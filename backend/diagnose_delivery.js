const db = require('./src/config/db');

async function diagnose() {
    try {
        console.log('--- DIAGNOSTIC START ---');

        const usersCount = await db.query('SELECT count(*) FROM users WHERE role = $1', ['delivery_partner']);
        console.log('Users with role delivery_partner:', usersCount.rows[0].count);

        const partnersCount = await db.query('SELECT count(*) FROM delivery_partners');
        console.log('Total records in delivery_partners:', partnersCount.rows[0].count);

        const mismatch = await db.query(`
            SELECT u.id, u.email 
            FROM users u 
            WHERE u.role = 'delivery_partner' 
            AND NOT EXISTS (SELECT 1 FROM delivery_partners dp WHERE dp.user_id = u.id)
        `);

        if (mismatch.rows.length > 0) {
            console.log('🚨 Found users with delivery_partner role but NO delivery_partners record:');
            mismatch.rows.forEach(r => console.log(` - ${r.email} (${r.id})`));
        } else {
            console.log('✅ All users with delivery_partner role have a partner record.');
        }

        console.log('--- DIAGNOSTIC END ---');
        process.exit(0);
    } catch (err) {
        console.error('Diagnostic failed:', err);
        process.exit(1);
    }
}

diagnose();
