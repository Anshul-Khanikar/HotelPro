const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  roomNumber: { type: String, required: true },
  type: { type: String, required: true, enum: ['Single', 'Double', 'Deluxe', 'Suite'] },
  pricePerNight: { type: Number, required: true, min: 0 },
  capacity: { type: Number, required: true, min: 1 },
  amenities: [String],
  isAvailable: { type: Boolean, default: true },
  images: [String]
}, { timestamps: true });

roomSchema.index({ hotel: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);