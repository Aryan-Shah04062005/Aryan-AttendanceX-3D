import { useJsonFallback } from '../config/db.js';
import { UserModel, EmployeeModel, AttendanceModel, SettingsModel, LeaveModel, AuditLogModel } from '../models/mongooseModels.js';
import { JsonDb } from './jsonDb.js';
import { IUser, IEmployee, IAttendance, ISettings, ILeave, IAuditLog } from '../models/types.js';

export const UserRepository = {
  async findByUsername(username: string): Promise<IUser | null> {
    if (useJsonFallback) {
      return JsonDb.findOne<IUser>('users', (u) => u.username.toLowerCase() === username.toLowerCase());
    }
    return UserModel.findOne({ username }).lean();
  },

  async findById(id: string): Promise<IUser | null> {
    if (useJsonFallback) {
      return JsonDb.findOne<IUser>('users', (u) => u.id === id);
    }
    return UserModel.findOne({ id }).lean();
  },

  async create(user: IUser): Promise<IUser> {
    if (useJsonFallback) {
      return JsonDb.insert<IUser>('users', user);
    }
    const doc = new UserModel(user);
    await doc.save();
    return doc.toObject();
  },

  async update(id: string, updates: Partial<IUser>): Promise<boolean> {
    if (useJsonFallback) {
      const count = JsonDb.update<IUser>('users', (u) => u.id === id, updates);
      return count > 0;
    }
    const res = await UserModel.updateOne({ id }, { $set: updates });
    return res.modifiedCount > 0;
  },

  async delete(id: string): Promise<boolean> {
    if (useJsonFallback) {
      const count = JsonDb.delete<IUser>('users', (u) => u.id === id);
      return count > 0;
    }
    const res = await UserModel.deleteOne({ id });
    return res.deletedCount > 0;
  }
};

export const EmployeeRepository = {
  async findAll(filter: Partial<IEmployee> = {}): Promise<IEmployee[]> {
    if (useJsonFallback) {
      return JsonDb.find<IEmployee>('employees', (emp) => {
        for (const key in filter) {
          if (emp[key as keyof IEmployee] !== filter[key as keyof IEmployee]) {
            return false;
          }
        }
        return true;
      });
    }
    return EmployeeModel.find(filter).lean();
  },

  async findById(employeeId: string): Promise<IEmployee | null> {
    if (useJsonFallback) {
      return JsonDb.findOne<IEmployee>('employees', (emp) => emp.employeeId === employeeId);
    }
    return EmployeeModel.findOne({ employeeId }).lean();
  },

  async findByUsername(username: string): Promise<IEmployee | null> {
    if (useJsonFallback) {
      return JsonDb.findOne<IEmployee>('employees', (emp) => emp.username.toLowerCase() === username.toLowerCase());
    }
    return EmployeeModel.findOne({ username }).lean();
  },

  async create(employee: IEmployee): Promise<IEmployee> {
    if (useJsonFallback) {
      return JsonDb.insert<IEmployee>('employees', employee);
    }
    const doc = new EmployeeModel(employee);
    await doc.save();
    return doc.toObject();
  },

  async update(employeeId: string, updates: Partial<IEmployee>): Promise<boolean> {
    if (useJsonFallback) {
      const count = JsonDb.update<IEmployee>('employees', (emp) => emp.employeeId === employeeId, updates);
      return count > 0;
    }
    const res = await EmployeeModel.updateOne({ employeeId }, { $set: updates });
    return res.modifiedCount > 0;
  },

  async delete(employeeId: string): Promise<boolean> {
    if (useJsonFallback) {
      const count = JsonDb.delete<IEmployee>('employees', (emp) => emp.employeeId === employeeId);
      return count > 0;
    }
    const res = await EmployeeModel.deleteOne({ employeeId });
    return res.deletedCount > 0;
  }
};

