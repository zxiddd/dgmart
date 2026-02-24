const supabase = require('../config/supabase');
const db = require('../config/db');
const { verifyFirebaseToken } = require('../services/firebaseService');

/**
 * POST /auth/firebase
 * Exchange a Firebase ID token for a Supabase session.
 * Called after the user completes Phone OTP or Google Sign-In on the app.
 */
const firebaseLogin = async (req, res) => {
    try {
        const { firebase_token, name, phone } = req.body;

        if (!firebase_token) {
            return res.status(400).json({ success: false, message: 'firebase_token is required' });
        }

        // 1. Verify the Firebase ID token
        const decoded = await verifyFirebaseToken(firebase_token);
        const { uid, phone_number, email, name: fbName } = decoded;

        // Normalize phone: Firebase gives +91XXXXXXXXXX
        const normalizedPhone = phone_number
            ? phone_number.replace(/^\+91/, '').replace(/\D/g, '')
            : phone;

        // 2. Find or create Supabase user by phone / email
        let supabaseUserId;
        let isNewUser = false;

        // Try to find existing user by phone
        const existingRes = await db.query(
            'SELECT id FROM users WHERE phone = $1 LIMIT 1',
            [normalizedPhone]
        );

        if (existingRes.rows.length > 0) {
            // Existing user
            supabaseUserId = existingRes.rows[0].id;
        } else {
            // New user — create in Supabase auth + users table
            isNewUser = true;

            // Create Supabase auth user using admin (service role)
            const authEmail = email || `${normalizedPhone}@degloormart.phone`;
            const tempPassword = `fb_${uid}_${Date.now()}`;

            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: authEmail,
                password: tempPassword,
                phone: normalizedPhone ? `+91${normalizedPhone}` : undefined,
                user_metadata: {
                    name: name || fbName || `User${normalizedPhone?.slice(-4) || ''}`,
                    phone: normalizedPhone,
                    firebase_uid: uid,
                },
                email_confirm: true,
            });

            if (authError) {
                // User might already exist in Supabase auth under this email - try to load
                const { data: existingAuth } = await supabase.auth.admin.listUsers();
                const found = existingAuth?.users?.find(u =>
                    u.email === authEmail || u.phone === `+91${normalizedPhone}`
                );
                if (found) {
                    supabaseUserId = found.id;
                } else {
                    console.error('Supabase auth create error:', authError.message);
                    return res.status(500).json({ success: false, message: 'Failed to create account.' });
                }
            } else {
                supabaseUserId = authData.user.id;
            }

            // Upsert into public.users
            await db.query(
                `INSERT INTO users (id, email, name, phone, role, firebase_uid)
                 VALUES ($1, $2, $3, $4, 'customer', $5)
                 ON CONFLICT (id) DO UPDATE SET phone = $4, firebase_uid = $5`,
                [
                    supabaseUserId,
                    email || `${normalizedPhone}@degloormart.phone`,
                    name || fbName || `User${normalizedPhone?.slice(-4) || ''}`,
                    normalizedPhone,
                    uid,
                ]
            );
        }

        // 3. Generate a Supabase access token (short-lived session)
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
            user_id: supabaseUserId,
        });

        if (sessionError || !sessionData?.session) {
            // Fallback: try generating a magic link token via signInWithOtp approach
            console.error('Session create error:', sessionError?.message);
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
        console.error('Firebase login error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Authentication failed.' });
    }
};

/**
 * POST /auth/fcm-token
 * Save the user's FCM device token for push notifications.
 */
const saveFcmToken = async (req, res) => {
    try {
        const { fcm_token } = req.body;
        const userId = req.user.id;

        if (!fcm_token) {
            return res.status(400).json({ success: false, message: 'fcm_token is required' });
        }

        await db.query(
            `UPDATE users SET fcm_token = $1 WHERE id = $2`,
            [fcm_token, userId]
        );

        return res.json({ success: true, message: 'FCM token saved.' });
    } catch (err) {
        console.error('Save FCM token error:', err);
        return res.status(500).json({ success: false, message: 'Failed to save token.' });
    }
};

module.exports = { firebaseLogin, saveFcmToken };
