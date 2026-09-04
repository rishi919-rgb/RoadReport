/**
 * @file reportRoutes.js
 * @description Defines Express routing path bindings for Report CRUD and interactions.
 * Connects each endpoint with the report controller functions and enforces protect middleware.
 */

const express = require('express');
const {
  createReport,
  getReports,
  getMyReports,
  getReportById,
  updateReport,
  deleteReport,
  updateReportStatus,
  toggleUpvoteReport
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Enforce authentication on all report endpoints
router.use(protect);

// Routes for creating reports and fetching all reports with query filters
router.route('/')
  .post(createReport)
  .get(getReports);

// Fetch only the logged-in user's own reports
router.get('/my', getMyReports);

// Routes for working on specific reports by ID
router.route('/:id')
  .get(getReportById)
  .put(updateReport)
  .delete(deleteReport);

// Update report resolution status
router.patch('/:id/status', updateReportStatus);

// Toggle upvoting a report
router.patch('/:id/upvote', toggleUpvoteReport);

module.exports = router;
