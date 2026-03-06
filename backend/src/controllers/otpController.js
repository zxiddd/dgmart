const admin = require('firebase-admin');
const path = require('path');
const crypto = require('crypto');
const db = require('../config/db');

// Initialize Firebase Admin (singleton)
if (!admin.apps.length) {
    const serviceAccount = require(path.join(__dirname, '../../firebase-service-account.json'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// In-memory OTP store (for production, use Redis or DB)
const otpStore = new Map(); // { "+91XXXXXXXXXX": { otp, expiresAt } }

/**
 * POST /api/auth/send-otp
 * Generate a 6-digit OTP and "send" it (via Firebase or SMS console log in dev)
 */
const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone || !/^\+91\d{10}$/.test(phone)) {
            return res.status(400).json({ success: false, message: 'Enter a valid +91XXXXXXXXXX phone number.' });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        otpStore.set(phone, { otp, expiresAt });

        // In production: send via Firebase/Twilio SMS
        // For now, log to console (replace with actual SMS sending)
        console.log(`📱 OTP for ${phone}: ${otp}`);

        // Integrate APIHome SMS provider
        const APIHOME_KEY = process.env.APIHOME_KEY || "YOUR_API_KEY";
        const cleanPhone = phone.replace(/^\+91/, ''); // assuming Indian numbers
        const smsUrl = `https://apihome.in/panel/api/bulksms/?key=${APIHOME_KEY}&mobile=${cleanPhone}&otp=${otp}`;

        try {
            console.log(`Sending SMS to ${cleanPhone} via apihome.in...`);
            const smsResponse = await fetch(smsUrl);
            const smsResult = await smsResponse.text();
            console.log('SMS Provider Response:', smsResult);
        } catch (smsError) {
            console.error('Failed to call SMS API:', smsError);
            if (process.env.NODE_ENV === 'production' && !APIHOME_KEY.includes('YOUR_API')) {
                return res.status(500).json({ success: false, message: 'Failed to send SMS via provider.' });
            }
        }

        return res.json({ success: true, message: 'OTP sent successfully.' });
    } catch (err) {
        console.error('Send OTP error:', err);
        return res.status(500).json({ success: false, message: 'Failed to send OTP.' });
    }
};

/**
 * POST /api/auth/verify-otp
 * Verify the OTP and return a Supabase session
 */
const verifyOtp = async (req, res) => {
    try {
        const { phone, otp, name } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });
        }

        const stored = otpStore.get(phone);
        if (!stored) {
            return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
        }
        if (Date.now() > stored.expiresAt) {
            otpStore.delete(phone);
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }
        if (stored.otp !== otp.toString()) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
        }

        // OTP valid — clean up
        otpStore.delete(phone);

        // Normalize phone: strip +91
        const normalizedPhone = phone.replace(/^\+91/, '');

        // Find or create Supabase user
        const supabase = require('../config/supabase');
        let supabaseUserId;
        let isNewUser = false;

        const existingRes = await db.query('SELECT id FROM users WHERE phone = $1 LIMIT 1', [normalizedPhone]);

        if (existingRes.rows.length > 0) {
            supabaseUserId = existingRes.rows[0].id;
        } else {
            isNewUser = true;
            const authEmail = `${normalizedPhone}@degloormart.phone`;
            const tempPassword = `otp_${normalizedPhone}_${Date.now()}`;
            const displayName = name || `User${normalizedPhone.slice(-4)}`;

            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: authEmail,
                password: tempPassword,
                phone,
                user_metadata: { name: displayName, phone: normalizedPhone },
                email_confirm: true,
            });

            if (authError) {
                // Try to find existing by email
                const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
                const found = listData?.users?.find(u => u.email === authEmail);
                if (found) {
                    supabaseUserId = found.id;
                    isNewUser = false;
                } else {
                    console.error('Create Supabase user error:', authError.message);
                    return res.status(500).json({ success: false, message: 'Failed to create account.' });
                }
            } else {
                supabaseUserId = authData.user.id;
            }

            // Upsert public.users row
            await db.query(
                `INSERT INTO users (id, email, name, phone, role)
                 VALUES ($1, $2, $3, $4, 'customer')
                 ON CONFLICT (id) DO UPDATE SET phone = $4, name = COALESCE(NULLIF($3, ''), users.name)`,
                [supabaseUserId, authEmail, displayName, normalizedPhone]
            );
        }

        // 3. Generate a Supabase access token (short-lived session)
        // Since Supabase SDK doesn't have an admin.createSession, we temporarily reset the 
        // user's password to a secure random string and perform a standard sign-in to get the JWTs.
        const dynamicPassword = `Otp!${normalizedPhone}_${Date.now()}A`;

        const { error: updateError } = await supabase.auth.admin.updateUserById(
            supabaseUserId,
            { password: dynamicPassword }
        );

        if (updateError) {
            console.error('Failed to rotate password for session generation:', updateError.message);
            return res.status(500).json({ success: false, message: 'Failed to generate session.' });
        }

        // Create a user-facing Supabase client with the ANON_KEY for sign-ins
        const { createClient } = require('@supabase/supabase-js');
        const supabaseUserClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Now perform sign in
        const { data: sessionData, error: sessionError } = await supabaseUserClient.auth.signInWithPassword({
            email: authEmail,
            password: dynamicPassword,
        });

        if (sessionError || !sessionData?.session) {
            console.error('Create session error:', sessionError?.message);
            return res.status(500).json({ success: false, message: 'Failed to create session.' });
        }

        return res.json({
            success: true,
            data: {
                access_token: sessionData.session.access_token,
                refresh_token: sessionData.session.refresh_token,
                user_id: supabaseUserId,
                is_new_user: isNewUser,
            },
        });
    } catch (err) {
        console.error('Verify OTP error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Verification failed.' });
    }
};

