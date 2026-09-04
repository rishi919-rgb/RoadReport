/**
 * @file authRoutes.js
 * @description Defines Express routes for user authentication.
 * Binds endpoints to the auth controller handlers and configures JWT protection.
 */

const express = require('express');
const { registerUser, loginUser, getUserProfile, updateUserProfile, redeemPerk, getLeaderboard, convertPointsToCredits } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes for user registration and login
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/redeem-perk', protect, redeemPerk);
router.post('/convert-points', protect, convertPointsToCredits);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
