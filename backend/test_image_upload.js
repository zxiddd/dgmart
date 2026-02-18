const supabase = require('./src/config/supabase');
const fs = require('fs');
const path = require('path');

async function testImageUpload() {
    console.log('--- Testing Supabase Image Upload ---');

    // Create a minimal valid PNG (1x1 pixel)
    // PNG header + IHDR + IDAT + IEND
    const minimalPng = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
        0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC,
        0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
        0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const { data, error } = await supabase.storage
        .from('uploads')
        .upload('test/test-image.png', minimalPng, {
            contentType: 'image/png',
            upsert: true
        });

    if (error) {
        console.error('❌ Image upload failed:', error.message);
        console.error('Full error:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Image upload succeeded!');
        const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl('test/test-image.png');
        console.log('Public URL:', publicUrl);
    }

    process.exit(0);
}

testImageUpload();
