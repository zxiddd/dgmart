const db = require('./src/config/db');

async function fixUser() {
    const userEmail = 'rider@gmail.com';
    try {
        console.log(`Fixing user ${userEmail}...`);

        const userRes = await db.query('SELECT id FROM users WHERE email = $1', [userEmail]);
        if (userRes.rows.length === 0) {
            console.error(`User ${userEmail} not found in users table.`);
            process.exit(1);
        }

        const userId = userRes.rows[0].id;
        console.log(`Found user ID: ${userId}`);

        // Ensure role is delivery_partner
        await db.query("UPDATE users SET role = 'delivery_partner' WHERE id = $1", [userId]);

        // Check if partner record exists
        const existing = await db.query('SELECT id FROM delivery_partners WHERE user_id = $1', [userId]);

        if (existing.rows.length === 0) {
            console.log('Inserting missing delivery_partners record...');
            await db.query(`
                INSERT INTO delivery_partners (
                    user_id, vehicle_type, vehicle_number, 
                    is_online, is_verified, zone, bank_details
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [userId, 'motorcycle', 'TEMP-000', false, true, 'Default', JSON.stringify({})]);
        } else {
            console.log('Partner record already exists in delivery_partners table.');
        }

        console.log('✅ User fixed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Fix failed:', err);
        process.exit(1);
    }
}

fixUser();
