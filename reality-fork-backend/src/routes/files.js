const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common file types
        const allowedTypes = [
            // Images
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            // Videos
            'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
            // Audio
            'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
            // Documents
            'application/pdf', 'application/json', 'text/plain', 'text/html', 'text/css', 'text/javascript',
            // Archives
            'application/zip', 'application/x-tar', 'application/gzip'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(null, true); // Accept all files for now
        }
    }
});

// Upload single file
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const fileInfo = {
            id: uuidv4(),
            originalName: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: `/uploads/${req.file.filename}`,
            uploadedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            data: fileInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Upload multiple files
router.post('/upload-multiple', upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const filesInfo = req.files.map(file => ({
            id: uuidv4(),
            originalName: file.originalname,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
            path: `/uploads/${file.filename}`,
            uploadedAt: new Date().toISOString()
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

// Get file by filename
router.get('/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            message: 'File not found'
        });
    }

    res.sendFile(filePath);
});

// Delete file
router.delete('/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../../uploads', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        fs.unlinkSync(filePath);

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

// List all uploaded files
router.get('/', (req, res) => {
    try {
        const uploadDir = path.join(__dirname, '../../uploads');

        if (!fs.existsSync(uploadDir)) {
            return res.json({
                success: true,
                count: 0,
                data: []
            });
        }

        const files = fs.readdirSync(uploadDir).map(filename => {
            const filePath = path.join(uploadDir, filename);
            const stats = fs.statSync(filePath);
            return {
                filename,
                size: stats.size,
                path: `/uploads/${filename}`,
                createdAt: stats.birthtime
            };
        });

        res.json({
            success: true,
            count: files.length,
            data: files
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
