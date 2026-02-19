const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool({
    connectionString: config.databaseUrl,
    max: 20, // Increase pool size for parallel admin queries
    connectionTimeoutMillis: 5000, // Fail fast if DB is slow (5s)
    idleTimeoutMillis: 30000,
    ssl: {
        rejectUnauthorized: false,
    },
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
};
