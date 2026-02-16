const supabase = require('../config/supabase');
const db = require('../config/db');

/**
 * Initialize Socket.io event handlers
 */
const initializeSocket = (io) => {
    // Auth middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('Authentication token required'));

            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error || !user) return next(new Error('Invalid token'));

            const { rows } = await db.query('SELECT role, name FROM users WHERE id = $1', [user.id]);
            if (rows.length === 0) return next(new Error('User profile not found'));

            socket.userId = user.id;
            socket.userRole = rows[0].role;
            socket.userName = rows[0].name;

            next();
        } catch (error) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId} (${socket.userRole})`);

        socket.join(`user:${socket.userId}`);
        socket.join(`role:${socket.userRole}`);

        // Restaurant
        socket.on('restaurant:join', (restaurantId) => {
            if (socket.userRole === 'restaurant_owner' || socket.userRole === 'admin') {
                socket.join(`restaurant:${restaurantId}`);
                console.log(`Restaurant ${restaurantId} joined by ${socket.userId}`);
            }
        });

        // Orders
        socket.on('order:subscribe', (orderId) => {
            socket.join(`order:${orderId}`);
        });

        socket.on('order:unsubscribe', (orderId) => {
            socket.leave(`order:${orderId}`);
        });

        // Order New (Triggered by Controller usually, but if client emits)
        socket.on('order:new', (data) => {
            // Verify if user is allowed to emit? 
            // Usually controller emits via io instance. 
            // But if we want client to emit to restaurant room:
            // io.to(`restaurant:${data.restaurant_id}`).emit('order:incoming', ...);
            // We'll leave it as is for now depending on architecture.
        });

        // Delivery
        socket.on('delivery:join', () => {
            if (socket.userRole === 'delivery_partner') {
                socket.join('delivery:available');
                console.log(`Delivery partner ${socket.userId} online`);
            }
        });

        socket.on('delivery:leave', () => {
            socket.leave('delivery:available');
        });

        socket.on('delivery:location_update', (data) => {
            if (socket.userRole !== 'delivery_partner') return;
            // Also save to DB? Controller does it via API.
            // Just broadcast to order room
            io.to(`order:${data.order_id}`).emit('delivery:location', {
                order_id: data.order_id,
                lat: data.lat,
                lng: data.lng,
                heading: data.heading,
                speed: data.speed,
                timestamp: new Date().toISOString()
            });
        });

        // Admin
        socket.on('admin:join', () => {
            if (['admin', 'super_admin'].includes(socket.userRole)) {
                socket.join('admin:dashboard');
            }
        });

        // Support
        socket.on('support:join_ticket', (ticketId) => {
            // Permission check?
            socket.join(`ticket:${ticketId}`);
        });

        socket.on('support:message', (data) => {
            io.to(`ticket:${data.ticket_id}`).emit('support:new_message', {
                ticket_id: data.ticket_id,
                sender_name: socket.userName,
                message: data.message,
                timestamp: new Date().toISOString()
            });
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
        });
    });
};

module.exports = { initializeSocket };
