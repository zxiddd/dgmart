const db = require('../config/db');
const { DELIVERY_STATUS } = require('../config/constants');
const { calculateDistance } = require('../utils/helpers');
const fs = require('fs');
const path = require('path');

const logDebug = (msg) => {
    try {
        const logFile = path.join(__dirname, '../../debug.log');
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] DELIVERY_DEBUG: ${msg}\n`);
    } catch (e) {
        console.error('Failed to write to debug log:', e);
    }
};

/**
 * Register as delivery partner
 */
const registerPartner = async (req, res, next) => {
    try {
        const uid = req.user.id;

        const existing = await db.query('SELECT id FROM delivery_partners WHERE user_id = $1', [uid]);
        if (existing.rows.length > 0) return res.status(400).json({ success: false, message: 'Already registered.' });

        const { vehicle_type, vehicle_number, license_url, id_proof_url, zone, bank_details } = req.body;

        const query = `
            INSERT INTO delivery_partners (user_id, vehicle_type, vehicle_number, license_url, id_proof_url, is_online, is_verified, zone, bank_details)
            VALUES ($1, $2, $3, $4, $5, false, false, $6, $7)
            RETURNING *
        `;
        const values = [uid, vehicle_type, vehicle_number, license_url, id_proof_url, zone, JSON.stringify(bank_details)];

        const { rows } = await db.query(query, values);

        await db.query("UPDATE users SET role = 'delivery_partner' WHERE id = $1", [uid]);

        res.status(201).json({ success: true, message: 'Registration submitted.', data: { partner: rows[0] } });
    } catch (e) {
        next(e);
    }
};

/**
 * Toggle online/offline status
 */
const toggleOnlineStatus = async (req, res, next) => {
    try {
        const uid = req.user.id;
        const partnerRes = await db.query('SELECT * FROM delivery_partners WHERE user_id = $1', [uid]);
        if (partnerRes.rows.length === 0) return res.status(400).json({ message: 'Not a delivery partner' });
        const partner = partnerRes.rows[0];

        if (!partner.is_verified) return res.status(400).json({ message: 'Not verified' });

        const newStatus = !partner.is_online;
        await db.query('UPDATE delivery_partners SET is_online = $1 WHERE id = $2', [newStatus, partner.id]);

        res.json({ success: true, message: newStatus ? 'Online' : 'Offline', data: { is_online: newStatus } });
    } catch (e) { next(e); }
};

/**
 * Update current location
 */
const updateLocation = async (req, res, next) => {
    try {
        const uid = req.user.id;
        const { lat, lng } = req.body;

        // Optimize: verify user is partner first? Or just update where user_id matches
        const result = await db.query('UPDATE delivery_partners SET current_lat = $1, current_lng = $2 WHERE user_id = $3 RETURNING id', [lat, lng, uid]);

        if (result.rowCount === 0) return res.status(400).json({ message: 'Not a delivery partner' });

        res.json({ success: true, message: 'Location updated' });
    } catch (e) { next(e); }
};

/**
 * Get assigned orders
 */
const getAssignedOrders = async (req, res, next) => {
    try {
        const uid = req.user.id;
        const partnerRes = await db.query('SELECT id FROM delivery_partners WHERE user_id = $1', [uid]);
        if (partnerRes.rows.length === 0) return res.status(400).json({ message: 'Not a delivery partner' });
        const partnerId = partnerRes.rows[0].id;

        const assignmentsRes = await db.query(`
            SELECT da.*, 
            row_to_json(o.*) as order_details 
            FROM delivery_assignments da
            JOIN orders o ON da.order_id = o.id
            WHERE da.partner_id = $1
            ORDER BY da.created_at DESC
        `, [uid]); // Note: Assignments user user_id or partner_id? Schema says partner_id UUID REFERENCES users(id). So it's UID.
        // Wait, earlier (step 1044 schema) partner_id REFERENCES users(id).
        // My code passed 'partner_id' (users.id) in assignments.
        // So here WHERE da.partner_id = $1 (uid) is correct.

        const assignments = assignmentsRes.rows;

        const active = assignments.filter(a => ['assigned', 'accepted', 'picked_up'].includes(a.status));
        const completed = assignments.filter(a => a.status === 'delivered');

        res.json({ success: true, data: { active, completed } });
    } catch (e) { next(e); }
};

/**
 * Respond to assignment
 */
const respondToAssignment = async (req, res, next) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const { assignmentId } = req.params;
        const { action } = req.body;

        console.log(`Responding to assignment ${assignmentId} with action ${action}`);

        // Verify assignment belongs to user
        const assignRes = await client.query('SELECT * FROM delivery_assignments WHERE id = $1', [assignmentId]);
        if (assignRes.rows.length === 0) throw new Error('Assignment not found');
        const assignment = assignRes.rows[0];

        if (assignment.partner_id !== req.user.id) throw new Error('Not authorized');

        logDebug(`Processing action '${action}' for assignment ${assignmentId} by user ${req.user.id}`);

        if (action === 'accept') {
            await client.query("UPDATE delivery_assignments SET status = 'accepted', accepted_at = NOW() WHERE id = $1", [assignmentId]);
            await client.query("UPDATE orders SET status = 'accepted_by_driver' WHERE id = $1", [assignment.order_id]);
            res.json({ success: true, message: 'Accepted' });
        } else {
            await client.query("UPDATE delivery_assignments SET status = 'cancelled' WHERE id = $1", [assignmentId]);
            // Reassign logic?
            res.json({ success: true, message: 'Rejected' });
        }
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        logDebug(`Respond Assignment Error: ${e.message}`);
        console.error('Respond Assignment Error:', e);
        next(e);
    } finally {
        client.release();
    }
};

/**
 * Update delivery status
 */
const updateDeliveryStatus = async (req, res, next) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const { assignmentId } = req.params;
        const { status, otp } = req.body;

        const assignRes = await client.query('SELECT * FROM delivery_assignments WHERE id = $1', [assignmentId]);
        if (assignRes.rows.length === 0) throw new Error('Not found');
        const assignment = assignRes.rows[0];

        let updates = 'status = $1';
        if (status === 'picked_up') {
            updates += ', picked_up_at = NOW()';
            await client.query("UPDATE orders SET status = 'picked_up', picked_up_at = NOW() WHERE id = $1", [assignment.order_id]);
        } else if (status === 'delivered') {
            // Verify OTP
            const orderRes = await client.query('SELECT delivery_otp FROM orders WHERE id = $1', [assignment.order_id]);
            const savedOtp = orderRes.rows[0]?.delivery_otp;

            if (savedOtp && savedOtp !== otp) {
                throw new Error('Invalid OTP. Please ask the customer for the correct delivery code.');
            }

            updates += ', delivered_at = NOW()';
            await client.query("UPDATE orders SET status = 'delivered', delivered_at = NOW(), payment_status = 'completed' WHERE id = $1", [assignment.order_id]);

            // Update Partner Stats
            const feeRes = await client.query('SELECT delivery_fee FROM orders WHERE id = $1', [assignment.order_id]);
            const fee = feeRes.rows[0]?.delivery_fee || 0;

            // Update partner table
            // delivery_partners table matches user_id = assignment.partner_id
            await client.query(`UPDATE delivery_partners SET total_deliveries = total_deliveries + 1, total_earnings = total_earnings + $1 WHERE user_id = $2`, [fee, assignment.partner_id]);
        }

        await client.query(`UPDATE delivery_assignments SET ${updates} WHERE id = $2`, [status, assignmentId]);

        // Emit socket events
        const io = global.io;
        if (io) {
            // Fetch order details to get customer and restaurant owner
            const orderDetailRes = await client.query(`
                SELECT o.user_id as customer_id, r.owner_id as restaurant_owner_id, o.order_number
                FROM orders o
                JOIN restaurants r ON o.restaurant_id = r.id
                WHERE o.id = $1
            `, [assignment.order_id]);

            if (orderDetailRes.rows.length > 0) {
                const { customer_id, restaurant_owner_id, order_number } = orderDetailRes.rows[0];

                // 1. Notify Customer
                io.to(`user_${customer_id}`).emit('order_status_update', {
                    order_id: assignment.order_id,
                    order_number,
                    status: status
                });

                // 2. Notify Restaurant Owner
                io.to(`user_${restaurant_owner_id}`).emit('order_status_update', {
                    order_id: assignment.order_id,
                    order_number,
                    status: status
                });

                // 3. Notify the Rider (for UI sync across tabs/devices)
                io.to(`user_${assignment.partner_id}`).emit('assignment_status_update', {
                    assignment_id: assignmentId,
                    status: status
                });
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Updated' });
    } catch (e) { await client.query('ROLLBACK'); next(e); } finally { client.release(); }
};

const getEarnings = async (req, res, next) => {
    try {
        const uid = req.user.id;
        const partnerRes = await db.query('SELECT * FROM delivery_partners WHERE user_id = $1', [uid]);
        if (partnerRes.rows.length === 0) return res.status(400).json({ message: 'Not a partner' });
        const partner = partnerRes.rows[0];
        // ... aggregation queries logic ...
        // Simplified for now
        res.json({ success: true, data: { total: { earnings: partner.total_earnings } } });
    } catch (e) { next(e); }
};

const getDeliveryHistory = async (req, res, next) => {
    try {
        const uid = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const partnerRes = await db.query('SELECT id FROM delivery_partners WHERE user_id = $1', [uid]);
        if (partnerRes.rows.length === 0) return res.status(400).json({ message: 'Not a partner' });
        const partnerId = partnerRes.rows[0].id; // Assigning to partner table ID? No, schema says partner_id in assignments is users.id usually.
        // Wait, let's consistency check.
        // In getAssignedOrders, I used uid (req.user.id) for da.partner_id.
        // So I should use uid here too.

        const historyRes = await db.query(`
            SELECT da.*, 
            row_to_json(o.*) as order_details,
            o.delivery_address, o.total, o.delivery_fee
            FROM delivery_assignments da
            JOIN orders o ON da.order_id = o.id
            WHERE da.partner_id = $1 AND da.status = 'delivered'
            ORDER BY da.delivered_at DESC
            LIMIT $2 OFFSET $3
        `, [uid, limit, offset]);

        res.json({ success: true, data: { history: historyRes.rows, page, limit } });
    } catch (e) { next(e); }
};

const getPartnerProfile = async (req, res, next) => {
    try {
        const uid = req.user.id;
        const resP = await db.query('SELECT * FROM delivery_partners WHERE user_id = $1', [uid]);
        if (resP.rows.length === 0) return res.status(404).json({ message: 'Not found' });

        const partner = resP.rows[0];
        // Calculate today's earnings (simplified: just take total for now or filter by date)
        const todayRes = await db.query(`
            SELECT SUM(o.delivery_fee) as today_earnings 
            FROM delivery_assignments da
            JOIN orders o ON da.order_id = o.id
            WHERE da.partner_id = $1 AND da.status = 'delivered' AND da.delivered_at >= CURRENT_DATE
        `, [uid]);

        res.json({ success: true, data: { partner, today_earnings: todayRes.rows[0]?.today_earnings || 0 } });
    } catch (e) { next(e); }
};

module.exports = {
    registerPartner,
    toggleOnlineStatus,
    updateLocation,
    getAssignedOrders,
    respondToAssignment,
    updateDeliveryStatus,
    getEarnings,
    getDeliveryHistory,
    getPartnerProfile
};
