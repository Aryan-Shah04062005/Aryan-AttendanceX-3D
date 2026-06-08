export interface IUser {
  id: string; // unique ID e.g. EMP001 or admin username
  username: string;
  passwordHash: string;
  role: 'admin' | 'employee';
  status: 'active' | 'suspended';
}

export interface IEmployee {
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  mobileNumber: string;
  email: string;
  joiningDate: string;
  username: string;
  profilePhoto?: string; // Base64 image data or URL
  status: 'active' | 'suspended';
}

export interface IAttendance {
  id: string; // e.g. employeeId_date
  employeeId: string;
  date: string; // YYYY-MM-DD
  entryTime?: string; // HH:MM:SS
  exitTime?: string; // HH:MM:SS
  status: 'Present' | 'Absent' | 'Half Day' | 'Late' | 'Leave';
  workingHours: number; // calculated hours
}

export interface ISettings {
  officeStartTime: string;  // "09:00"
  lateThresholdTime: string; // "09:15"
  officeEndTime: string;    // "18:00"
  minimumWorkHours: number;  // 8
  maxLateTime: string;      // "10:30"
}

export interface ILeave {
  id: string;
  employeeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface IAuditLog {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  details: string;
}
