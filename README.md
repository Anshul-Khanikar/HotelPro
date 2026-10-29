# HotelPro — End-to-End MERN Hotel Booking and Management System

HotelPro is a responsive hospitality application for hotel discovery, guest reservations, room inventory, and staff operations. This repository includes a local demo mode and an API integration test suite.

## Tech Stack

- **Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT Authentication, Express Rate Limit, bcryptjs.
- **Frontend:** React 18, React Router, Axios, Vite, and Tailwind CSS.
- **Testing:** Jest, Supertest (server integration tests).

## Features & Architecture

1. **Authentication & Authorization:** Secure registration and login with bcrypt password hashing and JWT tokens. Role-based access control (Guest, Staff, Admin).
2. **Hotel & Room Discovery:** Search hotels by location, name, and rating with detailed room inventories and pricing.
3. **Booking Lifecycle:** Create reservations with date and capacity validation, price snapshots, and an overlap check against active bookings. The current check is not atomic across concurrent requests; see the production-readiness notes below.
4. **Operations & Dashboard:** Admin/staff management for hotels, rooms, and bookings.
5. **Testing Suite:** API integration tests cover health checks, authentication, hotel retrieval, booking creation, date validation, authorization, lifecycle rules, and sequential overlap prevention.

## Production-readiness notes

- **Payments:** No payment gateway is integrated. Booking payment status is a placeholder; do not accept real payments or present a reservation as paid. A real provider must confirm capture and refund events server-side.
- **Inventory concurrency:** The current overlap query prevents sequential conflicts but is not a distributed lock or transaction. Before using real inventory, implement and test a transaction-backed reservation strategy on a MongoDB replica set.
- **Database:** `npm run demo` uses temporary in-memory data. Production must use a persistent MongoDB deployment and configured secrets.
- **Branding:** The product name is HotelPro. The UI uses Tailwind CSS; Bootstrap is not currently included.
- **Deployment:** Vercel configuration is a starting point only. Configure `MONGODB_URI` and a strong `JWT_SECRET`, then test the serverless API and frontend together before sharing a production URL.

## Quick Start & Setup

### Run the demo locally (no MongoDB installation required)

From the project root, run:

```bash
npm install
npm run demo
```

Open `http://localhost:5000`. The demo starts a temporary in-memory MongoDB,
automatically seeds sample hotels and demo accounts, and serves the built React
frontend from the same address. Demo data is discarded when the process stops.
The first run may download a MongoDB test binary. To rebuild the frontend after
changing client code, run `cd client && npm run build`.

Demo accounts (password for all three: `password123`):

- Admin: `admin@hotelpro.com`
- Staff: `staff@hotelpro.com`
- Guest: `guest@hotelpro.com`

### 1. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Configure MONGODB_URI and JWT_SECRET in .env
npm run seed   # Seeds sample users, hotels, and rooms
npm run dev    # Starts server on port 5000
```

### 2. Running Tests
```bash
cd server
npm test
```

## Client Setup
```bash
cd client
npm install
npm run dev    # Starts Vite on port 3000; /api requests proxy to localhost:5000
npm run build  # Creates the production bundle in client/dist
```

Configure the backend first (see Backend Setup) and ensure MongoDB is available before using API-backed pages. The client currently uses the Vite development proxy; production hosting must provide an equivalent `/api` reverse proxy.

## API Endpoints Overview

- **Auth:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- **Hotels:** `GET /api/v1/hotels`, `GET /api/v1/hotels/:id`, `POST /api/v1/hotels` (Admin/Staff), `POST /api/v1/hotels/:id/rooms`
- **Bookings:** `GET /api/v1/bookings`, `POST /api/v1/bookings`, `GET /api/v1/bookings/:id`, `PUT /api/v1/bookings/:id/status`

## Demo Credentials (after seeding)
- **Admin:** `admin@hotelpro.com` / `password123`
- **Staff:** `staff@hotelpro.com` / `password123`
- **Guest:** `guest@hotelpro.com` / `password123`