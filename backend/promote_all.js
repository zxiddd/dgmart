const db = require('./src/config/db');

async function promoteAll() {
    try {
        const { rows } = await db.query("UPDATE users SET role = 'super_admin' RETURNING *");
        console.log(`SUCCESS: Promoted ${rows.length} users to super_admin`);
        rows.forEach(u => console.log(`- ${u.email} (${u.role})`));
        process.exit(0);
    } catch (error) {
        console.error('Error promoting users:', error);
        process.exit(1);
    }
}

promoteAll();
