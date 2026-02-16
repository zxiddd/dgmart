const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function migrate() {
    console.log('🔌 Connecting to Supabase...');
    const client = await db.getClient();

    try {
        console.log('📝 Reading schema.sql...');
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon but respect PL/pgSQL functions if any
        // Improved split to handle $body$ or $$ delimiters roughly
        // For now, simple split is fine as we don't have complex nested bodies except the trigger function

        // We will execute the WHOLE SQL file as one block if possible, or split carefully.
        // Triggers and Functions often contain semicolons.
        // Splitting by ";\n" or "; " might be safer than just ";"

        // Let's try executing block by block based on clear separation, or just big chunks.
        // Actually, 'pg' driver can execute multiple statements in one query call usually.

        console.log('🚀 Running Full Migration...');
        // We'll try running the whole thing. If it fails on a specific part, we'll know.
        // But to be cleaner, let's drop cascade first.

        try {
            console.log('🚮 Dropping public schema for fresh start...');
            await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
            await client.query('GRANT ALL ON SCHEMA public TO postgres;');
            await client.query('GRANT ALL ON SCHEMA public TO public;');
        } catch (e) {
            console.log('⚠️ Schema reset failed, trying to continue...');
        }

        await client.query(sql);

        console.log('✅ Migration successful! All tables and triggers created.');
    } catch (error) {
        console.error('❌ Migration fatal error:', error.message);
        // console.error('Query:', error.query); // If available
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