/**
 * POST /api/auth/register-with-password
 * Register a user with name, phone, password, and optionally an OTP
 */
const registerWithPassword = async (req, res) => {
    try {
        const { name, phone, email, password, otp } = req.body;
        if (!name || !phone || !password || !email) {
            return res.status(400).json({ success: false, message: 'Name, Phone, Email, and Password are required.' });
        }

        const normalizedPhone = phone.replace(/^\+91/, '');

        // 1. Check Platform Settings for mandatory OTP
        const { rows: configRows } = await db.query("SELECT value FROM platform_settings WHERE key = 'global'");
        let isPhoneVerified = false;

        let requireVerification = true;
        if (configRows.length > 0 && configRows[0].value && configRows[0].value.require_phone_verification !== undefined) {
            requireVerification = configRows[0].value.require_phone_verification;
        }

        // 2. If OTP is required OR provided, verify it
        if (requireVerification || otp) {
            if (!otp) {
                return res.status(400).json({ success: false, message: 'Phone verification is mandatory. OTP is missing.' });
            }
            const stored = otpStore.get(phone);
            if (!stored) {
                return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
            }
            if (Date.now() > stored.expiresAt) {
                otpStore.delete(phone);
                return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
            }
            if (stored.otp !== otp.toString()) {
                return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
            }
            // OTP is valid
            otpStore.delete(phone);
            isPhoneVerified = true;
        }

        // 3. Check if phone is already registered in DB
        const existCheck = await db.query('SELECT * FROM users WHERE phone = $1 OR email = $2', [normalizedPhone, email]);
        if (existCheck.rows.length > 0) {
            const existing = existCheck.rows[0];
            if (existing.phone === normalizedPhone) {
                return res.status(400).json({ success: false, message: 'An account with this phone number already exists.' });
            }
            if (existing.email === email) {
                return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
            }
        }

        // 4. Create User in Supabase Auth
        const supabase = require('../config/supabase');

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            phone: phone, // Pass E.164 phone
            user_metadata: { name: name, phone: normalizedPhone },
            email_confirm: true,
        });

        if (authError) {
            console.error('Create Supabase user error:', authError.message);
            if (authError.message.includes('already exists')) {
                return res.status(400).json({ success: false, message: 'An account with this phone or email already exists.' });
            }
            return res.status(500).json({ success: false, message: 'Failed to create account.' });
        }

        const supabaseUserId = authData.user.id;

        // 5. Insert into public.users
        await db.query(
            `INSERT INTO users (id, email, name, phone, role, is_phone_verified)
             VALUES ($1, $2, $3, $4, 'customer', $5)
             ON CONFLICT (id) DO UPDATE SET phone = $4, name = $3, email = $2, is_phone_verified = $5`,
            [supabaseUserId, email, name, normalizedPhone, isPhoneVerified]
        );

        // Create a user-facing Supabase client with the ANON_KEY for sign-ins
        const { createClient } = require('@supabase/supabase-js');
        const supabaseUserClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // 6. Sign in to generate session
        const { data: sessionData, error: sessionError } = await supabaseUserClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (sessionError || !sessionData?.session) {
            console.error('Create session error:', sessionError?.message);
            return res.status(500).json({ success: false, message: 'Account created but failed to generate session. Please login.' });
        }

        return res.json({
            success: true,
            data: {
                access_token: sessionData.session.access_token,
                refresh_token: sessionData.session.refresh_token,
                user_id: supabaseUserId,
                is_new_user: true,
            },
        });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Registration failed.' });
    }
};

