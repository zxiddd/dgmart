const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL is missing in .env');
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

const migrate = async () => {
    try {
        await client.connect();
        console.log('Connected to database...');

        // 1. Alter Table
        console.log('Altering banners table...');
        await client.query(`
            ALTER TABLE public.banners 
            ADD COLUMN IF NOT EXISTS title TEXT,
            ADD COLUMN IF NOT EXISTS subtitle TEXT,
            ADD COLUMN IF NOT EXISTS badge_text TEXT,
            ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT 'View',
            ADD COLUMN IF NOT EXISTS gradient_colors TEXT[] DEFAULT ARRAY['#FFD700', '#D4AF37'];
        `);
        console.log('Table altered successfully.');

        // 2. Clear existing banners (optional, but good for clean slate)
        console.log('Clearing existing banners...');
        await client.query('DELETE FROM public.banners WHERE 1=1;');

        // 3. Insert Banners
        console.log('Inserting seed banners...');
        const insertQuery = `
            INSERT INTO public.banners (image_url, title, subtitle, badge_text, button_text, gradient_colors, target_screen, sort_order, is_active)
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9),
            ($10, $11, $12, $13, $14, $15, $16, $17, $18),
            ($19, $20, $21, $22, $23, $24, $25, $26, $27);
        `;

        const values = [
            // Banner 1
            'https://cdn-icons-png.flaticon.com/512/1046/1046774.png',
            '50% OFF',
            'Tasty Weekends',
            'PROMO',
            'CLAIM NOW',
            ['#FFD700', '#FF8C00'], // Gold to Orange
            'RestaurantList',
            1,
            true,

            // Banner 2
            'https://cdn-icons-png.flaticon.com/512/7541/7541673.png',
            'Free Delivery',
            'On Orders above ₹149',
            'LIMITED',
            'ORDER NOW',
            ['#4CAF50', '#2E7D32'], // Green
            'RestaurantList',
            2,
            true,

            // Banner 3
            'https://cdn-icons-png.flaticon.com/512/2921/2921822.png',
            'New Arrivals',
            'Try Something New',
            'FRESH',
            'EXPLORE',
            ['#2196F3', '#1976D2'], // Blue
            'RestaurantList',
            3,
            true
        ];

        await client.query(insertQuery, values);
        console.log('Banners seeded successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
};

migrate();
