const express = require('express');
const router = express.Router();
const { getHotels, getHotelById, createHotel, addRoomToHotel } = require('../controllers/hotelController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getHotels)
  .post(protect, authorize('admin', 'staff'), createHotel);

router.route('/:id')
  .get(getHotelById);

router.route('/:id/rooms')
  .post(protect, authorize('admin', 'staff'), addRoomToHotel);

module.exports = router;