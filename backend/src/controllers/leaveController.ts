import { Response } from 'express';
import { LeaveRepository, AttendanceRepository, AuditLogRepository, EmployeeRepository } from '../services/dbRepository.js';
import { AuthRequest } from '../middleware/auth.js';
import { ILeave, IAttendance } from '../models/types.js';

function getDatesInRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return [];
  }

  // Iterate date-by-date
  const curr = new Date(start);
  while (curr <= end) {
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

export async function requestLeave(req: AuthRequest, res: Response): Promise<void> {
  const employeeId = req.user?.id;
  const { startDate, endDate, reason } = req.body;

  if (!employeeId) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }

  if (!startDate || !endDate || !reason) {
    res.status(400).json({ message: 'Start date, end date, and reason are required.' });
    return;
  }

  try {
    const leaveId = `LV_${Date.now()}`;
    const newLeave: ILeave = {
      id: leaveId,
      employeeId,
      startDate,
      endDate,
      reason,
      status: 'Pending'
    };

    await LeaveRepository.create(newLeave);

    await AuditLogRepository.create({
      id: `lv_req_${leaveId}`,
      timestamp: new Date().toISOString(),
      action: 'Request Leave',
      userId: employeeId,
      details: `Requested leave from ${startDate} to ${endDate} for: ${reason}`
    });

    res.status(201).json({ message: 'Leave request submitted successfully.', leave: newLeave });
  } catch (error) {
    console.error('Error requesting leave:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function getLeaves(req: AuthRequest, res: Response): Promise<void> {
  const role = req.user?.role;
  const employeeId = req.user?.id;

  try {
    let leaves;
    if (role === 'admin') {
      leaves = await LeaveRepository.findAll();
    } else {
      leaves = await LeaveRepository.findAll({ employeeId });
    }

    // Join with Employee details for better admin view
    const detailedLeaves = await Promise.all(leaves.map(async (lv) => {
      const emp = await EmployeeRepository.findById(lv.employeeId);
      return {
        ...lv,
        employeeName: emp ? emp.name : 'Unknown',
        department: emp ? emp.department : 'Unknown',
        designation: emp ? emp.designation : 'Unknown',
      };
    }));

    res.status(200).json(detailedLeaves);
  } catch (error) {
    console.error('Error getting leaves:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function approveRejectLeave(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body; // 'Approved' or 'Rejected'

  if (status !== 'Approved' && status !== 'Rejected') {
    res.status(400).json({ message: 'Status must be Approved or Rejected.' });
    return;
  }

  try {
    const leave = await LeaveRepository.findById(id);
    if (!leave) {
      res.status(404).json({ message: 'Leave request not found.' });
      return;
    }

    if (leave.status !== 'Pending') {
      res.status(400).json({ message: `Leave request has already been ${leave.status.toLowerCase()}.` });
      return;
    }

    await LeaveRepository.update(id, { status });

    // If approved, automatically fill in Attendance records as "Leave"
    if (status === 'Approved') {
      const dates = getDatesInRange(leave.startDate, leave.endDate);
      for (const d of dates) {
        const attendanceId = `${leave.employeeId}_${d}`;
        const existingAtt = await AttendanceRepository.findById(attendanceId);
        
        // Only mark leave if no check-in/attendance already exists for that day
        if (!existingAtt) {
          const leaveAttendance: IAttendance = {
            id: attendanceId,
            employeeId: leave.employeeId,
            date: d,
            entryTime: undefined,
            exitTime: undefined,
            status: 'Leave',
            workingHours: 0
          };
          await AttendanceRepository.create(leaveAttendance);
        }
      }
    }

    await AuditLogRepository.create({
      id: `lv_dec_${id}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: status === 'Approved' ? 'Approve Leave' : 'Reject Leave',
      userId: req.user?.id || 'SYSTEM',
      details: `${status} leave ID ${id} for employee ${leave.employeeId}.`
    });

    res.status(200).json({ message: `Leave request has been ${status.toLowerCase()}.` });
  } catch (error) {
    console.error('Error approving/rejecting leave:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}
