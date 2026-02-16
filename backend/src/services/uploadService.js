const multer = require('multer');
const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

/**
 * Multer middleware (memory)
 */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type'), false);
    }
});

/**
 * Upload to Supabase Storage
 */
const uploadToFirebase = async (fileBuffer, originalName, folder, mimeType) => {
    // Note: Kept function name 'uploadToFirebase' for compatibility with existing code calling it
    // But implementation uses Supabase.

    const ext = path.extname(originalName);
    const fileName = `${folder}/${uuidv4()}${ext}`;

    // Supabase upload
    // Bucket name: 'uploads' (Make sure this exists in Supabase!)
    const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, fileBuffer, {
            contentType: mimeType,
            upsert: false
        });

    if (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

    return publicUrl;
};

/**
 * Delete from Storage
 */
const deleteFromFirebase = async (fileUrl) => {
    try {
        // Extract path from URL
        // URL format: .../storage/v1/object/public/uploads/folder/filename.ext
        const urlObj = new URL(fileUrl);
        const pathParts = urlObj.pathname.split('/public/uploads/');
        if (pathParts.length > 1) {
            const filePath = pathParts[1]; // folder/filename.ext
            await supabase.storage.from('uploads').remove([filePath]);
        }
    } catch (error) {
        console.error('Error deleting file:', error.message);
    }
};

module.exports = {
    upload,
    uploadToFirebase, // Export as alias
    deleteFromFirebase
};
