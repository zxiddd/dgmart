require('dotenv').config();

module.exports = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwt: {
        secret: process.env.JWT_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
        refreshExpiresIn: '30d',
    },
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    },
    googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
    cors: {
<<<<<<< HEAD
        allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3003',
            'http://localhost:8081',
            'http://172.20.10.2:8081'
        ],
=======
        allowedOrigins: [
            process.env.USER_APP_URL || 'http://localhost:8081',
            process.env.ADMIN_DASHBOARD_URL || 'http://localhost:3004',
            process.env.RESTAURANT_APP_URL || 'http://localhost:3003',
            process.env.DELIVERY_APP_URL || 'http://localhost:3001',
            '*'
        ].filter(origin => origin !== '*' || process.env.NODE_ENV === 'development'),
>>>>>>> 3bd9c2b546401d9cb689939f433135a0ba877c54
    },
    databaseUrl: process.env.DATABASE_URL,
    supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
};
