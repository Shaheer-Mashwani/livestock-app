const Farmer = require('../models/Farmer');

// ── @route   POST /api/farmers ───────────────────────────────
// @desc    Save a new farmer record (operator submits form)
// @access  Private — operator and manager only
const createFarmer = async (req, res) => {
  try {
    const data = req.body;

    // Calculate totals on the server side (never trust the client)
    const cowTotal  = (data.livestock?.cows?.milking      || 0)
                    + (data.livestock?.cows?.dry           || 0)
                    + (data.livestock?.cows?.youngOnes     || 0);

    const bufTotal  = (data.livestock?.buffaloes?.milking  || 0)
                    + (data.livestock?.buffaloes?.dry       || 0)
                    + (data.livestock?.buffaloes?.youngOnes || 0);

    const milkTotal = (data.livestock?.cows?.dailyMilk     || 0)
                    + (data.livestock?.buffaloes?.dailyMilk || 0);

    // Add computed totals and the logged-in user's ID
    data.livestock.totalAnimals   = cowTotal + bufTotal;
    data.livestock.totalDailyMilk = milkTotal;
    data.enteredBy                = req.user._id;

    // Create and save the farmer document
    const farmer = await Farmer.create(data);

    res.status(201).json({
      message: '✅ Farmer registered successfully',
      farmer,
    });
  } catch (error) {
    // Print full error in backend terminal so we can debug
    console.error('❌ createFarmer error:', error);

    // Handle duplicate CNIC error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'CNIC already registered' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── @route   GET /api/farmers ────────────────────────────────
// @desc    Get all farmers with optional filters (for dashboard table)
// @access  Private — all roles
const getFarmers = async (req, res) => {
  try {
    // Read filter values from query string
    // Example: /api/farmers?district=Peshawar&educationLevel=Matric
    const {
      district,
      educationLevel,
      minAnimals,
      maxAnimals,
      minMilk,
      maxMilk,
      minFarmArea,
      maxFarmArea,
      solar,
      chopper,
      milkChiller,
      milkingMachine,
      page  = 1,
      limit = 10,
    } = req.query;

    // Build a filter object — only add conditions that were provided
    const filter = {};

    if (district)      filter.district       = district;
    if (educationLevel) filter.educationLevel = educationLevel;

    // Range filters use $gte (>=) and $lte (<=) operators
    if (minAnimals || maxAnimals) {
      filter['livestock.totalAnimals'] = {};
      if (minAnimals) filter['livestock.totalAnimals'].$gte = Number(minAnimals);
      if (maxAnimals) filter['livestock.totalAnimals'].$lte = Number(maxAnimals);
    }

    if (minMilk || maxMilk) {
      filter['livestock.totalDailyMilk'] = {};
      if (minMilk) filter['livestock.totalDailyMilk'].$gte = Number(minMilk);
      if (maxMilk) filter['livestock.totalDailyMilk'].$lte = Number(maxMilk);
    }

    if (minFarmArea || maxFarmArea) {
      filter['farm.area'] = {};
      if (minFarmArea) filter['farm.area'].$gte = Number(minFarmArea);
      if (maxFarmArea) filter['farm.area'].$lte = Number(maxFarmArea);
    }

    // Machinery filters — only add if explicitly set to 'true'
    if (solar          === 'true') filter['machinery.solar']          = true;
    if (chopper        === 'true') filter['machinery.chopper']        = true;
    if (milkChiller    === 'true') filter['machinery.milkChiller']    = true;
    if (milkingMachine === 'true') filter['machinery.milkingMachine'] = true;

    // Pagination: skip = how many to skip, limit = how many to return
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Farmer.countDocuments(filter);

    const farmers = await Farmer.find(filter)
      .sort({ createdAt: -1 })      // newest first
      .skip(skip)
      .limit(Number(limit))
      .populate('enteredBy', 'username fullName'); // join with User collection

    res.json({
      farmers,
      pagination: {
        total,
        page:       Number(page),
        pages:      Math.ceil(total / Number(limit)),
        limit:      Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── @route   GET /api/farmers/stats ─────────────────────────
// @desc    Get aggregated stats for dashboard cards and charts
// @access  Private — all roles
const getDashboardStats = async (req, res) => {
  try {
    // MongoDB aggregation pipeline — powerful way to calculate stats
    const stats = await Farmer.aggregate([
      {
        // $group with _id: null means "group ALL documents together"
        $group: {
          _id:              null,
          totalFarmers:     { $sum: 1 },
          totalAnimals:     { $sum: '$livestock.totalAnimals' },
          totalDailyMilk:   { $sum: '$livestock.totalDailyMilk' },
          avgAnimals:       { $avg: '$livestock.totalAnimals' },
          avgMilk:          { $avg: '$livestock.totalDailyMilk' },
          // Count machinery adoption
          solarCount:         { $sum: { $cond: ['$machinery.solar',          1, 0] } },
          chopperCount:       { $sum: { $cond: ['$machinery.chopper',        1, 0] } },
          milkChillerCount:   { $sum: { $cond: ['$machinery.milkChiller',    1, 0] } },
          milkingMachineCount:{ $sum: { $cond: ['$machinery.milkingMachine', 1, 0] } },
        },
      },
    ]);

    // Farmers grouped by district
    const byDistrict = await Farmer.aggregate([
      { $group: { _id: '$district', count: { $sum: 1 } } },
      { $sort:  { count: -1 } }, // sort by most farmers first
    ]);

    // Farmers grouped by education level
    const byEducation = await Farmer.aggregate([
      { $group: { _id: '$educationLevel', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]);

    // Farmers grouped by animal count range
    const byAnimalRange = await Farmer.aggregate([
      {
        $bucket: {
          groupBy: '$livestock.totalAnimals',
          boundaries: [0, 6, 11, 21, 1000], // 0-5, 6-10, 11-20, 20+
          default: 'Other',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    // Count distinct districts
    const districts = await Farmer.distinct('district');

    res.json({
      summary:      stats[0] || {},
      byDistrict,
      byEducation,
      byAnimalRange,
      totalDistricts: districts.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── @route   GET /api/farmers/:id ────────────────────────────
// @desc    Get single farmer by ID
// @access  Private
const getFarmerById = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id).populate('enteredBy', 'username fullName');
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    res.json(farmer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── @route   PUT /api/farmers/:id ────────────────────────────
// @desc    Update farmer record
// @access  Private — operator and manager only
const updateFarmer = async (req, res) => {
  try {
    const farmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // return updated doc, run schema validators
    );
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    res.json({ message: '✅ Updated successfully', farmer });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── @route   DELETE /api/farmers/:id ─────────────────────────
// @desc    Delete farmer record
// @access  Private — manager only
const deleteFarmer = async (req, res) => {
  try {
    const farmer = await Farmer.findByIdAndDelete(req.params.id);
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    res.json({ message: '✅ Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createFarmer,
  getFarmers,
  getDashboardStats,
  getFarmerById,
  updateFarmer,
  deleteFarmer,
};