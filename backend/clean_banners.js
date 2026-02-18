const db = require('./src/config/db');

async function cleanBanners() {
    const result = await db.query("DELETE FROM banners WHERE target_screen = 'RestaurantDetails'");
    console.log('Deleted', result.rowCount, 'restaurant banners');
    const { rows } = await db.query('SELECT id, title, target_screen FROM banners');
    console.log('Remaining banners:', JSON.stringify(rows, null, 2));
    process.exit(0);
}

cleanBanners().catch(e => { console.error(e.message); process.exit(1); });
