/**
 * @file reportController.js
 * @description Controller managing Report CRUD operations.
 * Handles filtering by search terms, category, status, severity, nearby duplicates, and upvote toggling.
 */

const Report = require('../models/Report');

/**
 * Calculates the distance between two geographical points using the Haversine formula.
 * Used for the Duplicate Detection feature.
 * @param {number} lat1 - Latitude of point 1.
 * @param {number} lon1 - Longitude of point 1.
 * @param {number} lat2 - Latitude of point 2.
 * @param {number} lon2 - Longitude of point 2.
 * @returns {number} Distance in meters.
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Creates a new report.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Resolves when response is sent.
 */
const createReport = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      severity,
      location,
      media,
      isAnonymous,
      isEmergencySOS,
      hazardType,
      voiceAudioUri,
      voiceTranscript
    } = req.body;

    // Check required fields
    if (!title || !description || !category || !location || !location.latitude || !location.longitude || !location.address) {
      return res.status(400).json({ success: false, message: 'Please provide all required report details' });
    }

    // Create report linked to authenticated user (from req.user)
    const report = await Report.create({
      title,
      description,
      category,
      severity: isEmergencySOS ? 'high' : (severity || 'medium'),
      location,
      media: media || [],
      isAnonymous: Boolean(isAnonymous),
      isEmergencySOS: Boolean(isEmergencySOS),
      hazardType: hazardType || 'none',
      voiceAudioUri: voiceAudioUri || '',
      voiceTranscript: voiceTranscript || '',
      user: req.user._id
    });

    return res.status(201).json({ success: true, data: report });
  } catch (error) {
    console.error('Create Report Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error creating report' });
  }
};

/**
 * Gets all reports with optional filters (category, status, severity, search, page, limit, near).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Resolves when response is sent.
 */
const getReports = async (req, res) => {
  try {
    const { category, status, severity, search, page = 1, limit = 10, near, radius = 50 } = req.query;

    // Build the query object
    const query = {};

    if (category) {
      query.category = category;
    }
    if (status) {
      query.status = status;
    }
    if (severity) {
      query.severity = severity;
    }

    // Search matches text in title or description (case-insensitive)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skipNum = (pageNum - 1) * limitNum;

    // Retrieve reports matching search, sorted newest first
    let reports = await Report.find(query)
      .populate('user', 'name email profileImage')
      .sort({ createdAt: -1 });

    // Handle nearby duplicate detection if 'near' query parameter is specified as 'lat,lng'
    if (near) {
      const [latStr, lngStr] = near.split(',');
      const targetLat = parseFloat(latStr);
      const targetLng = parseFloat(lngStr);
      const limitRadius = parseFloat(radius);

      if (!isNaN(targetLat) && !isNaN(targetLng)) {
        // Filter reports based on Haversine distance formula
        reports = reports.filter(report => {
          if (!report.location || !report.location.latitude || !report.location.longitude) return false;
          const dist = calculateDistance(
            targetLat,
            targetLng,
            report.location.latitude,
            report.location.longitude
          );
          return dist <= limitRadius;
        });
      }
    }

    // Apply manual pagination to results (important since filter might change length)
    const total = reports.length;
    const paginatedReports = reports.slice(skipNum, skipNum + limitNum);

    return res.status(200).json({
      success: true,
      count: paginatedReports.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      },
      data: paginatedReports
    });
  } catch (error) {
    console.error('Get Reports Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving reports' });
  }
};

/**
 * Gets reports created by the currently authenticated user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Resolves when response is sent.
 */
const getMyReports = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skipNum = (pageNum - 1) * limitNum;

    const query = { user: req.user._id };

    const total = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate('user', 'name email profileImage')
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      },
      data: reports
    });
  } catch (error) {
    console.error('Get My Reports Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving your reports' });
  }
};

/**
 * Gets a single report by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Resolves when response is sent.
 */
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('user', 'name email profileImage')
      .populate('upvotes', 'name email');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error('Get Report By ID Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    return res.status(500).json({ success: false, message: 'Server error retrieving report' });
  }
};

/**
 * Updates a report (only allows modifications by the owner/creator).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Resolves when response is sent.
 */
