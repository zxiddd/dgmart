const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role to bypass RLS and set policies
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

async function fixStorageRLS() {
    console.log('--- Fixing Storage RLS Policies ---');

    try {
        // Use raw SQL via rpc to set storage policies
        // Supabase storage policies live in storage.objects table
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
            sql: `
                -- Drop existing policies if any
                DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
                DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
                DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
                DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
                DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
                DROP POLICY IF EXISTS "Allow all authenticated" ON storage.objects;

                -- Allow any authenticated user to upload
                CREATE POLICY "Allow authenticated uploads"
                ON storage.objects FOR INSERT
                TO authenticated
                WITH CHECK (bucket_id = 'uploads');

                -- Allow public reads
                CREATE POLICY "Allow public reads"
                ON storage.objects FOR SELECT
                TO public
                USING (bucket_id = 'uploads');

                -- Allow authenticated updates
                CREATE POLICY "Allow authenticated updates"
                ON storage.objects FOR UPDATE
                TO authenticated
                USING (bucket_id = 'uploads');

                -- Allow authenticated deletes
                CREATE POLICY "Allow authenticated deletes"
                ON storage.objects FOR DELETE
                TO authenticated
                USING (bucket_id = 'uploads');
            `
        });

        if (error) {
            console.error('RPC error:', error.message);
            // Try direct approach
            console.log('Trying direct SQL...');
        } else {
            console.log('✅ Policies set via RPC!');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }

    process.exit(0);
}

fixStorageRLS();
