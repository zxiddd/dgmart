const db = require('./src/config/db');

async function checkBanners() {
    try {
        console.log('--- BANNERS ---');
        const res = await db.query('SELECT * FROM banners');
        if (res.rows.length === 0) {
            console.log('No banners found.');
        } else {
            console.log(JSON.stringify(res.rows, null, 2));
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkBanners();
