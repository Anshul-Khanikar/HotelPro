// HotelPro's lightweight demo API for Vercel.
// This deliberately avoids a hosted database so the demo can be deployed with
// no external setup. Data is in-memory and can reset whenever Vercel cold-starts
// a function; do not use this mode for real reservations or sensitive data.
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(cors({ origin: true, credentials: true }));

const DEMO_JWT_SECRET = process.env.JWT_SECRET || 'hotelpro-demo-only-secret-change-before-production-2026';
const id = (value) => value || crypto.randomBytes(12).toString('hex');

const hotels = [
  {
    _id: 'hotel-grand-luxury',
    name: 'Grand Luxury Hotel & Spa',
    description: 'Experience 5-star luxury in the heart of the city with world-class amenities and exceptional service.',
    location: 'New York',
    address: '123 Broadway, New York, NY 10001',
    rating: 4.8,
    amenities: ['Free Wi-Fi', 'Swimming Pool', 'Spa & Wellness', 'Fine Dining', 'Valet Parking', 'Fitness Center'],
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'],
    rooms: [
      { _id: 'room-grand-101', roomNumber: '101', type: 'Deluxe', pricePerNight: 250, capacity: 2, amenities: ['King Bed', 'City View', 'Minibar', 'Smart TV', 'Ensuite Bathroom'], isAvailable: true, images: [] },
      { _id: 'room-grand-202', roomNumber: '202', type: 'Suite', pricePerNight: 450, capacity: 4, amenities: ['Master King Bed', 'Living Room', 'Jacuzzi', 'Balcony', 'Ocean View'], isAvailable: true, images: [] }
    ]
  },
  {
    _id: 'hotel-seaside-paradise',
    name: 'Seaside Paradise Resort',
    description: 'Relax on pristine white-sand beaches with breathtaking ocean views and private beach access.',
    location: 'Miami',
    address: '456 Ocean Drive, Miami Beach, FL 33139',
    rating: 4.6,
    amenities: ['Beachfront', 'Outdoor Pool', 'Bar & Lounge', 'Water Sports', 'Free Breakfast', 'Room Service'],
    images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'],
    rooms: [
      { _id: 'room-seaside-a1', roomNumber: 'A1', type: 'Double', pricePerNight: 180, capacity: 2, amenities: ['Queen Bed', 'Pool View', 'Balcony', 'Coffee Maker'], isAvailable: true, images: [] },
      { _id: 'room-seaside-b3', roomNumber: 'B3', type: 'Suite', pricePerNight: 380, capacity: 5, amenities: ['Two King Beds', 'Sea View', 'Kitchenette', 'Private Patio'], isAvailable: true, images: [] }
    ]
  }
];

const users = [
  { _id: 'demo-admin', name: 'Admin User', email: 'admin@hotelpro.com', password: 'password123', role: 'admin', phone: '1234567890' },
  { _id: 'demo-staff', name: 'Staff Member', email: 'staff@hotelpro.com', password: 'password123', role: 'staff', phone: '0987654321' },
  { _id: 'demo-guest', name: 'Guest User', email: 'guest@hotelpro.com', password: 'password123', role: 'guest', phone: '5551234567' }
];
const bookings = [];

