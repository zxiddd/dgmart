const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
const { PAYMENT_STATUS, ORDER_STATUS } = require('../config/constants');
const config = require('../config/env');

let razorpay = null;
try {
    if (config.razorpay.keyId && config.razorpay.keySecret) {
        razorpay = new Razorpay({
            key_id: config.razorpay.keyId.trim(),
            key_secret: config.razorpay.keySecret.trim(),
        });
        console.log(`✅ Razorpay initialized in PaymentController (Key ID: ${config.razorpay.keyId.substring(0, 14)}...)`);
    } else {
        console.warn('⚠️ Razorpay keys missing in PaymentController. KeyID:', !!config.razorpay.keyId, 'KeySecret:', !!config.razorpay.keySecret);
    }
} catch (error) {
    console.warn('⚠️ Razorpay initialization failed in PaymentController:', error.message);
}

/**
 * Handle Razorpay Webhook
 */
const handleWebhook = async (req, res, next) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const secret = config.razorpay.webhookSecret;

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Razorpay Webhook: Invalid signature');
            return res.status(400).send('Invalid signature');
        }

        const { event, payload } = req.body;
        console.log(`Razorpay Webhook Event: ${event}`);

        if (event === 'payment.captured') {
            const payment = payload.payment.entity;
            const type = payment.notes.type; // 'recharge' or undefined (order)

            const client = await db.getClient();
            try {
                await client.query('BEGIN');

                if (type === 'recharge') {
                    const userId = payment.notes.user_id;
                    const amount = payment.amount / 100;
                    const rzp_payment_id = payment.id;

                    // 1. Update user balance
                    await client.query(
                        'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
                        [amount, userId]
                    );

                    // 2. Record transaction
                    await client.query(
                        `INSERT INTO wallet_transactions (user_id, type, amount, description, reference_type, reference_id)
                         VALUES ($1, 'credit', $2, $3, 'recharge', $4)`,
                        [userId, amount, `Wallet Recharge via Razorpay`, rzp_payment_id]
                    );

                    console.log(`Webhook Success: Wallet credited for user ${userId}`);
                } else {
                    // Standard Order Payment
                    const order_id = payment.notes.order_id;
                    const rzp_order_id = payment.order_id;
                    const rzp_payment_id = payment.id;

                    // 1. Update payments table
                    await client.query(
                        `UPDATE payments SET razorpay_payment_id = $1, status = $2, completed_at = NOW() WHERE razorpay_order_id = $3`,
                        [rzp_payment_id, PAYMENT_STATUS.COMPLETED, rzp_order_id]
                    );

                    // 2. Update orders table
                    await client.query(
                        `UPDATE orders SET payment_status = $1, status = $2, updated_at = NOW() WHERE id = $3`,
                        [PAYMENT_STATUS.COMPLETED, ORDER_STATUS.CONFIRMED, order_id]
                    );

                    console.log(`Webhook Success: Payment captured for order ${order_id}`);
                }

                await client.query('COMMIT');
            } catch (err) {
                await client.query('ROLLBACK');
                console.error('Webhook DB Update Failed:', err);
                return res.status(500).send('Database update failed');
            } finally {
                client.release();
            }
        }

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Razorpay Webhook Error:', error);
        res.status(500).send('Webhook Processing Error');
    }
};

