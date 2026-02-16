const db = require('../config/db');

async function addPhoneColumn() {
    try {
        console.log('Adding missing columns to restaurants table...');
        await db.query(`
            ALTER TABLE restaurants 
            ADD COLUMN IF NOT EXISTS phone TEXT,
            ADD COLUMN IF NOT EXISTS image_url TEXT,
            ADD COLUMN IF NOT EXISTS cuisine_type TEXT[],
            ADD COLUMN IF NOT EXISTS min_order_amount DECIMAL(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS avg_prep_time_mins INTEGER DEFAULT 20,
            ADD COLUMN IF NOT EXISTS delivery_radius_km DECIMAL(5, 2) DEFAULT 10;
        `);
        console.log('Successfully added missing columns.');
        process.exit(0);
    } catch (error) {
        console.error('Error adding column:', error);
        process.exit(1);
    }
}

addPhoneColumn();
