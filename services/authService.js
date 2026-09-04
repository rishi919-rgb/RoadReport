/**
 * @file authService.js
 * @description Services managing authentication API requests.
 * Encapsulates network operations using the api axios client.
 */

import api from './api';

/**
 * Sends a registration request to the backend.
 * @param {string} name - Name of the user.
 * @param {string} email - Email address of the user.
 * @param {string} password - Password of the user.
 * @returns {Promise<Object>} Backend API response data.
 */
export const register = async (name, email, password) => {
  try {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Registration request failed'
    };
  }
};

/**
 * Sends a login request to the backend.
 * @param {string} email - Email address of the user.
 * @param {string} password - Password of the user.
 * @returns {Promise<Object>} Backend API response data.
 */
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Login request failed'
    };
  }
};

/**
 * Retrieves the profile of the currently logged-in user.
 * @returns {Promise<Object>} Backend API response data containing user object.
 */
export const getProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Profile fetch failed'
    };
  }
};

/**
 * Updates profile details for the authenticated user.
 * @param {Object} profileData - Data object containing name, phone, ward.
 * @returns {Promise<Object>} Backend API response data.
 */
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Profile update failed'
    };
  }
};

/**
 * Redeems a municipal perk using Civic Credits.
 * @param {Object} perkData - Perk details (perkId, title, cost).
 * @returns {Promise<Object>} API response payload.
 */
export const redeemPerk = async (perkData) => {
  try {
    const response = await api.post('/auth/redeem-perk', perkData);
    return response.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Perk redemption failed'
    };
  }
};

/**
 * Retrieves the municipal ward leaderboard rankings.
 * @returns {Promise<Object>} API response payload.
 */
export const getLeaderboard = async () => {
  try {
    const response = await api.get('/auth/leaderboard');
    return response.data;
  } catch (err) {
    return {
      success: false,
      data: [],
      message: err.response?.data?.message || err.message || 'Leaderboard fetch failed'
    };
  }
};

/**
 * Converts user Karma / Reputation Points into Civic Credits (CC).
 * @param {number} pointsToConvert - Number of points to convert.
 * @returns {Promise<Object>} API response payload.
 */
export const convertPoints = async (pointsToConvert) => {
  try {
    const response = await api.post('/auth/convert-points', { pointsToConvert });
    return response.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Points conversion failed'
    };
  }
};

export default {
  register,
  login,
  getProfile,
  updateProfile,
  redeemPerk,
  getLeaderboard,
  convertPoints
};
