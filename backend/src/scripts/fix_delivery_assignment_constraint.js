const { Client } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const client = new Client({ connectionString: envConfig.DATABASE_URL });

async function run() {
    await client.connect();
    console.log('Connected to DB');
    try {
        // Check what constraints exist on delivery_assignments
        const res = await client.query(`
            SELECT conname, pg_get_constraintdef(c.oid) AS def
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE t.relname = 'delivery_assignments' AND c.contype = 'c';
        `);
        console.log('=== delivery_assignments Check Constraints ===');
        res.rows.forEach(r => console.log(r.conname, ':', r.def));

        // Drop old constraint and recreate with all valid statuses
        await client.query(`
            ALTER TABLE delivery_assignments DROP CONSTRAINT IF EXISTS delivery_assignments_status_check;
        `);
        await client.query(`
            ALTER TABLE delivery_assignments DROP CONSTRAINT IF EXISTS delivery_assignments_type_check;
        `);
        // Drop any other type-related constraints
        const constraintRes = await client.query(`
            SELECT conname FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE t.relname = 'delivery_assignments' AND c.contype = 'c';
        `);
        for (const row of constraintRes.rows) {
            console.log('Dropping constraint:', row.conname);
            await client.query(`ALTER TABLE delivery_assignments DROP CONSTRAINT IF EXISTS "${row.conname}"`);
        }

        // Recreate with all statuses
        await client.query(`
            ALTER TABLE delivery_assignments ADD CONSTRAINT delivery_assignments_status_check 
            CHECK (status IN ('assigned', 'accepted', 'rejected', 'picked_up', 'delivered', 'cancelled'));
        `);
        console.log('✅ delivery_assignments constraint updated — all statuses allowed now.');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    await client.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
