
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://prvhnlamrknodwxuswyv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydmhubGFtcmtub2R3eHVzd3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTUwNjgsImV4cCI6MjA4NjQ5MTA2OH0.boUjRNYoYgtBCszvm9ob239wJ-ZeJe9OXKAuHnFkJ40';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
    const email = `test_${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log(`Attempting Signup with ${email}...`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        console.error('Signup Error:', signUpError.message);
        return;
    }

    console.log('Signup Successful. User ID:', signUpData.user?.id);
    if (signUpData.user?.identities?.length === 0) {
        console.log('User created but identities empty - likely already exists');
    }

    // Check if email confirmation is required (session will be null usually)
    if (signUpData.session) {
        console.log('Session returned immediately! Email confirmation is NOT required.');
    } else {
        console.log('No session returned. Email confirmation might be required.');
    }

    console.log('Attempting Login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (signInError) {
        console.error('Login Error:', signInError.message);
    } else {
        console.log('Login Successful!');
    }
}

testAuth();
