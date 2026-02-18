const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

async function activate() {
    try {
        const sqlPath = path.join(__dirname, 'activate_restaurant.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Activating pending restaurants...');
        const res = await db.query(sql);
        console.log(`✅ Activated restaurants. Rows affected: ${res.rowCount}`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

activate();
