const db = require('../config/db');

/**
 * Get Rider Report (admin only)
 */
const getRiderReport = async (req, res, next) => {
    try {
        const { riderId } = req.params;
        const { period = 'day' } = req.query;

        let dateFilter = "AND da.delivered_at >= CURRENT_DATE";
        if (period === 'week') dateFilter = "AND da.delivered_at >= CURRENT_DATE - INTERVAL '7 days'";
        else if (period === 'month') dateFilter = "AND da.delivered_at >= CURRENT_DATE - INTERVAL '30 days'";

        // Summary stats
        const statsRes = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                COUNT(*) FILTER (WHERE o.payment_method = 'cod') as cod_orders,
                COUNT(*) FILTER (WHERE o.payment_method != 'cod' OR o.payment_method IS NULL) as prepaid_orders,
                COALESCE(SUM(o.total) FILTER (WHERE o.payment_method = 'cod'), 0) as cod_amount,
                COALESCE(SUM(o.total) FILTER (WHERE o.payment_method != 'cod' OR o.payment_method IS NULL), 0) as prepaid_amount,
                COALESCE(SUM(o.total), 0) as total_amount,
                COALESCE(SUM(o.delivery_fee), 0) as total_earnings
            FROM delivery_assignments da
            JOIN orders o ON da.order_id = o.id
            WHERE da.partner_id = $1 AND da.status = 'delivered' ${dateFilter}
        `, [riderId]);

        // Detailed order list
        const ordersRes = await db.query(`
            SELECT o.id, o.order_number, o.total, o.delivery_fee, o.payment_method,
                   o.delivered_at, r.name as restaurant_name
            FROM delivery_assignments da
            JOIN orders o ON da.order_id = o.id
            JOIN restaurants r ON o.restaurant_id = r.id
            WHERE da.partner_id = $1 AND da.status = 'delivered' ${dateFilter}
            ORDER BY da.delivered_at DESC
        `, [riderId]);

        // Get rider info
        const riderRes = await db.query(`
            SELECT u.name, u.email, u.phone, dp.vehicle_type, dp.vehicle_number
            FROM users u
            LEFT JOIN delivery_partners dp ON dp.user_id = u.id
            WHERE u.id = $1
        `, [riderId]);

        res.json({
            success: true,
            data: {
                rider: riderRes.rows[0] || {},
                summary: statsRes.rows[0],
                orders: ordersRes.rows,
                period
            }
        });
    } catch (e) { next(e); }
};

/**
 * Download Rider Report CSV
 */
const downloadRiderCSV = async (req, res, next) => {
    try {
        const { riderId } = req.params;
        const { period = 'day' } = req.query;

        let dateFilter = "AND da.delivered_at >= CURRENT_DATE";
        if (period === 'week') dateFilter = "AND da.delivered_at >= CURRENT_DATE - INTERVAL '7 days'";
        else if (period === 'month') dateFilter = "AND da.delivered_at >= CURRENT_DATE - INTERVAL '30 days'";

        const riderRes = await db.query('SELECT name FROM users WHERE id = $1', [riderId]);
        const riderName = riderRes.rows[0]?.name || 'Unknown';

        const ordersRes = await db.query(`
            SELECT o.order_number, r.name as restaurant, o.total as order_amount,
                   o.delivery_fee as earning, o.payment_method,
                   to_char(o.delivered_at, 'YYYY-MM-DD HH24:MI') as delivered_at
            FROM delivery_assignments da
            JOIN orders o ON da.order_id = o.id
            JOIN restaurants r ON o.restaurant_id = r.id
            WHERE da.partner_id = $1 AND da.status = 'delivered' ${dateFilter}
            ORDER BY da.delivered_at DESC
        `, [riderId]);

        // Summary
        const statsRes = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                COUNT(*) FILTER (WHERE o.payment_method = 'cod') as cod_orders,
                COALESCE(SUM(o.total) FILTER (WHERE o.payment_method = 'cod'), 0) as cod_amount,
                COUNT(*) FILTER (WHERE o.payment_method != 'cod' OR o.payment_method IS NULL) as prepaid_orders,
                COALESCE(SUM(o.total) FILTER (WHERE o.payment_method != 'cod' OR o.payment_method IS NULL), 0) as prepaid_amount,
                COALESCE(SUM(o.total), 0) as total_amount,
                COALESCE(SUM(o.delivery_fee), 0) as total_earnings
            FROM delivery_assignments da
            JOIN orders o ON da.order_id = o.id
            WHERE da.partner_id = $1 AND da.status = 'delivered' ${dateFilter}
        `, [riderId]);

        const s = statsRes.rows[0];
        let csv = `Rider Report - ${riderName} (${period})\n`;
        csv += `Generated: ${new Date().toLocaleString()}\n\n`;
        csv += `SUMMARY\n`;
        csv += `Total Orders,${s.total_orders}\n`;
        csv += `COD Orders,${s.cod_orders},Amount,${s.cod_amount}\n`;
        csv += `Prepaid Orders,${s.prepaid_orders},Amount,${s.prepaid_amount}\n`;
        csv += `Total Amount,${s.total_amount}\n`;
        csv += `Total Earnings,${s.total_earnings}\n\n`;
        csv += `ORDER DETAILS\n`;
        csv += `Order#,Restaurant,Amount,Earning,Payment,Delivered At\n`;

        ordersRes.rows.forEach(o => {
            csv += `${o.order_number},${o.restaurant},${o.order_amount},${o.earning},${o.payment_method || 'online'},${o.delivered_at}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=rider_${riderName.replace(/\s+/g, '_')}_${period}.csv`);
        res.send(csv);
    } catch (e) { next(e); }
};

