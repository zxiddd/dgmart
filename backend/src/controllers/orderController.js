const db = require('../config/db');
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } = require('../config/constants');
const { generateOrderNumber, calculateDeliveryFee, estimateDeliveryTime } = require('../utils/helpers');
// const { sendPushNotification } = require('../services/firebaseService');
const { sendWebPush } = require('../services/webPushService');
const { calculateDistance } = require('../utils/helpers');
const Razorpay = require('razorpay');
const config = require('../config/env');
const fs = require('fs');
const path = require('path');

let razorpay = null;
try {
    if (config.razorpay.keyId && config.razorpay.keySecret) {
        razorpay = new Razorpay({
            key_id: config.razorpay.keyId,
            key_secret: config.razorpay.keySecret,
        });
        console.log('✅ Razorpay initialized successfully');
    } else {
        console.warn('⚠️ Razorpay keys missing. Payment features will be limited.');
    }
} catch (error) {
    console.warn('⚠️ Razorpay initialization failed:', error.message);
}

const logDebug = (msg) => {
    try {
        const logFile = path.join(__dirname, '../../debug.log');
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {
        console.error('Failed to write to debug log:', e);
    }
};

// ... (createOrder, getUserOrders, getOrder, getRestaurantOrders, updateOrderStatus from previous step)
// I will include them again for completeness to overwrite the file properly.

/**
 * Place a new order
 */
const createOrder = async (req, res, next) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const { restaurant_id, address_id, items, payment_method, promo_code, tip, special_instructions, phone } = req.body;
        const userId = req.user.id;

        // Fetch user phone if not in request
        let customerPhone = phone;
        const userRes = await client.query('SELECT phone FROM users WHERE id = $1', [userId]);

        if (!customerPhone && userRes.rows.length > 0) {
            customerPhone = userRes.rows[0].phone;
        }

        if (!customerPhone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required to place an order.',
            });
        }

        // Insert variables to check verification
        const { rows: configRows } = await client.query("SELECT value FROM platform_settings WHERE key = 'global'");
        let requireVerification = true; // safe default
        if (configRows.length > 0 && configRows[0].value && configRows[0].value.require_phone_verification !== undefined) {
            requireVerification = configRows[0].value.require_phone_verification;
        }

        const { rows: userRows } = await client.query("SELECT is_phone_verified FROM users WHERE id = $1", [userId]);
        const isVerified = userRows.length > 0 ? userRows[0].is_phone_verified : false;

        if (requireVerification && !isVerified) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                success: false,
                requiresPhoneVerification: true,
                message: 'Phone number verification is required before placing an order.'
            });
        }

        // Update user phone if it was provided and different
        if (phone && phone !== userRes.rows[0]?.phone) {
            await client.query('UPDATE users SET phone = $1 WHERE id = $2', [phone, userId]);
        }

        // Rate Limiting: Prevent orders within 30 seconds of the last order
        const lastOrderRes = await client.query('SELECT placed_at FROM orders WHERE user_id = $1 ORDER BY placed_at DESC LIMIT 1', [userId]);
        if (lastOrderRes.rows.length > 0) {
            const lastOrderTime = new Date(lastOrderRes.rows[0].placed_at).getTime();
            const now = Date.now();
            if (now - lastOrderTime < 30000) {
                return res.status(429).json({
                    success: false,
                    message: 'Please wait 30 seconds before placing another order to prevent duplicates.'
                });
            }
        }

        // Generate 4-digit OTP
        const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

        // Validate restaurant
        const restRes = await client.query('SELECT * FROM restaurants WHERE id = $1', [restaurant_id]);
        if (restRes.rows.length === 0 || !restRes.rows[0].is_active) throw new Error('Restaurant is not available.');
        const restaurant = restRes.rows[0];

        // Validate address
        const addrRes = await client.query('SELECT * FROM addresses WHERE id = $1', [address_id]);
        if (addrRes.rows.length === 0 || addrRes.rows[0].user_id !== userId) {
            console.error('❌ [ORDER FAIL] Invalid address block:', {
                providedAddressId: address_id,
                foundRows: addrRes.rows.length,
                dbUserId: addrRes.rows[0]?.user_id,
                requestUserId: userId
            });
            throw new Error('Invalid delivery address.');
        }
        const address = addrRes.rows[0];

        // Calculate distance/fee
        // Calculate distance/fee
        const distance = calculateDistance(restaurant.lat, restaurant.lng, address.lat, address.lng);
        if (distance > (restaurant.delivery_radius_km || 15)) throw new Error('Delivery address is too far.');



        // Fetch items
        let subtotal = 0;
        const orderItems = [];

        const itemIds = items.map(i => i.item_id);
        const itemsRes = await client.query('SELECT * FROM menu_items WHERE id = ANY($1)', [itemIds]);

        for (const item of items) {
            const itemData = itemsRes.rows.find(row => row.id === item.item_id);
            if (!itemData || itemData.restaurant_id !== restaurant_id) throw new Error(`Item ${item.item_id} not found.`);
            if (!itemData.is_available) throw new Error(`${itemData.name} unavailable.`);

            let itemTotal = parseFloat(itemData.price) * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                item_id: item.item_id, item_name: itemData.name, item_price: itemData.price,
                quantity: item.quantity, customizations: item.customizations || [], total_price: itemTotal
            });
        }

        // Dynamic Delivery Fee based on Zones
        let deliveryFee = 0;
        const zonesRes = await client.query('SELECT * FROM delivery_zones WHERE is_active = true');

        // Find matching zone (case-insensitive check in full_address)
        const matchedZone = zonesRes.rows.find(z =>
            address.full_address.toLowerCase().includes(z.name.toLowerCase()) ||
            (address.city && address.city.toLowerCase().includes(z.name.toLowerCase()))
        );

        if (matchedZone) {
            deliveryFee = parseFloat(matchedZone.delivery_fee);
            if (subtotal < parseFloat(matchedZone.min_order_amount || 0)) {
                throw new Error(`Minimum order for ${matchedZone.name} is ₹${matchedZone.min_order_amount}`);
            }
        } else {
            // Fallback to Degloor or Distance
            const defaultZone = zonesRes.rows.find(z => z.name.toLowerCase() === 'degloor');
            if (defaultZone) {
                deliveryFee = parseFloat(defaultZone.delivery_fee);
            } else {
                deliveryFee = calculateDeliveryFee(distance);
            }
        }

        if (subtotal < (restaurant.min_order_amount || 0)) throw new Error(`Min order is ${restaurant.min_order_amount}.`);

        // Promo
        let discount = 0;
        let promoId = null;
        if (promo_code) {
            const promoRes = await client.query('SELECT * FROM promo_codes WHERE code = $1 AND is_active = true', [promo_code.toUpperCase()]);
            if (promoRes.rows.length > 0) {
                const promo = promoRes.rows[0];
                const now = new Date();
                if ((!promo.valid_from || new Date(promo.valid_from) <= now) &&
                    (!promo.valid_until || new Date(promo.valid_until) >= now)) {
                    if (subtotal >= parseFloat(promo.min_order || 0)) {
                        if (promo.first_order_only) {
                            const pastOrders = await client.query('SELECT id FROM orders WHERE user_id = $1 LIMIT 1', [userId]);
                            if (pastOrders.rows.length > 0) throw new Error('Promo is for first orders only.');
                        }
                        if (!promo.usage_limit || promo.used_count < promo.usage_limit) {
                            if (promo.type === 'percentage') {
                                discount = (subtotal * parseFloat(promo.value)) / 100;
                                if (promo.max_discount) discount = Math.min(discount, parseFloat(promo.max_discount));
                            } else {
                                discount = parseFloat(promo.value);
                            }
                            promoId = promo.id;
                            await client.query('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1', [promo.id]);
                        }
                    }
                }
            }
        }

        const tax = subtotal * 0.05;
        const tipAmount = parseFloat(tip || 0);
        const total = subtotal + deliveryFee + tax - discount + tipAmount;
        const estimatedTime = estimateDeliveryTime(distance, restaurant.avg_prep_time_mins || 20);

        const orderQuery = `
            INSERT INTO orders (
                order_number, user_id, restaurant_id, address_id, promo_id,
                status, subtotal, delivery_fee, tax, discount, tip, total,
                payment_method, payment_status, special_instructions,
                delivery_address, delivery_lat, delivery_lng, estimated_delivery_mins, distance_km,
                delivery_otp, customer_phone,
                placed_at 
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW()) RETURNING *
        `;
        const values = [
            generateOrderNumber(), userId, restaurant_id, address_id, promoId,
            ORDER_STATUS.PLACED, subtotal, deliveryFee, tax, discount, tipAmount, total,
            payment_method, payment_method === PAYMENT_METHOD.COD ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PENDING,
            special_instructions, address.full_address, address.lat, address.lng, estimatedTime, distance,
            deliveryOtp, customerPhone
        ];

        const orderRes = await client.query(orderQuery, values);
        const order = orderRes.rows[0];

        if (payment_method === PAYMENT_METHOD.RAZORPAY) {
            if (!razorpay) throw new Error('Online payments are currently unavailable. Please use COD.');
            const rzpOrder = await razorpay.orders.create({
                amount: Math.round(total * 100),
                currency: 'INR',
                receipt: order.order_number,
                notes: { order_id: order.id, user_id: userId }
            });
            await client.query('UPDATE orders SET razorpay_order_id = $1 WHERE id = $2', [rzpOrder.id, order.id]);
            order.razorpay_order_id = rzpOrder.id;
        }

        if (orderItems.length > 0) {
            const valuesParams = [];
            const flatValues = [];
            let pIdx = 1;
            for (const item of orderItems) {
                valuesParams.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
                flatValues.push(order.id, item.item_id, item.item_name, item.item_price, item.quantity, JSON.stringify(item.customizations), item.total_price);
            }
            await client.query(`INSERT INTO order_items (order_id, item_id, item_name, item_price, quantity, customizations, total_price) VALUES ${valuesParams.join(', ')}`, flatValues);
        }

        await client.query('COMMIT');

        createNotification(userId, 'Order Placed', `Order ${order.order_number} placed.`, 'order_update', { order_id: order.id });

        // Emit socket events so restaurant & admin see this INSTANTLY
        const io = global.io;
        if (io) {
            const newOrderPayload = {
                id: order.id,
                order_number: order.order_number,
                status: order.status,
                total: order.total,
                subtotal: order.subtotal,
                delivery_fee: order.delivery_fee,
                payment_method: order.payment_method,
                delivery_address: order.delivery_address,
                special_instructions: order.special_instructions,
                created_at: order.placed_at || new Date().toISOString(),
                items: orderItems.map(i => ({ name: i.item_name, quantity: i.quantity })),
            };
            // Notify restaurant dashboard
            io.to(`restaurant:${restaurant_id}`).emit('new_order', newOrderPayload);
            // Notify all admins
            io.to('role:admin').emit('new_order', newOrderPayload);
            io.to('admin:dashboard').emit('new_order', newOrderPayload);
            // Subscribe the user to their order room so they get future updates
            io.to(`user:${userId}`).emit('order_placed', { order_id: order.id });
        }

        res.status(201).json({
            success: true,
            message: 'Order placed.',
            data: {
                order,
                items: orderItems,
                razorpay_key_id: config.razorpay.keyId // frontend needs this
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

const getUserOrders = async (req, res, next) => {
    try {
        const { status, page, limit } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const offset = (pageNum - 1) * limitNum;

        let query = `
            SELECT o.*, r.name as restaurant_name, r.image_url as restaurant_image 
            FROM orders o 
            JOIN restaurants r ON o.restaurant_id = r.id 
            WHERE o.user_id = $1
        `;
        const params = [req.user.id];
        let pCheck = 1;

        if (status) {
            pCheck++;
            query += ` AND o.status = $${pCheck}`;
            params.push(status);
        }

        query += ` ORDER BY o.created_at DESC LIMIT $${pCheck + 1} OFFSET $${pCheck + 2}`;
        params.push(limitNum, offset);

        const { rows } = await db.query(query, params);

        // Fetch items for each order
        const ordersWithItems = await Promise.all(rows.map(async (order) => {
            const itemsRes = await db.query('SELECT item_name, quantity FROM order_items WHERE order_id = $1', [order.id]);
            return {
                ...order,
                items: itemsRes.rows.map(i => `${i.item_name} (${i.quantity})`) // Format as ["Burger (2)", "Coke (1)"]
            };
        }));

        res.json({ success: true, data: { orders: ordersWithItems, pagination: { page: pageNum, limit: limitNum, total: rows.length } } });
    } catch (e) { next(e); }
};

const getOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT o.*, r.name as restaurant_name, r.phone as restaurant_phone
            FROM orders o
            JOIN restaurants r ON o.restaurant_id = r.id
            WHERE o.id = $1
        `;
        const orderRes = await db.query(query, [id]);
        if (orderRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        const order = orderRes.rows[0];

        if (order.user_id !== req.user.id && order.restaurant_id !== req.user.restaurant_id && !['admin', 'super_admin'].includes(req.user.role) && req.user.role !== 'delivery_partner') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
        const delRes = await db.query('SELECT da.*, u.name as partner_name, u.phone as partner_phone FROM delivery_assignments da LEFT JOIN users u ON da.partner_id = u.id WHERE da.order_id = $1', [id]);

        const delivery = delRes.rows[0] || null;

        // Hide rider details from user until picked up
        if (req.user.role === 'customer' && delivery && !['picked_up', 'on_the_way', 'delivered'].includes(order.status)) {
            delivery.partner_name = 'Assigning...';
            delivery.partner_phone = null;
        }

        res.json({ success: true, data: { order, items: itemsRes.rows, delivery } });
    } catch (e) {
        next(e);
    }
};

const getRestaurantOrders = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { rows } = await db.query('SELECT * FROM orders WHERE restaurant_id = $1 ORDER BY created_at DESC', [restaurantId]);
        res.json({ success: true, data: { orders: rows } });
    } catch (e) { next(e); }
};

const updateOrderStatus = async (req, res, next) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { status } = req.body;

        const orderRes = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (orderRes.rows.length === 0) throw new Error('Order not found');
        const order = orderRes.rows[0];

        let updates = 'status = $1, updated_at = NOW()';
        if (status === 'confirmed') updates += `, accepted_at = NOW()`;
        if (status === 'ready') updates += `, ready_at = NOW()`;
        if (status === 'picked_up') updates += `, picked_up_at = NOW()`;
        if (status === 'delivered') {
            updates += `, delivered_at = NOW()`;
            await client.query('UPDATE restaurants SET total_orders = total_orders + 1 WHERE id = $1', [order.restaurant_id]);
            await client.query('UPDATE users SET total_orders = COALESCE(total_orders, 0) + 1 WHERE id = $1', [order.user_id]); // If added col
        }

        if (status === 'cancelled' || status === 'rejected') {
            updates += `, cancelled_at = NOW()`;
            // Handle Refund if paid
            if (order.payment_status === 'completed') {
                await client.query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2', [order.total, order.user_id]);
                await client.query("INSERT INTO wallet_transactions (user_id, type, amount, description, reference_type, reference_id) VALUES ($1, 'credit', $2, $3, 'refund', $4)",
                    [order.user_id, order.total, `Refund for ${status} order ${order.order_number}`, id]);
                await client.query("UPDATE orders SET payment_status = 'refunded' WHERE id = $1", [id]);
            }
        }

        await client.query(`UPDATE orders SET ${updates} WHERE id = $2`, [status, id]);

        if (status === 'ready') await assignDeliveryPartner(id, order, client);

        await client.query('COMMIT');
        createNotification(order.user_id, 'Order Update', `Order is ${status}`, 'order_update', { order_id: id });

        // Emit socket event
        const io = global.io;
        if (io) {
            const payload = {
                order_id: id,
                id: id,
                status: status,
                updated_at: new Date().toISOString()
            };
            io.to(`order:${id}`).emit('order_update', payload);
            io.to(`restaurant:${order.restaurant_id}`).emit('order_status_updated', payload);
            io.to('admin:dashboard').emit('order_status_updated', payload);
        }

        res.json({ success: true, message: 'Updated' });
    } catch (e) {
        logDebug(`Update Order Status Failed: ${e.message}`);
        logDebug(`Params: ${JSON.stringify(req.params)} Body: ${JSON.stringify(req.body)}`);
        console.error('Update Order Status Failed:', e);
        console.error('Params:', req.params, 'Body:', req.body);
        await client.query('ROLLBACK');
        next(e);
    } finally { client.release(); }
};

const cancelOrder = async (req, res, next) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { cancellation_reason } = req.body;
        const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

        const resOrder = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (resOrder.rows.length === 0) throw new Error('Order not found');
        const order = resOrder.rows[0];

        // Authorization: User can cancel their own, Admin can cancel any
        if (order.user_id !== req.user.id && !isAdmin) throw new Error('Not authorized to cancel this order');

        // Business Rule: Users can't cancel if already preparing/ready/delivered
        if (!isAdmin && !['placed', 'confirmed'].includes(order.status)) {
            throw new Error(`Cannot cancel order in ${order.status} state. Please contact support.`);
        }

        await client.query('UPDATE orders SET status = $1, cancelled_at = NOW(), cancellation_reason = $2 WHERE id = $3',
            ['cancelled', cancellation_reason || (isAdmin ? 'Cancelled by Admin' : 'User cancelled'), id]);

        if (order.payment_status === 'completed') {
            // Refund logic to wallet
            await client.query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2', [order.total, order.user_id]);
            await client.query("INSERT INTO wallet_transactions (user_id, type, amount, description, reference_type, reference_id) VALUES ($1, 'credit', $2, $3, 'refund', $4)",
                [order.user_id, order.total, `Refund for cancelled order ${order.order_number}`, id]);
            await client.query("UPDATE orders SET payment_status = 'refunded' WHERE id = $1", [id]);
        }

        await client.query('COMMIT');

        // Real-time notifications
        const io = global.io;
        if (io) {
            const updatePayload = {
                order_id: id,
                id: id, // For compatibility
                status: 'cancelled',
                cancellation_reason: cancellation_reason || 'Cancelled',
                updated_at: new Date().toISOString()
            };

            // Notify User Room
            io.to(`order:${id}`).emit('order_update', updatePayload);

            // Notify Restaurant Dashboard
            io.to(`restaurant:${order.restaurant_id}`).emit('order_status_updated', updatePayload);

            // Notify Admin Dashboard
            io.to('admin:dashboard').emit('order_status_updated', updatePayload);
        }

        res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (e) {
        await client.query('ROLLBACK');
        next(e);
    } finally {
        client.release();
    }
};

const addReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        const orderRes = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (orderRes.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
        const order = orderRes.rows[0];

        if (order.user_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
        if (order.status !== 'delivered') return res.status(400).json({ message: 'Order must be delivered' });

        const check = await db.query('SELECT id FROM reviews WHERE order_id = $1', [id]);
        if (check.rows.length > 0) return res.status(400).json({ message: 'Already reviewed' });

        await db.query(`INSERT INTO reviews (user_id, order_id, restaurant_id, rating, comment) VALUES ($1, $2, $3, $4, $5)`, [req.user.id, id, order.restaurant_id, rating, comment]);

        // Recalc restaurant rating
        const stats = await db.query('SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE restaurant_id = $1', [order.restaurant_id]);
        if (stats.rows.length > 0) {
            await db.query('UPDATE restaurants SET rating = $1, total_reviews = $2 WHERE id = $3', [parseFloat(stats.rows[0].avg).toFixed(1), stats.rows[0].count, order.restaurant_id]);
        }

        res.status(201).json({ success: true, message: 'Review added' });
    } catch (e) { next(e); }
};

const reorder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const resItems = await db.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
        const orderRes = await db.query('SELECT restaurant_id FROM orders WHERE id = $1', [id]);

        if (resItems.rows.length === 0) return res.status(404).json({ message: 'No items found' });

        const availableItems = [];
        const unavailableItems = [];

        for (const item of resItems.rows) {
            const menuRes = await db.query('SELECT * FROM menu_items WHERE id = $1', [item.item_id]);
            if (menuRes.rows.length > 0 && menuRes.rows[0].is_available) {
                availableItems.push({ item_id: item.item_id, quantity: item.quantity, customizations: item.customizations });
            } else {
                unavailableItems.push(item.item_name);
            }
        }

        res.json({ success: true, data: { restaurant_id: orderRes.rows[0].restaurant_id, items: availableItems, unavailable_items: unavailableItems } });
    } catch (e) { next(e); }
};

// Helper - simplified logic
const assignDeliveryPartner = async (orderId, order, client) => {
    try {
        console.log(`Starting smarter assignment for order: ${order.order_number}`);

        // 1. Find the restaurant's location
        const restRes = await client.query('SELECT lat, lng, name FROM restaurants WHERE id = $1', [order.restaurant_id]);
        if (restRes.rows.length === 0) return;
        const restaurant = restRes.rows[0];

        // 2. Fetch all online and verified partners
        const resPartners = await client.query(`
            SELECT p.*, u.name as partner_name,
            (SELECT COUNT(*) FROM delivery_assignments WHERE partner_id = p.user_id AND status IN ('assigned', 'accepted', 'picked_up')) as active_orders
            FROM delivery_partners p
            JOIN users u ON p.user_id = u.id
            WHERE p.is_online = true AND p.is_verified = true
        `);

        let bestPartner = null;
        let minScore = Infinity;

        for (const p of resPartners.rows) {
            // Calculate distance from partner to restaurant (for pickup)
            const distToRest = calculateDistance(p.current_lat, p.current_lng, restaurant.lat, restaurant.lng);

            // Scoring logic:
            // - Priority 1: 0 active orders (base score = distance)
            // - Priority 2: 1 active order AND "Almost there" (within 1km of current dropoff)

            let score = distToRest;

            if (p.active_orders > 0) {
                if (p.active_orders >= 2) continue; // Skip riders with 2+ orders

                // If 1 order, check if "Almost there"
                const activeAssign = await client.query(`
                    SELECT o.delivery_lat, o.delivery_lng 
                    FROM delivery_assignments da
                    JOIN orders o ON da.order_id = o.id
                    WHERE da.partner_id = $1 AND da.status IN ('accepted', 'picked_up')
                    LIMIT 1
                `, [p.user_id]);

                if (activeAssign.rows.length > 0) {
                    const dropoff = activeAssign.rows[0];
                    const distToDropoff = calculateDistance(p.current_lat, p.current_lng, dropoff.delivery_lat, dropoff.delivery_lng);

                    if (distToDropoff > 1.5) continue; // Only consider if < 1.5km from current dropoff

                    // Rider is almost done. Add a small penalty to prioritize idle riders, 
                    // but still keep them in the pool if they are very close.
                    score += 2; // 2km penalty for being busy
                }
            }

            if (score < minScore) {
                minScore = score;
                bestPartner = p;
            }
        }

        if (bestPartner) {
            console.log(`Assigned partner ${bestPartner.partner_name} to order ${order.order_number}`);

            const assignmentRes = await client.query(`
                INSERT INTO delivery_assignments (order_id, partner_id, status) 
                VALUES ($1, $2, 'assigned') 
                RETURNING *
            `, [orderId, bestPartner.user_id]);

            const assignment = assignmentRes.rows[0];

            // 3. Notify Partner via Socket
            const io = global.io; // Ensure io is accessible globally or passed
            if (io) {
                console.log(`Emitting new_assignment to user:${bestPartner.user_id}`);
                io.to(`user:${bestPartner.user_id}`).emit('new_assignment', {
                    assignment_id: assignment.id,
                    order_id: orderId,
                    order_number: order.order_number,
                    restaurant_name: restaurant.name,
                    delivery_address: order.delivery_address,
                    total: order.total,
                    distance: order.distance_km
                });
            } else {
                console.error('Socket.io instance (global.io) not found!');
            }

            // 4. Notify Partner via Web Push
            await sendWebPush(
                bestPartner.user_id,
                '🛵 New Order Assigned!',
                `Order #${order.order_number} from ${restaurant.name} is assigned to you.`,
                {
                    assignment_id: assignment.id,
                    order_id: orderId,
                    url: '/dashboard'
                }
            );

            // Create persistent notification
            await client.query(`
                INSERT INTO notifications (user_id, title, body, type, data) 
                VALUES ($1, $2, $3, 'new_assignment', $4)
            `, [
                bestPartner.user_id,
                'New Order Assigned!',
                `You have a new delivery from ${restaurant.name}`,
                JSON.stringify({ order_id: orderId, assignment_id: assignment.id })
            ]);
        } else {
            console.log(`No available partners found for order ${order.order_number}`);
            console.log(`Searched ${resPartners.rows.length} online & verified partners.`);
            if (resPartners.rows.length === 0) {
                console.log('Reason: No partners are currently online and verified.');
            }
        }
    } catch (e) {
        console.error('Smarter assignment failed:', e);
    }
};

