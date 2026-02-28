const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
    await client.connect();

    // 1. Check orders.status constraint
    const r1 = await client.query(`
        SELECT conname, pg_get_constraintdef(oid) as def
        FROM pg_constraint 
        WHERE conrelid = 'orders'::regclass AND contype = 'c'
    `);
    console.log('\n=== orders CHECK constraints ===');
    if (r1.rows.length === 0) console.log('  [NONE - no check constraints!]');
    r1.rows.forEach(r => console.log(`  ${r.conname}: ${r.def}`));

    // 2. Check columns in orders table (look for ready_at)
    const r2 = await client.query(`
        SELECT column_name, data_type FROM information_schema.columns 
        WHERE table_name = 'orders' 
        ORDER BY ordinal_position
    `);
    console.log('\n=== orders table columns ===');
    r2.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

    // 3. Try the actual UPDATE that fails
    const testOrderId = (await client.query(`SELECT id FROM orders WHERE status = 'preparing' LIMIT 1`)).rows[0]?.id;
    if (testOrderId) {
        console.log(`\n=== Testing UPDATE on order: ${testOrderId} ===`);
        try {
            await client.query('BEGIN');
            await client.query(`UPDATE orders SET status = $1, updated_at = NOW(), ready_at = NOW() WHERE id = $2`, ['searching_rider', testOrderId]);
            console.log('  ✅ UPDATE succeeded!');
            await client.query('ROLLBACK'); // rollback - this is just a test
        } catch (e) {
            console.log(`  ❌ UPDATE failed: ${e.message}`);
            await client.query('ROLLBACK');
        }
    } else {
        console.log('\n  No preparing orders to test with');
    }

    await client.end();
}
run().catch(e => { console.error('Error:', e.message); process.exit(1); });
