const db = require('./src/config/db');

async function run() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS platform_settings (
                key VARCHAR(255) PRIMARY KEY,
                value JSONB NOT NULL
            );
        `);
        await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE;');
        await db.query(`
            INSERT INTO platform_settings (key, value) 
            VALUES ('global', '{"require_phone_verification": true}'::jsonb) 
            ON CONFLICT (key) DO UPDATE SET value = platform_settings.value || '{"require_phone_verification": true}'::jsonb;
        `);
        console.log('✅ DB Migration successful');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}
run();
