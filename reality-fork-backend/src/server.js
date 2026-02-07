require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
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
