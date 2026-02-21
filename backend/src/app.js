
// 🚨 EMERGENCY SSL BYPASS (For Render -> Supabase connectivity issues)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { initializeSocket } = require('./socket/socketHandler');


// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const restaurantRoutes = require('./routes/restaurant.routes');
const menuRoutes = require('./routes/menu.routes');
const orderRoutes = require('./routes/order.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');
const supportRoutes = require('./routes/support.routes');
const uploadRoutes = require('./routes/upload.routes');
const bannerRoutes = require('./routes/banner.routes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Trust proxy (Required for express-rate-limit on Render/Vercel)
app.set('trust proxy', 1);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: config.cors.allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Initialize Socket handlers
initializeSocket(io);

// Make io accessible globally and in routes via req.io
global.io = io;
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Security headers
app.use(helmet());



// CORS
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin || config.cors.allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all in development
        }
    },
    credentials: true,
}));

// Request compression
app.use(compression());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));



// Logging
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
    },
});
app.use('/api/', limiter);

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.',
    },
});
app.use('/api/auth/', authLimiter);

// ============ ROUTES ============

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🍔 Degloor Mart API is Live!',
        health: '/api/health',
        documentation: 'https://github.com/zxiddd/dgmart'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Degloor Mart API is running! 🚀',
        version: '1.0.0',
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/banners', bannerRoutes);

// ============ ERROR HANDLING ============

app.use(notFoundHandler);
app.use(errorHandler);

// ============ START SERVER ============

const PORT = config.port || process.env.PORT || 5000;



server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║      🍔 DEGLOOR MART API SERVER 🍔          ║
║   Server:    http://0.0.0.0:${PORT}             ║
║   Env:       ${config.nodeEnv.padEnd(30)}║
║   Socket.io: Enabled                        ║
║                                              ║
║   API Routes:                                ║
║   • /api/auth       - Authentication         ║
║   • /api/users      - User Management        ║
║   • /api/restaurants - Restaurants            ║
║   • /api/menu       - Menu Management         ║
║   • /api/orders     - Order Management        ║
║   • /api/delivery   - Delivery Partners       ║
║   • /api/payments   - Payments                ║
║   • /api/admin      - Admin Dashboard         ║
║   • /api/support    - Support & Tickets       ║
║                                              ║
╚══════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

module.exports = { app, server, io };
