const db = require('./src/config/db');

async function promoteUser(email) {
    try {
        const { rows } = await db.query('UPDATE users SET role = $1 WHERE email = $2 RETURNING *', ['super_admin', email]);
        if (rows.length > 0) {
            console.log(`SUCCESS: User ${email} promoted to super_admin`);
            console.log(rows[0]);
        } else {
            console.log(`FAILED: User ${email} not found`);
        }
        process.exit(0);
    } catch (error) {
        console.error('Error promoting user:', error);
        process.exit(1);
    }
}

const email = process.argv[2] || 'admin@degloormart.com';
promoteUser(email);
