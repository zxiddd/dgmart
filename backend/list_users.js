const db = require('./src/config/db');

async function listUsers() {
    try {
        const { rows } = await db.query('SELECT id, email, role FROM users');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error fetching users:', error);
        process.exit(1);
    }
}

listUsers();
