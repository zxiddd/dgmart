const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

async function applyFix() {
    try {
        console.log('Reading SQL fix file...');
        const sqlPath = path.join(__dirname, 'database', 'fix_restaurants_rls.sql');

        if (!fs.existsSync(sqlPath)) {
            console.error('SQL file not found at:', sqlPath);
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Applying RLS fix to database...');

        // Execute the SQL
        await db.query(sql);

        console.log('✅ Successfully applied RLS policies for restaurants table.');
        console.log('   Users should now be able to update their restaurant details.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error applying fix:', error);
        process.exit(1);
    }
}

applyFix();
