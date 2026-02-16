const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
    console.log('Testing connection to Supabase POOLER (aws-0-ap-south-1)...');

    // Explicit config
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected successfully to PostgreSQL!');
        const res = await client.query('SELECT NOW()');
        console.log('🕒 Server Time:', res.rows[0].now);

        // Test Table Creation Permission
        await client.query('CREATE TABLE IF NOT EXISTS _test_connection (id serial primary key, created_at timestamptz default now())');
        console.log('✅ Write permission verified (Table created)');

        await client.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection error:', err.message);
        process.exit(1);
    }
}

testConnection();
