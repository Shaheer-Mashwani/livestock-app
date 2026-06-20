const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── Helper: generate a JWT token ─────────────────────────────
// JWT = JSON Web Token — a signed string that proves who you are
// It contains the user's ID and expires after 7 days
const generateToken = (id) => {
  return jwt.sign(
    { id },                          // payload: what's inside the token
    process.env.JWT_SECRET,          // secret key to sign it
    { expiresIn: '7d' }              // expiry
  );
};

// ── @route   POST /api/auth/login ────────────────────────────
// @desc    Login user and return token
// @access  Public (no auth required)
const loginUser = async (req, res) => {
  // Destructure username and password from request body
  const { username, password } = req.body;

  try {
    // Find user in database by username
    const user = await User.findOne({ username });

    // If user not found OR password doesn't match → reject
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // If everything is correct → send back user info + token
    res.json({
      _id:      user._id,
      username: user.username,
      fullName: user.fullName,
      role:     user.role,
      token:    generateToken(user._id), // this token is sent to frontend
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── @route   GET /api/auth/me ────────────────────────────────
// @desc    Get current logged-in user's profile
// @access  Private (requires token)
const getMe = async (req, res) => {
  // req.user is attached by our protect middleware
  res.json({
    _id:      req.user._id,
    username: req.user.username,
    fullName: req.user.fullName,
    role:     req.user.role,
  });
};

// ── @route   POST /api/auth/seed ─────────────────────────────
// @desc    Create default users (run once to set up the system)
// @access  Public (only for initial setup)
const seedUsers = async (req, res) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      return res.json({ message: 'Users already exist' });
    }

    // ✅ Create one by one so pre('save') hook runs for each
    await User.create({ username: 'operator', password: '1234', role: 'operator', fullName: 'Data Operator' });
    await User.create({ username: 'manager',  password: '1234', role: 'manager',  fullName: 'District Manager' });
    await User.create({ username: 'viewer',   password: '1234', role: 'viewer',   fullName: 'Dashboard Viewer' });

    res.json({ message: '✅ Default users created successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: 'Seed error', error: error.message });
  }
};

module.exports = { loginUser, getMe, seedUsers };
