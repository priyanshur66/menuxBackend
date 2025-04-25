import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

import menuRoutes from './routes/menu.routes.js';
import authRoutes from './routes/auth.routes.js';
import errorHandler from './middlewares/error.middleware.js';
import requestLogger from './middlewares/logger.middleware.js';

// Environment variables configuration
dotenv.config();

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up server startup logs
console.log(`[Server] Initializing server in ${process.env.NODE_ENV} mode`);
console.log(`[Server] Server time: ${new Date().toISOString()}`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Morgan HTTP request logger only in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Custom request logger
app.use(requestLogger);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
console.log(`[Server] Static file path configured: ${path.join(__dirname, '../uploads')}`);

// API Routes
app.use('/api/menus', menuRoutes);
app.use('/api/auth', authRoutes);
console.log(`[Server] Routes registered`);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
});

// Connect to MongoDB
console.log(`[Server] Attempting to connect to MongoDB...`);
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(`[Server] Connected to MongoDB successfully`);
    // Start server after successful database connection
    app.listen(PORT, () => {
      console.log(`[Server] Server running on port ${PORT}`);
      console.log(`[Server] Health check available at: http://localhost:${PORT}/health`);
      console.log(`[Server] API endpoints available at: http://localhost:${PORT}/api/menus`);
    });
  })
  .catch(error => {
    console.error(`[Server] MongoDB connection error:`, error);
  });

export default app; 