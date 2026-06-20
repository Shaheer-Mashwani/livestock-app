const express = require('express');
const router  = express.Router();

const { loginUser, getMe, seedUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/login  → login (public)
router.post('/login', loginUser);

// GET  /api/auth/me     → get my profile (must be logged in)
router.get('/me', protect, getMe);

// POST /api/auth/seed   → create default users (run once)
router.post('/seed', seedUsers);

module.exports = router;
