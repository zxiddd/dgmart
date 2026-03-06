const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:Uzair78640@@db.prvhnlamrknodwxuswyv.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running admin features migration...');
    await client.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;`);
    console.log('restaurants.is_featured added');
    await client.query(`ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES users(id) ON DELETE SET NULL;`);
    await client.query(`ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS max_uses_per_user INT DEFAULT 1;`);
    await client.query(`ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;`);
    console.log('promo_codes columns added');
    await client.query(`
      CREATE TABLE IF NOT EXISTS promo_code_usages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        promo_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        used_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_promo_usages_promo_user ON promo_code_usages(promo_id, user_id);`);
    console.log('promo_code_usages table created');
    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}
migrate();
