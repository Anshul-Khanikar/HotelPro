const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '100kb' }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api/v1/auth', require('./src/routes/authRoutes'));
app.use('/api/v1/hotels', require('./src/routes/hotelRoutes'));
app.use('/api/v1/bookings', require('./src/routes/bookingRoutes'));

// Health check
const healthCheck = (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
};
app.get('/health', healthCheck);
app.get('/api/v1/health', healthCheck);

const path = require('path');
const fs = require('fs');

// Static frontend serving in production
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Database connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  process.env.MONGO_PRIVATE_URL ||
  'mongodb://localhost:27017/hotelpro';

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB successfully.');
      try {
        const Hotel = require('./src/models/Hotel');
        const count = await Hotel.countDocuments();
        if (count === 0) {
          console.log('Database empty, auto-seeding demo hotels and accounts...');
          const seedData = require('./src/seed');
          await seedData();
        }
      } catch (seedErr) {
        console.error('Auto-seed notice:', seedErr.message);
      }
      app.listen(PORT, () => {
        console.log(`HotelPro server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

module.exports = app;