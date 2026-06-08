import { Response } from 'express';
import { AttendanceRepository, EmployeeRepository, LeaveRepository, SettingsRepository, UserRepository, AuditLogRepository } from '../services/dbRepository.js';
import { AuthRequest } from '../middleware/auth.js';
import { IAttendance, IEmployee } from '../models/types.js';
import { JsonDb } from '../services/jsonDb.js';
import { useJsonFallback } from '../config/db.js';

export async function getDailyReport(req: AuthRequest, res: Response): Promise<void> {
  const { date } = req.query;
  const targetDate = (date as string) || new Date().toISOString().split('T')[0];

  try {
    const employees = await EmployeeRepository.findAll();
    const attendance = await AttendanceRepository.findAll({ date: targetDate });

    const report = await Promise.all(employees.map(async (emp) => {
      const record = attendance.find((att) => att.employeeId === emp.employeeId);
      
      return {
        employeeId: emp.employeeId,
        name: emp.name,
        department: emp.department,
        designation: emp.designation,
        status: record ? record.status : 'Absent',
        entryTime: record ? record.entryTime : '-',
        exitTime: record ? record.exitTime : '-',
        workingHours: record ? record.workingHours : 0
      };
    }));

    res.status(200).json({
      date: targetDate,
      summary: {
        total: employees.length,
        present: report.filter(r => r.status === 'Present').length,
        late: report.filter(r => r.status === 'Late').length,
        halfDay: report.filter(r => r.status === 'Half Day').length,
        leave: report.filter(r => r.status === 'Leave').length,
        absent: report.filter(r => r.status === 'Absent').length
      },
      records: report
    });
  } catch (error) {
    console.error('Error generating daily report:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function getMonthlyReport(req: AuthRequest, res: Response): Promise<void> {
  const { month } = req.query; // YYYY-MM
  const targetMonth = (month as string) || new Date().toISOString().substring(0, 7);

  try {
    const employees = await EmployeeRepository.findAll();
    const allRecords = await AttendanceRepository.findAll();
    const monthlyRecords = allRecords.filter((att) => att.date.startsWith(targetMonth));

    const report = employees.map((emp) => {
      const empRecords = monthlyRecords.filter((att) => att.employeeId === emp.employeeId);
      
      const present = empRecords.filter(r => r.status === 'Present').length;
      const late = empRecords.filter(r => r.status === 'Late').length;
      const halfDay = empRecords.filter(r => r.status === 'Half Day').length;
      const leave = empRecords.filter(r => r.status === 'Leave').length;
      const absent = empRecords.filter(r => r.status === 'Absent').length;

      const totalLogged = empRecords.length;
      const presentDays = present + late + halfDay;
      const attendancePercentage = totalLogged > 0 ? parseFloat(((presentDays / totalLogged) * 100).toFixed(1)) : 0;

      return {
        employeeId: emp.employeeId,
        name: emp.name,
        department: emp.department,
        present,
        late,
        halfDay,
        leave,
        absent,
        attendancePercentage
      };
    });

    res.status(200).json({
      month: targetMonth,
      records: report
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  try {
    const employees = await EmployeeRepository.findAll();
    const attendance = await AttendanceRepository.findAll({ date: today });

    const total = employees.length;
    const present = attendance.filter(r => r.status === 'Present').length;
    const late = attendance.filter(r => r.status === 'Late').length;
    const halfDay = attendance.filter(r => r.status === 'Half Day').length;
    const leave = attendance.filter(r => r.status === 'Leave').length;
    
    // The rest are marked absent (didn't check in)
    const activeCheckedIn = attendance.length;
    const absent = total - activeCheckedIn;

    const attendancePercentage = total > 0 ? parseFloat((((present + late + halfDay) / total) * 100).toFixed(1)) : 0;

    // Monthly Analytics
    const currentMonth = today.substring(0, 7);
    const allRecords = await AttendanceRepository.findAll();
    const monthlyRecords = allRecords.filter((att) => att.date.startsWith(currentMonth));

    // Department Stats
    const departments = Array.from(new Set(employees.map(emp => emp.department)));
    const departmentStats = departments.map((dept) => {
      const deptEmployees = employees.filter(emp => emp.department === dept);
      const deptEmpIds = deptEmployees.map(emp => emp.employeeId);
      const deptTodayAttendance = attendance.filter(att => deptEmpIds.includes(att.employeeId));
      
      const deptPresent = deptTodayAttendance.filter(r => r.status === 'Present' || r.status === 'Late' || r.status === 'Half Day').length;
      
      return {
        department: dept,
        totalEmployees: deptEmployees.length,
        presentToday: deptPresent,
        absentToday: deptEmployees.length - deptPresent
      };
    });

    // Attendance Trends (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const trends = last7Days.map((dateStr) => {
      const dayRecords = allRecords.filter(r => r.date === dateStr);
      return {
        date: dateStr,
        present: dayRecords.filter(r => r.status === 'Present' || r.status === 'Late' || r.status === 'Half Day').length,
        absent: total - dayRecords.filter(r => r.status === 'Present' || r.status === 'Late' || r.status === 'Half Day').length
      };
    });

    // Employee Rankings (top performers in the current month)
    const rankings = employees.map((emp) => {
      const empRecords = monthlyRecords.filter(r => r.employeeId === emp.employeeId);
      const workingHours = empRecords.reduce((sum, r) => sum + r.workingHours, 0);
      const daysCount = empRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
      return {
        employeeId: emp.employeeId,
        name: emp.name,
        department: emp.department,
        designation: emp.designation,
        totalHours: parseFloat(workingHours.toFixed(1)),
        presentDays: daysCount
      };
    }).sort((a, b) => b.totalHours - a.totalHours).slice(0, 5);

    res.status(200).json({
      summary: {
        totalEmployees: total,
        presentToday: present,
        lateToday: late,
        halfDayToday: halfDay,
        leaveToday: leave,
        absentToday: absent,
        attendancePercentage
      },
      departmentStats,
      trends,
      rankings
    });
  } catch (error) {
    console.error('Error generating dashboard stats:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function backupDatabase(req: AuthRequest, res: Response): Promise<void> {
  try {
    let backupData: any = {};
    
    if (useJsonFallback) {
      backupData = {
        users: JsonDb.read('users'),
        employees: JsonDb.read('employees'),
        attendance: JsonDb.read('attendance'),
        settings: JsonDb.read('settings'),
        leaves: JsonDb.read('leaves'),
        auditlogs: JsonDb.read('auditlogs')
      };
    } else {
      const mongoose = (await import('mongoose')).default;
      const collections = ['users', 'employees', 'attendances', 'settings', 'leaves', 'auditlogs'];
      for (const colName of collections) {
        const docs = await mongoose.connection.db?.collection(colName).find({}).toArray();
        backupData[colName] = docs;
      }
    }

    res.setHeader('Content-disposition', 'attachment; filename=attendance_backup.json');
    res.setHeader('Content-type', 'application/json');
    res.status(200).send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ message: 'Error backing up database.' });
  }
}

export async function restoreDatabase(req: AuthRequest, res: Response): Promise<void> {
  const { data } = req.body; // Expecting parsed JSON object matching backup structure

  if (!data) {
    res.status(400).json({ message: 'Backup JSON data is required.' });
    return;
  }

  try {
    if (useJsonFallback) {
      if (data.users) JsonDb.write('users', data.users);
      if (data.employees) JsonDb.write('employees', data.employees);
      if (data.attendance) JsonDb.write('attendance', data.attendance);
      if (data.settings) JsonDb.write('settings', data.settings);
      if (data.leaves) JsonDb.write('leaves', data.leaves);
      if (data.auditlogs) JsonDb.write('auditlogs', data.auditlogs);
    } else {
      const mongoose = (await import('mongoose')).default;
      // Truncate and write to MongoDB collections
      if (data.users) {
        await mongoose.connection.db?.collection('users').deleteMany({});
        await mongoose.connection.db?.collection('users').insertMany(data.users);
      }
      if (data.employees) {
        await mongoose.connection.db?.collection('employees').deleteMany({});
        await mongoose.connection.db?.collection('employees').insertMany(data.employees);
      }
      if (data.attendance) {
        await mongoose.connection.db?.collection('attendances').deleteMany({});
        await mongoose.connection.db?.collection('attendances').insertMany(data.attendance);
      }
      if (data.settings) {
        await mongoose.connection.db?.collection('settings').deleteMany({});
        await mongoose.connection.db?.collection('settings').insertMany(data.settings);
      }
      if (data.leaves) {
        await mongoose.connection.db?.collection('leaves').deleteMany({});
        await mongoose.connection.db?.collection('leaves').insertMany(data.leaves);
      }
      if (data.auditlogs) {
        await mongoose.connection.db?.collection('auditlogs').deleteMany({});
        await mongoose.connection.db?.collection('auditlogs').insertMany(data.auditlogs);
      }
    }

    await AuditLogRepository.create({
      id: `restore_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Restore Database',
      userId: req.user?.id || 'SYSTEM',
      details: 'Database has been restored from backup.'
    });

    res.status(200).json({ message: 'Database restored successfully.' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ message: 'Error restoring database.' });
  }
}
