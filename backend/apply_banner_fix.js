const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

async function applyFix() {
    try {
        const sqlPath = path.join(__dirname, 'fix_banners_schema_and_rls.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying Schema and RLS fix for Banners...');
        await db.query(sql);
        console.log('✅ Successfully applied fixes to banners table.');

        process.exit(0);

    } catch (error) {
        console.error('Error applying fix:', error);
        process.exit(1);
    }
}

applyFix();
