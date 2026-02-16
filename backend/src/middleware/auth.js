const supabase = require('../config/supabase');
const db = require('../config/db');
const { USER_ROLES } = require('../config/constants');

/**
 * Verify Supabase JWT and attach user to request
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify JWT using Supabase Auth
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token.',
            });
        }

        // Get user profile from our public.users table
        const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [user.id]);

        if (rows.length === 0) {
            console.log('User profile not found. Creating new profile for:', user.id);

            // Auto-create user profile
            const newUserRes = await db.query(
                `INSERT INTO users (id, email, name, role) 
                 VALUES ($1, $2, $3, 'customer') 
                 RETURNING *`,
                [
                    user.id,
                    user.email,
                    user.user_metadata?.name || user.email.split('@')[0] || 'New User'
                ]
            );

            if (newUserRes.rows.length > 0) {
                console.log('Created new user profile:', newUserRes.rows[0].email);
                req.user = {
                    uid: user.id,
                    id: user.id,
                    email: user.email,
                    ...newUserRes.rows[0]
                };
                return next();
            } else {
                return res.status(500).json({ success: false, message: 'Failed to create user profile.' });
            }
        }

        console.log('Auth success: User:', rows[0].email, 'Role:', rows[0].role);

        req.user = {
            uid: user.id, // Keep 'uid' for compatibility if needed, but 'id' is standard
            id: user.id,
            email: user.email,
            ...rows[0], // role, name, etc.
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication.',
        });
    }
};

/**
 * Optional authentication
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split('Bearer ')[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (user) {
            const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [user.id]);
            if (rows.length > 0) {
                req.user = {
                    uid: user.id,
                    id: user.id,
                    email: user.email,
                    ...rows[0],
                };
            }
        }
    } catch (error) {
        // Silent fail
    }
    next();
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            console.log('Authorize failed: No user attached to request');
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        if (!roles.includes(req.user.role)) {
            console.log(`Authorize failed: User role '${req.user.role}' is not in allowed roles: [${roles.join(', ')}]`);
            return res.status(403).json({ success: false, message: 'Permission denied.' });
        }
        next();
    };
};

const isAdmin = authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN);
const isRestaurantOwner = authorize(USER_ROLES.RESTAURANT_OWNER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN);
const isDeliveryPartner = authorize(USER_ROLES.DELIVERY_PARTNER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN);

module.exports = {
    authenticate,
    optionalAuth,
    authorize,
    isAdmin,
    isRestaurantOwner,
    isDeliveryPartner,
};
