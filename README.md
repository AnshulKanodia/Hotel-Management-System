# 🏨 Hotel Management & Room Booking System

A production-ready **RESTful backend API** for managing hotel operations — rooms, bookings, customers, staff, departments, and analytics — built with **Node.js**, **Express.js**, **TypeScript**, and **MongoDB Atlas**.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript (strict mode) |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Config | dotenv |
| Dev Server | ts-node-dev |

---

## 📁 Project Structure

```
hotel/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── src/
    ├── app.ts                    # Express app, middleware, route mounting
    ├── server.ts                 # Entry point — DB connect + HTTP listen
    ├── config/
    │   └── db.ts                 # MongoDB Atlas connection (Mongoose)
    ├── models/
    │   ├── Department.ts
    │   ├── Staff.ts
    │   ├── Customer.ts
    │   ├── Room.ts
    │   └── Booking.ts
    ├── controllers/
    │   ├── DepartmentController.ts
    │   ├── CustomerController.ts
    │   ├── StaffController.ts
    │   ├── RoomController.ts
    │   ├── BookingController.ts
    │   └── ReportController.ts
    ├── routes/
    │   ├── departmentRoutes.ts
    │   ├── customerRoutes.ts
    │   ├── staffRoutes.ts
    │   ├── roomRoutes.ts
    │   ├── bookingRoutes.ts
    │   └── reportRoutes.ts
    ├── middlewares/
    │   ├── asyncHandler.ts       # HOF — wraps async controllers
    │   ├── errorHandler.ts       # Global error handler + AppError class
    │   └── notFound.ts           # 404 catcher
    ├── services/                 # Reserved for Phase 6+
    ├── types/                    # Reserved for shared TypeScript types
    └── utils/                    # Reserved for helper utilities
```

---

## ⚙️ Installation & Setup

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd hotel
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and specify your credentials:
```env
PORT=5000
NODE_ENV=development
ADMIN_PASSWORD=admin123
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/hotel_db?retryWrites=true&w=majority
```

### 3. Populate Database (Seed Script)

Populate the database with a pre-configured set of 7 departments, 20 rooms, 15 customers, 14 staff members, and 12 mock bookings:
```bash
npm run seed
```

### 4. Run API Server

```bash
npm run dev
```
The server will start at `http://localhost:5000`. 
* **API Endpoints base path**: `http://localhost:5000/api`
* **Web Admin Panel (SPA)**: `http://localhost:5000/admin/` (Login Password: `admin123` or your config)

### 5. Run Interactive CLI

Connect directly to the database and manage hotel operations from the terminal:
```bash
npm run cli
```

### 6. Build for Production

```bash
npm run build
npm start
```

---

## 📋 API Reference

### Base URL
```
http://localhost:5000/api
```

### Health Check
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Server liveness check |

### Departments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/departments` | Create department |
| GET | `/departments` | Get all departments |
| GET | `/departments/:id` | Get department by ID |
| PUT | `/departments/:id` | Update department |
| DELETE | `/departments/:id` | Delete department |

### Customers
| Method | Endpoint | Description |
|---|---|---|
| POST | `/customers` | Create customer |
| GET | `/customers` | Get all customers |
| GET | `/customers/:id` | Get customer by ID |
| PUT | `/customers/:id` | Update customer |
| DELETE | `/customers/:id` | Delete customer |

### Staff
| Method | Endpoint | Description |
|---|---|---|
| POST | `/staff` | Create staff member |
| GET | `/staff` | Get all staff (populated) |
| GET | `/staff/:id` | Get staff by ID |
| PUT | `/staff/:id` | Update staff |
| DELETE | `/staff/:id` | Delete staff |

### Rooms
| Method | Endpoint | Description |
|---|---|---|
| POST | `/rooms` | Create room |
| GET | `/rooms` | Get all rooms |
| GET | `/rooms/:id` | Get room by ID |
| GET | `/rooms/status/:status` | Filter by status |
| PUT | `/rooms/:id` | Update room |
| DELETE | `/rooms/:id` | Delete room |

