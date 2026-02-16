const { createClient } = require('@supabase/supabase-js');
const config = require('./env');

if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    console.error('❌ Supabase URL or Service Role Key missing!');
}

const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

module.exports = supabase;
