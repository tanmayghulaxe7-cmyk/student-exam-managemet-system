# College Exam Timetable Management System

A complete, production-ready, and tested **College Exam Timetable Management Website** built with **HTML5, CSS3, Vanilla JavaScript, Node.js, Express.js, MongoDB/Mongoose, JWT, and bcrypt**.

---

## 1. Project Folder Structure

```text
exam-timetable/
│
├── public/
│   ├── index.html                  # Home landing page with role options
│   ├── login.html                  # Role-segregated Login page
│   ├── register.html               # Registration page with dynamic cohort fields
│   ├── admin-dashboard.html        # Admin portal: add, view, and delete exams
│   ├── student-dashboard.html      # Student portal: strictly filtered timetable & print
│   │
│   ├── css/
│   │   ├── style.css               # Global styles, variables, navbar, modals, cards
│   │   ├── auth.css                # Authentication forms and toggle design
│   │   ├── admin.css               # Admin layout, stats, and timetable controls
│   │   └── student.css             # Student layout, cohort badges, timetable card
│   │
│   └── js/
│       ├── main.js                 # JWT tokens, auth guards, profile modal & updates
│       ├── auth.js                 # Login & registration logic, role selector
│       ├── admin.js                # Admin exam management, add exam, delete modal
│       └── student.js              # Student timetable loader & cohort display
│
├── models/
│   ├── User.js                     # User schema (name, email, password, role, year, section)
│   └── Exam.js                     # Exam schema (subject, year, section, examDate, examTime)
│
├── routes/
│   ├── authRoutes.js               # POST /api/auth/register, POST /api/auth/login
│   ├── examRoutes.js               # GET /api/exams, POST /api/exams, DELETE /api/exams/:id
│   └── userRoutes.js               # GET /api/users/me, POST/PUT /api/users/update
│
├── middleware/
│   └── authMiddleware.js           # JWT verification, authenticateToken, requireAdmin
│
├── db.js                           # Mongoose connection with resilient fallback store
├── seed.js                         # Initial test accounts and sample exams seeder
├── server.js                       # Express server (Node.js ES module entry point)
├── server.ts                       # TypeScript full-stack server entry point
├── .env                            # Environment variables
├── .env.example                    # Sample environment variables
├── package.json                    # Project configuration and dependencies
└── README.md                       # Complete documentation
```

---

## 2. Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (completely separated files, no monolithic mixing)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose (with dual-engine resilience for local MongoDB or sandbox execution)
- **Authentication & Security**:
  - JWT (`jsonwebtoken`) for stateless session authorization
  - `bcryptjs` for secure password hashing (10 salt rounds)
  - Role-Based Access Control (`admin` vs `student`)

---

## 3. Installation & Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (optional for local development; app includes an automatic fallback store if MongoDB daemon is not running)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Create or verify `.env`:
```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/exam_timetable
JWT_SECRET=super_secret_exam_timetable_jwt_key_2026
```

### Step 3: Start the Application

To run with Node.js:
```bash
npm start
```
Or for development with automatic TypeScript compilation:
```bash
npm run dev
```

Open your browser at:
```text
http://localhost:3000
```
*(or `http://localhost:5000` if you set `PORT=5000` in `.env`)*

---

## 4. Test Accounts

Initial accounts are pre-seeded automatically:

| Role | Name | Email | Password | Year / Section |
|------|------|-------|----------|----------------|
| **Admin** | Administrator | `admin@gmail.com` | `Admin@123` | N/A |
| **Student** | Student A | `studentA@gmail.com` | `Student@123` | **3rd Year, Section A** |
| **Student** | Student B | `studentB@gmail.com` | `Student@123` | **3rd Year, Section B** |

---

## 5. How Student Year/Section Filtering Works (Mandatory Requirement)

1. When a Student logs in via `POST /api/auth/login`, the backend retrieves their registered `year` and `section` from the database.
2. The backend embeds `{ id, role: "student", year, section }` inside the signed JWT.
3. When the student's browser calls `GET /api/exams`, the `authenticateToken` middleware verifies the JWT and attaches `req.user` (`year` and `section`).
4. **Backend Enforced Query**:
   ```javascript
   if (req.user.role === 'student') {
     exams = await Exam.find({
       year: req.user.year,
       section: req.user.section
     });
   }
   ```
5. **Security Guarantee**:
   - The student **cannot tamper with or bypass the filter** using URL query parameters (`?year=...`) or request bodies.
   - Student A (3rd Year, Section A) sees only **Java** and **DBMS**.
   - Student B (3rd Year, Section B) sees only **Computer Networks** and **Operating System**.
   - Admins see **all** examinations across all years and sections.

---

## 6. User Profile Functionality

Users can view and manage their account profile via the **"My Profile"** button on the navbar:
- **`GET /api/users/me`**: Fetches the authenticated user's profile details (`name`, `email`, `role`, `year`, `section`, `createdAt`).
- **`POST/PUT /api/users/update`**:
  - Allows editing the user's `name`.
  - Allows changing the password with required verification of the `currentPassword` using `bcrypt.compare()`.
  - Minimum password length is 6 characters.
  - Automatically encrypts new password with `bcrypt.hash()`.
  - Returns a refreshed JWT token containing the latest user details.

---

## 7. API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register a new Admin or Student. Validates email, password match, minimum 6 characters, and required Year/Section for students.
- `POST /api/auth/login` - Authenticate with email, password, and role. Returns JWT token and user profile.

### Examinations
- `GET /api/exams` - Protected. Returns all exams for Admin; returns strictly filtered exams matching the student's cohort.
- `POST /api/exams` - Admin only (403 Forbidden for students). Creates a new exam.
- `DELETE /api/exams/:id` - Admin only (403 Forbidden for students). Deletes an exam.

### User Profile
- `GET /api/users/me` - Protected. Returns current user details.
- `POST /api/users/update` - Protected. Updates name and/or password with bcrypt and returns a refreshed JWT.
