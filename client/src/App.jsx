import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { 
  getHotels, 
  getHotelById, 
  createBooking, 
  getBookings, 
  loginUser, 
  registerUser, 
  updateBookingStatus,
  createHotel,
  addRoom
} from './api';

function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-emerald-950 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-black tracking-wider text-amber-300 flex items-center space-x-2">
          <span aria-hidden="true" className="brand-mark">H</span>
          <span>HotelPro</span>
        </Link>
        <div className="flex items-center space-x-5 text-sm font-medium">
          <Link to="/" className="hover:text-amber-200 transition">Explore Hotels</Link>
          {user ? (
            <>
              <Link to="/bookings" className="hover:text-amber-200 transition">My Bookings</Link>
              {(user.role === 'admin' || user.role === 'staff') && (
                <Link to="/admin" className="bg-emerald-500/10 text-amber-300 border border-emerald-500/30 px-2.5 py-1 rounded-md hover:bg-emerald-500/20 transition">
                  ⚙️ Operations Dashboard
                </Link>
              )}
              <div className="flex items-center space-x-3 pl-2 border-l border-stone-700">
                <span className="text-stone-300 text-xs">
                  {user.name} <span className="uppercase text-[10px] bg-stone-800 px-1.5 py-0.5 rounded text-amber-200 border border-stone-700">{user.role}</span>
                </span>
                <button 
                  onClick={logout} 
                  className="bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded text-xs font-semibold text-white transition shadow-sm"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login" className="hover:text-amber-200 transition px-3 py-1.5">Login</Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-amber-300 text-stone-950 font-bold px-4 py-1.5 rounded-lg transition shadow-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function Home() {
  const [hotels, setHotels] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const delayDebounce = setTimeout(() => {
      getHotels({ search })
        .then(res => setHotels(res.data.data || []))
        .catch(err => console.error('Fetch hotels error:', err))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white p-10 md:p-14 mb-10 shadow-xl border border-stone-800">
        <div className="max-w-2xl">
          <span className="bg-emerald-500/20 text-amber-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block border border-emerald-500/30">
            Verified Stays & Real-Time Availability
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Find Your Next Luxury Stay
          </h1>
          <p className="text-stone-300 text-base md:text-lg mb-8">
            Explore thoughtfully selected hotels, compare room options, and request reservations with clear stay details.
          </p>
          <div className="relative max-w-xl">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by city, property name, or destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 bg-stone-800/90 border border-stone-700 rounded-xl text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Hotel Cards Grid */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-950">Featured Properties</h2>
        <span className="text-stone-500 text-sm">{hotels.length} destinations available</span>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-stone-300 border-t-emerald-500"></div>
          <p className="mt-3 text-stone-500 text-sm font-medium">Checking live room availability...</p>
        </div>
      ) : hotels.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          <span className="text-4xl block mb-2">🏝️</span>
          <h3 className="text-lg font-bold text-stone-800 mb-1">No hotels found</h3>
          <p className="text-stone-500 text-sm mb-4">Try searching with a different city name or keyword.</p>
          <button onClick={() => setSearch('')} className="bg-emerald-950 text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-stone-800">
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hotels.map(hotel => {
            const minPrice = hotel.rooms && hotel.rooms.length > 0
              ? Math.min(...hotel.rooms.map(r => r.pricePerNight))
              : null;
            return (
              <div key={hotel._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-stone-200/80 flex flex-col group">
                <div className="relative h-52 overflow-hidden bg-amber-50">
                  <img 
                    src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'} 
                    alt={hotel.name} 
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500" 
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-stone-800 shadow-sm flex items-center space-x-1">
                    <span className="text-amber-500">★</span>
                    <span>{hotel.rating.toFixed(1)}</span>
                  </div>
                  {minPrice && (
                    <div className="absolute bottom-3 left-3 bg-stone-950/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-semibold">
                      From <span className="text-amber-300 font-bold text-sm">${minPrice}</span> / night
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-emerald-950 mb-1 group-hover:text-emerald-800 transition">{hotel.name}</h3>
                    <p className="text-stone-500 text-xs mb-3 flex items-center">
                      <span className="mr-1">📍</span> {hotel.location}
                    </p>
                    <p className="text-stone-600 text-sm mb-4 line-clamp-2 leading-relaxed">{hotel.description}</p>
                    
                    {hotel.amenities && hotel.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                          <span key={idx} className="bg-amber-50 text-stone-600 text-[11px] font-medium px-2 py-0.5 rounded-md">
                            {amenity}
                          </span>
                        ))}
                        {hotel.amenities.length > 3 && (
                          <span className="text-[11px] text-stone-400 py-0.5 px-1 font-medium">
                            +{hotel.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Link 
                    to={`/hotel/${hotel._id}`} 
                    className="block text-center bg-emerald-950 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl transition duration-200 text-sm shadow-sm"
                  >
                    View Rooms & Reserve →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HotelDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    getHotelById(id)
      .then(res => {
        setHotel(res.data.data);
        if (res.data.data?.rooms?.length > 0) {
          setSelectedRoom(res.data.data.rooms[0]);
        }
      })
      .catch(err => {
        console.error('Fetch hotel error:', err);
        setError('Failed to load hotel details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Compute stay pricing breakdown
  const stayMetrics = useMemo(() => {
    if (!checkIn || !checkOut || !selectedRoom) return null;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (end <= start) return null;
    const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (nights <= 0) return null;
    const total = nights * selectedRoom.pricePerNight;
    return { nights, total };
  }, [checkIn, checkOut, selectedRoom]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedRoom) {
      setError('Please select a room type');
      return;
    }
    if (guests > selectedRoom.capacity) {
      setError(`Selected room allows a maximum capacity of ${selectedRoom.capacity} guests.`);
      return;
    }
    if (!stayMetrics) {
      setError('Check-out date must be at least one day after check-in.');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await createBooking({
        hotelId: hotel._id,
        roomId: selectedRoom._id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestCount: Number(guests)
      });
      setSuccess(`Your reservation request is pending confirmation and payment. Reference: ${res.data.data.bookingReference}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Room might already be booked for these dates.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-stone-300 border-t-emerald-500"></div>
        <p className="mt-3 text-stone-500 text-sm font-medium">Loading property details...</p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-emerald-950 mb-2">Hotel Not Found</h2>
        <p className="text-stone-500 mb-6">The property you are looking for may have been removed or updated.</p>
        <Link to="/" className="bg-emerald-950 text-white px-5 py-2.5 rounded-lg text-sm font-semibold">
          ← Back to All Hotels
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Navigation Breadcrumb */}
      <div className="mb-6">
        <Link to="/" className="text-sm text-emerald-800 hover:text-emerald-800 font-medium flex items-center space-x-1">
          <span>← Back to all properties</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-6 border-b border-stone-200">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-950 mb-1">{hotel.name}</h1>
          <p className="text-stone-500 text-sm flex items-center">
            <span className="mr-1">📍</span> {hotel.address}, {hotel.location}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <span className="bg-amber-100 text-amber-800 text-sm font-bold px-3 py-1.5 rounded-lg border border-amber-200 flex items-center space-x-1">
            <span>★</span>
            <span>{hotel.rating.toFixed(1)} / 5.0</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Gallery, About, and Rooms */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl overflow-hidden shadow-md border border-stone-200 max-h-96">
            <img 
              src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'} 
              alt={hotel.name} 
              className="w-full h-96 object-cover" 
            />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h2 className="text-xl font-bold text-emerald-950 mb-3">About Property</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-6">{hotel.description}</p>
            
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">Property Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {hotel.amenities.map((item, idx) => (
                    <span key={idx} className="bg-amber-50 text-stone-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-200">
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Available Rooms */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h2 className="text-xl font-bold text-emerald-950 mb-4">Choose Your Room</h2>
            {!hotel.rooms || hotel.rooms.length === 0 ? (
              <p className="text-stone-500 text-sm">No rooms currently configured for this hotel.</p>
            ) : (
              <div className="space-y-4">
                {hotel.rooms.map(room => {
                  const isSelected = selectedRoom?._id === room._id;
                  return (
                    <div 
                      key={room._id} 
                      onClick={() => setSelectedRoom(room)}
                      className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-md' 
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-bold text-base text-emerald-950">{room.type} Suite</h4>
                          <span className="text-xs bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-mono">Room #{room.roomNumber}</span>
                        </div>
                        <p className="text-xs text-stone-500 mb-2">Max Capacity: <span className="font-semibold text-stone-700">{room.capacity} Guests</span></p>
                        {room.amenities && room.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {room.amenities.map((am, i) => (
                              <span key={i} className="text-[11px] bg-amber-50 text-stone-600 px-2 py-0.5 rounded">
                                {am}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center">
                        <div className="text-right mb-2">
                          <span className="text-2xl font-black text-emerald-950">${room.pricePerNight}</span>
                          <span className="text-xs text-stone-500"> / night</span>
                        </div>
                        <button 
                          type="button"
                          className={`text-xs font-bold px-4 py-2 rounded-lg transition ${
                            isSelected 
                              ? 'bg-emerald-800 text-white shadow-sm' 
                              : 'bg-emerald-950 text-white hover:bg-stone-800'
                          }`}
                        >
                          {isSelected ? '✓ Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Booking Card */}
        <div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-stone-200/90 sticky top-20">
            <h3 className="text-xl font-bold text-emerald-950 mb-1">Book Your Stay</h3>
            <p className="text-stone-500 text-xs mb-5">Guaranteed reservation with price lock snapshot</p>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl mb-4 text-xs font-medium leading-relaxed">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl mb-4 text-xs font-medium leading-relaxed">
                <span className="font-bold text-sm block mb-1">🎉 Reservation Request Received</span>
                <p className="mb-2">{success}</p>
                <Link to="/bookings" className="text-emerald-700 underline font-semibold block mt-1">
                  View in My Bookings →
                </Link>
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Selected Room</label>
                <div className="w-full px-3.5 py-2.5 bg-amber-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 flex justify-between items-center">
                  <span>{selectedRoom ? `${selectedRoom.type} (Room #${selectedRoom.roomNumber})` : 'None selected'}</span>
                  {selectedRoom && <span className="text-emerald-800 font-bold">${selectedRoom.pricePerNight}/night</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Check-In</label>
                  <input 
                    type="date" 
                    required 
                    min={todayStr}
                    value={checkIn} 
                    onChange={e => {
                      setCheckIn(e.target.value);
                      if (checkOut && e.target.value >= checkOut) {
                        setCheckOut('');
                      }
                    }} 
                    className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Check-Out</label>
                  <input 
                    type="date" 
                    required 
                    min={checkIn || todayStr}
                    value={checkOut} 
                    onChange={e => setCheckOut(e.target.value)} 
                    className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">Guests</label>
                  {selectedRoom && (
                    <span className="text-[11px] text-stone-400">Max capacity: {selectedRoom.capacity}</span>
                  )}
                </div>
                <input 
                  type="number" 
                  min="1" 
                  max={selectedRoom?.capacity || 10}
                  required 
                  value={guests} 
                  onChange={e => setGuests(e.target.value)} 
                  className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              {/* Price Calculation Card */}
              {stayMetrics && (
                <div className="bg-amber-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>${selectedRoom.pricePerNight} × {stayMetrics.nights} {stayMetrics.nights === 1 ? 'night' : 'nights'}</span>
                    <span>${stayMetrics.total}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Taxes & Service fees</span>
                    <span className="text-emerald-600 font-medium">Included</span>
                  </div>
                  <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-bold text-emerald-950">
                    <span>Total Price</span>
                    <span className="text-emerald-800 font-black text-base">${stayMetrics.total}</span>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={!selectedRoom || submitting || !checkIn || !checkOut}
                className="w-full bg-emerald-500 hover:bg-amber-300 text-stone-950 font-black py-3.5 rounded-xl transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
              >
                {submitting ? 'Confirming Reservation...' : user ? 'Instant Book & Pay' : 'Sign in to Reserve'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-amber-50 flex items-center justify-center space-x-2 text-[11px] text-stone-400">
              <span>🔒 256-bit Secure Reservation</span>
              <span>•</span>
              <span>No Double-Booking Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchBookings = () => {
    setLoading(true);
    getBookings()
      .then(res => setBookings(res.data.data || []))
      .catch(err => console.error('Fetch bookings error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation? Any completed payment would need to be refunded separately.')) {
      return;
    }
    try {
      await updateBookingStatus(id, 'cancelled');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return bookings;
    return bookings.filter(b => b.status === filter);
  }, [bookings, filter]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-stone-300 border-t-emerald-500"></div>
        <p className="mt-3 text-stone-500 text-sm font-medium">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-950">My Bookings</h1>
          <p className="text-stone-500 text-sm">Review your reservations, status, and cancellation history.</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex bg-stone-200/80 p-1 rounded-xl text-xs font-semibold text-stone-600">
          {['all', 'pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg capitalize transition ${
                filter === status ? 'bg-white text-emerald-950 shadow-sm' : 'hover:text-emerald-950'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          <span className="text-4xl block mb-2">📋</span>
          <h3 className="text-lg font-bold text-stone-800 mb-1">No bookings found</h3>
          <p className="text-stone-500 text-sm mb-6">You don't have any reservations under the selected filter.</p>
          <Link to="/" className="bg-emerald-950 text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-stone-800 transition">
            Explore Hotels Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(b => (
            <div key={b._id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {b.bookingReference}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                    b.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    b.status === 'checked-in' ? 'bg-blue-100 text-blue-800' :
                    b.status === 'checked-out' ? 'bg-amber-50 text-stone-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {b.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    b.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' :
                    b.paymentStatus === 'refunded' ? 'bg-amber-50 text-amber-700' :
                    'bg-amber-50 text-stone-600'
                  }`}>
                    Payment: {b.paymentStatus}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-emerald-950">{b.hotel?.name || 'Hotel Property'}</h3>
                <p className="text-xs text-stone-500">📍 {b.hotel?.address || b.hotel?.location}</p>
                <div className="text-xs text-stone-600 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                  <span>Room: <strong className="text-stone-800">{b.room?.type} (#{b.room?.roomNumber})</strong></span>
                  <span>Guests: <strong className="text-stone-800">{b.guestCount}</strong></span>
                  <span>Dates: <strong className="text-stone-800">{new Date(b.checkInDate).toLocaleDateString()} → {new Date(b.checkOutDate).toLocaleDateString()}</strong></span>
                </div>
              </div>

              <div className="flex md:flex-col items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-amber-50">
                <div className="text-right mb-2">
                  <span className="text-xs text-stone-400 block">Total Price</span>
                  <span className="text-2xl font-black text-emerald-950">${b.totalPrice}</span>
                </div>
                {(b.status === 'confirmed' || b.status === 'pending') && (
                  <button 
                    onClick={() => handleCancel(b._id)} 
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition"
                  >
                    Cancel Reservation
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');

  // Form states for creating hotel
  const [hotelForm, setHotelForm] = useState({
    name: '',
    description: '',
    location: '',
    address: '',
    rating: 4.5,
    amenities: 'WiFi, Pool, Spa, Free Breakfast',
    images: 'https://images.unsplash.com/photo-1566073771259-6a8506099945'
  });

  // Form states for adding room
  const [roomForm, setRoomForm] = useState({
    hotelId: '',
    roomNumber: '',
    type: 'Deluxe',
    pricePerNight: 150,
    capacity: 2,
    amenities: 'King Bed, Balcony, Sea View'
  });

  const [message, setMessage] = useState('');
  const [errMessage, setErrMessage] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([getBookings(), getHotels()])
      .then(([bRes, hRes]) => {
        setBookings(bRes.data.data || []);
        setHotels(hRes.data.data || []);
        if (hRes.data.data?.length > 0 && !roomForm.hotelId) {
          setRoomForm(prev => ({ ...prev, hotelId: hRes.data.data[0]._id }));
        }
      })
      .catch(err => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCreateHotel = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrMessage('');
    try {
      await createHotel({
        ...hotelForm,
        rating: Number(hotelForm.rating),
        amenities: hotelForm.amenities.split(',').map(s => s.trim()).filter(Boolean),
        images: [hotelForm.images.trim()]
      });
      setMessage('New hotel created successfully!');
      loadData();
      setHotelForm({
        name: '',
        description: '',
        location: '',
        address: '',
        rating: 4.5,
        amenities: 'WiFi, Pool, Spa',
        images: 'https://images.unsplash.com/photo-1566073771259-6a8506099945'
      });
    } catch (err) {
      setErrMessage(err.response?.data?.message || 'Failed to create hotel');
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrMessage('');
    if (!roomForm.hotelId) {
      setErrMessage('Please select a hotel');
      return;
    }
    try {
      await addRoom(roomForm.hotelId, {
        roomNumber: roomForm.roomNumber,
        type: roomForm.type,
        pricePerNight: Number(roomForm.pricePerNight),
        capacity: Number(roomForm.capacity),
        amenities: roomForm.amenities.split(',').map(s => s.trim()).filter(Boolean)
      });
      setMessage(`Room ${roomForm.roomNumber} added successfully!`);
      loadData();
      setRoomForm(prev => ({
        ...prev,
        roomNumber: '',
        pricePerNight: 150
      }));
    } catch (err) {
      setErrMessage(err.response?.data?.message || 'Failed to add room');
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalBookings = bookings.length;
    const active = bookings.filter(b => b.status === 'confirmed' || b.status === 'checked-in').length;
    const checkedIn = bookings.filter(b => b.status === 'checked-in').length;
    const revenue = bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((acc, b) => acc + (b.totalPrice || 0), 0);
    return { totalBookings, active, checkedIn, revenue };
  }, [bookings]);

  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-emerald-950 mb-1">Operations & Hotel Management</h1>
        <p className="text-stone-500 text-sm">Real-time occupancy, guest check-in/check-out workflows, and inventory administration.</p>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Total Reservations</span>
          <span className="text-3xl font-black text-emerald-950">{metrics.totalBookings}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Active Stays</span>
          <span className="text-3xl font-black text-emerald-800">{metrics.active}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Currently Checked-In</span>
          <span className="text-3xl font-black text-emerald-600">{metrics.checkedIn}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Gross Revenue</span>
          <span className="text-3xl font-black text-emerald-950">${metrics.revenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 mb-6 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'bookings' ? 'border-emerald-500 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          All Guest Reservations ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('new-room')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'new-room' ? 'border-emerald-500 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Add Room to Hotel
        </button>
        {user.role === 'admin' && (
          <button
            onClick={() => setActiveTab('new-hotel')}
            className={`pb-3 transition border-b-2 ${
              activeTab === 'new-hotel' ? 'border-emerald-500 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Create New Property
          </button>
        )}
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl mb-6 text-xs font-semibold">
          ✓ {message}
        </div>
      )}
      {errMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl mb-6 text-xs font-semibold">
          ⚠️ {errMessage}
        </div>
      )}

      {/* Tab: Reservations Management Table */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Ref Code</th>
                  <th className="py-3.5 px-4">Guest</th>
                  <th className="py-3.5 px-4">Hotel & Room</th>
                  <th className="py-3.5 px-4">Stay Dates</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50 text-stone-700">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-stone-400">No reservations currently recorded.</td>
                  </tr>
                ) : (
                  bookings.map(b => (
                    <tr key={b._id} className="hover:bg-amber-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-950">{b.bookingReference}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-emerald-950 block">{b.user?.name || 'Guest'}</span>
                        <span className="text-[11px] text-stone-400">{b.user?.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-stone-800 block">{b.hotel?.name}</span>
                        <span className="text-[11px] text-stone-400">{b.room?.type} Room #{b.room?.roomNumber}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span>{new Date(b.checkInDate).toLocaleDateString()}</span>
                        <span className="text-stone-400 mx-1">→</span>
                        <span>{new Date(b.checkOutDate).toLocaleDateString()}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-950">${b.totalPrice}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          b.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          b.status === 'checked-in' ? 'bg-blue-100 text-blue-800' :
                          b.status === 'checked-out' ? 'bg-amber-50 text-stone-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {b.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(b._id, 'confirmed')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold transition"
                          >
                            Confirm
                          </button>
                        )}
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(b._id, 'checked-in')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold transition"
                          >
                            Check-In
                          </button>
                        )}
                        {b.status === 'checked-in' && (
                          <button
                            onClick={() => handleStatusChange(b._id, 'checked-out')}
                            className="bg-stone-800 hover:bg-emerald-950 text-white px-2.5 py-1 rounded text-[11px] font-semibold transition"
                          >
                            Check-Out
                          </button>
                        )}
                        {b.status !== 'cancelled' && b.status !== 'checked-out' && (
                          <button
                            onClick={() => handleStatusChange(b._id, 'cancelled')}
                            className="text-rose-600 hover:underline px-2 py-1 text-[11px] font-semibold"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Add Room */}
      {activeTab === 'new-room' && (
        <div className="max-w-2xl bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-xl font-bold text-emerald-950 mb-4">Add Room Inventory</h3>
          <form onSubmit={handleAddRoom} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-stone-600 mb-1 font-bold">Select Hotel Property</label>
              <select
                value={roomForm.hotelId}
                onChange={e => setRoomForm({ ...roomForm, hotelId: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-lg text-xs"
              >
                {hotels.map(h => (
                  <option key={h._id} value={h._id}>{h.name} ({h.location})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-600 mb-1 font-bold">Room Number / Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 301, PH-A"
                  value={roomForm.roomNumber}
                  onChange={e => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-1 font-bold">Room Type</label>
                <select
                  value={roomForm.type}
                  onChange={e => setRoomForm({ ...roomForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-lg text-xs"
                >
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Suite">Suite</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-600 mb-1 font-bold">Price per Night ($)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={roomForm.pricePerNight}
                  onChange={e => setRoomForm({ ...roomForm, pricePerNight: e.target.value })}
                  className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-1 font-bold">Max Guest Capacity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={roomForm.capacity}
                  onChange={e => setRoomForm({ ...roomForm, capacity: e.target.value })}
                  className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-bold">Room Amenities (comma separated)</label>
              <input
                type="text"
                placeholder="King Bed, Balcony, Sea View, Mini Bar"
                value={roomForm.amenities}
                onChange={e => setRoomForm({ ...roomForm, amenities: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-lg text-xs"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-950 hover:bg-stone-800 text-white font-bold py-2.5 px-6 rounded-lg transition"
            >
              Add Room to Inventory
            </button>
          </form>
        </div>
      )}

      {/* Tab: Create Hotel */}
      {activeTab === 'new-hotel' && user.role === 'admin' && (
        <div className="max-w-2xl bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-xl font-bold text-emerald-950 mb-4">Register New Hotel Property</h3>
          <form onSubmit={handleCreateHotel} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-stone-600 mb-1 font-bold">Hotel Name</label>
              <input
                type="text"
                required
                placeholder="e.g. The Grand Royal Resort"
                value={hotelForm.name}
                onChange={e => setHotelForm({ ...hotelForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-lg text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-600 mb-1 font-bold">City / Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Miami, FL"
                  value={hotelForm.location}
                  onChange={e => setHotelForm({ ...hotelForm, location: e.target.value })}
                  className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-1 font-bold">Full Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500 Ocean Blvd"
                  value={hotelForm.address}
                  onChange={e => setHotelForm({ ...hotelForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-bold">Property Description</label>
              <textarea
                rows="3"
                required
                placeholder="Describe amenities, location highlights, and guest experience..."
                value={hotelForm.description}
                onChange={e => setHotelForm({ ...hotelForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-lg text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-600 mb-1 font-bold">Initial Rating (1-5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={hotelForm.rating}
                  onChange={e => setHotelForm({ ...hotelForm, rating: e.target.value })}
                  className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-1 font-bold">Cover Image URL</label>
                <input
                  type="url"
                  value={hotelForm.images}
                  onChange={e => setHotelForm({ ...hotelForm, images: e.target.value })}
                  className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-bold">Amenities (comma separated)</label>
              <input
                type="text"
                placeholder="Swimming Pool, Free WiFi, Fitness Center, Spa"
                value={hotelForm.amenities}
                onChange={e => setHotelForm({ ...hotelForm, amenities: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50 border border-stone-200 rounded-lg text-xs"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-amber-300 text-stone-950 font-bold py-2.5 px-6 rounded-lg transition"
            >
              Register Hotel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await loginUser({ email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  const fillQuickDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@hotelpro.com');
      setPassword('password123');
    } else if (role === 'staff') {
      setEmail('staff@hotelpro.com');
      setPassword('password123');
    } else {
      setEmail('guest@hotelpro.com');
      setPassword('password123');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-2xl shadow-xl border border-stone-200">
      <h2 className="text-2xl font-black mb-2 text-center text-emerald-950">Welcome Back</h2>
      <p className="text-xs text-stone-500 text-center mb-6">Sign in to manage reservations and room bookings</p>
      
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-4 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Quick demo credentials filler */}
      <div className="bg-amber-50 p-3 rounded-xl border border-stone-200 mb-5">
        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2">⚡ Quick Autofill Demo Accounts:</span>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => fillQuickDemo('guest')} className="bg-white border border-stone-200 hover:border-emerald-500 text-stone-700 text-xs py-1.5 rounded-lg font-semibold transition">
            Guest
          </button>
          <button type="button" onClick={() => fillQuickDemo('staff')} className="bg-white border border-stone-200 hover:border-emerald-500 text-stone-700 text-xs py-1.5 rounded-lg font-semibold transition">
            Staff
          </button>
          <button type="button" onClick={() => fillQuickDemo('admin')} className="bg-white border border-stone-200 hover:border-emerald-500 text-stone-700 text-xs py-1.5 rounded-lg font-semibold transition">
            Admin
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-stone-700 mb-1.5">Email Address</label>
          <input 
            type="email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full px-3.5 py-2.5 bg-amber-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500" 
          />
        </div>
        <div>
          <label className="block font-bold text-stone-700 mb-1.5">Password</label>
          <input 
            type="password" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full px-3.5 py-2.5 bg-amber-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500" 
          />
        </div>
        <button 
          type="submit" 
          className="w-full bg-emerald-950 hover:bg-stone-800 text-white font-bold py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-md"
        >
          Sign In
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-stone-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-emerald-800 font-bold hover:underline">
          Create Account
        </Link>
      </p>
    </div>
  );
}

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await registerUser({ name, email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-2xl shadow-xl border border-stone-200">
      <h2 className="text-2xl font-black mb-2 text-center text-emerald-950">Create Account</h2>
      <p className="text-xs text-stone-500 text-center mb-6">Find a stay that feels like your own</p>
      
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-4 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-stone-700 mb-1.5">Full Name</label>
          <input 
            type="text" 
            required 
            placeholder="John Doe"
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="w-full px-3.5 py-2.5 bg-amber-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500" 
          />
        </div>
        <div>
          <label className="block font-bold text-stone-700 mb-1.5">Email Address</label>
          <input 
            type="email" 
            required 
            placeholder="john@example.com"
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full px-3.5 py-2.5 bg-amber-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500" 
          />
        </div>
        <div>
          <label className="block font-bold text-stone-700 mb-1.5">Password (min 6 characters)</label>
          <input 
            type="password" 
            required 
            minLength="6"
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full px-3.5 py-2.5 bg-amber-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500" 
          />
        </div>
        <button 
          type="submit" 
          className="w-full bg-emerald-500 hover:bg-amber-300 text-stone-950 font-bold py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-md"
        >
          Complete Registration
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-stone-500">
        Already have an account?{' '}
        <Link to="/login" className="text-emerald-800 font-bold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-amber-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-stone-950">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/hotel/:id" element={<HotelDetail />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="bg-emerald-950 text-stone-400 text-xs py-8 border-t border-stone-800 text-center">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="font-bold text-stone-200 text-sm">HotelPro <span className="font-normal">· hotel booking & management</span></span>
              <span>Find a place to feel at home.</span>
              <span>© {new Date().getFullYear()} All rights reserved.</span>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}