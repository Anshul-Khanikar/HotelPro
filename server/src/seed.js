const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Hotel = require('./models/Hotel');
const Room = require('./models/Room');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelpro';

const seedData = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB for seeding...');
    }

    // Clear existing data
    await User.deleteMany({});
    await Hotel.deleteMany({});
    await Room.deleteMany({});
    console.log('Cleared existing database records.');

    // Create demo users with credentials matching README and Client Quick-Fill
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@hotelpro.com',
      password: 'password123',
      role: 'admin',
      phone: '1234567890'
    });

    const staffUser = await User.create({
      name: 'Staff Member',
      email: 'staff@hotelpro.com',
      password: 'password123',
      role: 'staff',
      phone: '0987654321'
    });

    const guestUser = await User.create({
      name: 'Guest User',
      email: 'guest@hotelpro.com',
      password: 'password123',
      role: 'guest',
      phone: '5551234567'
    });

    console.log('Created users: Admin (admin@hotelpro.com), Staff (staff@hotelpro.com), Guest (guest@hotelpro.com).');

    // Create Hotels
    const hotel1 = await Hotel.create({
      name: 'Grand Luxury Hotel & Spa',
      description: 'Experience 5-star luxury in the heart of the city with world-class amenities and exceptional service.',
      location: 'New York',
      address: '123 Broadway, New York, NY 10001',
      rating: 4.8,
      amenities: ['Free Wi-Fi', 'Swimming Pool', 'Spa & Wellness', 'Fine Dining', 'Valet Parking', 'Fitness Center'],
      images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'],
      createdBy: adminUser._id
    });

    const hotel2 = await Hotel.create({
      name: 'Seaside Paradise Resort',
      description: 'Relax on pristine white-sand beaches with breathtaking ocean views and private beach access.',
      location: 'Miami',
      address: '456 Ocean Drive, Miami Beach, FL 33139',
      rating: 4.6,
      amenities: ['Beachfront', 'Outdoor Pool', 'Bar & Lounge', 'Water Sports', 'Free Breakfast', 'Room Service'],
      images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'],
      createdBy: adminUser._id
    });

    console.log('Created hotels: Grand Luxury Hotel & Spa, Seaside Paradise Resort.');

    // Create Rooms
    await Room.create([
      {
        hotel: hotel1._id,
        roomNumber: '101',
        type: 'Deluxe',
        pricePerNight: 250,
        capacity: 2,
        amenities: ['King Bed', 'City View', 'Minibar', 'Smart TV', 'Ensuite Bathroom'],
        isAvailable: true
      },
      {
        hotel: hotel1._id,
        roomNumber: '202',
        type: 'Suite',
        pricePerNight: 450,
        capacity: 4,
        amenities: ['Master King Bed', 'Living Room', 'Jacuzzi', 'Balcony', 'Ocean View'],
        isAvailable: true
      },
      {
        hotel: hotel2._id,
        roomNumber: 'A1',
        type: 'Double',
        pricePerNight: 180,
        capacity: 2,
        amenities: ['Queen Bed', 'Pool View', 'Balcony', 'Coffee Maker'],
        isAvailable: true
      },
      {
        hotel: hotel2._id,
        roomNumber: 'B3',
        type: 'Suite',
        pricePerNight: 380,
        capacity: 5,
        amenities: ['Two King Beds', 'Sea View', 'Kitchenette', 'Private Patio'],
        isAvailable: true
      }
    ]);

    console.log('Created rooms for both hotels.');
    console.log('Database seeding completed successfully.');
    return true;
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
};

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedData;