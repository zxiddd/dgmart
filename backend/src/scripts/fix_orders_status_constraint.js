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
        // Drop old constraint and recreate with searching_rider included
        await client.query(`
            ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
        `);
        await client.query(`
            ALTER TABLE orders ADD CONSTRAINT orders_status_check 
            CHECK (status IN (
                'pending', 'confirmed', 'preparing', 'ready', 
                'searching_rider', 'assigned_rider',
                'picked_up', 'out_for_delivery', 'delivered', 
                'cancelled', 'rejected'
            ));
        `);
        console.log('✅ Constraint updated successfully! searching_rider is now allowed.');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    await client.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
