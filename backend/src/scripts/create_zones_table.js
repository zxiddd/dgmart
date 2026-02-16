const db = require('../config/db');

const createZonesTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS delivery_zones (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) UNIQUE NOT NULL,
                delivery_fee DECIMAL(10, 2) NOT NULL,
                min_order_amount DECIMAL(10, 2) DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('delivery_zones table created successfully.');

        // Insert Default Zone if not exists
        const check = await db.query("SELECT * FROM delivery_zones WHERE name = 'Degloor'");
        if (check.rows.length === 0) {
            await db.query(`
                INSERT INTO delivery_zones (name, delivery_fee, min_order_amount)
                VALUES ('Degloor', 20.00, 0);
            `);
            console.log('Default Degloor zone added.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    }
};

createZonesTable();
