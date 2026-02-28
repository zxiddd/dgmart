const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function checkSchema() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'delivery_assignments'
        `);
        console.log('Columns in delivery_assignments:');
        console.log(res.rows.map(r => r.column_name).join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

checkSchema();
