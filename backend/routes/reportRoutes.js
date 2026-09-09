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

// Fetch active emergency SOS road hazard alerts (mounted before /:id)
router.get('/alerts/emergency', getEmergencyAlerts);

// Fetch only the logged-in user's own reports
router.get('/my', getMyReports);

// Routes for working on specific reports by ID
router.route('/:id')
  .get(getReportById)
  .put(updateReport)
  .delete(deleteReport);

// Update report resolution status
router.patch('/:id/status', updateReportStatus);

// Assign work order to municipal engineer
router.patch('/:id/assign-order', assignWorkOrder);

// Resolve report with verified Before vs After photo proof
router.patch('/:id/resolve-proof', resolveReportWithProof);

// Toggle upvoting a report
router.patch('/:id/upvote', toggleUpvoteReport);

module.exports = router;
