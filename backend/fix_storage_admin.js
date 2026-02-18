// Use service role key to manage storage policies
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixStoragePolicies() {
    console.log('--- Fixing Storage Policies via Admin Client ---');

    try {
        // Test upload with service role (bypasses RLS)
        const testBuffer = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
            0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC,
            0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
            0x44, 0xAE, 0x42, 0x60, 0x82
        ]);

        const { data, error } = await supabaseAdmin.storage
            .from('uploads')
            .upload('test/admin-test.png', testBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) {
            console.error('❌ Admin upload failed:', error.message);
        } else {
            console.log('✅ Admin upload succeeded!');
        }

        // Now update bucket to be public and allow all authenticated uploads
        const { data: updateData, error: updateError } = await supabaseAdmin.storage.updateBucket('uploads', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            fileSizeLimit: 5 * 1024 * 1024
        });

        if (updateError) {
            console.error('❌ Bucket update failed:', updateError.message);
        } else {
            console.log('✅ Bucket updated to public!');
        }

    } catch (err) {
        console.error('Error:', err.message);
    }

    process.exit(0);
}

fixStoragePolicies();
