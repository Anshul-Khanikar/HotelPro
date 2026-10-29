const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const crypto = require('crypto');


// @desc    Create a new booking with overlap prevention
// @route   POST /api/v1/bookings
// @access  Private (Guest/Staff/Admin)
const createBooking = async (req, res) => {
  try {
    const { hotelId, roomId, checkInDate, checkOutDate, guestCount } = req.body;

    if (!hotelId || !roomId || !checkInDate || !checkOutDate || guestCount === undefined || guestCount === null || guestCount === '') {
      return res.status(400).json({ success: false, message: 'Please provide hotelId, roomId, checkInDate, checkOutDate, and guestCount' });
    }
    const parsedGuestCount = Number(guestCount);
    if (!Number.isInteger(parsedGuestCount) || parsedGuestCount < 1) {
      return res.status(400).json({ success: false, message: 'Guest count must be a positive whole number' });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid check-in or check-out date format' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDateOnly = new Date(checkIn);
    checkInDateOnly.setHours(0, 0, 0, 0);

    if (checkInDateOnly < today) {
      return res.status(400).json({ success: false, message: 'Check-in date cannot be in the past' });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({ success: false, message: 'Check-out date must be after check-in date' });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const room = await Room.findOne({ _id: roomId, hotel: hotelId });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found in this hotel' });
    }

    if (parsedGuestCount > room.capacity) {
      return res.status(400).json({ success: false, message: `Guest count exceeds room capacity (${room.capacity})` });
    }

    // Overlap check for existing active bookings. This check alone is not a
    // cross-request lock; production deployments must use a transaction-backed
    // reservation strategy before claiming race-safe inventory guarantees.
    const overlappingBooking = await Booking.findOne({
      room: roomId,
      status: { $in: ['confirmed', 'checked-in', 'pending'] },
      $or: [
        { checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Room is already booked for the selected dates. Please choose different dates or another room.'
      });
    }

    // Calculate total price based on nights
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalPrice = diffDays * room.pricePerNight;

    const bookingReference = 'HP-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const booking = await Booking.create({
      user: req.user._id,
      hotel: hotelId,
      room: roomId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guestCount,
      totalPrice,
      priceSnapshot: room.pricePerNight, // snapshot guard
      status: 'pending',
      paymentStatus: 'pending',
      bookingReference
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('hotel', 'name location address')
      .populate('room', 'roomNumber type pricePerNight')
      .populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      data: populatedBooking
    });
  } catch (error) {
    console.error('CreateBooking error:', error);
    res.status(500).json({ success: false, message: 'Server error creating booking', error: error.message });
  }
};

// @desc    Get all bookings for logged in user (or all for admin/staff)
// @route   GET /api/v1/bookings
// @access  Private
const getBookings = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'guest') {
      query.user = req.user._id;
    }

    const bookings = await Booking.find(query)
      .populate('hotel', 'name location address images')
      .populate('room', 'roomNumber type pricePerNight')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('GetBookings error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving bookings', error: error.message });
  }
};

// @desc    Get booking by ID
// @route   GET /api/v1/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('hotel', 'name location address images')
      .populate('room', 'roomNumber type pricePerNight')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check authorization (guests can only view their own bookings)
    if (req.user.role === 'guest' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('GetBookingById error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid booking ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error retrieving booking', error: error.message });
  }
};

// @desc    Update booking status (cancel, checked-in, checked-out)
// @route   PUT /api/v1/bookings/:id/status
// @access  Private
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'checked-in', 'checked-out', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid booking status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Guests can only cancel their own bookings
    if (req.user.role === 'guest') {
      if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ success: false, message: 'Guests can only cancel bookings' });
      }
    }

    // Enforce the booking lifecycle; never permit terminal states to be reopened.
    const transitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['checked-in', 'cancelled'],
      'checked-in': ['checked-out'],
      'checked-out': [],
      cancelled: []
    };
    if (!transitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change booking status from '${booking.status}' to '${status}'`
      });
    }

    booking.status = status;
    // A cancellation is not proof that money was captured or refunded. Keep
    // pending payments pending; only mark a previously paid booking refunded
    // once a real payment provider confirms the refund.
    if (status === 'cancelled' && booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
    }
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('hotel', 'name location address images')
      .populate('room', 'roomNumber type pricePerNight')
      .populate('user', 'name email phone');

    res.status(200).json({
      success: true,
      data: populated
    });
  } catch (error) {
    console.error('UpdateBookingStatus error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid booking ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error updating booking status' });
  }
};

module.exports = { createBooking, getBookings, getBookingById, updateBookingStatus };