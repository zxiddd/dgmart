const db = require('../config/db');

/**
 * Get menu categories for a restaurant
 */
const getCategories = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { rows } = await db.query('SELECT * FROM menu_categories WHERE restaurant_id = $1 ORDER BY sort_order ASC', [restaurantId]);
        res.json({ success: true, data: { categories: rows } });
    } catch (e) { next(e); }
};

/**
 * Get full menu (nested)
 */
const getFullMenu = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        // Get Categories
        const catRes = await db.query('SELECT * FROM menu_categories WHERE restaurant_id = $1 ORDER BY sort_order ASC', [restaurantId]);
        // Get Items
        const itemRes = await db.query('SELECT * FROM menu_items WHERE restaurant_id = $1 ORDER BY name ASC', [restaurantId]); // Show all items (even unavailable) for owner

        const categories = catRes.rows.map(cat => ({
            ...cat,
            items: itemRes.rows.filter(item => item.category_id === cat.id)
        }));

        res.json({ success: true, data: { categories } });
    } catch (e) { next(e); }
};

/**
 * Create a menu category
 */
const createCategory = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { name, sort_order } = req.body;

        const restRes = await db.query('SELECT owner_id FROM restaurants WHERE id = $1', [restaurantId]);
        if (restRes.rows.length === 0 || (restRes.rows[0].owner_id !== req.user.id && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { rows } = await db.query(
            'INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES ($1, $2, $3) RETURNING *',
            [restaurantId, name, sort_order || 0]
        );

        res.status(201).json({ success: true, message: 'Category created', data: { category: rows[0] } });
    } catch (e) { next(e); }
};

/**
 * Update a menu category
 */
/**
 * Update a menu category
 */
const updateCategory = async (req, res, next) => {
    try {
        const { restaurantId, categoryId } = req.params;
        const { name, sort_order, is_active } = req.body;

        // Verify ownership/permission
        // We need to check if the category's restaurant belongs to user OR user is admin
        // Optimized query: Join restaurants to get owner_id
        const check = await db.query(`
            SELECT mc.restaurant_id, r.owner_id 
            FROM menu_categories mc 
            JOIN restaurants r ON mc.restaurant_id = r.id 
            WHERE mc.id = $1
        `, [categoryId]);

        if (check.rows.length === 0 || check.rows[0].restaurant_id !== restaurantId) return res.status(404).json({ message: 'Not found' });

        if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await db.query(
            'UPDATE menu_categories SET name = COALESCE($1, name), sort_order = COALESCE($2, sort_order), is_active = COALESCE($3, is_active) WHERE id = $4',
            [name, sort_order, is_active, categoryId]
        );

        res.json({ success: true, message: 'Category updated' });
    } catch (e) { next(e); }
};

/**
 * Delete a menu category
 */
const deleteCategory = async (req, res, next) => {
    try {
        const { restaurantId, categoryId } = req.params;

        const check = await db.query(`
            SELECT mc.restaurant_id, r.owner_id 
            FROM menu_categories mc 
            JOIN restaurants r ON mc.restaurant_id = r.id 
            WHERE mc.id = $1
        `, [categoryId]);

        if (check.rows.length === 0 || check.rows[0].restaurant_id !== restaurantId) return res.status(404).json({ message: 'Not found' });

        if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM menu_items WHERE category_id = $1', [categoryId]);
            await client.query('DELETE FROM menu_categories WHERE id = $1', [categoryId]);
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        res.json({ success: true, message: 'Deleted' });
    } catch (e) { next(e); }
};

/**
 * Get menu items
 */
const getItems = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { category_id } = req.query;

        let query = 'SELECT * FROM menu_items WHERE restaurant_id = $1';
        const params = [restaurantId];

        if (category_id) {
            query += ' AND category_id = $2';
            params.push(category_id);
        }
        query += ' ORDER BY name ASC';

        const { rows } = await db.query(query, params);
        res.json({ success: true, data: { items: rows } });
    } catch (e) { next(e); }
};

/**
 * Create item
 */
const createItem = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { category_id, name, description, price, is_veg, image_url } = req.body;

        const restRes = await db.query('SELECT owner_id FROM restaurants WHERE id = $1', [restaurantId]);
        if (restRes.rows.length === 0) return res.status(404).json({ message: 'Restaurant not found' });

        if (restRes.rows[0].owner_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const query = `
            INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_veg, image_url, is_available)
            VALUES ($1, $2, $3, $4, $5, $6, $7, true)
            RETURNING *
        `;
        const { rows } = await db.query(query, [restaurantId, category_id, name, description, price, is_veg, image_url]);

        res.status(201).json({ success: true, message: 'Item created', data: { item: rows[0] } });
    } catch (e) { next(e); }
};

/**
 * Update item
 */
const updateItem = async (req, res, next) => {
    try {
        const { restaurantId, itemId } = req.params;
        const { name, description, price, is_veg, image_url, is_available, category_id } = req.body;

        // Verify ownership
        const check = await db.query(`
            SELECT mi.restaurant_id, r.owner_id 
            FROM menu_items mi 
            JOIN restaurants r ON mi.restaurant_id = r.id 
            WHERE mi.id = $1
        `, [itemId]);

        if (check.rows.length === 0 || check.rows[0].restaurant_id !== restaurantId) return res.status(404).json({ message: 'Not found' });

        if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const query = `
            UPDATE menu_items SET 
                name = COALESCE($1, name), description = COALESCE($2, description), 
                price = COALESCE($3, price), is_veg = COALESCE($4, is_veg), 
                image_url = COALESCE($5, image_url), is_available = COALESCE($6, is_available),
                category_id = COALESCE($7, category_id)
            WHERE id = $8 RETURNING *
        `;
        const { rows } = await db.query(query, [name, description, price, is_veg, image_url, is_available, category_id, itemId]);

        res.json({ success: true, message: 'Updated', data: { item: rows[0] } });
    } catch (e) { next(e); }
};

const deleteItem = async (req, res, next) => {
    try {
        const { restaurantId, itemId } = req.params;

        const check = await db.query(`
            SELECT mi.restaurant_id, r.owner_id 
            FROM menu_items mi 
            JOIN restaurants r ON mi.restaurant_id = r.id 
            WHERE mi.id = $1
        `, [itemId]);

        if (check.rows.length === 0 || check.rows[0].restaurant_id !== restaurantId) return res.status(404).json({ message: 'Not found' });

        if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await db.query('DELETE FROM menu_items WHERE id = $1', [itemId]);
        res.json({ success: true, message: 'Deleted' });
    } catch (e) { next(e); }
};

const toggleItemAvailability = async (req, res, next) => {
    try {
        const { restaurantId, itemId } = req.params;

        const check = await db.query(`
            SELECT mi.restaurant_id, mi.is_available, r.owner_id 
            FROM menu_items mi 
            JOIN restaurants r ON mi.restaurant_id = r.id 
            WHERE mi.id = $1
        `, [itemId]);

        if (check.rows.length === 0 || check.rows[0].restaurant_id !== restaurantId) return res.status(404).json({ message: 'Not found' });

        if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const newState = !check.rows[0].is_available;
        await db.query('UPDATE menu_items SET is_available = $1 WHERE id = $2', [newState, itemId]);
        res.json({ success: true, message: newState ? 'Available' : 'Unavailable', data: { is_available: newState } });
    } catch (e) { next(e); }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getItems,
    createItem,
    updateItem,
    deleteItem,
    toggleItemAvailability,
    getFullMenu
};
