const db = require('../config/db');

/**
 * Create Ticket
 */
const createTicket = async (req, res, next) => {
    try {
        const { order_id, subject, category, message } = req.body;
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            const { rows } = await client.query(`
                INSERT INTO support_tickets (user_id, order_id, subject, category, status)
                VALUES ($1, $2, $3, $4, 'open') RETURNING id, created_at
            `, [req.user.id, order_id, subject, category]);

            const ticketId = rows[0].id;

            await client.query(`
                INSERT INTO ticket_messages (ticket_id, sender_id, message)
                VALUES ($1, $2, $3)
            `, [ticketId, req.user.id, message]);

            await client.query('COMMIT');
            res.status(201).json({ success: true, data: { ticket: { id: ticketId, ...req.body, status: 'open', created_at: rows[0].created_at } } });
        } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    } catch (e) { next(e); }
};

/**
 * Get User Tickets
 */
const getUserTickets = async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        res.json({ success: true, data: { tickets: rows } });
    } catch (e) { next(e); }
};

/**
 * Get All Tickets (Admin)
 */
const getAllTickets = async (req, res, next) => {
    try {
        const { status, category } = req.query;
        let query = 'SELECT * FROM support_tickets';
        const params = [];
        let pc = 0;
        if (status) { pc++; query += ` WHERE status = $${pc}`; params.push(status); }
        // ... category filter
        query += ' ORDER BY created_at DESC';
        const { rows } = await db.query(query, params);
        res.json({ success: true, data: { tickets: rows } });
    } catch (e) { next(e); }
};

/**
 * Get Details
 */
const getTicketDetails = async (req, res, next) => {
    try {
        const { ticketId } = req.params;
        const tRes = await db.query('SELECT * FROM support_tickets WHERE id = $1', [ticketId]);
        if (tRes.rows.length === 0) return res.status(404).json({ message: 'Not found' });

        if (tRes.rows[0].user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

        const mRes = await db.query('SELECT * FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC', [ticketId]);
        res.json({ success: true, data: { ticket: tRes.rows[0], messages: mRes.rows } });
    } catch (e) { next(e); }
};

/**
 * Reply
 */
const replyToTicket = async (req, res, next) => {
    try {
        const { ticketId } = req.params;
        const { message } = req.body;

        await db.query(`INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES ($1, $2, $3)`, [ticketId, req.user.id, message]);

        if (['admin', 'super_admin'].includes(req.user.role)) {
            await db.query("UPDATE support_tickets SET status = 'in_progress', updated_at = NOW() WHERE id = $1", [ticketId]);
        }
        res.json({ success: true, message: 'Replied' });
    } catch (e) { next(e); }
};

const updateTicketStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        await db.query('UPDATE support_tickets SET status = $1 WHERE id = $2', [status, req.params.ticketId]);
        res.json({ success: true });
    } catch (e) { next(e); }
};

// Notification methods (Moved from adminController?)
// Or implemented here?
// Admin controller has `getNotifications`?
// The file viewed in 1117 had `getNotifications` in `supportController.js`? 
// No, step 1117 viewed `supportController.js` and it DID have `getNotifications`.
// So I should keep them here.

const getNotifications = async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
        res.json({ success: true, data: { notifications: rows } });
    } catch (e) { next(e); }
};

const markNotificationRead = async (req, res, next) => {
    try {
        await db.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [req.params.notificationId, req.user.id]);
        res.json({ success: true });
    } catch (e) { next(e); }
};

const markAllNotificationsRead = async (req, res, next) => {
    try {
        await db.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
        res.json({ success: true });
    } catch (e) { next(e); }
};

module.exports = {
    createTicket, getUserTickets, getAllTickets, getTicketDetails, replyToTicket, updateTicketStatus,
    getNotifications, markNotificationRead, markAllNotificationsRead
};
