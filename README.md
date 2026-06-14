# Aryan AttendanceX 3D - Futuristic Employee Attendance Management Portal

Aryan AttendanceX 3D is a premium, enterprise-grade, futuristic 3D Employee Attendance Management System featuring separate Admin and Employee portals, clock-in/out shift logging, timing policy managers, automatic status calculations, and beautiful mouse-responsive 3D analytics charts.

---

## Technical Architecture

- **Frontend**: Vite, React.js, TypeScript, Tailwind CSS, Three.js, Lucide Icons, Framer Motion, and GSAP animations.
- **Backend**: Node.js, Express.js, TypeScript, and JWT-based authentication.
- **Database Layer**: Hybrid Database Adapter. If `MONGODB_URI` is configured in `backend/.env`, the server uses standard MongoDB via Mongoose. If it's missing or connection fails, the server automatically falls back to persistent, local JSON database files stored in `backend/data/*.json`.

---

## Quick Start Guide

### Prerequisites
- **Node.js** (v20+ recommended)
- **npm** (v10+ recommended)

### 1. Installation
In the project root directory, run the command to install all dependencies for both frontend and backend projects:
```bash
npm run install:all
```

### 2. Configuration
Create a `.env` file in the `backend/` directory (you can copy `backend/.env.example` as a template):
```env
PORT=4000
JWT_SECRET=super-secret-security-attendance-token
MONGODB_URI=mongodb://localhost:27017/attendancex
```
*Note: If `MONGODB_URI` is not provided, the database will fall back to persistent local JSON files in `backend/data/` automatically.*

### 3. Running the Application
To start both the Express API backend (port 4000) and Vite React frontend (port 5173) concurrently in development mode, run:
```bash
npm run dev
```

---

## Default Login Credentials

Upon application startup, the database is seeded automatically with the default administrator account:
- **Username**: `Aryan`
- **Password**: `Aryanshah`

*Note: On your first login, the admin can navigate to Settings to modify these credentials.*

---

## API Documentation

### Authentication Routes
- `POST /api/auth/login`: Authenticate and sign in user.
- `PUT /api/auth/profile`: Update user credentials (JWT authorized).

### Employee Management Routes (Admin Only)
- `GET /api/employees`: List all onboarded employee profiles.
- `GET /api/employees/:id`: Retrieve details for a specific employee.
- `POST /api/employees`: Onboard a new employee (creates employee profile and user auth).
- `PUT /api/employees/:id`: Update employee details.
- `PATCH /api/employees/:id/status`: Suspend or activate employee account.
- `DELETE /api/employees/:id`: Permanently delete employee account.

### Attendance Tracking Routes
- `POST /api/attendance/clock-in`: Record clock-in entry (Employee).
- `POST /api/attendance/clock-out`: Record clock-out exit (Employee).
- `GET /api/attendance/my`: Get current employee's attendance logs (Employee).
- `GET /api/attendance/today`: Get clock-in/out status for today (Employee).
- `GET /api/attendance/settings`: Get active office hours timings settings.
- `PUT /api/attendance/settings`: Update office timings settings (Admin Only).

### Leave Management Routes
- `POST /api/leaves`: Submit a leave request (Employee).
- `GET /api/leaves`: Get leave requests list (Employees view theirs, Admin views all).
- `PATCH /api/leaves/:id`: Approve or Reject a leave request (Admin Only).

### Reports & Analytics Routes (Admin Only)
- `GET /api/reports/daily`: Fetch records status list for a specific date.
- `GET /api/reports/monthly`: Fetch aggregate monthly statistics per employee.
- `GET /api/reports/dashboard`: Fetch stats summary, weekly trends, department ratios, and employee ranking for dashboard analytics.
- `GET /api/reports/backup`: Download database backup as JSON.
- `POST /api/reports/restore`: Upload database backup to restore/overwrite records.

### Audit logs
- `GET /api/audit-logs`: Fetch system security compliance logs (Admin Only).

---

## Automatic Attendance Calculation Logic

The status of daily attendance is updated automatically upon clocking out based on the admin's office configurations:

1. **Present**: Arrives before *Late Arrival Threshold* and works $\ge$ *Required Work Hours* (default: 8 hours).
2. **Late**: Arrives after *Late Arrival Threshold* but before *Max Late Entry Time*, and works $\ge$ *Required Work Hours*.
3. **Half Day**: Worked hours are less than the required shift hours.
4. **Absent**: Arrives after the *Max Late Entry Time*, or does not record a clock-in for the day.
5. **Leave**: Automatically recorded as "Leave" for dates where the employee's leave request is approved.

---

## 🚀 Live Deployment Guide

This project is optimized for a simple, zero-cost, 1-click cloud deployment.

### 1. Backend Deployment (Render)
1. Go to [Render](https://render.com/) and sign in with GitHub.
2. Click **New +** and select **Blueprint**.
3. Link your `Aryan-AttendanceX-3D` repository.
4. Render will automatically read the `render.yaml` file and set up the service.
5. (Optional) Under environment variables, you can set `MONGODB_URI` to a free MongoDB Atlas connection string so database entries are preserved permanently.
6. Click **Apply**. Once deployed, copy your web service URL (e.g. `https://aryan-attendance-backend.onrender.com`).

### 2. Frontend Deployment (Vercel)
1. Go to [Vercel](https://vercel.com/) and sign in with GitHub.
2. Click **Add New** -> **Project**.
3. Select your `Aryan-AttendanceX-3D` repository.
4. In the configuration:
   - Set **Root Directory** to `frontend`.
   - Expand the **Environment Variables** section and add:
     - Name: `VITE_API_URL`
     - Value: `https://YOUR-RENDER-BACKEND-URL/api` (replace with your actual Render URL).
5. Click **Deploy**. Vercel will build and serve your app. All client routes are protected and rewritten to `index.html` via the `frontend/vercel.json` file.

