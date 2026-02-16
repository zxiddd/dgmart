const db = require('../config/db');

const checkRestaurant = async () => {
    try {
        const id = 'd2e97aad-e655-4edb-9d04-31b99ba4e0da';
        console.log(`Checking for restaurant ID: ${id}`);

        const res = await db.query('SELECT * FROM restaurants WHERE id = $1', [id]);

        if (res.rows.length > 0) {
            console.log('✅ Restaurant FOUND:', res.rows[0].name);
            console.log('Is Active:', res.rows[0].is_active);
        } else {
            console.log('❌ Restaurant NOT FOUND');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
};

checkRestaurant();
