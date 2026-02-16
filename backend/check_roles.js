const db = require('./src/config/db');

async function checkRoles() {
    try {
        const { rows } = await db.query('SELECT id, email, role FROM users');
        console.log('--- User Roles ---');
        rows.forEach(user => {
            console.log(`ID: ${user.id} | Email: ${user.email} | Role: ${user.role}`);
        });
        console.log('------------------');
        process.exit(0);
    } catch (error) {
        console.error('Error fetching roles:', error);
        process.exit(1);
    }
}

checkRoles();
