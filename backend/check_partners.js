const db = require('./src/config/db');

async function checkPartners() {
    try {
        console.log('--- Delivery Partner Diagnostic ---');
        
        // Check online/verified status
        const partners = await db.query(`
            SELECT p.id, p.user_id, u.name, p.is_online, p.is_verified, p.zone
            FROM delivery_partners p
            JOIN users u ON p.user_id = u.id
        `);
        
        console.log(`Found ${partners.rows.length} partners:`);
        partners.rows.forEach(p => {
            console.log(`- ${p.name} (UID: ${p.user_id}): Online: ${p.is_online}, Verified: ${p.is_verified}, Zone: ${p.zone}`);
        });

        // Check if there are any orders in 'searching_rider' status
        const orders = await db.query(`
            SELECT id, order_number, status, restaurant_id 
            FROM orders 
            WHERE status = 'searching_rider'
        `);
        
        console.log(`\nFound ${orders.rows.length} orders in 'searching_rider' status:`);
        orders.rows.forEach(o => {
            console.log(`- Order #${o.order_number} (ID: ${o.id}) for Restaurant ${o.restaurant_id}`);
        });

    } catch (error) {
        console.error('Diagnostic failed:', error);
    } finally {
        process.exit();
    }
}

checkPartners();
