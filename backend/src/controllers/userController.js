const db = require('../config/db');
const { USER_ROLES } = require('../config/constants');
const { generateReferralCode } = require('../utils/helpers');

/**
 * Update user profile (Register step 2)
 */
const register = async (req, res, next) => {
    try {
        const { name, email, phone, role, referralCode } = req.body;
        const id = req.user.id; // From Supabase Auth

        // The user row is already created by trigger. We just update it.
        // Or if we need to manually insert for some reason (rare with trigger).

        let referralBonus = 0;
        let referredBy = null;

        if (referralCode) {
            const referrerRes = await db.query('SELECT * FROM users WHERE referral_code = $1', [referralCode]);
            if (referrerRes.rows.length > 0) {
                const referrer = referrerRes.rows[0];
                referredBy = referrer.id;

                // Add bonus to referrer
                await db.query('UPDATE users SET wallet_balance = wallet_balance + 50 WHERE id = $1', [referrer.id]);
                await db.query(`
                    INSERT INTO wallet_transactions (user_id, type, amount, description, reference_type, reference_id)
                    VALUES ($1, 'credit', 50, $2, 'referral', $3)
                `, [referrer.id, `Referral bonus for inviting ${name}`, id]);

                // Bonus for new user
                referralBonus = 25;
            }
        }

        const updateQuery = `
            UPDATE users 
            SET 
                name = COALESCE($1, name),
                phone = COALESCE($2, phone),
                role = COALESCE($3, role),
                referral_code = COALESCE(referral_code, $4),
                wallet_balance = wallet_balance + $5,
                updated_at = NOW()
            WHERE id = $6
            RETURNING *;
        `;

        const values = [
            name,
            phone,
            role || USER_ROLES.CUSTOMER,
            generateReferralCode(name),
            referralBonus,
            id
        ];

        const { rows } = await db.query(updateQuery, values);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.status(200).json({
            success: true,
            message: 'Registration completed.',
            data: { user: rows[0] },
        });
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({ success: true, data: { user: rows[0] } });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { name, phone, email, avatar_url } = req.body;
        const query = `
            UPDATE users 
            SET name = COALESCE($1, name), phone = COALESCE($2, phone), email = COALESCE($3, email), avatar_url = COALESCE($4, avatar_url), updated_at = NOW()
            WHERE id = $5 RETURNING *
        `;
        const { rows } = await db.query(query, [name, phone, email, avatar_url, req.user.id]);
        res.json({ success: true, message: 'Profile updated', data: { user: rows[0] } });
    } catch (error) {
        next(error);
    }
};

const getAddresses = async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC', [req.user.id]);
        res.json({ success: true, data: { addresses: rows } });
    } catch (error) {
        next(error);
    }
};

const addAddress = async (req, res, next) => {
    try {
        const { full_address, label, lat, lng, is_default, phone, landmark } = req.body;

        if (is_default) {
            await db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
        }

        const query = `
            INSERT INTO addresses (user_id, full_address, label, lat, lng, is_default, phone, landmark)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
        `;
        const { rows } = await db.query(query, [req.user.id, full_address, label, lat, lng, is_default || false, phone, landmark]);

        res.status(201).json({ success: true, message: 'Address added', data: { address: rows[0] } });
    } catch (error) {
        next(error);
    }
};

const updateAddress = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { full_address, label, lat, lng, is_default, phone, landmark } = req.body;

        // Verify ownership
        const check = await db.query('SELECT user_id FROM addresses WHERE id = $1', [id]);
        if (check.rows.length === 0 || check.rows[0].user_id !== req.user.id) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        if (is_default) {
            await db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
        }

        const query = `
            UPDATE addresses 
            SET full_address = COALESCE($1, full_address), 
                label = COALESCE($2, label), 
                lat = COALESCE($3, lat), 
                lng = COALESCE($4, lng), 
                is_default = COALESCE($5, is_default),
                phone = COALESCE($6, phone),
                landmark = COALESCE($7, landmark)
            WHERE id = $8 RETURNING *
        `;
        const { rows } = await db.query(query, [full_address, label, lat, lng, is_default, phone, landmark, id]);
        res.json({ success: true, message: 'Address updated', data: { address: rows[0] } });
    } catch (error) {
        next(error);
    }
};

const deleteAddress = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Address not found' });
        res.json({ success: true, message: 'Address deleted' });
    } catch (error) {
        next(error);
    }
};

const getWallet = async (req, res, next) => {
    try {
        const userRes = await db.query('SELECT wallet_balance FROM users WHERE id = $1', [req.user.id]);
        const transRes = await db.query('SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);

        res.json({
            success: true,
            data: {
                balance: userRes.rows[0]?.wallet_balance || 0,
                transactions: transRes.rows
            }
        });
    } catch (error) {
        next(error);
    }
};

const getFavorites = async (req, res, next) => {
    try {
        const query = `
            SELECT r.*, f.id as favorite_id 
            FROM favorites f
            JOIN restaurants r ON f.restaurant_id = r.id
            WHERE f.user_id = $1
        `;
        const { rows } = await db.query(query, [req.user.id]);
        res.json({ success: true, data: { favorites: rows } });
    } catch (error) {
        next(error);
    }
};

const toggleFavorite = async (req, res, next) => {
    try {
        const { restaurant_id } = req.params;

        const existing = await db.query('SELECT id FROM favorites WHERE user_id = $1 AND restaurant_id = $2', [req.user.id, restaurant_id]);

        if (existing.rows.length > 0) {
            await db.query('DELETE FROM favorites WHERE id = $1', [existing.rows[0].id]);
            return res.json({ success: true, message: 'Removed from favorites', data: { is_favorite: false } });
        } else {
            await db.query('INSERT INTO favorites (user_id, restaurant_id) VALUES ($1, $2)', [req.user.id, restaurant_id]);
            return res.json({ success: true, message: 'Added to favorites', data: { is_favorite: true } });
        }
    } catch (error) {
        next(error);
    }
};

const getZones = async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT id, name, delivery_fee, min_order_amount FROM delivery_zones WHERE is_active = true ORDER BY name ASC');
        res.json({ success: true, data: { zones: rows } });
    } catch (error) {
        next(error);
    }
};

const subscribeToPush = async (req, res, next) => {
    try {
        const { subscription, device_type } = req.body;
        const userId = req.user.id;

        // Use UPSERT to handle subscription update if exists
        const query = `
            INSERT INTO push_subscriptions (user_id, subscription, device_type)
            VALUES ($1, $2, $3)
            ON CONFLICT (id) DO UPDATE SET 
                subscription = EXCLUDED.subscription,
                device_type = EXCLUDED.device_type,
                updated_at = NOW()
            RETURNING *;
        `;
        // Wait, push_subscriptions doesn't have a unique constraint on user_id+subscription yet.
        // I'll just insert for now or check if it exists.

        await db.query('DELETE FROM push_subscriptions WHERE user_id = $1 AND subscription::text = $2::text', [userId, JSON.stringify(subscription)]);
        await db.query('INSERT INTO push_subscriptions (user_id, subscription, device_type) VALUES ($1, $2, $3)', [userId, subscription, device_type || 'web']);

        res.json({ success: true, message: 'Subscribed to push notifications' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    getProfile,
    updateProfile,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    getWallet,
    getFavorites,
    toggleFavorite,
    getZones,
    subscribeToPush,
};
