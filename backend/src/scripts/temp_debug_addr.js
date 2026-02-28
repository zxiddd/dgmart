const { Client } = require('pg');
require('dotenv').config();

async function debugAddress() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const addressId = '047c8b08-db3e-4ce0-b4d1-78188d8fc953';
        const userId = 'b06e2028-0514-44b6-a606-70231615376a';

        console.log('--- Checking Address ---');
        const addrRes = await client.query('SELECT * FROM addresses WHERE id = $1', [addressId]);
        console.log(`Address ID ${addressId} exists:`, addrRes.rows.length > 0);
        if (addrRes.rows.length > 0) {
            console.log('Address Owner:', addrRes.rows[0].user_id);
            console.log('Details:', addrRes.rows[0]);
        }

        console.log('\n--- Checking User Addresses ---');
        const userAddrs = await client.query('SELECT * FROM addresses WHERE user_id = $1', [userId]);
        console.log(`User ${userId} has ${userAddrs.rows.length} addresses.`);
        userAddrs.rows.forEach(a => console.log(`- ${a.id}: ${a.label} (${a.full_address})`));

        await client.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

debugAddress();
