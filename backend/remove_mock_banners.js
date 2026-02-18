const db = require('./src/config/db');

async function removeMockBanners() {
    const result = await db.query("DELETE FROM banners WHERE target_screen = 'RestaurantList'");
    console.log('Deleted', result.rowCount, 'mock promo banners');

    const { rows } = await db.query('SELECT id, title, target_screen FROM banners');
    console.log('Remaining banners:', JSON.stringify(rows, null, 2));
    process.exit(0);
}

removeMockBanners().catch(e => { console.error(e.message); process.exit(1); });