const publicUser = ({ password, ...user }) => ({ ...user, id: user._id });
const tokenFor = (user) => jwt.sign({ id: user._id }, DEMO_JWT_SECRET, { expiresIn: '7d' });
const auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
  try {
    const payload = jwt.verify(token, DEMO_JWT_SECRET);
    const user = users.find((item) => item._id === payload.id);
    if (!user) return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
    req.user = user;
    next();
  } catch (_) {
    return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
  }
};
const roles = (...allowed) => (req, res, next) => {
  if (!allowed.includes(req.user.role)) return res.status(403).json({ success: false, message: 'You do not have permission to do that.' });
  next();
};
const findHotel = (hotelId) => hotels.find((hotel) => hotel._id === hotelId);
const findRoom = (hotelId, roomId) => findHotel(hotelId)?.rooms.find((room) => room._id === roomId);
const populatedBooking = (booking) => ({
  ...booking,
  hotel: (() => { const h = findHotel(booking.hotelId); return h ? { _id: h._id, name: h.name, location: h.location, address: h.address, images: h.images } : null; })(),
  room: (() => { const r = findRoom(booking.hotelId, booking.roomId); return r ? { _id: r._id, roomNumber: r.roomNumber, type: r.type, pricePerNight: r.pricePerNight } : null; })(),
  user: (() => { const u = users.find((item) => item._id === booking.userId); return u ? { _id: u._id, name: u.name, email: u.email, phone: u.phone } : null; })()
});

app.get(['/health', '/api/health', '/api/v1/health'], (_req, res) => res.status(200).json({ status: 'OK', demo: true, timestamp: new Date().toISOString() }));

