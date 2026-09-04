/**
 * @file authMiddleware.js
 * @description Middleware to verify JWT tokens on protected Express routes.
 * Ensures only authenticated users can access specific endpoints.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Express middleware to protect routes. Checks authorization header for valid JWT.
 * 
 * VIVA QUESTION: "Why JWT and not sessions?"
 * ANSWER: JSON Web Tokens (JWT) are stateless. Sessions require the server to store session state
 * in memory or a database (like Redis) and query it on every request. JWTs carry all the user data
 * encoded inside them, verified cryptographically using a server secret. This eliminates server-side
 * storage constraints, simplifies scaling, and allows cross-domain authentication easily.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {void} Calls next() on success or sends HTTP error code on failure.
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in the Authorization header (standard: Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from Bearer prefix
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify the token signature
      const JWT_SECRET = process.env.JWT_SECRET || 'roadreport_fallback_secret_key_12345';
      const decoded = jwt.verify(token, JWT_SECRET);

      // Find user in DB by ID stored in token (exclude password field for security)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found, authorization failed' });
      }

      // Allow request to proceed to the next handler/controller
      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
  }

  // If no token was found in the header
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
