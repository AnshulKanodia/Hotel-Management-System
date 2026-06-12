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

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/hotel_db?retryWrites=true&w=majority
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

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

## 🧠 MongoDB Concepts Demonstrated

- **Schema Design** with Mongoose (types, enums, required, unique, trim, match)
- **ObjectId References** (population / virtual joins)
- **Aggregation Pipeline** ($match, $group, $lookup, $project, $sort, $limit, $sum, $avg, $cond, $arrayElemAt)
- **Timestamps** (createdAt / updatedAt on all schemas)
- **Pre-save Hooks** (date validation on Booking)
- **Indexes** (unique constraints on email, roomNumber, department name)
- **Soft Delete** (booking cancellation without physical removal)

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

---

## 🔮 Future Scope

- **JWT Authentication** — role-based access (Admin, Receptionist, Manager)
- **Room Image Uploads** — Cloudinary / AWS S3 integration
- **Payment Integration** — Razorpay / Stripe for booking payments
- **Email Notifications** — Nodemailer for booking confirmations
- **Pagination & Filtering** — query params for large datasets
- **Rate Limiting** — express-rate-limit to prevent abuse
- **Input Validation** — Joi or Zod schema validators
- **Unit & Integration Tests** — Jest + Supertest
- **Docker** — containerised deployment
- **Swagger / OpenAPI** — auto-generated API documentation

---

## 👤 Author

**Anshul Kanodia**
