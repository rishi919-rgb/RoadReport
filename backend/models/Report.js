/**
 * @file Report.js
 * @description Mongoose model representing a civic issue Report in RoadReport.
 * Stores details about categories, coordinates, severity, status progress, media attachments, and upvotes.
 */

const mongoose = require('mongoose');

// Define structure of the civic Report document in MongoDB
const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for the report'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description of the issue']
  },
  // Category must be one of the defined list: pothole, streetlight, garbage, water, traffic, other
  category: {
    type: String,
    required: [true, 'Please select an issue category']
  },
  // Severity indicates urgency: low, medium, or high
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  // Geolocation details: GPS coordinates and human-readable address
  location: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required']
    },
    address: {
      type: String,
      required: [true, 'Address string is required']
    }
  },
  // Cloudinary image/video URLs associated with this report
  media: [{
    type: String
  }],
  // Tracks report resolution state
  status: {
    type: String,
    enum: ['reported', 'under_review', 'assigned', 'in_progress', 'resolved'],
    default: 'reported'
  },
  /*
   * VIVA QUESTION: "Why do you store user IDs in upvotes array?"
   * ANSWER: Storing the MongoDB User IDs in the upvotes array (instead of just keeping a numeric count)
   * allows us to verify if a specific user has already upvoted this report.
   * This prevents duplicate upvotes from the same user, and allows the user to undo/toggle their upvote.
   */
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // The creator of the report
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A report must be linked to a user']
  },
  // Allows user to stay hidden from public feeds
  isAnonymous: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the Report model
module.exports = mongoose.model('Report', reportSchema);
