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
            key_id: config.razorpay.keyId.trim(),
            key_secret: config.razorpay.keySecret.trim(),
        });
        console.log(`✅ Razorpay initialized successfully (Key ID: ${config.razorpay.keyId.substring(0, 14)}...)`);
    } else {
        console.warn('⚠️ Razorpay keys missing. KeyID:', !!config.razorpay.keyId, 'KeySecret:', !!config.razorpay.keySecret);
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
            // Enhanced logging for debugging
            console.error('❌ [ORDER FAIL] Address Not Found or Ownership Mismatch:', {
                providedAddressId: address_id,
                foundInDb: addrRes.rows.length > 0,
                addressOwner: addrRes.rows[0]?.user_id,
                requestUser: userId,
                // Check if the address exists but belongs to a different user
                otherAddressesCount: (await client.query('SELECT count(*) FROM addresses WHERE user_id = $1', [userId])).rows[0].count
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
                            // Track per-user usage
                            await client.query(
                                'INSERT INTO promo_code_usages (promo_id, user_id, used_at) VALUES ($1, $2, NOW())',
                                [promo.id, userId]
                            );
                        }
                    }
                }
            }
        }

        const tax = subtotal * 0.05;
        const tipAmount = parseFloat(tip || 0);
        const total = subtotal + deliveryFee + tax - discount + tipAmount;
        const estimatedTime = estimateDeliveryTime(distance, restaurant.avg_prep_time_mins || 20);

        const isOnline = payment_method === PAYMENT_METHOD.RAZORPAY || payment_method === PAYMENT_METHOD.ONLINE;

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
            isOnline ? ORDER_STATUS.PAYMENT_PENDING : ORDER_STATUS.PLACED, subtotal, deliveryFee, tax, discount, tipAmount, total,
            payment_method, PAYMENT_STATUS.PENDING,
            special_instructions, address.full_address, address.lat, address.lng, estimatedTime, distance,
            deliveryOtp, customerPhone
        ];

        const orderRes = await client.query(orderQuery, values);
        const order = orderRes.rows[0];

        // Also update user's last phone for future orders
        await client.query('UPDATE users SET phone = $1 WHERE id = $2', [customerPhone, userId]);

        if (payment_method === PAYMENT_METHOD.RAZORPAY || payment_method === PAYMENT_METHOD.ONLINE) {
            if (!razorpay) throw new Error('Online payments are currently unavailable. Please use COD.');

            try {
                console.log(`📡 [RAZORPAY] Creating order for ${order.order_number}, amount: ${Math.round(total * 100)}`);
                const rzpOrder = await razorpay.orders.create({
                    amount: Math.round(total * 100),
                    currency: 'INR',
                    receipt: order.order_number,
                    notes: { order_id: order.id, user_id: userId }
                });
                console.log(`✅ [RAZORPAY] Order created: ${rzpOrder.id}`);
                await client.query('UPDATE orders SET razorpay_order_id = $1 WHERE id = $2', [rzpOrder.id, order.id]);
                order.razorpay_order_id = rzpOrder.id;
            } catch (rzpError) {
                console.error('❌ [RAZORPAY ERROR]:', {
                    message: rzpError.message,
                    code: rzpError.code,
                    description: rzpError.description,
                    metadata: rzpError.metadata,
                    statusCode: rzpError.statusCode
                });
                throw new Error(`Payment gateway error: ${rzpError.description || rzpError.message || 'Authentication failed'}`);
            }
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

        // Only notify restaurant/admin if it's NOT a pending online payment
        if (!isOnline) {
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
            }

            // Push notification to restaurant owner
            await sendWebPush(
                restaurant.owner_id,
                `🔔 New Order #${order.order_number}!`,
                `You have a new order totalling ₹${order.total}. Tap to view.`,
                { order_id: order.id, url: '/dashboard' }
            ).catch(() => {});
        }

        // Always notify the user that order room is ready
        const io = global.io;
        if (io) {
            io.to(`user:${userId}`).emit('order_placed', { order_id: order.id, status: order.status });
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
        const delRes = await db.query(`
            SELECT da.*, u.name as partner_name, u.phone as partner_phone 
            FROM delivery_assignments da 
            LEFT JOIN users u ON da.partner_id = u.id 
            WHERE da.order_id = $1 AND da.status NOT IN ('rejected', 'cancelled')
            ORDER BY da.created_at DESC LIMIT 1
        `, [id]);

        const delivery = delRes.rows[0] || null;

        // If a delivery partner is actively assigned, their details will be shown to the user immediately.
        // No need to hide them based on the order.status (which can go back to 'preparing' if restaurant toggles it).

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

        // When order is 'ready', we immediately transition it to 'searching_rider'
        // which triggers rider broadcast. We set ready_at but store 'searching_rider' as the final status.
        const effectiveStatus = status === 'ready' ? 'searching_rider' : status;

        let updates = 'status = $1, updated_at = NOW()';
        if (status === 'confirmed') updates += `, accepted_at = NOW()`;
        if (status === 'ready') updates += `, ready_at = NOW()`; // still record when it was ready
        if (status === 'picked_up') updates += `, picked_up_at = NOW()`;
        if (status === 'delivered') {
            updates += `, delivered_at = NOW()`;
            await client.query('UPDATE restaurants SET total_orders = total_orders + 1 WHERE id = $1', [order.restaurant_id]);
            await client.query('UPDATE users SET total_orders = COALESCE(total_orders, 0) + 1 WHERE id = $1', [order.user_id]);
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

        // Single UPDATE with effectiveStatus — avoids double-write constraint violation
        await client.query(`UPDATE orders SET ${updates} WHERE id = $2`, [effectiveStatus, id]);

        // COMMIT first — broadcast happens AFTER so any failure there doesn't rollback the status update
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
            
            // Notify assigned driver if exists
            const assignRes = await client.query('SELECT partner_id, id as assignment_id FROM delivery_assignments WHERE order_id = $1 AND status NOT IN (\'rejected\', \'cancelled\') ORDER BY created_at DESC LIMIT 1', [id]);
            if (assignRes.rows.length > 0) {
                io.to(`user:${assignRes.rows[0].partner_id}`).emit('assignment_status_update', {
                    ...payload,
                    assignment_id: assignRes.rows[0].assignment_id
                });
            }
        }

        res.json({ success: true, message: 'Updated' });

        // Push notification to customer on key status changes
        const statusMessages = {
            confirmed: { title: '✅ Order Confirmed!', body: `${order.restaurant_name || 'Your restaurant'} has accepted your order. Preparing now!` },
            rejected:  { title: '❌ Order Rejected', body: 'Unfortunately your order was rejected. Any payment will be refunded.' },
            preparing: { title: '👨‍🍳 Preparing Your Order', body: 'The kitchen is cooking your order right now!' },
            picked_up: { title: '🚵 Rider Picked Up!', body: 'Your order is on its way. Hang tight!' },
            out_for_delivery: { title: '🏃 Almost There!', body: 'Your rider is very close. Get ready!' },
            delivered: { title: '🎉 Order Delivered!', body: 'Enjoy your meal! Rate your experience in the app.' },
        };
        if (statusMessages[status]) {
            sendWebPush(
                order.user_id,
                statusMessages[status].title,
                statusMessages[status].body,
                { order_id: id, url: `/tracking/${id}` }
            ).catch(() => {});
        }

        // Broadcast AFTER response is sent — uses pool not transaction client
        if (status === 'ready') {
            broadcastOrderToRiders(id, { ...order, status: 'searching_rider' }).catch(e => {
                console.error('Broadcast failed (non-critical):', e.message);
            });
        }
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
        if (!isAdmin && !['placed', 'confirmed', 'payment_pending'].includes(order.status)) {
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

/**
 * Broadcast order to all online delivery partners
 */
const broadcastOrderToRiders = async (orderId, order) => {
    try {
        console.log(`📡 Broadcasting order ${order.order_number} to all available riders`);

        // 1. Find the restaurant's location (uses pool — outside any transaction now)
        const restRes = await db.query('SELECT lat, lng, name FROM restaurants WHERE id = $1', [order.restaurant_id]);
        if (restRes.rows.length === 0) return;
        const restaurant = restRes.rows[0];

        // 2. Fetch all online and verified partners
        const resPartners = await db.query(`
            SELECT p.user_id, u.name as partner_name, p.is_online, p.is_verified
            FROM delivery_partners p
            JOIN users u ON p.user_id = u.id
            WHERE p.is_online = true AND p.is_verified = true
        `);

        if (resPartners.rows.length === 0) {
            console.log(`⚠️ No online and verified partners found for broadcast of order ${order.order_number}`);
            // Check if there are ANY partners to provide better diagnostics
            const anyPartners = await db.query(`SELECT count(*) as count FROM delivery_partners`);
            const onlinePartners = await db.query(`SELECT count(*) as count FROM delivery_partners WHERE is_online = true`);
            const verifiedPartners = await db.query(`SELECT count(*) as count FROM delivery_partners WHERE is_verified = true`);
            console.log(`📊 Stats: Total partners: ${anyPartners.rows[0].count}, Online: ${onlinePartners.rows[0].count}, Verified: ${verifiedPartners.rows[0].count}`);
            return;
        }

        const io = global.io;

        // 3. Notify each partner
        for (const p of resPartners.rows) {
            // Socket Notification
            if (io) {
                console.log(`Emitting new_available_order to user:${p.user_id}`);
                io.to(`user:${p.user_id}`).emit('new_available_order', {
                    order_id: orderId,
                    order_number: order.order_number,
                    restaurant_name: restaurant.name,
                    delivery_address: order.delivery_address,
                    total: order.total,
                    distance: order.distance_km || 0
                });
            }

            // Web Push Notification
            await sendWebPush(
                p.user_id,
                '🛵 New Order Available!',
                `A new order #${order.order_number} from ${restaurant.name} is available for pickup.`,
                {
                    order_id: orderId,
                    url: '/dashboard'
                }
            );

            // Persistent internal notification
            await db.query(`
                INSERT INTO notifications (user_id, title, body, type, data) 
                VALUES ($1, $2, $3, 'new_available_order', $4)
            `, [
                p.user_id,
                'New Order Available!',
                `Order #${order.order_number} is available for pickup.`,
                JSON.stringify({ order_id: orderId })
            ]).catch(e => console.error('Notification insert failed:', e.message));
        }

        console.log(`✅ Broadcasted order ${order.order_number} to ${resPartners.rows.length} riders`);
    } catch (e) {
        console.error('Broadcast failed:', e);
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
    broadcastOrderToRiders // Exported for testing
};
