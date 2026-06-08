import mongoose, { Schema } from 'mongoose';
import { IUser, IEmployee, IAttendance, ISettings, ILeave, IAuditLog } from './types.js';

const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee'], required: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
});

const EmployeeSchema = new Schema<IEmployee>({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  email: { type: String, required: true },
  joiningDate: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  profilePhoto: { type: String },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
});

const AttendanceSchema = new Schema<IAttendance>({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  date: { type: String, required: true },
  entryTime: { type: String },
  exitTime: { type: String },
  status: { type: String, enum: ['Present', 'Absent', 'Half Day', 'Late', 'Leave'], required: true },
  workingHours: { type: Number, default: 0 },
});

const SettingsSchema = new Schema<ISettings>({
  officeStartTime: { type: String, default: "09:00" },
  lateThresholdTime: { type: String, default: "09:15" },
  officeEndTime: { type: String, default: "18:00" },
  minimumWorkHours: { type: Number, default: 8 },
  maxLateTime: { type: String, default: "10:30" },
});

const LeaveSchema = new Schema<ILeave>({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
});

const AuditLogSchema = new Schema<IAuditLog>({
  id: { type: String, required: true, unique: true },
  timestamp: { type: String, required: true },
  action: { type: String, required: true },
  userId: { type: String, required: true },
  details: { type: String, required: true },
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);
export const EmployeeModel = mongoose.model<IEmployee>('Employee', EmployeeSchema);
export const AttendanceModel = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export const SettingsModel = mongoose.model<ISettings>('Settings', SettingsSchema);
export const LeaveModel = mongoose.model<ILeave>('Leave', LeaveSchema);
export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
