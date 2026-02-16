
const db = require('../config/db');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Use env vars or fallback to what we know
const supabaseUrl = process.env.SUPABASE_URL || 'https://prvhnlamrknodwxuswyv.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydmhubGFtcmtub2R3eHVzd3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTUwNjgsImV4cCI6MjA4NjQ5MTA2OH0.boUjRNYoYgtBCszvm9ob239wJ-ZeJe9OXKAuHnFkJ40';

const supabase = createClient(supabaseUrl, supabaseKey);

const seedData = async () => {
    console.log('🌱 Starting PostgreSQL database seed with Supabase Auth...');
    const client = await db.getClient();

    try {
        // 1. Create a Test Restaurant Owner via Supabase Auth
        const ownerEmail = `owner_${Date.now()}@biryanipalace.com`;
        const ownerPassword = 'Password123!';

        console.log(`Creating Owner via Auth: ${ownerEmail}`);
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email: ownerEmail,
            password: ownerPassword,
            options: {
                data: {
                    name: 'Bilal Khan',
                    role: 'restaurant_owner',
                    phone: '+919876543210'
                }
            }
        });

        if (signUpError) {
            console.error('Auth Signup Error:', signUpError.message);
            // If error is "User already registered", we can't easily get the ID without login.
            // For seeding, just fail or use a random ID if we were mocking, but here we need real FK.
            // But since we use unique email (Date.now()), it should match.
            throw signUpError;
        }

        if (!user) {
            throw new Error('No user returned from signup');
        }

        const ownerId = user.id;
        console.log(`✅ User Created: ${ownerId}`);

        // Wait a bit for the trigger to insert into public.users
        console.log('Waiting for trigger to populate public.users...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        await client.query('BEGIN');

        // Verify user exists in public.users
        const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [ownerId]);
        if (userCheck.rows.length === 0) {
            console.log('⚠️ Trigger failed? Inserting manually into public.users for fallback...');
            await client.query(`
                INSERT INTO users (id, email, name, role, phone, wallet_balance)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO NOTHING
            `, [ownerId, ownerEmail, 'Bilal Khan', 'restaurant_owner', '+919876543210', 0]);
        }

        // 2. Create Restaurant
        const restaurantId = uuidv4();
        console.log(`Creating Restaurant: Biryani Palace (${restaurantId})`);

        await client.query(`
            INSERT INTO restaurants (
                id, owner_id, name, description, address, lat, lng,
                rating, total_reviews, is_active, is_approved, status,
                min_order_amount, avg_prep_time_mins, delivery_radius_km,
                cuisine_type, image_url
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12,
                $13, $14, $15,
                $16, $17
            )
        `, [
            restaurantId, ownerId, 'Biryani Palace',
            'The best Hyderabadi Biryani in Degloor', 'Main Road, Degloor', 18.5492, 77.5768,
            4.5, 128, true, true, 'active',
            149.00, 25, 5.0,
            ['biryani', 'north_indian'], 'https://placehold.co/600x400/orange/white?text=Biryani+Palace'
        ]);

        // 3. Create Menu Category
        const catId = uuidv4();
        await client.query(`
            INSERT INTO menu_categories (id, restaurant_id, name, sort_order, is_active)
            VALUES ($1, $2, $3, $4, $5)
        `, [catId, restaurantId, 'Biryani', 1, true]);

        // 4. Create Menu Item
        await client.query(`
            INSERT INTO menu_items (
                id, restaurant_id, category_id, name, description,
                price, is_veg, is_available, image_url
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9
            )
        `, [
            uuidv4(), restaurantId, catId, 'Chicken Dum Biryani',
            'Authentic Hyderabadi style chicken dum biryani served with mirchi ka salan and raita.',
            240.00, false, true, 'https://placehold.co/400x300/orange/white?text=Chicken+Biryani'
        ]);

        await client.query('COMMIT');
        console.log('✅ Seeding complete!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
};

seedData();
