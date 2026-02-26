const db = require('../config/db');

/**
 * GET /api/app/config
 * Public endpoint to fetch global app configuration
 */
const getAppConfig = async (req, res, next) => {
    try {
        const { rows } = await db.query("SELECT value FROM platform_settings WHERE key = 'global'");

        let configData = {
            require_phone_verification: true, // safe default
        };

        if (rows.length > 0 && rows[0].value) {
            configData = { ...configData, ...rows[0].value };
        }

        res.json({
            success: true,
            data: configData
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAppConfig
};
