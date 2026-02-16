const db = require('../config/db');

async function updateConstraints() {
    const client = await db.getClient();
    try {
        console.log('Updating orders table status constraint...');

        // 1. Drop existing constraint
        // Note: We need the exact name, which is 'orders_status_check' based on the schema.sql
        await client.query(`
            ALTER TABLE orders 
            DROP CONSTRAINT IF EXISTS orders_status_check;
        `);

        // 2. Add updated constraint
        await client.query(`
            ALTER TABLE orders 
            ADD CONSTRAINT orders_status_check 
            CHECK (status IN ('placed', 'confirmed', 'preparing', 'ready', 'accepted_by_driver', 'picked_up', 'delivered', 'cancelled', 'refunded'));
        `);

        console.log('✅ Orders status constraint updated successfully.');
    } catch (error) {
        console.error('❌ Error updating constraint:', error);
    } finally {
        client.release();
        process.exit();
    }
}

updateConstraints();