const createPaymentOrder = async (req, res, next) => {
    // ... (rest of the file)
    try {
        const { order_id } = req.body;
        const { rows } = await db.query('SELECT * FROM orders WHERE id = $1', [order_id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Order not found' });
        const order = rows[0];

        if (order.user_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        if (!razorpay) return res.status(400).json({ message: 'Online payments are currently unavailable.' });
        const rzpOrder = await razorpay.orders.create({
            amount: Math.round(order.total * 100),
            currency: 'INR',
            receipt: order.order_number,
            notes: { order_id, user_id: req.user.id }
        });

        await db.query(`INSERT INTO payments (order_id, user_id, razorpay_order_id, amount, currency, status, method) VALUES ($1, $2, $3, $4, 'INR', $5, 'razorpay')`, [order_id, req.user.id, rzpOrder.id, order.total, PAYMENT_STATUS.PENDING]);

        res.json({
            success: true,
            data: {
                razorpay_order_id: rzpOrder.id,
                razorpay_key_id: config.razorpay.keyId,
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                order_id
            }
        });
    } catch (e) { next(e); }
};

const verifyPayment = async (req, res, next) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', config.razorpay.keySecret).update(body).digest('hex');

        if (expectedSignature !== razorpay_signature) throw new Error('Invalid signature');

        await client.query(`UPDATE payments SET razorpay_payment_id = $1, razorpay_signature = $2, status = $3, completed_at = NOW() WHERE razorpay_order_id = $4`, [razorpay_payment_id, razorpay_signature, PAYMENT_STATUS.COMPLETED, razorpay_order_id]);

        await client.query(`UPDATE orders SET payment_status = $1 WHERE id = $2`, [PAYMENT_STATUS.COMPLETED, order_id]);
        await client.query('COMMIT');
        res.json({ success: true, message: 'Verified' });
    } catch (e) { await client.query('ROLLBACK'); next(e); } finally { client.release(); }
};

// ... refund, payFromWallet (Refactor using transactions)

const processRefund = async (req, res, next) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const { order_id, reason } = req.body;
        const resOrder = await client.query('SELECT * FROM orders WHERE id = $1', [order_id]);
        if (resOrder.rows.length === 0) throw new Error('Order not found');
        const order = resOrder.rows[0];

        // Check if paid via Razorpay
        const resPayment = await client.query("SELECT * FROM payments WHERE order_id = $1 AND status = 'completed' AND method = 'razorpay'", [order_id]);

        if (resPayment.rows.length === 0) {
            // Wallet Refund
            await client.query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2', [order.total, order.user_id]);
            await client.query("INSERT INTO wallet_transactions (user_id, type, amount, description, reference_type, reference_id) VALUES ($1, 'credit', $2, $3, 'refund', $4)", [order.user_id, order.total, `Refund: ${reason}`, 'refund', order_id]);
        } else {
            // Razorpay Refund
            try {
                if (razorpay) {
                    await razorpay.payments.refund(resPayment.rows[0].razorpay_payment_id, { amount: Math.round(order.total * 100), notes: { reason } });
                } else {
                    console.error('Cannot process Razorpay refund: Razorpay not initialized');
                }
            } catch (e) { console.error('Rzp refund failed', e); }

            await client.query("UPDATE payments SET status = 'refunded', refunded_at = NOW() WHERE id = $1", [resPayment.rows[0].id]);
        }

        await client.query("UPDATE orders SET payment_status = 'refunded', status = 'refunded' WHERE id = $1", [order_id]);
        await client.query('COMMIT');
        res.json({ success: true, message: 'Refunded' });
    } catch (e) { await client.query('ROLLBACK'); next(e); } finally { client.release(); }
};

const payFromWallet = async (req, res, next) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const { order_id } = req.body;
        const orderRes = await client.query("SELECT * FROM orders WHERE id = $1", [order_id]);
        if (orderRes.rows.length === 0) throw new Error('Order not found');
        const order = orderRes.rows[0];

        if (order.user_id !== req.user.id) throw new Error('Not authorized');

        const userRes = await client.query("SELECT wallet_balance FROM users WHERE id = $1", [req.user.id]);
        const balance = parseFloat(userRes.rows[0].wallet_balance || 0);

        if (balance < order.total) throw new Error('Insufficient balance');

        await client.query("UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2", [order.total, req.user.id]);
        await client.query("INSERT INTO wallet_transactions (user_id, type, amount, description, reference_type, reference_id) VALUES ($1, 'debit', $2, $3, 'order_payment', $4)", [req.user.id, order.total, `Payment for ${order.order_number}`, order_id]);

        await client.query("UPDATE orders SET payment_status = 'completed', payment_method = 'wallet' WHERE id = $1", [order_id]);
        await client.query("INSERT INTO payments (order_id, user_id, amount, status, method) VALUES ($1, $2, $3, 'completed', 'wallet')", [order_id, req.user.id, order.total]);

        await client.query('COMMIT');
        res.json({ success: true, message: 'Paid from wallet' });
    } catch (e) { await client.query('ROLLBACK'); next(e); } finally { client.release(); }
};

const createRechargeOrder = async (req, res, next) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid recharge amount' });
        }

        if (!razorpay) return res.status(400).json({ message: 'Wallet recharge via Razorpay is currently unavailable.' });
        const rzpOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: 'INR',
            notes: {
                type: 'recharge',
                user_id: req.user.id
            }
        });

        res.json({
            success: true,
            data: {
                razorpay_order_id: rzpOrder.id,
                razorpay_key_id: config.razorpay.keyId,
                amount: rzpOrder.amount,
                currency: rzpOrder.currency
            }
        });
    } catch (e) {
        next(e);
    }
};

module.exports = { createPaymentOrder, verifyPayment, processRefund, payFromWallet, handleWebhook, createRechargeOrder };
