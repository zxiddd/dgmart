require('dotenv').config();
const db = require('./src/config/db');

async function createTable() {
    try {
        console.log('Creating push_subscriptions table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS public.push_subscriptions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
                subscription JSONB NOT NULL,
                device_type TEXT, -- 'web', 'mobile'
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Add index for user_id
            CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
        `);
        console.log('Table created successfully.');
    } catch (err) {
        console.error('Error creating table:', err.message);
    } finally {
        process.exit(0);
    }
}

createTable();
