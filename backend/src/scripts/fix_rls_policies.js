const db = require('../config/db');

async function fixRLS() {
    const client = await db.getClient();
    try {
        console.log('Applying RLS fix for users table...');

        // Ensure RLS is enabled
        await client.query(`ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;`);

        // Drop if exists to avoid errors
        await client.query(`DROP POLICY IF EXISTS "Users can view own profile" ON public.users;`);

        // Add policy: Allow users to select their own row
        // Note: auth.uid() is available if using Supabase, but since we are hitting via REST with a JWT, 
        // Supabase fills auth.uid() from the JWT.
        await client.query(`
            CREATE POLICY "Users can view own profile" 
            ON public.users 
            FOR SELECT 
            USING (auth.uid() = id);
        `);

        // Also allow updating own profile
        await client.query(`DROP POLICY IF EXISTS "Users can update own profile" ON public.users;`);
        await client.query(`
            CREATE POLICY "Users can update own profile" 
            ON public.users 
            FOR UPDATE 
            USING (auth.uid() = id);
        `);

        console.log('✅ RLS policies for users table applied.');
    } catch (error) {
        console.error('❌ Error fixing RLS:', error);
    } finally {
        client.release();
        process.exit();
    }
}

fixRLS();
