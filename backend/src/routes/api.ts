import { Router } from 'express';
import { authenticateJWT, requireAdmin, requireEmployee } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as employeeController from '../controllers/employeeController.js';
import * as attendanceController from '../controllers/attendanceController.js';
import * as leaveController from '../controllers/leaveController.js';
import * as reportController from '../controllers/reportController.js';
import { AuditLogRepository } from '../services/dbRepository.js';

const router = Router();

// ----------------------------------------------------
// Authentication Routes
// ----------------------------------------------------
router.post('/auth/login', authController.login);
router.put('/auth/profile', authenticateJWT, authController.updateProfile);

// ----------------------------------------------------
// Employee Management Routes (Admin Only)
// ----------------------------------------------------
router.get('/employees', authenticateJWT, requireAdmin, employeeController.getAllEmployees);
router.post('/employees', authenticateJWT, requireAdmin, employeeController.addEmployee);
router.get('/employees/:id', authenticateJWT, employeeController.getEmployeeById);
router.put('/employees/:id', authenticateJWT, requireAdmin, employeeController.editEmployee);
router.patch('/employees/:id/status', authenticateJWT, requireAdmin, employeeController.suspendEmployee);
router.delete('/employees/:id', authenticateJWT, requireAdmin, employeeController.deleteEmployee);

// ----------------------------------------------------
// Attendance Routes
// ----------------------------------------------------
router.post('/attendance/clock-in', authenticateJWT, requireEmployee, attendanceController.clockIn);
router.post('/attendance/clock-out', authenticateJWT, requireEmployee, attendanceController.clockOut);
router.get('/attendance/my', authenticateJWT, requireEmployee, attendanceController.getMyAttendance);
router.get('/attendance/today', authenticateJWT, requireEmployee, attendanceController.getTodayStatus);
router.get('/attendance/settings', authenticateJWT, attendanceController.getSettings);
router.put('/attendance/settings', authenticateJWT, requireAdmin, attendanceController.updateSettings);

// ----------------------------------------------------
// Leave Routes
// ----------------------------------------------------
router.post('/leaves', authenticateJWT, requireEmployee, leaveController.requestLeave);
router.get('/leaves', authenticateJWT, leaveController.getLeaves);
router.patch('/leaves/:id', authenticateJWT, requireAdmin, leaveController.approveRejectLeave);

// ----------------------------------------------------
// Reports & Analytics Routes (Admin Only)
// ----------------------------------------------------
router.get('/reports/daily', authenticateJWT, requireAdmin, reportController.getDailyReport);
router.get('/reports/monthly', authenticateJWT, requireAdmin, reportController.getMonthlyReport);
router.get('/reports/dashboard', authenticateJWT, requireAdmin, reportController.getDashboardStats);
router.get('/reports/backup', authenticateJWT, requireAdmin, reportController.backupDatabase);
router.post('/reports/restore', authenticateJWT, requireAdmin, reportController.restoreDatabase);

// ----------------------------------------------------
// Audit Logs (Admin Only)
// ----------------------------------------------------
router.get('/audit-logs', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const logs = await AuditLogRepository.findAll();
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit logs.' });
  }
});

export default router;
