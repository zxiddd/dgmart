const db = require('./src/config/db');

async function checkSchema() {
    try {
        console.log('Checking restaurants table schema...');
        const res = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'restaurants' AND column_name = 'banner_url';
        `);

        if (res.rows.length > 0) {
            console.log('✅ Column banner_url EXISTS in restaurants table.');
        } else {
            console.log('❌ Column banner_url DOES NOT EXIST in restaurants table.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
}

checkSchema();
