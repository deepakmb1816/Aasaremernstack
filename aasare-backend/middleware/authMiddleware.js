const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, 'aasare_secret_key'); // 🔐 Use env variable in production

      // Fetch user without password field
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ error: 'User not found. Authorization failed.' });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('JWT verification failed:', error.message);
      return res.status(401).json({ error: 'Not authorized, invalid token' });
    }
  } else {
    return res.status(401).json({ error: 'Not authorized, token missing' });
  }
};

module.exports = protect;