const updateReport = async (req, res) => {
  try {
    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Verify ownership of the report
    if (report.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this report' });
    }

    // Update with req.body fields (safely selecting fields)
    const { title, description, category, severity, location, media } = req.body;
    if (title) report.title = title;
    if (description) report.description = description;
    if (category) report.category = category;
    if (severity) report.severity = severity;
    if (location) report.location = location;
    if (media) report.media = media;

    const updatedReport = await report.save();

    return res.status(200).json({ success: true, data: updatedReport });
  } catch (error) {
    console.error('Update Report Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating report' });
  }
};

/**
 * Deletes a report (only allowed for the creator/owner).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Resolves when response is sent.
 */
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Verify ownership of the report
    if (report.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this report' });
    }

    await Report.deleteOne({ _id: req.params.id });

    return res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete Report Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error deleting report' });
  }
};

/**
 * Updates status of a report.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Resolves when response is sent.
 */
const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status value against enum values in schema
    const validStatuses = ['reported', 'under_review', 'assigned', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid report status value' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = status;
    const updatedReport = await report.save();

    return res.status(200).json({ success: true, data: updatedReport });
  } catch (error) {
    console.error('Update Status Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};

/**
 * Toggles an upvote on a report.
 * If user has already upvoted, removes the upvote. Otherwise, adds the upvote.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Resolves when response is sent.
 */
const toggleUpvoteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const userId = req.user._id.toString();
    const upvotesIndex = report.upvotes.findIndex(id => id.toString() === userId);

    if (upvotesIndex > -1) {
      // User already upvoted, so remove user ID from upvotes (un-upvote)
      report.upvotes.splice(upvotesIndex, 1);
    } else {
      // User has not upvoted yet, add user ID to upvotes
      report.upvotes.push(req.user._id);
    }

    const updatedReport = await report.save();

    return res.status(200).json({
      success: true,
      upvotesCount: updatedReport.upvotes.length,
      isUpvoted: upvotesIndex === -1, // True if we just added the upvote
      data: updatedReport
    });
  } catch (error) {
    console.error('Toggle Upvote Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error toggling upvote' });
  }
};

/**
 * Gets all active emergency SOS road hazard alerts.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getEmergencyAlerts = async (req, res) => {
  try {
    const alerts = await Report.find({
      isEmergencySOS: true,
      status: { $ne: 'resolved' }
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('Get Emergency Alerts Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve emergency alerts' });
  }
};

/**
 * Assigns a work order to a municipal engineer with a 36-hour SLA timer.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const assignWorkOrder = async (req, res) => {
  try {
    const { engineerName, department, hours = 36 } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const assignedAt = new Date();
    const slaDeadline = new Date(assignedAt.getTime() + (parseInt(hours) || 36) * 3600 * 1000);

    report.status = 'in_progress';
    report.assignedEngineer = {
      name: engineerName || 'Field Engineer Team',
      department: department || 'Municipal Roads & Infrastructure',
      assignedAt,
      slaDeadline
    };

    const updated = await report.save();
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Assign Work Order Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to assign work order' });
  }
};

/**
 * Resolves a report with verified Before vs After photo proof and department stamp.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const resolveReportWithProof = async (req, res) => {
  try {
    const { afterPhotoUri, resolverNotes, department } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const resolvedAt = new Date();
    let withinSLA = true;

    if (report.assignedEngineer && report.assignedEngineer.slaDeadline) {
      withinSLA = resolvedAt <= new Date(report.assignedEngineer.slaDeadline);
    }

    report.status = 'resolved';
    report.resolutionProof = {
      afterPhotoUri: afterPhotoUri || '',
      resolvedAt,
      resolverNotes: resolverNotes || 'Work inspected and completed according to civic safety standards.',
      department: department || report.assignedEngineer?.department || 'Municipal Works Dept',
      verifiedBy: req.user?.name || 'Municipal Officer',
      withinSLA
    };

    const updated = await report.save();
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Resolve With Proof Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to record resolution proof' });
  }
};

module.exports = {
  createReport,
  getReports,
  getMyReports,
  getReportById,
  updateReport,
  deleteReport,
  updateReportStatus,
  toggleUpvoteReport,
  getEmergencyAlerts,
  assignWorkOrder,
  resolveReportWithProof
};
