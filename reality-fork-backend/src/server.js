require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? false // Disable CORS or set to specific domain in production as it serves from same origin
        : 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve frontend static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// Database connection
connectDB();

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Reality Fork API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/versions', require('./routes/versions'));
app.use('/api/branches', require('./routes/branches'));
app.use('/api/files', require('./routes/files'));

// API 404 handler (only for /api routes)
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API Route not found'
    });
});

// SPA Fallback: serve index.html for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║   Reality Fork API Server Running     ║
    ║   Port: ${PORT}                           ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}             ║
    ╚═══════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});