/**
 * Get Restaurant Report (admin only)
 */
const getRestaurantReport = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { period = 'day' } = req.query;

        let dateFilter = "AND o.placed_at >= CURRENT_DATE";
        if (period === 'week') dateFilter = "AND o.placed_at >= CURRENT_DATE - INTERVAL '7 days'";
        else if (period === 'month') dateFilter = "AND o.placed_at >= CURRENT_DATE - INTERVAL '30 days'";

        const statsRes = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                COUNT(*) FILTER (WHERE o.status = 'delivered') as delivered_orders,
                COUNT(*) FILTER (WHERE o.status = 'cancelled') as cancelled_orders,
                COUNT(*) FILTER (WHERE o.payment_method = 'cod') as cod_orders,
                COUNT(*) FILTER (WHERE o.payment_method != 'cod' OR o.payment_method IS NULL) as prepaid_orders,
                COALESCE(SUM(o.total) FILTER (WHERE o.payment_method = 'cod'), 0) as cod_amount,
                COALESCE(SUM(o.total) FILTER (WHERE o.payment_method != 'cod' OR o.payment_method IS NULL), 0) as prepaid_amount,
                COALESCE(SUM(o.total), 0) as total_revenue,
                COALESCE(SUM(o.subtotal), 0) as subtotal_revenue
            FROM orders o
            WHERE o.restaurant_id = $1 ${dateFilter}
        `, [restaurantId]);

        const ordersRes = await db.query(`
            SELECT o.id, o.order_number, o.total, o.subtotal, o.delivery_fee,
                   o.payment_method, o.status, 
                   to_char(o.placed_at, 'YYYY-MM-DD HH24:MI') as placed_at,
                   u.name as customer_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.restaurant_id = $1 ${dateFilter}
            ORDER BY o.placed_at DESC
        `, [restaurantId]);

        const restRes = await db.query('SELECT name, address, phone FROM restaurants WHERE id = $1', [restaurantId]);

        res.json({
            success: true,
            data: {
                restaurant: restRes.rows[0] || {},
                summary: statsRes.rows[0],
                orders: ordersRes.rows,
                period
            }
        });
    } catch (e) { next(e); }
};

/**
 * Download Restaurant Report CSV
 */
const downloadRestaurantCSV = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { period = 'day' } = req.query;

        let dateFilter = "AND o.placed_at >= CURRENT_DATE";
        if (period === 'week') dateFilter = "AND o.placed_at >= CURRENT_DATE - INTERVAL '7 days'";
        else if (period === 'month') dateFilter = "AND o.placed_at >= CURRENT_DATE - INTERVAL '30 days'";

        const restRes = await db.query('SELECT name FROM restaurants WHERE id = $1', [restaurantId]);
        const restName = restRes.rows[0]?.name || 'Unknown';

        const ordersRes = await db.query(`
            SELECT o.order_number, u.name as customer, o.total, o.subtotal,
                   o.delivery_fee, o.payment_method, o.status,
                   to_char(o.placed_at, 'YYYY-MM-DD HH24:MI') as placed_at
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.restaurant_id = $1 ${dateFilter}
            ORDER BY o.placed_at DESC
        `, [restaurantId]);

        const statsRes = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                COUNT(*) FILTER (WHERE o.payment_method = 'cod') as cod_orders,
                COALESCE(SUM(o.total) FILTER (WHERE o.payment_method = 'cod'), 0) as cod_amount,
                COUNT(*) FILTER (WHERE o.payment_method != 'cod' OR o.payment_method IS NULL) as prepaid_orders,
                COALESCE(SUM(o.total) FILTER (WHERE o.payment_method != 'cod' OR o.payment_method IS NULL), 0) as prepaid_amount,
                COALESCE(SUM(o.total), 0) as total_revenue
            FROM orders o
            WHERE o.restaurant_id = $1 ${dateFilter}
        `, [restaurantId]);

        const s = statsRes.rows[0];
        let csv = `Restaurant Report - ${restName} (${period})\n`;
        csv += `Generated: ${new Date().toLocaleString()}\n\n`;
        csv += `SUMMARY\n`;
        csv += `Total Orders,${s.total_orders}\n`;
        csv += `COD Orders,${s.cod_orders},Amount,${s.cod_amount}\n`;
        csv += `Prepaid Orders,${s.prepaid_orders},Amount,${s.prepaid_amount}\n`;
        csv += `Total Revenue,${s.total_revenue}\n\n`;
        csv += `ORDER DETAILS\n`;
        csv += `Order#,Customer,Total,Subtotal,Delivery Fee,Payment,Status,Placed At\n`;

        ordersRes.rows.forEach(o => {
            csv += `${o.order_number},${o.customer},${o.total},${o.subtotal},${o.delivery_fee},${o.payment_method || 'online'},${o.status},${o.placed_at}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=restaurant_${restName.replace(/\s+/g, '_')}_${period}.csv`);
        res.send(csv);
    } catch (e) { next(e); }
};

/**
 * Get all riders list (for report selection dropdown)
 */
const getRidersList = async (req, res, next) => {
    try {
        const { rows } = await db.query(`
            SELECT u.id, u.name, u.email, u.phone, dp.vehicle_type, dp.total_deliveries, dp.total_earnings
            FROM delivery_partners dp
            JOIN users u ON dp.user_id = u.id
            ORDER BY u.name
        `);
        res.json({ success: true, data: { riders: rows } });
    } catch (e) { next(e); }
};

/**
 * Get all restaurants list (for report selection dropdown)
 */
const getRestaurantsList = async (req, res, next) => {
    try {
        const { rows } = await db.query(`
            SELECT id, name, address, phone
            FROM restaurants
            WHERE is_approved = true
            ORDER BY name
        `);
        res.json({ success: true, data: { restaurants: rows } });
    } catch (e) { next(e); }
};

module.exports = {
    getRiderReport,
    downloadRiderCSV,
    getRestaurantReport,
    downloadRestaurantCSV,
    getRidersList,
    getRestaurantsList
};