app.post('/api/v1/auth/register', (req, res) => {
  const { name, email, password, phone = '' } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Please provide name, email and password.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  if (String(password).length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  if (users.some((user) => user.email.toLowerCase() === String(email).toLowerCase())) return res.status(400).json({ success: false, message: 'User already exists with this email.' });
  const user = { _id: id(), name: String(name).trim(), email: String(email).trim().toLowerCase(), password: String(password), role: 'guest', phone: String(phone) };
  users.push(user);
  res.status(201).json({ success: true, token: tokenFor(user), user: publicUser(user) });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find((item) => item.email.toLowerCase() === String(email || '').toLowerCase() && item.password === String(password || ''));
  if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  res.json({ success: true, token: tokenFor(user), user: publicUser(user) });
});
app.get('/api/v1/auth/me', auth, (req, res) => res.json({ success: true, user: publicUser(req.user) }));

app.get('/api/v1/hotels', (req, res) => {
  const { location, search, minRating } = req.query;
  const term = String(search || '').toLowerCase();
  const place = String(location || '').toLowerCase();
  const result = hotels.filter((hotel) =>
    (!place || hotel.location.toLowerCase().includes(place)) &&
    (!term || `${hotel.name} ${hotel.location} ${hotel.address} ${hotel.description}`.toLowerCase().includes(term)) &&
    (!minRating || hotel.rating >= Number(minRating))
  ).sort((a, b) => b.rating - a.rating);
  res.json({ success: true, count: result.length, data: result });
});
app.get('/api/v1/hotels/:id', (req, res) => {
  const hotel = findHotel(req.params.id);
  if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found.' });
  res.json({ success: true, data: hotel });
});
app.post('/api/v1/hotels', auth, roles('admin'), (req, res) => {
  const { name, description, location, address, rating = 4, amenities = [], images = [] } = req.body || {};
  if (!name || !description || !location || !address) return res.status(400).json({ success: false, message: 'Please provide name, description, location and address.' });
  const hotel = { _id: id(), name, description, location, address, rating: Number(rating), amenities, images, rooms: [] };
  hotels.push(hotel);
  res.status(201).json({ success: true, data: hotel });
});
app.post('/api/v1/hotels/:id/rooms', auth, roles('admin', 'staff'), (req, res) => {
  const hotel = findHotel(req.params.id);
  if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found.' });
  const { roomNumber, type, pricePerNight, capacity, amenities = [], images = [] } = req.body || {};
  if (!roomNumber || !type || pricePerNight === undefined || !capacity) return res.status(400).json({ success: false, message: 'Please provide roomNumber, type, pricePerNight and capacity.' });
  if (hotel.rooms.some((room) => room.roomNumber === String(roomNumber))) return res.status(400).json({ success: false, message: 'Room number already exists for this hotel.' });
  const room = { _id: id(), roomNumber: String(roomNumber), type, pricePerNight: Number(pricePerNight), capacity: Number(capacity), amenities, images, isAvailable: true };
  hotel.rooms.push(room);
  res.status(201).json({ success: true, data: room });
});

app.post('/api/v1/bookings', auth, (req, res) => {
  const { hotelId, roomId, checkInDate, checkOutDate, guestCount } = req.body || {};
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const guests = Number(guestCount);
  if (!hotelId || !roomId || !checkInDate || !checkOutDate || !Number.isInteger(guests) || guests < 1) return res.status(400).json({ success: false, message: 'Please provide hotel, room, valid dates and guest count.' });
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) return res.status(400).json({ success: false, message: 'Check-out date must be after check-in date.' });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const checkInDay = new Date(checkIn); checkInDay.setHours(0, 0, 0, 0);
  if (checkInDay < today) return res.status(400).json({ success: false, message: 'Check-in date cannot be in the past.' });
  const hotel = findHotel(hotelId);
  const room = findRoom(hotelId, roomId);
  if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found.' });
  if (!room) return res.status(404).json({ success: false, message: 'Room not found in this hotel.' });
  if (guests > room.capacity) return res.status(400).json({ success: false, message: `Guest count exceeds room capacity (${room.capacity}).` });
  const overlap = bookings.some((booking) => booking.roomId === roomId && ['confirmed', 'checked-in', 'pending'].includes(booking.status) && new Date(booking.checkInDate) < checkOut && new Date(booking.checkOutDate) > checkIn);
  if (overlap) return res.status(400).json({ success: false, message: 'Room is already booked for the selected dates. Please choose different dates or another room.' });
  const nights = Math.ceil((checkOut - checkIn) / 86400000);
  const booking = { _id: id(), userId: req.user._id, hotelId, roomId, checkInDate: checkIn.toISOString(), checkOutDate: checkOut.toISOString(), guestCount: guests, totalPrice: nights * room.pricePerNight, priceSnapshot: room.pricePerNight, status: 'pending', paymentStatus: 'pending', bookingReference: `HP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, createdAt: new Date().toISOString() };
  bookings.push(booking);
  res.status(201).json({ success: true, data: populatedBooking(booking) });
});
app.get('/api/v1/bookings', auth, (req, res) => {
  const result = bookings.filter((booking) => req.user.role !== 'guest' || booking.userId === req.user._id).slice().reverse().map(populatedBooking);
  res.json({ success: true, count: result.length, data: result });
});
app.get('/api/v1/bookings/:id', auth, (req, res) => {
  const booking = bookings.find((item) => item._id === req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  if (req.user.role === 'guest' && booking.userId !== req.user._id) return res.status(403).json({ success: false, message: 'Not authorized to view this booking.' });
  res.json({ success: true, data: populatedBooking(booking) });
});
app.put('/api/v1/bookings/:id/status', auth, (req, res) => {
  const booking = bookings.find((item) => item._id === req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  const { status } = req.body || {};
  if (req.user.role === 'guest' && (booking.userId !== req.user._id || status !== 'cancelled')) return res.status(403).json({ success: false, message: 'Guests can only cancel their own bookings.' });
  if (!['confirmed', 'checked-in', 'checked-out', 'cancelled'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid booking status.' });
  const transitions = { pending: ['confirmed', 'cancelled'], confirmed: ['checked-in', 'cancelled'], 'checked-in': ['checked-out'], 'checked-out': [], cancelled: [] };
  if (!transitions[booking.status]?.includes(status)) return res.status(400).json({ success: false, message: `Cannot change booking status from '${booking.status}' to '${status}'.` });
  booking.status = status;
  res.json({ success: true, data: populatedBooking(booking) });
});

app.use('/api/v1', (_req, res) => res.status(404).json({ success: false, message: 'API route not found.' }));
app.use((err, _req, res, _next) => {
  console.error('HotelPro demo API error:', err);
  res.status(500).json({ success: false, message: 'Unexpected demo API error.' });
});

module.exports = app;
