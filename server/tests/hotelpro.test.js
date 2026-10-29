const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
process.env.JWT_SECRET = 'hotelpro-test-secret-that-is-at-least-32-characters';
const app = require('../server');
const User = require('../src/models/User');
const Hotel = require('../src/models/Hotel');
const Room = require('../src/models/Room');
const Booking = require('../src/models/Booking');

describe('HotelPro API Integration Tests', () => {
  let mongoServer;
  let authToken;
  let testHotelId;
  let testRoomId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Hotel.deleteMany({});
    await Room.deleteMany({});
    await Booking.deleteMany({});

    // Register user & login to get token
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'test@hotelpro.com',
        password: 'password123',
        role: 'guest'
      });

    authToken = regRes.body.token;

    // Create a test hotel & room
    const hotel = await Hotel.create({
      name: 'Test Hotel',
      description: 'A test hotel',
      location: 'Test City',
      address: '123 Test St'
    });
    testHotelId = hotel._id;

    const room = await Room.create({
      hotel: testHotelId,
      roomNumber: 'T101',
      type: 'Deluxe',
      pricePerNight: 100,
      capacity: 2
    });
    testRoomId = room._id;
  });

  test('GET /health should return status OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('OK');
  });

  test('POST /api/v1/auth/register should create a user and return token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Another User',
        email: 'another@hotelpro.com',
        password: 'password123'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test('GET /api/v1/hotels should retrieve hotels list', async () => {
    const res = await request(app).get('/api/v1/hotels');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  test('POST /api/v1/bookings should create a booking successfully', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 2);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 5);

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hotelId: testHotelId,
        roomId: testRoomId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        guestCount: 2
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingReference).toBeDefined();
    expect(res.body.data.totalPrice).toEqual(300); // 3 nights * 100
  });

  test('POST /api/v1/bookings should prevent overlapping double-bookings', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 2);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 5);

    // First booking
    await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hotelId: testHotelId,
        roomId: testRoomId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        guestCount: 2
      });

    // Overlapping second booking
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hotelId: testHotelId,
        roomId: testRoomId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        guestCount: 1
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already booked');
  });

  test('POST /api/v1/auth/register should prevent privilege escalation and always enforce guest role', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Hacker User',
        email: 'hacker@hotelpro.com',
        password: 'password123',
        role: 'admin' // Attempting privilege escalation
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toEqual('guest'); // Must be guest
  });

  test('POST /api/v1/auth/login should authenticate valid user and reject invalid password', async () => {
    const validRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@hotelpro.com',
        password: 'password123'
      });
    expect(validRes.statusCode).toEqual(200);
    expect(validRes.body.token).toBeDefined();

    const invalidRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@hotelpro.com',
        password: 'wrongpassword'
      });
    expect(invalidRes.statusCode).toEqual(401);
    expect(invalidRes.body.success).toBe(false);
  });

  test('GET /api/v1/hotels should handle search queries with special regex characters safely', async () => {
    const res = await request(app).get('/api/v1/hotels?search=(');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /api/v1/bookings should reject invalid date strings, past dates, and invalid range', async () => {
    // Invalid date string
    const invalidFormatRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hotelId: testHotelId,
        roomId: testRoomId,
        checkInDate: 'not-a-date',
        checkOutDate: 'not-a-date',
        guestCount: 1
      });
    expect(invalidFormatRes.statusCode).toEqual(400);
    expect(invalidFormatRes.body.message).toContain('Invalid check-in or check-out date format');

    // Past date
    const pastCheckIn = new Date();
    pastCheckIn.setDate(pastCheckIn.getDate() - 5);
    const pastCheckOut = new Date();
    pastCheckOut.setDate(pastCheckOut.getDate() - 2);

    const pastDateRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hotelId: testHotelId,
        roomId: testRoomId,
        checkInDate: pastCheckIn.toISOString(),
        checkOutDate: pastCheckOut.toISOString(),
        guestCount: 1
      });
    expect(pastDateRes.statusCode).toEqual(400);
    expect(pastDateRes.body.message).toContain('cannot be in the past');

    // Check-out before or equal to check-in
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rangeRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hotelId: testHotelId,
        roomId: testRoomId,
        checkInDate: tomorrow.toISOString(),
        checkOutDate: tomorrow.toISOString(),
        guestCount: 1
      });
    expect(rangeRes.statusCode).toEqual(400);
    expect(rangeRes.body.message).toContain('Check-out date must be after check-in date');
  });

  test('POST /api/v1/bookings should reject bookings exceeding room capacity', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 2);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 4);

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hotelId: testHotelId,
        roomId: testRoomId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        guestCount: 10 // Capacity is 2
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toContain('exceeds room capacity');
  });

  test('PUT /api/v1/bookings/:id/status allows guest to cancel without falsely claiming a refund', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 3);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 6);

    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hotelId: testHotelId,
        roomId: testRoomId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        guestCount: 2
      });

    const bookingId = createRes.body.data._id;

    const cancelRes = await request(app)
      .put(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'cancelled' });

    expect(cancelRes.statusCode).toEqual(200);
    expect(cancelRes.body.data.status).toEqual('cancelled');
    expect(cancelRes.body.data.paymentStatus).toEqual('pending');
  });

  test('PUT /api/v1/bookings/:id/status rejects invalid lifecycle transitions', async () => {
    const checkIn = new Date(); checkIn.setDate(checkIn.getDate() + 3);
    const checkOut = new Date(); checkOut.setDate(checkOut.getDate() + 6);
    const createRes = await request(app).post('/api/v1/bookings').set('Authorization', `Bearer ${authToken}`).send({ hotelId: testHotelId, roomId: testRoomId, checkInDate: checkIn.toISOString(), checkOutDate: checkOut.toISOString(), guestCount: 1 });
    const bookingId = createRes.body.data._id;
    await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' });
    const manager = await User.create({ name: 'Manager', email: 'manager@hotelpro.com', password: 'password123', role: 'admin' });
    const jwt = require('jsonwebtoken');
    const managerToken = jwt.sign({ id: manager._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const res = await request(app).put(`/api/v1/bookings/${bookingId}/status`).set('Authorization', `Bearer ${managerToken}`).send({ status: 'confirmed' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("from 'cancelled' to 'confirmed'");
    expect((await Booking.findById(bookingId)).status).toBe('cancelled');
  });

  test('PUT /api/v1/bookings/:id/status prevents unauthorized user from cancelling another user booking (IDOR guard)', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 3);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 6);

    // Create booking under test user
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hotelId: testHotelId,
        roomId: testRoomId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        guestCount: 1
      });

    const bookingId = createRes.body.data._id;

    // Register second guest
    const secondGuestRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Second Guest',
        email: 'second@hotelpro.com',
        password: 'password123'
      });
    const secondToken = secondGuestRes.body.token;

    // Second guest tries to cancel first guest's booking
    const unauthorizedRes = await request(app)
      .put(`/api/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ status: 'cancelled' });

    expect(unauthorizedRes.statusCode).toEqual(403);
    expect(unauthorizedRes.body.success).toBe(false);
  });
});