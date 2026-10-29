const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  location: { type: String, required: true, index: true },
  address: { type: String, required: true },
  rating: { type: Number, default: 4.0, min: 1, max: 5 },
  amenities: [String],
  images: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Hotel', hotelSchema);