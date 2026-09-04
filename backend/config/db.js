/**
 * @file db.js
 * @description Configures and manages the Mongoose connection to MongoDB database.
 * This connection is established at server startup so endpoints can perform DB operations.
 */

const mongoose = require('mongoose');

/**
 * Connects the Express server to the MongoDB database using URI from environment variables.
 * Falls back to local MongoDB URL if MONGO_URI is not set.
 * @returns {Promise<void>} Resolves when connection succeeds, or terminates process on error.
 */
const connectDB = async () => {
  try {
    // Read the URI from environment variables or use the local MongoDB default path
    const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/roadreport';
    
    // Connect to database
    const conn = await mongoose.connect(connUri);
    
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection failure: ${error.message}`);
    // Exit application process with failure code (1) if database cannot connect
    process.exit(1);
  }
};

module.exports = connectDB;
