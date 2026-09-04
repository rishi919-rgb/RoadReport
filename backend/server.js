/**
 * @file server.js
 * @description Main entry point for the RoadReport Express.js backend.
 * Initializes middleware, establishes database connections, and mounts API routes.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Middleware: Enable Cross-Origin Resource Sharing (allows React Native app to make API calls)
app.use(cors());

// Middleware: Parse incoming requests with JSON payloads (replaces body-parser)
app.use(express.json());

// Mount API endpoint routers
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// Simple health-check route to verify backend is running
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'RoadReport Backend API is active and healthy' });
});

// Catch-all route for undefined endpoints
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Resource endpoint not found' });
});

// Configure server port (default to 5000 if not specified in environment)
const PORT = process.env.PORT || 5000;

// Start Express server explicitly binding to 0.0.0.0 host
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled Promise rejections to prevent server crash
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server and exit process
  server.close(() => process.exit(1));
});
