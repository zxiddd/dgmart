const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { upload, uploadToFirebase } = require('../services/uploadService');

/**
 * Upload a single file
 * POST /api/upload
 * Body: multipart/form-data with 'file' field and 'folder' field
 */
router.post('/', authenticate, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file provided.' });
        }

        const folder = req.body.folder || 'uploads';
        const url = await uploadToFirebase(
            req.file.buffer,
            req.file.originalname,
            folder,
            req.file.mimetype
        );

        res.json({
            success: true,
            message: 'File uploaded.',
            data: { url, filename: req.file.originalname, size: req.file.size },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Upload multiple files (up to 5)
 * POST /api/upload/multiple
 */
router.post('/multiple', authenticate, upload.array('files', 5), async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files provided.' });
        }

        const folder = req.body.folder || 'uploads';
        const urls = [];

        for (const file of req.files) {
            const url = await uploadToFirebase(file.buffer, file.originalname, folder, file.mimetype);
            urls.push({ url, filename: file.originalname, size: file.size });
        }

        res.json({
            success: true,
            message: `${urls.length} files uploaded.`,
            data: { files: urls },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
