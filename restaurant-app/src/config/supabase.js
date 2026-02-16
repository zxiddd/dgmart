
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prvhnlamrknodwxuswyv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydmhubGFtcmtub2R3eHVzd3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTUwNjgsImV4cCI6MjA4NjQ5MTA2OH0.boUjRNYoYgtBCszvm9ob239wJ-ZeJe9OXKAuHnFkJ40';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
