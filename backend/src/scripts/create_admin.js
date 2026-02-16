const { createClient } = require('@supabase/supabase-js');
const db = require('../config/db');
require('dotenv').config();

// Use env vars or fallback
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const createAdmin = async () => {
    console.log('Creating Admin User...');
    const email = 'admin@degloormart.com';
    const password = 'Password123!';

    try {
        // 1. Sign Up
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            console.log('Signup error (user might exist):', error.message);
        }

        let userId = data?.user?.id;

        // If user already exists, try to sign in to get ID
        if (!userId) {
            console.log('Attempting login to get existing user ID...');
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (loginError) throw loginError;
            userId = loginData.user.id;
        }

        console.log(`User ID: ${userId}`);

        // 2. Insert/Update in public.users with 'admin' role
        const client = await db.getClient();
        await client.query(`
            INSERT INTO users (id, email, name, role, phone, wallet_balance)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE 
            SET role = 'admin', name = 'Super Admin'
        `, [userId, email, 'Super Admin', 'admin', '+910000000000', 1000]); // Use 1000 as default wallet balance

        client.release();
        console.log('✅ Admin user created/updated successfully!');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

    } catch (err) {
        console.error('❌ Failed to create admin:', err);
    }
};

createAdmin();
