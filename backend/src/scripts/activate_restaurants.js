const db = require('../config/db');

async function activate() {
    try {
        console.log('Activating all restaurants for testing...');
        await db.query("UPDATE restaurants SET status = 'active', is_active = true");
        console.log('✅ All restaurants sets to active.');
    } catch (e) {
        console.error('❌ Error activating restaurants:', e);
    } finally {
        process.exit();
    }
}

activate();
