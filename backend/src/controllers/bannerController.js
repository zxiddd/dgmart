const db = require('../config/db');

exports.getBanners = async (req, res, next) => {
    try {
        const { rows } = await db.query(
            `SELECT * FROM banners WHERE is_active = true ORDER BY sort_order ASC`
        );

        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        next(error);
    }
};

exports.createBanner = async (req, res, next) => {
    try {
        const { image_url, target_screen, target_id, sort_order, title, subtitle, gradient_colors, badge_text, button_text } = req.body;

        const { rows } = await db.query(
            `INSERT INTO banners (image_url, target_screen, target_id, sort_order, title, subtitle, gradient_colors, badge_text, button_text, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING *`,
            [image_url, target_screen, target_id, sort_order || 0, title, subtitle, gradient_colors, badge_text, button_text]
        );

        res.status(201).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.updateBanner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { image_url, target_screen, target_id, sort_order, title, subtitle, gradient_colors, is_active, badge_text, button_text } = req.body;

        const { rows } = await db.query(
            `UPDATE banners SET
                image_url = COALESCE($1, image_url),
                target_screen = COALESCE($2, target_screen),
                target_id = COALESCE($3, target_id),
                sort_order = COALESCE($4, sort_order),
                title = COALESCE($5, title),
                subtitle = COALESCE($6, subtitle),
                gradient_colors = COALESCE($7, gradient_colors),
                is_active = COALESCE($8, is_active),
                badge_text = COALESCE($9, badge_text),
                button_text = COALESCE($10, button_text),
                updated_at = NOW()
             WHERE id = $11 RETURNING *`,
            [image_url, target_screen, target_id, sort_order, title, subtitle, gradient_colors, is_active, badge_text, button_text, id]
        );

        res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteBanner = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM banners WHERE id = $1', [id]);

        res.status(200).json({
            success: true,
            message: 'Banner deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
