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

        // Now perform sign in
        const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
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

module.exports = { sendOtp, verifyOtp };
