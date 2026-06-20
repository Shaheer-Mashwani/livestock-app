// ── Load environment variables FIRST ─────────────────────────
// Must be called before anything else so process.env values are available
require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const connectDB    = require('./config/db');
const authRoutes   = require('./routes/authRoutes');
const farmerRoutes = require('./routes/farmerRoutes');

// ── Connect to MongoDB ────────────────────────────────────────
connectDB();

// ── Create Express app ────────────────────────────────────────
const app = express();

// ── Middleware ────────────────────────────────────────────────
// CORS: allows our React frontend (on port 3000) to call this API (on port 5000)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// express.json(): parses incoming JSON request bodies
// Without this, req.body would be undefined
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────
// All auth endpoints start with /api/auth
app.use('/api/auth', authRoutes);

// All farmer endpoints start with /api/farmers
app.use('/api/farmers', farmerRoutes);

// ── Health check route ────────────────────────────────────────
// Visit http://localhost:5000/api/health to confirm server is running
app.get('/api/health', (req, res) => {
  res.json({ status: '✅ Server is running', time: new Date().toISOString() });
});

// ── 404 handler for unknown routes ───────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Start the server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
