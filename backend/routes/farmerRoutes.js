const express = require('express');
const router  = express.Router();

const {
  createFarmer,
  getFarmers,
  getDashboardStats,
  getFarmerById,
  updateFarmer,
  deleteFarmer,
} = require('../controllers/farmerController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All routes below require login (protect middleware runs first)

// GET  /api/farmers/stats → dashboard stats (all roles)
router.get('/stats', protect, getDashboardStats);

// GET  /api/farmers       → list with filters (all roles)
// POST /api/farmers       → create new (operator + manager only)
router.route('/')
  .get(protect, getFarmers)
  .post(protect, authorize('operator', 'manager'), createFarmer);

// GET    /api/farmers/:id → single record
// PUT    /api/farmers/:id → update (operator + manager)
// DELETE /api/farmers/:id → delete (manager only)
router.route('/:id')
  .get(protect, getFarmerById)
  .put(protect, authorize('operator', 'manager'), updateFarmer)
  .delete(protect, authorize('manager'), deleteFarmer);

module.exports = router;