### Bookings
| Method | Endpoint | Description |
|---|---|---|
| POST | `/bookings` | Create booking |
| GET | `/bookings` | Get all bookings |
| GET | `/bookings/:id` | Get booking by ID |
| PUT | `/bookings/:id` | Update booking dates |
| DELETE | `/bookings/:id` | Cancel booking (soft) |
| PATCH | `/bookings/:id/checkin` | Check in guest |
| PATCH | `/bookings/:id/checkout` | Check out guest |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/reports/dashboard` | Hotel summary stats |
| GET | `/reports/staff-by-department` | Staff count per department |
| GET | `/reports/room-status` | Room status breakdown |
| GET | `/reports/booking-status` | Booking lifecycle counts |
| GET | `/reports/revenue` | Total revenue (CheckedOut) |
| GET | `/reports/top-customers` | Top 5 customers by bookings |
| GET | `/reports/occupancy` | Occupancy percentage |
| GET | `/reports/customer-bookings/:id` | Customer booking history |

---

## 🔁 Booking Lifecycle

```
[Booked] → PATCH /checkin → [CheckedIn] → PATCH /checkout → [CheckedOut]
   ↓                              ↓
DELETE (cancel)             DELETE (cancel)
   ↓                              ↓
[Cancelled]               [Cancelled]
```

Room status transitions automatically:
- Create booking → `Available` → `Occupied`
- Checkout or Cancel → `Occupied` → `Available`

---

## ✨ Key Features

- **Interactive CLI**: Direct DB integration using `@inquirer/prompts` with full CRUD, dynamic tables, and ASCII-based reporting.
- **Web Admin Panel**: Password-protected single-page dashboard loaded with quick room-state modifications, live overlap checks, and statistics.
- **Zod Request Validation**: Declarative body schema definitions (`src/validators/schemas.ts`) protecting database integrity with clean, error-specific HTTP 400 structures.
- **Smart Room Booking Engine**: Booking validation based on date-intervals instead of status filters (rooms occupied today can still be reserved for next week).
- **Physical Occupancy Guard**: Checks during guest check-in to ensure no two bookings occupy a room at the same physical time, throwing a `409 Conflict` if blocked.
- **MongoDB Aggregation Reports**: 8 different business performance analysis endpoints (occupancy, top-customers, revenue summary) calculated entirely on the database cluster.

---

## 🧠 MongoDB Concepts Demonstrated

- **Schema Design** with Mongoose (types, enums, required, unique, trim, match)
- **ObjectId References** (population / virtual joins)
- **Aggregation Pipeline** ($match, $group, $lookup, $project, $sort, $limit, $sum, $avg, $cond, $arrayElemAt)
- **Compound Database Indexes** for search and conflict performance
- **Pre-save Hooks** (date validation on Booking)
- **Deletion Guards** preventing orphaning referencing schemas

---

## 📊 API Response Format

**Success:**
```json
{ "success": true, "message": "...", "data": {} }
```

**Error:**
```json
{ "success": false, "message": "..." }
```

**Zod Validation Error (HTTP 400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Please enter a valid email address" },
    { "field": "phone", "message": "Phone number must be 10–15 digits" }
  ]
}
```

---

## 🔮 Future Scope

- **JWT Authentication** — role-based access (Admin, Receptionist, Manager)
- **Room Image Uploads** — Cloudinary / AWS S3 integration
- **Payment Integration** — Razorpay / Stripe for booking payments
- **Email Notifications** — Nodemailer for booking confirmations
- **Pagination & Filtering** — query params for large datasets
- **Rate Limiting** — express-rate-limit to prevent abuse
- **Unit & Integration Tests** — Jest + Supertest
- **Docker** — containerised deployment
- **Swagger / OpenAPI** — auto-generated API documentation

---

## 👤 Author

**Anshul Kanodia**
