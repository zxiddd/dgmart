const { Pool } = require('pg');
const config = require('./env');

console.log('🐘 Initializing PostgreSQL Pool...');
const pool = new Pool({
    connectionString: config.databaseUrl,
    max: 20,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    ssl: {
        rejectUnauthorized: false, // Bypass self-signed cert issues on Render
    },
});

// Diagnostic check on connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err.message);
    } else {
        console.log('✅ Database Connection Verified');
        release();
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
};
