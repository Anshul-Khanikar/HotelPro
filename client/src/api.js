import axios from 'axios';

const API = axios.create({ baseURL: '/api/v1' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('hotelpro_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Hotels
export const getHotels = (params) => API.get('/hotels', { params });
export const getHotelById = (id) => API.get(`/hotels/${id}`);
export const createHotel = (data) => API.post('/hotels', data);
export const addRoom = (hotelId, data) => API.post(`/hotels/${hotelId}/rooms`, data);

// Bookings
export const createBooking = (data) => API.post('/bookings', data);
export const getBookings = () => API.get('/bookings');
export const getBookingById = (id) => API.get(`/bookings/${id}`);
export const updateBookingStatus = (id, status) => API.put(`/bookings/${id}/status`, { status });