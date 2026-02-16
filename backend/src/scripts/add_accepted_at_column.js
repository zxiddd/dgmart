const db = require('../config/db');

async function addAcceptedAtColumn() {
    const client = await db.getClient();
    try {
        console.log('Checking/Adding accepted_at column to delivery_assignments...');

        await client.query(`
            ALTER TABLE delivery_assignments 
            ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;
        `);

        console.log('✅ Column accepted_at added successfully (or already existed).');
    } catch (error) {
        console.error('❌ Error adding column:', error);
    } finally {
        client.release();
        process.exit();
    }
}

addAcceptedAtColumn();
