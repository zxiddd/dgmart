const db = require('./src/config/db');

async function fixStoragePolicies() {
    console.log('--- Checking and Fixing Storage Policies ---');

    try {
        // Check existing policies
        const existing = await db.query(`
            SELECT name, bucket_id, operation, definition 
            FROM storage.policies 
            WHERE bucket_id = 'uploads'
        `);
        console.log('Existing policies:', existing.rows);

        // Add missing policies
        const policies = [
            { name: 'Allow authenticated uploads', operation: 'INSERT', definition: `(auth.role() = 'authenticated')` },
            { name: 'Allow public reads', operation: 'SELECT', definition: `true` },
            { name: 'Allow authenticated updates', operation: 'UPDATE', definition: `(auth.role() = 'authenticated')` },
            { name: 'Allow authenticated deletes', operation: 'DELETE', definition: `(auth.role() = 'authenticated')` },
        ];

        for (const policy of policies) {
            const exists = existing.rows.find(r => r.name === policy.name);
            if (!exists) {
                await db.query(`
                    INSERT INTO storage.policies (name, bucket_id, operation, definition)
                    VALUES ($1, 'uploads', $2, $3)
                `, [policy.name, policy.operation, policy.definition]);
                console.log(`✅ Created policy: ${policy.name}`);
            } else {
                console.log(`⏭️  Policy already exists: ${policy.name}`);
            }
        }

        console.log('Done!');
    } catch (err) {
        console.error('Error:', err.message);
    }

    process.exit(0);
}

fixStoragePolicies();
