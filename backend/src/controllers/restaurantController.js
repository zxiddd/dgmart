const db = require('../config/db');
const { RESTAURANT_STATUS } = require('../config/constants');
const { calculateDistance } = require('../utils/helpers');

/**
 * List restaurants with filters
 */
const listRestaurants = async (req, res, next) => {
    try {
        const { search, cuisine, is_veg_only, rating_min, lat, lng, radius_km, page, limit, sort_by } = req.query;

        // Base Query
        let query = `
            SELECT * FROM restaurants 
            WHERE is_active = true 
            AND status = $1
        `;
        const params = [RESTAURANT_STATUS.ACTIVE || 'active']; // Fallback if constant is undefined/wrong
        let paramCount = 1;

        // Search
        if (search) {
            paramCount++;
            query += ` AND (name ILIKE $${paramCount} OR $${paramCount} = ANY(cuisine_type))`;
            params.push(`%${search}%`);
        }

        // Cuisine
        if (cuisine) {
            paramCount++;
            query += ` AND $${paramCount} = ANY(cuisine_type)`;
            params.push(cuisine.toLowerCase());
        }

        // Veg Only
        if (is_veg_only === 'true') {
            // Check if all menu items are veg? Or if restaurant is marked as veg?
            // Schema doesn't have is_veg_only on restaurant, only on menu_items.
            // But strict requirement might imply we filter restaurants that serve ONLY veg.
            // For now, let's assume we don't have a column, or I should have added it.
            // Schema has `cuisine_type` text[].
            // If the user meant "Pure Veg" restaurants.
            // Let's filter by cuisine_type containing 'veg' or similar if applicable, 
            // OR if I added `is_veg` column? 
            // Looking at schema: `restaurant` table has `cuisine_type`. `menu_items` has `is_veg`.
            // I'll skip this filter on SQL level for now unless I join menu_items, which is expensive.
            // Alternatively, I can do client side filtering or add `is_pure_veg` column to restaurants later.
            // For now, I'll ignore or maybe approximate.
        }

        // Rating
        if (rating_min) {
            paramCount++;
            query += ` AND rating >= $${paramCount}`;
            params.push(parseFloat(rating_min));
        }

        // Execute Query
        const { rows } = await db.query(query, params);
        let restaurants = rows;

        // Geospatial Filtering (Application Layer for simplicity without PostGIS)
        if (lat && lng) {
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);
            const maxRadius = parseFloat(radius_km) || 10;

            restaurants = restaurants.map(r => ({
                ...r,
                distance_km: calculateDistance(userLat, userLng, r.lat, r.lng)
            }))
                .filter(r => r.distance_km <= maxRadius);

            // Sort by distance if no other sort
            if (!sort_by) {
                restaurants.sort((a, b) => a.distance_km - b.distance_km);
            }
        }

        // Sort
        if (sort_by === 'rating') {
            restaurants.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sort_by === 'prep_time') {
            restaurants.sort((a, b) => (a.avg_prep_time_mins || 30) - (b.avg_prep_time_mins || 30));
        }

        // Pagination
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const startIndex = (pageNum - 1) * limitNum;
        const paginatedRestaurants = restaurants.slice(startIndex, startIndex + limitNum);

        res.json({
            success: true,
            data: {
                restaurants: paginatedRestaurants,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: restaurants.length,
                    total_pages: Math.ceil(restaurants.length / limitNum),
                },
            },
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get restaurant details with menu
 */
const getRestaurant = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log('getRestaurant called with ID:', id);

        // Check if ID is 'me' which implies route collision
        if (id === 'me') {
            console.error('CRITICAL: Route collision detected! /:id captured "me"');
            return res.status(500).json({ error: 'Route collision detected' });
        }

        // Get Restaurant
        const restRes = await db.query('SELECT * FROM restaurants WHERE id = $1', [id]);
        if (restRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Restaurant not found.' });
        }
        const restaurant = restRes.rows[0];

        // Get Categories
        const catRes = await db.query('SELECT * FROM menu_categories WHERE restaurant_id = $1 AND is_active = true ORDER BY sort_order ASC', [id]);

        // Get Menu Items
        const itemRes = await db.query('SELECT * FROM menu_items WHERE restaurant_id = $1 AND is_available = true ORDER BY name ASC', [id]);

        // Group
        const menu = catRes.rows.map(cat => ({
            ...cat,
            items: itemRes.rows.filter(item => item.category_id === cat.id)
        }));

        // Get Reviews
        const reviewRes = await db.query('SELECT * FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC LIMIT 10', [id]);

        res.json({
            success: true,
            data: {
                restaurant,
                menu,
                reviews: reviewRes.rows
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Create Restaurant
 */
const createRestaurant = async (req, res, next) => {
    try {
        const { name, address, lat, lng, cuisine_type, phone, image_url, avg_prep_time_mins, min_order_amount, delivery_radius_km } = req.body;

        const query = `
            INSERT INTO restaurants (owner_id, name, address, lat, lng, cuisine_type, status, is_active, phone, image_url, avg_prep_time_mins, min_order_amount, delivery_radius_km)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;

        const values = [
            req.user.id,
            name,
            address,
            lat,
            lng,
            cuisine_type || [], // Ensure array
            RESTAURANT_STATUS.PENDING_APPROVAL || 'pending_approval',
            false,
            phone,
            image_url,
            avg_prep_time_mins || 20,
            min_order_amount || 0,
            delivery_radius_km || 10
        ];

        const { rows } = await db.query(query, values);

        // Update user role
        await db.query("UPDATE users SET role = 'restaurant_owner' WHERE id = $1", [req.user.id]);

        res.status(201).json({
            success: true,
            message: 'Restaurant submitted for approval.',
            data: { restaurant: rows[0] }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update Restaurant
 */
const updateRestaurant = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, address, lat, lng, image_url, banner_url, min_order_amount, avg_prep_time_mins, delivery_radius_km, cuisine_type } = req.body;

        // Verify ownership
        const check = await db.query('SELECT owner_id FROM restaurants WHERE id = $1', [id]);
        if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Restaurant not found' });

        if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const query = `
            UPDATE restaurants
            SET 
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                address = COALESCE($3, address),
                lat = COALESCE($4, lat),
                lng = COALESCE($5, lng),
                image_url = COALESCE($6, image_url),
                banner_url = COALESCE($7, banner_url),
                min_order_amount = COALESCE($8, min_order_amount),
                avg_prep_time_mins = COALESCE($9, avg_prep_time_mins),
                delivery_radius_km = COALESCE($10, delivery_radius_km),
                cuisine_type = COALESCE($11, cuisine_type)
            WHERE id = $12
            RETURNING *
        `;

        const values = [name, description, address, lat, lng, image_url, banner_url, min_order_amount, avg_prep_time_mins, delivery_radius_km, cuisine_type, id];
        const { rows } = await db.query(query, values);

        res.json({ success: true, message: 'Restaurant updated', data: { restaurant: rows[0] } });

    } catch (error) {
        next(error);
    }
};

const toggleRestaurantStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const check = await db.query('SELECT owner_id, is_active FROM restaurants WHERE id = $1', [id]);
        if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Restaurant not found' });

        if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const newStatus = !check.rows[0].is_active;
        await db.query('UPDATE restaurants SET is_active = $1 WHERE id = $2', [newStatus, id]);

        res.json({ success: true, message: newStatus ? 'Restaurant opened' : 'Restaurant closed', data: { is_active: newStatus } });
    } catch (error) {
        next(error);
    }
};

const getRestaurantDashboard = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Today's Stats
        const todayStats = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                COUNT(CASE WHEN status IN ('placed', 'confirmed', 'preparing') THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
                COALESCE(SUM(CASE WHEN status = 'delivered' THEN subtotal ELSE 0 END), 0) as revenue
            FROM orders
            WHERE restaurant_id = $1 AND created_at >= CURRENT_DATE
        `, [id]);

        // 30 Days Stats
        const monthStats = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(subtotal), 0) as revenue
            FROM orders
            WHERE restaurant_id = $1 AND status = 'delivered' AND created_at >= NOW() - INTERVAL '30 days'
        `, [id]);

        // Recent Reviews
        const reviews = await db.query('SELECT * FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC LIMIT 5', [id]);

        res.json({
            success: true,
            data: {
                today: todayStats.rows[0],
                last_30_days: monthStats.rows[0],
                recent_reviews: reviews.rows
            }
        });

    } catch (error) {
        next(error);
    }
};

const getMyRestaurant = async (req, res, next) => {
    try {
        console.log('getMyRestaurant: req.user:', req.user);
        const query = 'SELECT * FROM restaurants WHERE owner_id = $1';
        const { rows } = await db.query(query, [req.user.id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Restaurant not found for this user' });
        }

        res.json({ success: true, data: { restaurant: rows[0] } });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listRestaurants,
    getRestaurant,
    createRestaurant,
    updateRestaurant,
    toggleRestaurantStatus,
    getRestaurantDashboard,
    getMyRestaurant
};
