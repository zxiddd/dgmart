require('dotenv').config();
const supabase = require('./src/config/supabase');
const db = require('./src/config/db');

async function testSupabase() {
    console.log('Testing Supabase Auth & DB Upsert...');
    try {
        const uid = 'test_uid_' + Date.now();
        const normalizedPhone = '9999999999';
        const name = 'Test User';
        const authEmail = `test_${Date.now()}@degloormart.phone`;

        console.log('1. Creating Supabase User...');
        const tempPassword = `supa_${uid}_${Date.now()}!A`;
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: authEmail,
            password: tempPassword,
            phone: `+91${Date.now().toString().slice(-10)}`, // unique phone
            user_metadata: {
                name: name,
                phone: normalizedPhone,
            },
            email_confirm: true,
            phone_confirm: true
        });

        if (authError) {
            console.error('Supabase create error:', authError);
            process.exit(1);
        }

        const supabaseUserId = authData.user.id;
        console.log('Supabase user created:', supabaseUserId);

        console.log('2. Upserting into public.users...');
        await db.query(
            `INSERT INTO users (id, email, name, phone, role)
             VALUES ($1, $2, $3, $4, 'customer')
             ON CONFLICT (id) DO UPDATE SET phone = $4`,
            [
                supabaseUserId,
                authEmail,
                name,
                normalizedPhone,
            ]
        );
        console.log('DB upsert successful.');

        console.log('3. Rotating password...');
        const dynamicPassword = `Fb!${uid}_${Date.now()}`;
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            supabaseUserId,
            { password: dynamicPassword }
        );

        if (updateError) {
            console.error('Update password error:', updateError);
            process.exit(1);
        }

        console.log('4. Signing in...');
        const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password: dynamicPassword,
        });

        if (sessionError) {
            console.error('Sign in error:', sessionError);
            process.exit(1);
        }
        console.log('Session created:', sessionData.session?.access_token?.slice(0, 10));

    } catch (err) {
        console.error('Unhandled exception:', err);
    } finally {
        process.exit(0);
    }
}

testSupabase();
