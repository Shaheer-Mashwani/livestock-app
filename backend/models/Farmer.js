const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    // ── Section 1: Personal Info ─────────────────────────────
    serialNumber: {
      type: String,
      unique: true, // auto-generated, no duplicates
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    fatherHusbandName: {
      type: String,
      required: [true, 'Father/Husband name is required'],
      trim: true,
    },
    cnic: {
      type: String,
      required: [true, 'CNIC is required'],
      unique: true,
      trim: true,
    },
    dateOfBirth: { type: String },
    contactNo1: {
      type: String,
      required: [true, 'Contact number is required'],
    },
    contactNo2: { type: String },

    // ── Section 2: Background ────────────────────────────────
    // FILTER 1: Education Level
    educationLevel: {
      type: String,
      required: [true, 'Education level is required'],
      enum: [
        'Illiterate',
        'Primary (Class 1–5)',
        'Middle (Class 6–8)',
        'Matric (Class 9–10)',
        'Intermediate (FA/FSc)',
        "Bachelor's",
        "Master's or above",
      ],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: true,
    },
    experience: { type: String },

    // ── Section 3: Location ──────────────────────────────────
    // FILTER 2: Location
    district: {
      type: String,
      required: [true, 'District is required'],
    },
    tehsil:        { type: String },
    unionCouncil:  { type: String },
    farmAddress:   { type: String, required: true },
    gpsLocation:   { type: String },

    // ── Section 4: Livestock ─────────────────────────────────
    // FILTER 3: Number of Animals + Filter 4: Production Status
    livestock: {
      cows: {
        milking:  { type: Number, default: 0 },
        dailyMilk:{ type: Number, default: 0 }, // litres/day — production status
        dry:      { type: Number, default: 0 },
        youngOnes:{ type: Number, default: 0 },
      },
      buffaloes: {
        milking:  { type: Number, default: 0 },
        dailyMilk:{ type: Number, default: 0 },
        dry:      { type: Number, default: 0 },
        youngOnes:{ type: Number, default: 0 },
      },
      // Computed totals stored for fast filtering
      totalAnimals:    { type: Number, default: 0 }, // FILTER 3
      totalDailyMilk:  { type: Number, default: 0 }, // FILTER 4
    },

    // ── Section 5: Farm Details ──────────────────────────────
    // FILTER 5: Farm Area
    farm: {
      area:          { type: Number, default: 0 },   // FILTER 5
      areaUnit:      { type: String, default: 'Acres' },
      ownership:     { type: String }, // Owned / Leased / Other
      housingType:   { type: String }, // Pacca / Semi-Pacca / Katcha
      shadeLength:   { type: Number, default: 0 },
      shadeWidth:    { type: Number, default: 0 },
      waterSource:   { type: String },
      electricity:   { type: String },
    },

    // ── Section 6: Machinery ─────────────────────────────────
    // FILTER 6: Farm Machinery (all boolean — yes/no)
    machinery: {
      solar:          { type: Boolean, default: false },
      chopper:        { type: Boolean, default: false },
      milkChiller:    { type: Boolean, default: false },
      milkingMachine: { type: Boolean, default: false },
    },

    // ── Application Info ─────────────────────────────────────
    applicationType: { type: String },
    notes:           { type: String },

    // Who entered this record
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId, // reference to User collection
      ref: 'User',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// ── AUTO-GENERATE SERIAL NUMBER before saving ─────────────────
// This runs before every new document is saved
// NOTE: In async functions, mongoose does NOT need next() —
// it just waits for the promise to resolve. Calling next() in an
// async pre-hook can cause "next is not a function" errors.
farmerSchema.pre('save', async function () {
  if (!this.serialNumber) {
    // Count how many farmers exist, then add 1
    const count = await mongoose.model('Farmer').countDocuments();
    // Format: LDD-2024-0001
    const year = new Date().getFullYear();
    this.serialNumber = `LDD-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  // No next() call needed — async function resolving is enough
});

module.exports = mongoose.model('Farmer', farmerSchema);