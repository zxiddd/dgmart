const db = require('../config/db');

async function checkMenu() {
    const restaurantId = 'd2e97aad-e655-4edb-9d04-31b99ba4e0da';
    console.log('Checking menu for:', restaurantId);

    try {
        const cats = await db.query('SELECT * FROM menu_categories WHERE restaurant_id = $1', [restaurantId]);
        console.log('Categories:', cats.rows.length);
        console.table(cats.rows);

        const items = await db.query('SELECT * FROM menu_items WHERE restaurant_id = $1', [restaurantId]);
        console.log('Items:', items.rows.length);
        console.table(items.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkMenu();
