const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

// @desc    Get all hotels with optional location & rating filter
// @route   GET /api/v1/hotels
// @access  Public
const getHotels = async (req, res) => {
  try {
    const { location, search, minRating } = req.query;
    let query = {};

    if (location && typeof location === 'string') {
      query.location = { $regex: escapeRegex(location.trim()), $options: 'i' };
    }
    if (search && typeof search === 'string') {
      const safeSearch = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { location: { $regex: safeSearch, $options: 'i' } },
        { address: { $regex: safeSearch, $options: 'i' } }
      ];
    }
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    const hotels = await Hotel.find(query).sort({ rating: -1 });

    // Fetch rooms for each hotel or provide count
    const hotelsWithRooms = await Promise.all(hotels.map(async (hotel) => {
      const rooms = await Room.find({ hotel: hotel._id });
      return {
        ...hotel.toObject(),
        rooms
      };
    }));

    res.status(200).json({
      success: true,
      count: hotelsWithRooms.length,
      data: hotelsWithRooms
    });
  } catch (error) {
    console.error('GetHotels error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving hotels', error: error.message });
  }
};

// @desc    Get single hotel by ID with its rooms
// @route   GET /api/v1/hotels/:id
// @access  Public
const getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const rooms = await Room.find({ hotel: hotel._id });

    res.status(200).json({
      success: true,
      data: {
        ...hotel.toObject(),
        rooms
      }
    });
  } catch (error) {
    console.error('GetHotelById error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid hotel ID format' });
    }
    res.status(500).json({ success: false, message: 'Server error retrieving hotel', error: error.message });
  }
};

// @desc    Create new hotel (Admin/Staff only)
// @route   POST /api/v1/hotels
// @access  Private (Admin/Staff)
const createHotel = async (req, res) => {
  try {
    const { name, description, location, address, rating, amenities, images } = req.body;

    if (!name || !description || !location || !address) {
      return res.status(400).json({ success: false, message: 'Please provide name, description, location and address' });
    }

    const hotel = await Hotel.create({
      name,
      description,
      location,
      address,
      rating: rating || 4.0,
      amenities: amenities || [],
      images: images || [],
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    console.error('CreateHotel error:', error);
    res.status(500).json({ success: false, message: 'Server error creating hotel', error: error.message });
  }
};

// @desc    Add room to hotel (Admin/Staff only)
// @route   POST /api/v1/hotels/:id/rooms
// @access  Private (Admin/Staff)
const addRoomToHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const { roomNumber, type, pricePerNight, capacity, amenities, images } = req.body;

    if (!roomNumber || !type || pricePerNight === undefined || !capacity) {
      return res.status(400).json({ success: false, message: 'Please provide roomNumber, type, pricePerNight and capacity' });
    }

    const room = await Room.create({
      hotel: hotel._id,
      roomNumber,
      type,
      pricePerNight,
      capacity,
      amenities: amenities || [],
      images: images || []
    });

    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('AddRoom error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Room number already exists for this hotel' });
    }
    res.status(500).json({ success: false, message: 'Server error adding room', error: error.message });
  }
};

module.exports = { getHotels, getHotelById, createHotel, addRoomToHotel };