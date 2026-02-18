const { createClient } = require('@supabase/supabase-js');
const config = require('./env');

let supabase = null;
if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    console.error('❌ Supabase URL or Service Role Key missing!');
} else {
    try {
        supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    } catch (e) {
        console.error('❌ Supabase Client Error:', e.message);
    }
}

module.exports = supabase;
