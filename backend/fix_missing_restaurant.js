const db = require('./src/config/db');

async function fixMissingRestaurant() {
    try {
        console.log('Finding restaurant_owners without a restaurant...');

        // Find users with role 'restaurant_owner' who are NOT in restaurants table
        const query = `
            SELECT u.id, u.email, u.name 
            FROM users u
            LEFT JOIN restaurants r ON u.id = r.owner_id
            WHERE u.role = 'restaurant_owner' AND r.id IS NULL
        `;

        const { rows } = await db.query(query);

        if (rows.length === 0) {
            console.log('✅ All restaurant owners have a restaurant linked.');
            process.exit(0);
        }

        console.log(`Found ${rows.length} orphaned owners. Creating restaurants for them...`);

        for (const user of rows) {
            console.log(`Creating restaurant for ${user.email} (${user.id})...`);

            const insertQuery = `
                INSERT INTO restaurants (owner_id, name, address, phone, status, is_active, min_order_amount, avg_prep_time_mins, delivery_radius_km, cuisine_type, lat, lng)
                VALUES ($1, $2, $3, $4, 'pending_approval', true, 0, 30, 5.0, ARRAY['North Indian'], 0.0, 0.0)
                RETURNING id, name
            `;

            const name = user.name ? `${user.name}'s Kitchen` : 'My Awesome Restaurant';

            await db.query(insertQuery, [
                user.id,
                name,
                'Update Address',
                '9999999999'
            ]);

            console.log(`✅ Created "${name}" for ${user.email}`);
        }

        console.log('All fixes applied.');
        process.exit(0);

    } catch (error) {
        console.error('Error fixing data:', error);
        process.exit(1);
    }
}

fixMissingRestaurant();
