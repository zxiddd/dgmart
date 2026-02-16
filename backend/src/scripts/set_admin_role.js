const db = require('../config/db');

const email = 'admin@degloormart.com'; // Replace with actual admin email if different

async function setAdminRole() {
    try {
        console.log(`Setting admin role for user: ${email}`);

        // Find user by email
        const userRes = await db.query('SELECT id, role FROM users WHERE email = $1', [email]);

        if (userRes.rows.length === 0) {
            console.error('User not found!');
            process.exit(1);
        }

        const userId = userRes.rows[0].id;
        console.log(`Found user ${userId} with role ${userRes.rows[0].role}`);

        // Update role
        await db.query("UPDATE users SET role = 'admin' WHERE id = $1", [userId]);
        console.log('Successfully updated user role to admin.');

        process.exit(0);
    } catch (error) {
        console.error('Error setting admin role:', error);
        process.exit(1);
    }
}

setAdminRole();
