const db = require('./src/config/db');

async function syncLogosToBanners() {
    console.log('--- Syncing Restaurant Logos to Banners ---');

    try {
        // Get all active restaurants with a logo
        const { rows: restaurants } = await db.query(`
            SELECT id, name, image_url, cuisine_type, address
            FROM restaurants
            WHERE image_url IS NOT NULL AND image_url != '' AND is_active = true
        `);

        console.log(`Found ${restaurants.length} restaurants with logos.`);

        for (const r of restaurants) {
            const bannerTitle = r.name;
            const bannerSubtitle = (r.cuisine_type || []).join(', ') + ' | ' + (r.address || '').split(',')[0];
            const gradientColors = ['#FFD700', '#FF8C00'];

            // Check if banner already exists
            const { rows: existing } = await db.query(
                "SELECT id FROM banners WHERE target_screen = 'RestaurantDetails' AND target_id = $1",
                [r.id]
            );

            if (existing.length > 0) {
                await db.query(`
                    UPDATE banners SET image_url = $1, title = $2, subtitle = $3, updated_at = NOW()
                    WHERE id = $4
                `, [r.image_url, bannerTitle, bannerSubtitle, existing[0].id]);
                console.log(`✅ Updated banner for: ${r.name}`);
            } else {
                await db.query(`
                    INSERT INTO banners (image_url, target_screen, target_id, title, subtitle, gradient_colors, sort_order, is_active)
                    VALUES ($1, 'RestaurantDetails', $2, $3, $4, $5, 0, true)
                `, [r.image_url, r.id, bannerTitle, bannerSubtitle, gradientColors]);
                console.log(`✅ Created banner for: ${r.name}`);
            }
        }

        // Show final banners
        const { rows: banners } = await db.query('SELECT id, title, image_url, is_active FROM banners ORDER BY created_at DESC');
        console.log('\n--- Final Banners Table ---');
        console.log(JSON.stringify(banners, null, 2));

    } catch (err) {
        console.error('Error:', err.message);
    }

    process.exit(0);
}

syncLogosToBanners();
