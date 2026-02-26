require('dotenv').config({ path: __dirname + '/.env' });
const { Client } = require('pg');

async function testPgBehavior() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();

        // Setup table
        await client.query(`
            CREATE TEMP TABLE test_users (
                id INT PRIMARY KEY,
                email TEXT UNIQUE
            )
        `);

        // Insert first row (simulate trigger)
        await client.query(`
            INSERT INTO test_users (id, email) VALUES (1, 'test@test.com')
        `);
        console.log('1. Simulated trigger insert complete');

        // Try to insert same row with ON CONFLICT (id)
        await client.query(`
            INSERT INTO test_users (id, email) VALUES (1, 'test@test.com')
            ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
        `);
        console.log('2. ON CONFLICT query succeeded');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}
testPgBehavior();
