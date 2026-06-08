import { Response } from 'express';
import { AttendanceRepository, SettingsRepository, EmployeeRepository, AuditLogRepository } from '../services/dbRepository.js';
import { AuthRequest } from '../middleware/auth.js';
import { IAttendance, ISettings } from '../models/types.js';


// Helper to convert time "HH:MM" to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper to calculate hours difference
function calculateHoursDiff(startTimeStr: string, endTimeStr: string): number {
  const start = timeToMinutes(startTimeStr);
  const end = timeToMinutes(endTimeStr);
  if (end < start) return 0; // Negative working hours
  return parseFloat(((end - start) / 60).toFixed(2));
}

// Get current time formatted as HH:MM
function getCurrentTimeStr(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Get current date formatted as YYYY-MM-DD
function getCurrentDateStr(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function clockIn(req: AuthRequest, res: Response): Promise<void> {
  const employeeId = req.user?.id;
  if (!employeeId) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }

  const today = getCurrentDateStr();
  const checkinTime = getCurrentTimeStr();

  try {
    // Check if employee is suspended or inactive
    const employee = await EmployeeRepository.findById(employeeId);
    if (!employee || employee.status === 'suspended') {
      res.status(403).json({ message: 'Account is suspended or invalid.' });
      return;
    }

    // Check if attendance already logged today
    const existingRecord = await AttendanceRepository.findByEmployeeAndDate(employeeId, today);
    if (existingRecord) {
      res.status(400).json({ message: 'Attendance already recorded for today.' });
      return;
    }

    // Fetch office rules
    const settings = await SettingsRepository.get();
    const minutesIn = timeToMinutes(checkinTime);
    const thresholdMinutes = timeToMinutes(settings.lateThresholdTime);
    const maxLateMinutes = timeToMinutes(settings.maxLateTime);

    let status: IAttendance['status'] = 'Present';
    if (minutesIn > maxLateMinutes) {
      status = 'Absent'; // Arrived too late
    } else if (minutesIn > thresholdMinutes) {
      status = 'Late';
    }

    const newRecord: IAttendance = {
      id: `${employeeId}_${today}`,
      employeeId,
      date: today,
      entryTime: checkinTime,
      exitTime: undefined,
      status,
      workingHours: 0
    };

    await AttendanceRepository.create(newRecord);

    await AuditLogRepository.create({
      id: `in_${employeeId}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Clock In',
      userId: employeeId,
      details: `Employee marked entry at ${checkinTime}. Status: ${status}.`
    });

    res.status(201).json({
      message: 'Clock-in recorded successfully.',
      record: newRecord
    });
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ message: 'Internal server error during clock-in.' });
  }
}

export async function clockOut(req: AuthRequest, res: Response): Promise<void> {
  const employeeId = req.user?.id;
  if (!employeeId) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }

  const today = getCurrentDateStr();
  const checkoutTime = getCurrentTimeStr();

  try {
    const record = await AttendanceRepository.findByEmployeeAndDate(employeeId, today);
    if (!record) {
      res.status(400).json({ message: 'No clock-in record found for today. You must clock-in first.' });
      return;
    }

    if (record.exitTime) {
      res.status(400).json({ message: 'You have already clocked out for today.' });
      return;
    }

    const entryTime = record.entryTime || '09:00';
    const workingHours = calculateHoursDiff(entryTime, checkoutTime);

    const settings = await SettingsRepository.get();

    let status = record.status;

    // Check for half-day or absent recalculations
    if (status !== 'Absent') {
      if (workingHours < settings.minimumWorkHours) {
        status = 'Half Day';
      }
    }

    const updates: Partial<IAttendance> = {
      exitTime: checkoutTime,
      workingHours,
      status
    };

    await AttendanceRepository.update(record.id, updates);

    await AuditLogRepository.create({
      id: `out_${employeeId}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Clock Out',
      userId: employeeId,
      details: `Employee marked exit at ${checkoutTime}. Worked hours: ${workingHours}. Final Status: ${status}.`
    });

    res.status(200).json({
      message: 'Clock-out recorded successfully.',
      record: { ...record, ...updates }
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ message: 'Internal server error during clock-out.' });
  }
}

export async function getMyAttendance(req: AuthRequest, res: Response): Promise<void> {
  const employeeId = req.user?.id;
  if (!employeeId) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }

  try {
    const list = await AttendanceRepository.findAll({ employeeId });
    res.status(200).json(list);
  } catch (error) {
    console.error('Error fetching employee attendance:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function getSettings(req: AuthRequest, res: Response): Promise<void> {
  try {
    const settings = await SettingsRepository.get();
    res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function updateSettings(req: AuthRequest, res: Response): Promise<void> {
  const { officeStartTime, lateThresholdTime, officeEndTime, minimumWorkHours, maxLateTime } = req.body;

  try {
    const updates: Partial<ISettings> = {};
    if (officeStartTime) updates.officeStartTime = officeStartTime;
    if (lateThresholdTime) updates.lateThresholdTime = lateThresholdTime;
    if (officeEndTime) updates.officeEndTime = officeEndTime;
    if (minimumWorkHours !== undefined) updates.minimumWorkHours = Number(minimumWorkHours);
    if (maxLateTime) updates.maxLateTime = maxLateTime;

    const newSettings = await SettingsRepository.update(updates);

    await AuditLogRepository.create({
      id: `settings_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Update Settings',
      userId: req.user?.id || 'SYSTEM',
      details: `Updated office rules settings: Start=${newSettings.officeStartTime}, End=${newSettings.officeEndTime}, MinHours=${newSettings.minimumWorkHours}.`
    });

    res.status(200).json({ message: 'Settings updated successfully.', settings: newSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function getTodayStatus(req: AuthRequest, res: Response): Promise<void> {
  const employeeId = req.user?.id;
  if (!employeeId) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }

  const today = getCurrentDateStr();

  try {
    const record = await AttendanceRepository.findByEmployeeAndDate(employeeId, today);
    res.status(200).json(record || null);
  } catch (error) {
    console.error('Error getting today status:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}
