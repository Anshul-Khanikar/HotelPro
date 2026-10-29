const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  guestCount: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true, min: 0 },
  priceSnapshot: { type: Number, required: true }, // guards against future price updates
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'], 
    default: 'confirmed' 
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  bookingReference: { type: String, required: true, unique: true }
}, { timestamps: true });

// Index for checking date overlaps efficiently
bookingSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);