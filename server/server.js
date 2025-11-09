import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import chatRoutes from './routes/chat.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
// Increase body parser limit to handle base64 image uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/chat', chatRoutes);

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '⚡ Electric Buddy API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ✅ Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Electric Buddy API',
    version: '1.0.0',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'GET  /api/customers',
      'GET  /api/health'
    ]
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('🚀 Electric Buddy Server Started!');
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log('📋 Available Endpoints:');
  console.log('   ✅ GET  http://localhost:5000/');
  console.log('   ✅ GET  http://localhost:5000/api/health');
  console.log('   ✅ POST http://localhost:5000/api/auth/register');
  console.log('   ✅ POST http://localhost:5000/api/auth/login');
  console.log('   ✅ GET  http://localhost:5000/api/auth/me');
  console.log('   ✅ GET  http://localhost:5000/api/customers');
  console.log('');
  console.log('🎯 Test immediately in Thunder Client:');
  console.log('   Method: POST');
  console.log('   URL: http://localhost:5000/api/auth/register');
});