/**
 * POST /api/auth/login-with-password
 * Login a user with phone and password
 */
const loginWithPassword = async (req, res) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            return res.status(400).json({ success: false, message: 'Phone and Password are required.' });
        }

        const normalizedPhone = phone.replace(/^\+91/, '');

        // Lookup the user's email by their phone number from our users table
        const { rows } = await db.query('SELECT email FROM users WHERE phone = $1', [normalizedPhone]);

        let authEmail;
        if (rows.length > 0 && rows[0].email) {
            authEmail = rows[0].email;
        } else {
            // Fallback to legacy proxy email for older users
            authEmail = `${normalizedPhone}@degloormart.phone`;
        }

        // Create a user-facing Supabase client with the ANON_KEY for sign-ins
        const { createClient } = require('@supabase/supabase-js');
        const supabaseUserClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const { data: sessionData, error: sessionError } = await supabaseUserClient.auth.signInWithPassword({
            email: authEmail,
            password: password,
        });

        if (sessionError || !sessionData?.session) {
            console.error('Login error:', sessionError?.message);
            return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
        }

        return res.json({
            success: true,
            data: {
                access_token: sessionData.session.access_token,
                refresh_token: sessionData.session.refresh_token,
                user_id: sessionData.user.id,
                is_new_user: false,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Login failed.' });
    }
};

/**
 * POST /api/auth/verify-existing-phone
 * Verify OTP for an ALREADY logged in user (used during checkout block)
 */
const verifyExistingPhone = async (req, res) => {
    try {
        // req.user should exist since this route will be protected
        const userId = req.user?.id;
        const { phone, otp } = req.body;

        if (!userId || !phone || !otp) {
            return res.status(400).json({ success: false, message: 'User ID, Phone, and OTP are required.' });
        }

        const stored = otpStore.get(phone);
        if (!stored) {
            return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
        }
        if (Date.now() > stored.expiresAt) {
            otpStore.delete(phone);
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }
        if (stored.otp !== otp.toString()) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
        }

        // OTP valid
        otpStore.delete(phone);

        // Update DB
        const normalizedPhone = phone.replace(/^\+91/, '');
        await db.query('UPDATE users SET is_phone_verified = true, phone = $1 WHERE id = $2', [normalizedPhone, userId]);

        return res.json({ success: true, message: 'Phone number verified successfully.' });
    } catch (err) {
        console.error('Verify existing phone error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Verification failed.' });
    }
};

/**
 * POST /api/auth/reset-password
 * Reset password using OTP verification
 */
const resetPassword = async (req, res) => {
    try {
        const { phone, otp, newPassword } = req.body;
        if (!phone || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'Phone, OTP, and New Password are required.' });
        }

        const stored = otpStore.get(phone);
        if (!stored) {
            return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
        }
        if (Date.now() > stored.expiresAt) {
            otpStore.delete(phone);
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }
        if (stored.otp !== otp.toString()) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
        }

        // OTP valid — clean up
        otpStore.delete(phone);

        // Normalize phone: strip +91
        const normalizedPhone = phone.replace(/^\+91/, '');

        // Find user by phone to get their Supabase ID
        const { rows } = await db.query('SELECT id FROM users WHERE phone = $1', [normalizedPhone]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No account found with this phone number.' });
        }

        const userId = rows[0].id;

        // Update password in Supabase Auth
        const supabase = require('../config/supabase');
        const { error } = await supabase.auth.admin.updateUserById(userId, {
            password: newPassword
        });

        if (error) {
            console.error('Reset password error:', error.message);
            return res.status(500).json({ success: false, message: 'Failed to reset password.' });
        }

        return res.json({ success: true, message: 'Password reset successfully. You can now login with your new password.' });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = { sendOtp, verifyOtp, registerWithPassword, loginWithPassword, verifyExistingPhone, resetPassword };
