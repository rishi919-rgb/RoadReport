/**
 * @file User.js
 * @description Mongoose model representing a registered User in RoadReport.
 * Handles the declaration of fields (name, email, hashed password, profile image, registration date).
 */

const mongoose = require('mongoose');

// Define structure of the User document in MongoDB
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password']
  },
  profileImage: {
    type: String,
    default: '' // Cloudinary URL or empty string
  },
  phone: {
    type: String,
    default: ''
  },
  ward: {
    type: String,
    default: 'Ward 12 - Central Zone'
  },
  reputationPoints: {
    type: Number,
    default: 150
  },
  civicCredits: {
    type: Number,
    default: 250
  },
  streakCount: {
    type: Number,
    default: 4
  },
  badges: [{
    id: String,
    name: String,
    icon: String,
    dateUnlocked: { type: Date, default: Date.now }
  }],
  redeemedPerks: [{
    perkId: String,
    title: String,
    code: String,
    creditsSpent: Number,
    dateRedeemed: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the User model
module.exports = mongoose.model('User', userSchema);
