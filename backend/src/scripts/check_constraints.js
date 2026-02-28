const { Client } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const client = new Client({ connectionString: envConfig.DATABASE_URL });

async function run() {
    await client.connect();
    // Get check constraints on orders table
    const res = await client.query(`
        SELECT conname, pg_get_constraintdef(c.oid) AS def
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'orders' AND c.contype = 'c';
    `);
    console.log('=== Orders Check Constraints ===');
    res.rows.forEach(r => console.log(r.conname, ':', r.def));
    await client.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
