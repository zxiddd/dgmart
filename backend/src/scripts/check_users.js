const db = require('../config/db');
require('dotenv').config();

const listUsers = async () => {
    try {
        const res = await db.query('SELECT id, email, name, role FROM users');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

listUsers();
