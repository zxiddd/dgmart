const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { supportTicketSchema, ticketReplySchema } = require('../validators/schemas');
const supportController = require('../controllers/supportController');

// User routes
router.post('/tickets', authenticate, validate(supportTicketSchema), supportController.createTicket);
router.get('/tickets', authenticate, supportController.getUserTickets);
router.get('/tickets/:ticketId', authenticate, supportController.getTicketDetails);
router.post('/tickets/:ticketId/reply', authenticate, validate(ticketReplySchema), supportController.replyToTicket);

// Admin routes
router.get('/admin/tickets', authenticate, isAdmin, supportController.getAllTickets);
router.put('/admin/tickets/:ticketId/status', authenticate, isAdmin, supportController.updateTicketStatus);

module.exports = router;
