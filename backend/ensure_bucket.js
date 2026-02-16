const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function ensureBucket() {
    console.log('Checking for "uploads" bucket...');

    try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.error('Error listing buckets:', listError.message);
            return;
        }

        const exists = buckets.find(b => b.name === 'uploads');

        if (!exists) {
            console.log('Creating "uploads" bucket...');
            const { error: createError } = await supabase.storage.createBucket('uploads', {
                public: true,
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
                fileSizeLimit: 5242880 // 5MB
            });

            if (createError) {
                console.error('Error creating bucket:', createError.message);
            } else {
                console.log('Bucket "uploads" created successfully.');
            }
        } else {
            console.log('Bucket "uploads" already exists.');
        }
    } catch (err) {
        console.error('Unexpected error:', err.message);
    }
}

ensureBucket();
