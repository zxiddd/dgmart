require('dotenv').config({ path: __dirname + '/.env' });
const db = require('./src/config/db');

async function checkCols() {
    try {
        console.log('Connecting to', process.env.DATABASE_URL.slice(0, 30) + '...');
        const res = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.log('Columns in public.users:', res.rows.map(r => r.column_name).join(', '));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit(0);
    }
}
checkCols();
