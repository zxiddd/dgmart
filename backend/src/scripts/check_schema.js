const { Client } = require('pg');
require('dotenv').config();

async function checkSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'addresses';
        `);
        console.log('Columns in addresses table:');
        res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
        await client.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkSchema();
