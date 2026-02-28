const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
    await client.connect();

    // Check orders.status constraint
    const r1 = await client.query(`
        SELECT conname, pg_get_constraintdef(oid) as def
        FROM pg_constraint 
        WHERE conrelid = 'orders'::regclass AND contype = 'c'
    `);
    console.log('\n=== orders table CHECK constraints ===');
    r1.rows.forEach(r => console.log(`  ${r.conname}: ${r.def}`));

    // Check what statuses actually exist in orders table right now
    const r2 = await client.query(`SELECT status, COUNT(*) FROM orders GROUP BY status`);
    console.log('\n=== Current order statuses in DB ===');
    r2.rows.forEach(r => console.log(`  ${r.status}: ${r.count}`));

    // Check the last 5 order updates
    const r3 = await client.query(`SELECT id, status, updated_at FROM orders ORDER BY updated_at DESC LIMIT 5`);
    console.log('\n=== Last 5 updated orders ===');
    r3.rows.forEach(r => console.log(`  ${r.id.slice(0, 8)} | ${r.status} | ${r.updated_at}`));

    await client.end();
}
run().catch(e => { console.error('Error:', e.message); process.exit(1); });