const createNotification = async (userId, title, body, type, data) => {
    try {
        await db.query(`INSERT INTO notifications (user_id, title, body, type, data) VALUES ($1, $2, $3, $4, $5)`, [userId, title, body, type, JSON.stringify(data)]);
    } catch (e) { console.error(e); }
};

const getMyRestaurantOrders = async (req, res, next) => {
    try {
        // Find restaurant for this user
        const restRes = await db.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
        if (restRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Restaurant not found for user' });

        const restaurantId = restRes.rows[0].id;
        const { rows } = await db.query('SELECT * FROM orders WHERE restaurant_id = $1 ORDER BY created_at DESC', [restaurantId]);

        // Fetch items for each order to show details
        // This is an N+1 query, but for a simple dashboard it's okay for now. 
        // Optimization: Fetch all items for these orders in one go.
        const ordersWithItems = await Promise.all(rows.map(async (order) => {
            const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
            return { ...order, items: itemsRes.rows };
        }));

        res.json({ success: true, data: { orders: ordersWithItems } });
    } catch (e) { next(e); }
};

/**
 * Preview Order (Calculate Fees & Total)
 */
const previewOrder = async (req, res, next) => {
    const client = await db.getClient();
    try {
        const { restaurant_id, address_id, items, promo_code, tip } = req.body;
        const userId = req.user.id;

        console.log('Preview Order Body:', req.body); // DEBUG LOG
        console.log('User ID:', userId); // DEBUG LOG
        logDebug(`Preview Order Body: ${JSON.stringify(req.body)}`);
        logDebug(`User ID: ${userId}`);

        // 1. Validate Restaurant
        console.log('Querying restaurant with ID:', restaurant_id);
        const cleanRestId = restaurant_id ? restaurant_id.trim() : null;
        logDebug(`Querying restaurant with ID: '${cleanRestId}' (original: '${restaurant_id}')`);

        const restRes = await client.query('SELECT * FROM restaurants WHERE id = $1', [cleanRestId]);
        console.log('Restaurant query result rows:', restRes.rows.length);
        logDebug(`Restaurant query result rows: ${restRes.rows.length}`);

        if (restRes.rows.length === 0) throw new Error('Restaurant not found.');
        const restaurant = restRes.rows[0];

        // 2. Validate Address
        const addrRes = await client.query('SELECT * FROM addresses WHERE id = $1', [address_id]);
        if (addrRes.rows.length === 0) throw new Error('Invalid address.');
        const address = addrRes.rows[0];

        // 3. Calculate Subtotal
        let subtotal = 0;
        const orderItems = [];
        const itemIds = items.map(i => i.item_id);
        const itemsRes = await client.query('SELECT * FROM menu_items WHERE id = ANY($1)', [itemIds]);

        for (const item of items) {
            const itemData = itemsRes.rows.find(row => row.id === item.item_id);
            if (itemData) {
                let itemTotal = parseFloat(itemData.price) * item.quantity;
                subtotal += itemTotal;
                orderItems.push({ name: itemData.name, price: itemData.price, quantity: item.quantity, total: itemTotal });
            }
        }

        // 4. Calculate Delivery Fee (Dynamic)
        let deliveryFee = 0;
        const zonesRes = await client.query('SELECT * FROM delivery_zones WHERE is_active = true');
        const matchedZone = zonesRes.rows.find(z =>
            address.full_address.toLowerCase().includes(z.name.toLowerCase()) ||
            (address.city && address.city.toLowerCase().includes(z.name.toLowerCase()))
        );

        if (matchedZone) {
            deliveryFee = parseFloat(matchedZone.delivery_fee);
            if (subtotal < parseFloat(matchedZone.min_order_amount || 0)) {
                // Return error or just data with warning? Better to throw for preview.
                throw new Error(`Minimum order for ${matchedZone.name} is ₹${matchedZone.min_order_amount}`);
            }
        } else {
            const defaultZone = zonesRes.rows.find(z => z.name.toLowerCase() === 'degloor');
            if (defaultZone) {
                deliveryFee = parseFloat(defaultZone.delivery_fee);
            } else {
                // Fallback distance
                const distance = calculateDistance(restaurant.lat, restaurant.lng, address.lat, address.lng);
                deliveryFee = calculateDeliveryFee(distance);
            }
        }

        // 5. Calculate Taxes & Charges
        const platformFee = 5.00;
        const taxes = subtotal * 0.05; // 5% tax example

        // 6. Promo
        let discount = 0;
        if (promo_code) {
            const promoRes = await client.query('SELECT * FROM promo_codes WHERE code = $1 AND is_active = true', [promo_code.toUpperCase()]);
            if (promoRes.rows.length > 0) {
                const promo = promoRes.rows[0];
                // basic validation
                if (subtotal >= parseFloat(promo.min_order || 0)) {
                    if (promo.type === 'percentage') {
                        discount = (subtotal * parseFloat(promo.value)) / 100;
                        if (promo.max_discount) discount = Math.min(discount, parseFloat(promo.max_discount));
                    } else {
                        discount = parseFloat(promo.value);
                    }
                }
            }
        }

        const total = subtotal + deliveryFee + platformFee + taxes - discount + (tip || 0);

        res.json({
            success: true,
            data: {
                subtotal,
                delivery_fee: deliveryFee,
                platform_fee: platformFee,
                taxes,
                discount,
                tip: tip || 0,
                total,
                zone_name: matchedZone ? matchedZone.name : 'Standard',
                items: orderItems
            }
        });

    } catch (e) {
        logDebug(`Preview Order Failed: ${e.message}`);
        logDebug(e.stack);
        next(e);
    } finally {
        client.release();
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrder,
    cancelOrder,
    addReview,
    reorder,
    getMyRestaurantOrders,
    getRestaurantOrders,
    updateOrderStatus,
    previewOrder, // Exported
    assignDeliveryPartner // Exported for testing
};
