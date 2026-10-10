# 🏨 Hotel Management & Room Booking System

> **Enterprise RESTful API & Interactive Management Platform**  
> A production-grade backend reservation and hospitality management system built with Node.js, Express.js, TypeScript, and MongoDB Atlas. Features complete lifecycle handling for rooms, reservations, guests, staff, departments, revenue analytics, an interactive terminal CLI, and an administrative dashboard.

[![TypeScript](https://img.shields.io/badge/Language-TypeScript_5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js_18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Framework-Express.js-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Overview & Small Description

The **Hotel Management & Room Booking System** is an end-to-end backend service engineered for modern hospitality workflows. 

Designed following clean layered architecture (Routes $\to$ Controllers $\to$ Services $\to$ Mongoose Models), the platform eliminates manual booking overlaps, enforces transactional room inventory constraints, calculates stay durations and dynamic bills, tracks employee departmental assignments, and generates real-time occupancy and revenue analytics. In addition to a RESTful JSON API, the system ships with an interactive command-line terminal management interface (CLI) and an administrative web console.

---

## ✨ Features

- **Room Inventory & Tiering**: Manage Deluxe, Suite, Standard, and Executive rooms with real-time status tracking (`Available`, `Occupied`, `Maintenance`).
- **Transactional Booking Lifecycle**: Validates check-in/check-out dates, computes room night totals, verifies customer identity, and updates room availability automatically.
- **Customer CRM**: Maintain customer profiles, reservation history, contact information, and billing records.
- **Department & Staff Operations**: Track departmental hierarchies, manager designations, staff rosters, shift schedules, and contact directories.
- **Business Intelligence & Analytics**: Aggregate occupancy metrics, total revenue reports, upcoming checkout alerts, and departmental expenditure insights.
- **Dual Interface Modes**:
  - **RESTful API**: Standardized JSON endpoints tested with included Postman collection.
  - **Interactive CLI**: Colorized terminal menu for terminal-based management.
  - **Web Console**: Admin UI hosted at `/admin`.
- **Database Seeder**: Pre-configured database seeder (`seed.ts`) generating realistic initial departments, rooms, staff members, and customers.

---

## 📂 File Structure

```text
Hotel-Management-System/
├── .env.example                  # Environment configuration template
├── .gitignore                    # Excludes node_modules, build artifacts & secrets
├── LICENSE                       # MIT Open Source License
├── README.md                     # Comprehensive documentation & API manual
├── package.json                  # NPM dependencies & operational scripts
├── tsconfig.json                 # TypeScript compiler configuration
├── docs/                         # Specifications & API testing assets
│   ├── Hotel_Management_System_Postman_Collection.json # Postman collection
│   └── Hotel_Management_System_Project_Report.docx     # Academic project report
├── public/                       # Static web console assets
│   └── admin/
│       └── index.html            # Administrative control dashboard
├── src/                          # TypeScript source code
│   ├── app.ts                    # Express application bootstrap & route mounting
│   ├── seed.ts                   # Database population & mock generator script
│   ├── server.ts                 # Server entry point & MongoDB Atlas connection
│   ├── cli/                      # Interactive CLI terminal menus
│   │   ├── bookingMenu.ts        # Reservation CLI interface
│   │   ├── cli.ts                # Main CLI loop
│   │   ├── customerMenu.ts       # Customer management interface
│   │   ├── departmentMenu.ts     # Department management interface
│   │   ├── mainMenu.ts           # Root interactive navigation
│   │   ├── reportMenu.ts         # Analytics CLI visualizer
│   │   ├── roomMenu.ts           # Room inventory management
│   │   └── staffMenu.ts          # Employee roster interface
│   ├── config/                   # Configuration loaders
│   │   └── db.ts                 # Mongoose database client pool
│   ├── controllers/              # Request handlers & HTTP routing
│   │   ├── AdminController.ts
│   │   ├── BookingController.ts
│   │   ├── CustomerController.ts
│   │   ├── DepartmentController.ts
│   │   ├── ReportController.ts
│   │   ├── RoomController.ts
│   │   └── StaffController.ts
│   ├── middlewares/              # Express middlewares (Auth, Errors, Async Handlers)
│   │   ├── adminAuth.ts
│   │   ├── asyncHandler.ts
│   │   └── errorHandler.ts
│   ├── models/                   # Mongoose data schemas & TypeScript interfaces
│   │   ├── Booking.ts
│   │   ├── Customer.ts
│   │   ├── Department.ts
│   │   ├── Room.ts
│   │   └── Staff.ts
│   └── routes/                   # RESTful API routing manifests
└── system_screenshots/           # UI and CLI operation screenshots
```

---

## 🚀 Setup & Deployment

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**
- **MongoDB Atlas** cluster URI or local MongoDB daemon

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AnshulKanodia/Hotel-Management-System.git
   cd Hotel-Management-System
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the `.env.example` file to `.env` and fill in your MongoDB connection details:
   ```bash
   cp .env.example .env
   ```
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hotel_db?retryWrites=true&w=majority
   ADMIN_KEY=your_admin_secret_key
   ```

4. **Seed the Database (Optional)**:
   Populate your MongoDB database with sample records:
   ```bash
   npm run seed
   ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The API server will listen at `http://localhost:5000`.

6. **Run Interactive CLI Mode**:
   ```bash
   npm run cli
   ```

---

## 🛠️ Tech Stack & Language Breakdown

| Component | Technology |
|---|---|
| **Language** | TypeScript (Strict Mode) |
| **Runtime & Server** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Development** | `ts-node-dev`, TypeScript Compiler (`tsc`) |
| **Testing & Documentation** | Postman, Microsoft Word Project Report |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the [LICENSE](LICENSE) file for details.

<!-- documentation enhancement -->
