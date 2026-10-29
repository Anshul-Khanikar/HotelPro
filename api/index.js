const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Ensure both local and root Mongoose instances are retrieved to prevent dual-instance desync
let mongoose;
try {
  mongoose = require('../server/node_modules/mongoose');
} catch (e) {
  mongoose = require('mongoose');
}

let rootMongoose = null;
try {
  rootMongoose = require('mongoose');
} catch (e) {}

const app = express();

app.use(express.json({ limit: '100kb' }));
app.use(cors({ origin: true, credentials: true }));

// Database connection caching for serverless environments
let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  const options = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  };

  cachedConnection = await mongoose.connect(MONGODB_URI, options);

  // Connect secondary root instance if present and distinct
  if (rootMongoose && rootMongoose !== mongoose && rootMongoose.connection.readyState === 0) {
    try {
      await rootMongoose.connect(MONGODB_URI, options);
    } catch (rootErr) {
      console.warn('Secondary mongoose connection notice:', rootErr.message);
    }
  }

  return cachedConnection;
};

// Ensure database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed: ' + err.message
    });
  }
});

// Mount Routes
app.use('/api/v1/auth', require('../server/src/routes/authRoutes'));
app.use('/api/v1/hotels', require('../server/src/routes/hotelRoutes'));
app.use('/api/v1/bookings', require('../server/src/routes/bookingRoutes'));

// Health check
app.get(['/health', '/api/v1/health', '/api/health'], (req, res) => {
  res.status(200).json({ status: 'OK', serverless: true, timestamp: new Date() });
});

// 404 handler for API routes
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

module.exports = app;