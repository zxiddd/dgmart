const { Client } = require('pg');
require('dotenv').config();

async function checkAddress() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const userId = '0050a9e4-4473-4508-bdc3-3edfc7224367'; // User ID from logs
        console.log(`Checking addresses for user: ${userId}`);

        const res = await client.query('SELECT * FROM addresses WHERE user_id = $1', [userId]);
        console.log(`Found ${res.rows.length} addresses.`);
        if (res.rows.length > 0) {
            console.log('Sample Address ID:', res.rows[0].id);
        } else {
            console.log('Creating default address...');
            const insertRes = await client.query(`
                INSERT INTO addresses (user_id, label, full_address, lat, lng, is_default)
                VALUES ($1, 'Home', 'H.No 1-2-3, Degloor, Maharashtra', 18.5492, 77.5746, true)
                RETURNING id
            `, [userId]);
            console.log('Created Address ID:', insertRes.rows[0].id);
        }

        await client.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkAddress();