export const AttendanceRepository = {
  async findAll(filter: Partial<IAttendance> = {}): Promise<IAttendance[]> {
    if (useJsonFallback) {
      return JsonDb.find<IAttendance>('attendance', (att) => {
        for (const key in filter) {
          if (att[key as keyof IAttendance] !== filter[key as keyof IAttendance]) {
            return false;
          }
        }
        return true;
      });
    }
    return AttendanceModel.find(filter).lean();
  },

  async findById(id: string): Promise<IAttendance | null> {
    if (useJsonFallback) {
      return JsonDb.findOne<IAttendance>('attendance', (att) => att.id === id);
    }
    return AttendanceModel.findOne({ id }).lean();
  },

  async findByEmployeeAndDate(employeeId: string, date: string): Promise<IAttendance | null> {
    if (useJsonFallback) {
      return JsonDb.findOne<IAttendance>('attendance', (att) => att.employeeId === employeeId && att.date === date);
    }
    return AttendanceModel.findOne({ employeeId, date }).lean();
  },

  async create(attendance: IAttendance): Promise<IAttendance> {
    if (useJsonFallback) {
      return JsonDb.insert<IAttendance>('attendance', attendance);
    }
    const doc = new AttendanceModel(attendance);
    await doc.save();
    return doc.toObject();
  },

  async update(id: string, updates: Partial<IAttendance>): Promise<boolean> {
    if (useJsonFallback) {
      const count = JsonDb.update<IAttendance>('attendance', (att) => att.id === id, updates);
      return count > 0;
    }
    const res = await AttendanceModel.updateOne({ id }, { $set: updates });
    return res.modifiedCount > 0;
  },

  async upsert(id: string, attendance: IAttendance): Promise<IAttendance> {
    if (useJsonFallback) {
      const existing = JsonDb.findOne<IAttendance>('attendance', (att) => att.id === id);
      if (existing) {
        JsonDb.update<IAttendance>('attendance', (att) => att.id === id, attendance);
        return { ...existing, ...attendance };
      } else {
        return JsonDb.insert<IAttendance>('attendance', attendance);
      }
    }
    const doc = await AttendanceModel.findOneAndUpdate({ id }, attendance, { upsert: true, new: true }).lean();
    return doc as IAttendance;
  }
};

const DEFAULT_SETTINGS: ISettings = {
  officeStartTime: "09:00",
  lateThresholdTime: "09:15",
  officeEndTime: "18:00",
  minimumWorkHours: 8,
  maxLateTime: "10:30",
};

export const SettingsRepository = {
  async get(): Promise<ISettings> {
    if (useJsonFallback) {
      const list = JsonDb.read<ISettings>('settings');
      if (list.length === 0) {
        JsonDb.insert<ISettings>('settings', DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      return list[0];
    }
    let settings = await SettingsModel.findOne().lean();
    if (!settings) {
      const newSettings = new SettingsModel(DEFAULT_SETTINGS);
      await newSettings.save();
      return newSettings.toObject();
    }
    return settings as unknown as ISettings;
  },

  async update(updates: Partial<ISettings>): Promise<ISettings> {
    if (useJsonFallback) {
      const list = JsonDb.read<ISettings>('settings');
      let current = list.length > 0 ? list[0] : DEFAULT_SETTINGS;
      current = { ...current, ...updates };
      JsonDb.write<ISettings>('settings', [current]);
      return current;
    }
    let settings = await SettingsModel.findOne();
    if (!settings) {
      settings = new SettingsModel({ ...DEFAULT_SETTINGS, ...updates });
    } else {
      Object.assign(settings, updates);
    }
    await settings.save();
    return settings.toObject() as unknown as ISettings;
  }
};

export const LeaveRepository = {
  async findAll(filter: Partial<ILeave> = {}): Promise<ILeave[]> {
    if (useJsonFallback) {
      return JsonDb.find<ILeave>('leaves', (lv) => {
        for (const key in filter) {
          if (lv[key as keyof ILeave] !== filter[key as keyof ILeave]) {
            return false;
          }
        }
        return true;
      });
    }
    return LeaveModel.find(filter).lean();
  },

  async findById(id: string): Promise<ILeave | null> {
    if (useJsonFallback) {
      return JsonDb.findOne<ILeave>('leaves', (lv) => lv.id === id);
    }
    return LeaveModel.findOne({ id }).lean();
  },

  async create(leave: ILeave): Promise<ILeave> {
    if (useJsonFallback) {
      return JsonDb.insert<ILeave>('leaves', leave);
    }
    const doc = new LeaveModel(leave);
    await doc.save();
    return doc.toObject();
  },

  async update(id: string, updates: Partial<ILeave>): Promise<boolean> {
    if (useJsonFallback) {
      const count = JsonDb.update<ILeave>('leaves', (lv) => lv.id === id, updates);
      return count > 0;
    }
    const res = await LeaveModel.updateOne({ id }, { $set: updates });
    return res.modifiedCount > 0;
  },

  async delete(id: string): Promise<boolean> {
    if (useJsonFallback) {
      const count = JsonDb.delete<ILeave>('leaves', (lv) => lv.id === id);
      return count > 0;
    }
    const res = await LeaveModel.deleteOne({ id });
    return res.deletedCount > 0;
  }
};

export const AuditLogRepository = {
  async findAll(): Promise<IAuditLog[]> {
    if (useJsonFallback) {
      return JsonDb.find<IAuditLog>('auditlogs');
    }
    return AuditLogModel.find().sort({ timestamp: -1 }).lean();
  },

  async create(log: IAuditLog): Promise<IAuditLog> {
    if (useJsonFallback) {
      return JsonDb.insert<IAuditLog>('auditlogs', log);
    }
    const doc = new AuditLogModel(log);
    await doc.save();
    return doc.toObject();
  }
};
