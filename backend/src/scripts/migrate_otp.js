const { Pool } = require('pg');

// Manually escaping the @ in the password if Uzair78640@ is the password
const connectionString = 'postgresql://postgres:Uzair78640%40@db.prvhnlamrknodwxuswyv.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('🚀 Starting migration with escaped connection string...');
        const client = await pool.connect();
        await client.query(`
            ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_otp TEXT;
            ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
        `);
        console.log('✅ Migration successful: Added delivery_otp and customer_phone columns.');
        client.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
