import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Do NOT throw at module load time — a hard throw here crashes the entire
// Next.js app shell during SSR/hydration, which is the "client-side exception"
// seen on iPhone/Android. Log a warning instead.
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);
