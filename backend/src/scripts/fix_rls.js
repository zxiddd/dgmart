const db = require('../config/db');

const fixRLS = async () => {
    try {
        console.log('Fixing RLS for users table...');

        // Check if RLS is enabled
        await db.query(`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`);

        // Drop existing policy if any
        await db.query(`DROP POLICY IF EXISTS "Users can view own profile" ON users;`);
        await db.query(`DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;`); // Optional: allow public read?

        // Create policy: Users can see their own profile
        await db.query(`
            CREATE POLICY "Users can view own profile" 
            ON users 
            FOR SELECT 
            USING (auth.uid() = id);
        `);

        // Also allow service_role (backend) to do everything? 
        // Backend uses postgres user usually, which bypasses RLS if it's superuser or owner.
        // But if using anon/authenticated roles, policies map.

        // Create policy: Allow public to view basic info? (Optional)
        // For now, just own profile.

        console.log('✅ RLS Policy "Users can view own profile" created.');

    } catch (err) {
        console.error('Error fixing RLS:', err);
    } finally {
        process.exit();
    }
};

fixRLS();
