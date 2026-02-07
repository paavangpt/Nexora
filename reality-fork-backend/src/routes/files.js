const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

// Configure multer for memory storage (files go to GridFS, not filesystem)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Get GridFS bucket
const getBucket = () => {
    return new GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
    });
};

// Upload single file to GridFS
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const bucket = getBucket();
        const fileId = new mongoose.Types.ObjectId();
        const filename = `${uuidv4()}-${req.file.originalname}`;

        // Create upload stream to GridFS
        const uploadStream = bucket.openUploadStreamWithId(fileId, filename, {
            contentType: req.file.mimetype,
            metadata: {
                originalName: req.file.originalname,
                uploadedAt: new Date().toISOString()
            }
        });

        // Write file buffer to GridFS
        uploadStream.end(req.file.buffer);

        uploadStream.on('finish', () => {
            const fileInfo = {
                id: fileId.toString(),
                originalName: req.file.originalname,
                filename: filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: `/api/files/${fileId.toString()}`,
                uploadedAt: new Date().toISOString()
            };

            res.json({
                success: true,
                data: fileInfo
            });
        });

        uploadStream.on('error', (error) => {
            res.status(500).json({
                success: false,
                message: error.message
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Upload multiple files to GridFS
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const bucket = getBucket();
        const filesInfo = [];

        for (const file of req.files) {
            const fileId = new mongoose.Types.ObjectId();
            const filename = `${uuidv4()}-${file.originalname}`;

            await new Promise((resolve, reject) => {
                const uploadStream = bucket.openUploadStreamWithId(fileId, filename, {
                    contentType: file.mimetype,
                    metadata: {
                        originalName: file.originalname,
                        uploadedAt: new Date().toISOString()
                    }
                });

                uploadStream.end(file.buffer);

                uploadStream.on('finish', () => {
                    filesInfo.push({
                        id: fileId.toString(),
                        originalName: file.originalname,
                        filename: filename,
                        mimetype: file.mimetype,
                        size: file.size,
                        path: `/api/files/${fileId.toString()}`,
                        uploadedAt: new Date().toISOString()
                    });
                    resolve();
                });

                uploadStream.on('error', reject);
            });
        }

        res.json({
            success: true,
            count: filesInfo.length,
            data: filesInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get file by ID from GridFS
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file ID'
            });
        }

        const bucket = getBucket();
        const fileId = new mongoose.Types.ObjectId(id);

        // Find file metadata
        const files = await bucket.find({ _id: fileId }).toArray();

        if (files.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        const file = files[0];

        // Set content type header
        res.set('Content-Type', file.contentType || 'application/octet-stream');
        res.set('Content-Disposition', `inline; filename="${file.metadata?.originalName || file.filename}"`);

        // Stream file from GridFS
        const downloadStream = bucket.openDownloadStream(fileId);
        downloadStream.pipe(res);

        downloadStream.on('error', (error) => {
            res.status(500).json({
                success: false,
                message: error.message
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete file from GridFS
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file ID'
            });
        }

        const bucket = getBucket();
        const fileId = new mongoose.Types.ObjectId(id);

        // Check if file exists
        const files = await bucket.find({ _id: fileId }).toArray();

        if (files.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        await bucket.delete(fileId);

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// List all uploaded files from GridFS
router.get('/', async (req, res) => {
    try {
        const bucket = getBucket();
        const files = await bucket.find({}).toArray();

        const filesInfo = files.map(file => ({
            id: file._id.toString(),
            filename: file.filename,
            originalName: file.metadata?.originalName || file.filename,
            contentType: file.contentType,
            size: file.length,
            path: `/api/files/${file._id.toString()}`,
            uploadedAt: file.uploadDate
        }));

        res.json({
            success: true,
            count: filesInfo.length,
            data: filesInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
