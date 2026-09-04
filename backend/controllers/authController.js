/**
 * @file authController.js
 * @description Controllers managing User authentication logic (register, login, profile, perks, conversion).
 * Utilizes bcrypt for security and jsonwebtoken for token generation.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generates a signed JWT token containing the user's MongoDB ID.
 * @param {string} id - The MongoDB ID of the user.
 * @returns {string} Signed JSON Web Token string.
 */
const generateToken = (id) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'roadreport_fallback_secret_key_12345';
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * Registers a new user.
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, profileImage } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profileImage: profileImage || ''
    });

    if (user) {
      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          ward: user.ward || 'Ward 12 - Central Zone',
          reputationPoints: user.reputationPoints || 150,
          civicCredits: user.civicCredits || 250,
          streakCount: user.streakCount || 4,
          redeemedPerks: user.redeemedPerks || [],
          profileImage: user.profileImage,
          token: generateToken(user._id)
        }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid user data provided' });
    }
  } catch (error) {
    console.error('Registration Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

/**
 * Logins an existing user.
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      return res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          ward: user.ward || 'Ward 12 - Central Zone',
          reputationPoints: user.reputationPoints || 150,
          civicCredits: user.civicCredits || 250,
          streakCount: user.streakCount || 4,
          redeemedPerks: user.redeemedPerks || [],
          profileImage: user.profileImage,
          token: generateToken(user._id)
        }
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/**
 * Retrieves profile information for the authenticated user.
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        ward: user.ward || 'Ward 12 - Central Zone',
        reputationPoints: user.reputationPoints !== undefined ? user.reputationPoints : 150,
        civicCredits: user.civicCredits !== undefined ? user.civicCredits : 250,
        streakCount: user.streakCount || 4,
        redeemedPerks: user.redeemedPerks || [],
        profileImage: user.profileImage,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get Profile Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching user profile' });
  }
};

/**
 * Updates profile details for the authenticated user.
 */
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, phone, ward, profileImage } = req.body;
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (ward) user.ward = ward.trim();
    if (profileImage) user.profileImage = profileImage;

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        ward: updatedUser.ward,
        reputationPoints: updatedUser.reputationPoints,
        civicCredits: updatedUser.civicCredits,
        profileImage: updatedUser.profileImage,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

/**
 * Redeems a municipal perk using earned Civic Credits.
 */
const redeemPerk = async (req, res) => {
  try {
    const { perkId, title, cost } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const perkCost = parseInt(cost) || 50;
    const currentCredits = user.civicCredits !== undefined ? user.civicCredits : 250;

    if (currentCredits < perkCost) {
      return res.status(400).json({ success: false, message: `Insufficient Civic Credits. You need ${perkCost} CC.` });
    }

    const voucherCode = `CIVIC-${Math.floor(100000 + Math.random() * 900000)}`;
    user.civicCredits = currentCredits - perkCost;

    const redeemedItem = {
      perkId: perkId || 'perk_custom',
      title: title || 'Municipal Reward Voucher',
      voucherCode: voucherCode,
      creditsSpent: perkCost,
      redeemedAt: new Date()
    };

    if (!user.redeemedPerks) user.redeemedPerks = [];
    user.redeemedPerks.unshift(redeemedItem);

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Perk redeemed successfully!',
      data: {
        civicCredits: user.civicCredits,
        voucher: redeemedItem
      }
    });
  } catch (error) {
    console.error('Redeem Perk Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error redeeming perk' });
  }
};

/**
 * Converts user Karma / Reputation Points into Civic Credits (CC).
 * Rate: 5 Reputation Points = 1 Civic Credit (e.g. 50 points -> 10 CC).
 */
const convertPointsToCredits = async (req, res) => {
  try {
    const { pointsToConvert } = req.body;
    const pts = parseInt(pointsToConvert);

    if (isNaN(pts) || pts <= 0) {
      return res.status(400).json({ success: false, message: 'Please specify a valid number of Karma Points to convert.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentPts = user.reputationPoints !== undefined ? user.reputationPoints : 150;
    if (currentPts < pts) {
      return res.status(400).json({
        success: false,
        message: `Insufficient Karma Points. You have ${currentPts} points available.`
      });
    }

    if (pts < 5) {
      return res.status(400).json({ success: false, message: 'Minimum 5 Karma Points required for conversion.' });
    }

    // Rate: 5 Karma Points = 1 Civic Credit
    const creditsEarned = Math.floor(pts / 5);
    const actualPointsDeducted = creditsEarned * 5;

    if (creditsEarned <= 0) {
      return res.status(400).json({ success: false, message: 'Select at least 5 points to earn 1 Civic Credit.' });
    }

    user.reputationPoints = currentPts - actualPointsDeducted;
    user.civicCredits = (user.civicCredits !== undefined ? user.civicCredits : 250) + creditsEarned;

    await user.save();

    return res.status(200).json({
      success: true,
      message: `Successfully converted ${actualPointsDeducted} Karma Points into ${creditsEarned} Civic Credit(s)!`,
      data: {
        reputationPoints: user.reputationPoints,
        civicCredits: user.civicCredits,
        creditsEarned,
        pointsDeducted: actualPointsDeducted
      }
    });
  } catch (error) {
    console.error('Convert Points Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during point conversion' });
  }
};

/**
 * Gets top municipal ward citizens leaderboard.
 */
const getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find({})
      .select('name ward reputationPoints civicCredits profileImage')
      .sort({ reputationPoints: -1 })
      .limit(10);

    const demoLeaderboard = [
      { _id: 'ld1', name: 'Vikram Patel', ward: 'Ward 12 - Central Zone', reputationPoints: 480, civicCredits: 620, badge: '🏆 Mayor Gold Medalist' },
      { _id: 'ld2', name: 'Ananya Sharma', ward: 'Ward 14 - Science City', reputationPoints: 390, civicCredits: 510, badge: '🥈 Silver Sentinel' },
      { _id: 'ld3', name: 'Rajesh Mehta', ward: 'Ward 08 - SG Highway', reputationPoints: 340, civicCredits: 430, badge: '🥉 Bronze Warden' },
      { _id: 'ld4', name: 'Priya Joshi', ward: 'Ward 12 - Central Zone', reputationPoints: 290, civicCredits: 350, badge: '🛡️ Ward Captain' }
    ];

    const combinedList = [...topUsers.map(u => ({
      _id: u._id,
      name: u.name,
      ward: u.ward || 'Ward 12 - Central Zone',
      reputationPoints: u.reputationPoints !== undefined ? u.reputationPoints : 150,
      civicCredits: u.civicCredits !== undefined ? u.civicCredits : 250,
      isCurrentUser: u._id.toString() === req.user._id.toString()
    })), ...demoLeaderboard];

    const sortedList = combinedList
      .sort((a, b) => b.reputationPoints - a.reputationPoints)
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      data: sortedList
    });
  } catch (error) {
    console.error('Get Leaderboard Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving leaderboard' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  redeemPerk,
  convertPointsToCredits,
  getLeaderboard
};
