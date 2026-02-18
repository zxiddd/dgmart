const supabase = require('./src/config/supabase');

async function testUpload() {
    console.log('--- Testing Supabase Storage ---');

    // 1. List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
        console.error('Error listing buckets:', bucketsError.message);
    } else {
        console.log('Existing buckets:', buckets.map(b => b.name));
    }

    // 2. Try to create the 'uploads' bucket if it doesn't exist
    const uploadsBucket = buckets?.find(b => b.name === 'uploads');
    if (!uploadsBucket) {
        console.log('Creating uploads bucket...');
        const { data, error } = await supabase.storage.createBucket('uploads', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            fileSizeLimit: 5 * 1024 * 1024
        });
        if (error) {
            console.error('Error creating bucket:', error.message);
        } else {
            console.log('✅ Bucket created:', data);
        }
    } else {
        console.log('✅ Uploads bucket already exists:', uploadsBucket);
    }

    // 3. Test a small upload
    const testBuffer = Buffer.from('test image content');
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload('test/test-file.txt', testBuffer, {
            contentType: 'text/plain',
            upsert: true
        });

    if (uploadError) {
        console.error('❌ Test upload failed:', uploadError.message);
    } else {
        console.log('✅ Test upload succeeded:', uploadData);
        const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl('test/test-file.txt');
        console.log('Public URL:', publicUrl);
    }

    process.exit(0);
}

testUpload();
