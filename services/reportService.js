/**
 * @file reportService.js
 * @description Service containing all API network requests for civic reports.
 * Connects the ReportContext actions to the backend Express server endpoints.
 */

import api from './api';

/**
 * Gets all reports from the backend matching filters.
 * @param {Object} filters - Search, category, status, severity, and near distance parameters.
 * @returns {Promise<Object>} API response payload.
 */
export const getReports = async (filters = {}) => {
  try {
    const response = await api.get('/reports', { params: filters });
    return response.data;
  } catch (err) {
    return {
      success: false,
      data: [],
      message: err.response?.data?.message || err.message || 'Failed to fetch reports'
    };
  }
};

/**
 * Gets reports submitted by the logged-in user.
 * @param {Object} params - Pagination details (page, limit).
 * @returns {Promise<Object>} API response payload.
 */
export const getMyReports = async (params = {}) => {
  try {
    const response = await api.get('/reports/my', { params });
    return response.data;
  } catch (err) {
    return {
      success: false,
      data: [],
      message: err.response?.data?.message || err.message || 'Failed to fetch user reports'
    };
  }
};

/**
 * Gets detail info for a single report by ID.
 * @param {string} id - MongoDB ID of the report.
 * @returns {Promise<Object>} API response payload.
 */
export const getReportById = async (id) => {
  try {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  } catch (err) {
    return {
      success: false,
      data: null,
      message: err.response?.data?.message || err.message || 'Failed to fetch report details'
    };
  }
};

/**
 * Submits a new report to the backend.
 * @param {Object} reportData - Details (title, category, severity, location, media).
 * @returns {Promise<Object>} API response payload.
 */
export const createReport = async (reportData) => {
  try {
    const response = await api.post('/reports', reportData);
    return response.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Report submission failed'
    };
  }
};

/**
 * Updates report details (owner only).
 * @param {string} id - Report ID.
 * @param {Object} reportData - Fields to update.
 * @returns {Promise<Object>} API response payload.
 */
export const updateReport = async (id, reportData) => {
  try {
    const response = await api.put(`/reports/${id}`, reportData);
    return response.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Report update failed'
    };
  }
};

/**
 * Deletes a report (owner only).
 * @param {string} id - Report ID.
 * @returns {Promise<Object>} API response payload.
 */
export const deleteReport = async (id) => {
  try {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Report deletion failed'
    };
  }
};

/**
 * Updates status of a report.
 * @param {string} id - Report ID.
 * @param {string} status - New status string.
 * @returns {Promise<Object>} API response payload.
 */
export const updateStatus = async (id, status) => {
  try {
    const response = await api.patch(`/reports/${id}/status`, { status });
    return response.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Status update failed'
    };
  }
};

/**
 * Toggles user upvote on a report.
 * @param {string} id - Report ID.
 * @returns {Promise<Object>} API response payload.
 */
export const toggleUpvote = async (id) => {
  try {
    const response = await api.patch(`/reports/${id}/upvote`);
    return response.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Upvote action failed'
    };
  }
};

/**
 * Gets nearby reports by GPS coordinates and radius.
 * @param {number} latitude - Target latitude.
 * @param {number} longitude - Target longitude.
 * @param {number} distance - Radius distance in meters.
 * @param {string} category - Optional category filter.
 * @returns {Promise<Array>} Array of nearby report items.
 */
export const getReportsNear = async (latitude, longitude, distance = 50, category = '') => {
  try {
    const params = { near: `${latitude},${longitude}`, distance };
    if (category) params.category = category;
    const response = await api.get('/reports', { params });
    return response.data?.data || response.data || [];
  } catch (err) {
    console.error('getReportsNear error:', err.message);
    return [];
  }
};

/**
 * Gets active emergency road hazard SOS alerts.
 * @returns {Promise<Object>} API response payload with emergency alerts array.
 */
export const getEmergencyAlerts = async () => {
  try {
    const response = await api.get('/reports/alerts/emergency');
    return response.data;
  } catch (err) {
    return {
      success: false,
      data: [],
      message: err.response?.data?.message || err.message || 'Failed to fetch emergency alerts'
    };
  }
};

/**
 * Assigns a work order to a municipal engineer team with a 36h SLA deadline.
 * @param {string} id - Report ID.
 * @param {Object} data - { engineerName, department, hours }.
 */
export const assignWorkOrder = async (id, data = {}) => {
  try {
    const response = await api.patch(`/reports/${id}/assign-order`, data);
    return response.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Failed to assign work order'
    };
  }
};

/**
 * Resolves a report with verified Before vs After photo proof.
 * @param {string} id - Report ID.
 * @param {Object} data - { afterPhotoUri, resolverNotes, department }.
 */
export const resolveWithProof = async (id, data = {}) => {
  try {
    const response = await api.patch(`/reports/${id}/resolve-proof`, data);
    return response.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Failed to submit resolution proof'
    };
  }
};

export default {
  getReports,
  getMyReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  updateStatus,
  toggleUpvote,
  getReportsNear,
  getEmergencyAlerts,
  assignWorkOrder,
  resolveWithProof
};

