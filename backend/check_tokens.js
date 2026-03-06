const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres.ptobpxmrgptxeyetjoxq:Degloormart@123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const fcm = await pool.query('SELECT count(*) as count FROM users WHERE fcm_token IS NOT NULL');
    const web = await pool.query('SELECT count(*) as count FROM push_subscriptions');
    const usersWithFCM = await pool.query('SELECT id, email, role, fcm_token FROM users WHERE fcm_token IS NOT NULL LIMIT 5');

    console.log('--- Push Notification Stats ---');
    console.log(`FCM Tokens (users table): ${fcm.rows[0].count}`);
    console.log(`Web Subscriptions (push_subscriptions table): ${web.rows[0].count}`);
    console.log('\n--- Sample Users with FCM ---');
    console.table(usersWithFCM.rows.map(r => ({ ...r, fcm_token: r.fcm_token.substring(0, 10) + '...' })));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

check();
