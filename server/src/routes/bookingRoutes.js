const express = require('express');
const router = express.Router();
const { createBooking, getBookings, getBookingById, updateBookingStatus } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getBookings)
  .post(protect, createBooking);

router.route('/:id')
  .get(protect, getBookingById);

router.route('/:id/status')
  .put(protect, updateBookingStatus);

module.exports = router;