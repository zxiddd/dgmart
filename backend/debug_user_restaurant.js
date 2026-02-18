const db = require('./src/config/db');

async function debugData() {
    try {
        console.log('--- USERS ---');
        const users = await db.query('SELECT id, email, role, name FROM users LIMIT 10');
        users.rows.forEach(u => console.log(`${u.email} (${u.role}) - ID: ${u.id}`));

        console.log('\n--- RESTAURANTS ---');
        const rests = await db.query('SELECT id, name, owner_id FROM restaurants');
        rests.rows.forEach(r => console.log(`${r.name} - Owner ID: ${r.owner_id}`));

        console.log('\n--- MATCH CHECK ---');
        if (users.rows.length > 0 && rests.rows.length > 0) {
            rests.rows.forEach(r => {
                const owner = users.rows.find(u => u.id === r.owner_id);
                if (owner) {
                    console.log(`✅ Restaurant "${r.name}" is owned by ${owner.email}`);
                } else {
                    console.log(`❌ Restaurant "${r.name}" has ORPHANED owner_id: ${r.owner_id}`);
                }
            });
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

debugData();
