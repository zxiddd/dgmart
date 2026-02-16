
const db = require('./src/config/db');

async function debugSchema() {
    try {
        console.log('Checking restaurants table schema...');
        const res = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'restaurants';
        `);
        console.table(res.rows);
    } catch (err) {
        console.error('Schema check error:', err);
    }
}

debugSchema();
