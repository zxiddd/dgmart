import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

// Singleton: reuse existing instance across hot reloads and module re-imports
// Prevents "lock not released" AbortError from multiple Supabase client instances
const globalStore = (typeof globalThis !== 'undefined' ? globalThis : global);

if (!globalStore._supabaseClient) {
  globalStore._supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'dm-delivery-auth-token',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = globalStore._supabaseClient;
