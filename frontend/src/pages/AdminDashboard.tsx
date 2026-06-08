import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Charts3D } from '../components/Charts3D.js';
import { 
  Users, UserCheck, UserX, Clock, Calendar, Check, X, Search, 
  Settings, UserPlus, Trash2, Edit2, ShieldAlert, Download, Upload, Loader2, Sparkles, Sliders
} from 'lucide-react';

interface AdminDashboardProps {
  currentTab: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentTab }) => {
  const { updateCredentials } = useAuth();
  
  // States
  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search/Filter for Employees
  const [empSearch, setEmpSearch] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('All');

  // Employee Form State (Add / Edit)
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [isEditingEmp, setIsEditingEmp] = useState(false);
  const [empForm, setEmpForm] = useState({
    employeeName: '',
    employeeId: '',
    department: '',
    designation: '',
    mobileNumber: '',
    email: '',
    joiningDate: '',
    username: '',
    password: '',
    profilePhoto: ''
  });

  // Settings Credentials Update
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

  // Report filters
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().substring(0, 7));
  const [dailyReportData, setDailyReportData] = useState<any>(null);
  const [monthlyReportData, setMonthlyReportData] = useState<any>(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/reports/dashboard');
      setStats(statsRes.data);
      
      const empRes = await api.get('/employees');
      setEmployees(empRes.data);

      const leaveRes = await api.get('/leaves');
      setLeaves(leaveRes.data);

      const logsRes = await api.get('/audit-logs');
      setLogs(logsRes.data);

      const settingsRes = await api.get('/attendance/settings');
      setSettings(settingsRes.data);
    } catch (err: any) {
      setError('Failed to fetch dashboard data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch specific reports when filters change
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const dailyRes = await api.get(`/reports/daily?date=${reportDate}`);
        setDailyReportData(dailyRes.data);

        const monthlyRes = await api.get(`/reports/monthly?month=${reportMonth}`);
        setMonthlyReportData(monthlyRes.data);
      } catch (err) {
        console.error('Error fetching reports:', err);
      }
    };
    if (!loading) {
      fetchReports();
    }
  }, [reportDate, reportMonth, loading]);

  // Handle Employee Add/Edit submit
  const handleEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isEditingEmp) {
        await api.put(`/employees/${empForm.employeeId}`, {
          name: empForm.employeeName,
          department: empForm.department,
          designation: empForm.designation,
          mobileNumber: empForm.mobileNumber,
          email: empForm.email,
          joiningDate: empForm.joiningDate,
          profilePhoto: empForm.profilePhoto
        });
        setSuccessMsg('Employee details updated successfully!');
      } else {
        await api.post('/employees', empForm);
        setSuccessMsg(`Employee ${empForm.employeeName} onboarded successfully!`);
      }
      
      setShowEmpForm(false);
      setIsEditingEmp(false);
      // Reset form
      setEmpForm({
        employeeName: '',
        employeeId: '',
        department: '',
        designation: '',
        mobileNumber: '',
        email: '',
        joiningDate: '',
        username: '',
        password: '',
        profilePhoto: ''
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Employee action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Profile photo upload helper
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEmpForm(prev => ({ ...prev, profilePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Edit employee button trigger
  const handleEditClick = (emp: any) => {
    setEmpForm({
      employeeName: emp.name,
      employeeId: emp.employeeId,
      department: emp.department,
      designation: emp.designation,
      mobileNumber: emp.mobileNumber,
      email: emp.email,
      joiningDate: emp.joiningDate,
      username: emp.username,
      password: '', // blank password on edit
      profilePhoto: emp.profilePhoto || ''
    });
    setIsEditingEmp(true);
    setShowEmpForm(true);
  };

  // Suspend/Activate Employee toggle
  const handleSuspendToggle = async (empId: string, currentStatus: string) => {
    setActionLoading(true);
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await api.patch(`/employees/${empId}/status`, { status: newStatus });
      setSuccessMsg(`Employee status set to ${newStatus}.`);
      fetchData();
    } catch (err) {
      setError('Failed to toggle employee status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete employee permanently
  const handleDeleteEmployee = async (empId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this employee? This cannot be undone.')) return;
    
    setActionLoading(true);
    try {
      await api.delete(`/employees/${empId}`);
      setSuccessMsg('Employee permanently removed.');
      fetchData();
    } catch (err) {
      setError('Failed to delete employee.');
    } finally {
      setActionLoading(false);
    }
  };

  // Leave approval / rejection
  const handleLeaveDecision = async (leaveId: string, decision: 'Approved' | 'Rejected') => {
    setActionLoading(true);
    try {
      await api.patch(`/leaves/${leaveId}`, { status: decision });
      setSuccessMsg(`Leave request has been ${decision.toLowerCase()}.`);
      fetchData();
    } catch (err) {
      setError('Failed to update leave request status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Timings settings update
  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put('/attendance/settings', settings);
      setSuccessMsg('Office timing configuration updated successfully!');
      fetchData();
    } catch (err) {
      setError('Failed to update timings settings.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update admin credentials
  const handleAdminCredsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await updateCredentials(newAdminUser || undefined, newAdminPass || undefined);
      setSuccessMsg('Admin credentials updated successfully! Use your new details next time.');
      setNewAdminUser('');
      setNewAdminPass('');
    } catch (err: any) {
      setError(err.message || 'Failed to update credentials.');
    } finally {
      setActionLoading(false);
    }
  };

  // Backup Database trigger
  const handleBackup = async () => {
    try {
      const response = await api.get('/reports/backup', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'aryan_attendancex_backup.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export database backup.');
    }
  };

  // Restore Database trigger
  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('WARNING: Restoring the database will overwrite all existing data. Proceed?')) return;

    setActionLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        await api.post('/reports/restore', { data: jsonData });
        setSuccessMsg('Database restored successfully from file!');
        fetchData();
      } catch (err) {
        setError('Failed to restore database. Invalid file structure.');
      } finally {
        setActionLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Export Daily/Monthly Report to CSV
  const handleExportCSV = (reportType: 'daily' | 'monthly') => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    if (reportType === 'daily' && dailyReportData) {
      filename = `Daily_Report_${reportDate}.csv`;
      headers = ['Employee ID', 'Name', 'Department', 'Designation', 'Status', 'Clock In', 'Clock Out', 'Hours'];
      rows = dailyReportData.records.map((r: any) => [
        r.employeeId, r.name, r.department, r.designation, r.status, r.entryTime, r.exitTime, r.workingHours.toString()
      ]);
    } else if (reportType === 'monthly' && monthlyReportData) {
      filename = `Monthly_Report_${reportMonth}.csv`;
      headers = ['Employee ID', 'Name', 'Department', 'Presents', 'Lates', 'Half Days', 'Leaves', 'Absents', 'Attendance %'];
      rows = monthlyReportData.records.map((r: any) => [
        r.employeeId, r.name, r.department, r.present.toString(), r.late.toString(), r.halfDay.toString(), r.leave.toString(), r.absent.toString(), `${r.attendancePercentage}%`
      ]);
    }

    if (rows.length === 0) return;

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Filtered employees list
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(empSearch.toLowerCase()) || 
                          emp.employeeId.toLowerCase().includes(empSearch.toLowerCase()) ||
                          emp.department.toLowerCase().includes(empSearch.toLowerCase());
    const matchesDept = empDeptFilter === 'All' || emp.department === empDeptFilter;
    return matchesSearch && matchesDept;
  });

  // Unique departments for filtering
  const departmentsList = Array.from(new Set(employees.map(emp => emp.department)));

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-cyber-blue">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="text-sm font-mono uppercase tracking-widest animate-pulse">Synchronizing holographic datasets...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 select-none relative z-10">
      
      {/* Alert Banner for Actions */}
      {(error || successMsg) && (
        <div className="flex flex-col gap-2">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm font-medium flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')}><X size={16} /></button>
            </div>
          )}
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm font-medium flex items-center justify-between">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg('')}><X size={16} /></button>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB PANEL: DASHBOARD */}
      {/* ==================================================== */}
      {currentTab === 'dashboard' && stats && (
        <div className="space-y-6">
          
          {/* Holographic Quick Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="glass-card p-4 flex flex-col justify-between hover:border-cyber-blue/20 transition-all duration-300">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Total Headcount</span>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-3xl font-extrabold text-white">{stats.summary.totalEmployees}</span>
                <Users size={20} className="text-cyber-blue" />
              </div>
            </div>
            <div className="glass-card p-4 flex flex-col justify-between hover:border-emerald-400/20 transition-all duration-300">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Present Today</span>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-3xl font-extrabold text-emerald-400">{stats.summary.presentToday}</span>
                <UserCheck size={20} className="text-emerald-400" />
              </div>
            </div>
            <div className="glass-card p-4 flex flex-col justify-between hover:border-amber-400/20 transition-all duration-300">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Late Arrivals</span>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-3xl font-extrabold text-amber-400">{stats.summary.lateToday}</span>
                <Clock size={20} className="text-amber-400" />
              </div>
            </div>
            <div className="glass-card p-4 flex flex-col justify-between hover:border-indigo-400/20 transition-all duration-300">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Half Days</span>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-3xl font-extrabold text-indigo-400">{stats.summary.halfDayToday}</span>
                <Clock size={20} className="text-indigo-400" />
              </div>
            </div>
            <div className="glass-card p-4 flex flex-col justify-between hover:border-purple-400/20 transition-all duration-300">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">On Leaves</span>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-3xl font-extrabold text-purple-400">{stats.summary.leaveToday}</span>
                <Calendar size={20} className="text-cyber-purple" />
              </div>
            </div>
            <div className="glass-card p-4 flex flex-col justify-between hover:border-red-400/20 transition-all duration-300">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Absent Total</span>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-3xl font-extrabold text-red-400">{stats.summary.absentToday}</span>
                <UserX size={20} className="text-red-400" />
              </div>
            </div>
          </div>

          {/* Attendance Efficiency Banner */}
          <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-900/50 via-cyber-blue/5 to-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyber-blue/10 flex items-center justify-center border border-cyber-blue/20">
                <Sparkles className="text-cyber-blue animate-pulse" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Daily Operational Efficiency</h3>
                <p className="text-xs text-white/50">Calculated as attendance percent relative to registered employee counts.</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-4xl font-extrabold bg-gradient-to-r from-cyber-blue to-cyber-purple bg-clip-text text-transparent">
                {stats.summary.attendancePercentage}%
              </span>
            </div>
          </div>

          {/* 3D Dashboard Charts Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-2">Weekly Attendance Trends (3D Bar)</h3>
                <p className="text-xs text-white/40">Present headcount compared day-to-day.</p>
              </div>
              <div className="my-6">
                <Charts3D data={stats.trends.map((t: any) => ({ label: t.date.substring(5), value: t.present, secondaryValue: t.absent }))} type="bar" />
              </div>
            </div>

            <div className="glass-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-2">Today's Attendance Ratio (3D Donut)</h3>
                <p className="text-xs text-white/40">Headcount percentage proportions.</p>
              </div>
              <div className="my-6">
                <Charts3D 
                  data={[
                    { label: 'Present', value: stats.summary.presentToday },
                    { label: 'Late', value: stats.summary.lateToday },
                    { label: 'Half Day', value: stats.summary.halfDayToday },
                    { label: 'Leave', value: stats.summary.leaveToday },
                    { label: 'Absent', value: stats.summary.absentToday },
                  ].filter(d => d.value > 0)} 
                  type="donut" 
                />
              </div>
            </div>
          </div>

          {/* Performance Ranking */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Top Employee Hours Ranking (This Month)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 text-xs uppercase font-mono">
                    <th className="pb-3 pl-4">Rank</th>
                    <th className="pb-3">Employee</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Designation</th>
                    <th className="pb-3 text-right pr-4">Total Logged Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.rankings.map((emp: any, idx: number) => (
                    <tr key={emp.employeeId} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="py-3 pl-4 font-mono font-bold text-cyber-blue">#{idx + 1}</td>
                      <td className="py-3 font-semibold text-white">{emp.name} <span className="text-xs text-white/30">({emp.employeeId})</span></td>
                      <td className="py-3 text-white/60">{emp.department}</td>
                      <td className="py-3 text-white/50">{emp.designation}</td>
                      <td className="py-3 text-right pr-4 font-mono font-bold text-emerald-400">{emp.totalHours} hrs</td>
                    </tr>
                  ))}
                  {stats.rankings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-white/30 font-mono text-xs">No hours recorded this month yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* TAB PANEL: EMPLOYEES */}
      {/* ==================================================== */}
      {currentTab === 'employees' && (
        <div className="space-y-6">
          
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                type="text"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="w-full glass-input pl-11 py-2 text-sm"
                placeholder="Search by ID, name, or department..."
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <select
                value={empDeptFilter}
                onChange={(e) => setEmpDeptFilter(e.target.value)}
                className="glass-input py-2 text-sm bg-slate-950/80 cursor-pointer"
              >
                <option value="All">All Departments</option>
                {departmentsList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setIsEditingEmp(false);
                  setEmpForm({
                    employeeName: '',
                    employeeId: '',
                    department: '',
                    designation: '',
                    mobileNumber: '',
                    email: '',
                    joiningDate: new Date().toISOString().split('T')[0],
                    username: '',
                    password: '',
                    profilePhoto: ''
                  });
                  setShowEmpForm(true);
                }}
                className="glass-btn flex items-center gap-1.5 py-2 text-sm font-semibold"
              >
                <UserPlus size={16} />
                Add Employee
              </button>
            </div>
          </div>

          {/* Modal / Form Overlay */}
          {showEmpForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-cyber-dark/80 backdrop-blur-sm">
              <div className="w-full max-w-2xl glass-card p-6 border border-white/10 relative max-h-[90vh] overflow-y-auto">
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={() => setShowEmpForm(false)} 
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <X size={16} />
                  </button>
                </div>

                <h3 className="text-xl font-bold text-white mb-6">
                  {isEditingEmp ? `Edit Employee Details: ${empForm.employeeName}` : 'Register New Employee Account'}
                </h3>

                <form onSubmit={handleEmpSubmit} className="space-y-4 text-left">
                  {/* Photo upload row */}
                  <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                      {empForm.profilePhoto ? (
                        <img src={empForm.profilePhoto} alt="Upload Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="text-white/20" size={24} />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/50 mb-1 cursor-pointer">Profile Photo (JPEG/PNG)</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        className="text-xs text-white/60 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white file:cursor-pointer hover:file:bg-white/15" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/50">Full Employee Name</label>
                      <input
                        type="text"
                        required
                        value={empForm.employeeName}
                        onChange={(e) => setEmpForm(prev => ({ ...prev, employeeName: e.target.value }))}
                        className="w-full glass-input py-2 text-sm"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/50">Employee ID</label>
                      <input
                        type="text"
                        required
                        disabled={isEditingEmp}
                        value={empForm.employeeId}
                        onChange={(e) => setEmpForm(prev => ({ ...prev, employeeId: e.target.value.toUpperCase() }))}
                        className="w-full glass-input py-2 text-sm disabled:opacity-50"
                        placeholder="EMP001"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/50">Department</label>
                      <input
                        type="text"
                        required
                        value={empForm.department}
                        onChange={(e) => setEmpForm(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full glass-input py-2 text-sm"
                        placeholder="Engineering"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/50">Designation</label>
                      <input
                        type="text"
                        required
                        value={empForm.designation}
                        onChange={(e) => setEmpForm(prev => ({ ...prev, designation: e.target.value }))}
                        className="w-full glass-input py-2 text-sm"
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/50">Email Address</label>
                      <input
                        type="email"
                        required
                        value={empForm.email}
                        onChange={(e) => setEmpForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full glass-input py-2 text-sm"
                        placeholder="john.doe@company.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/50">Mobile Number</label>
                      <input
                        type="text"
                        value={empForm.mobileNumber}
                        onChange={(e) => setEmpForm(prev => ({ ...prev, mobileNumber: e.target.value }))}
                        className="w-full glass-input py-2 text-sm"
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/50">Joining Date</label>
                      <input
                        type="date"
                        value={empForm.joiningDate}
                        onChange={(e) => setEmpForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                        className="w-full glass-input py-2 text-sm cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/50">System Username</label>
                      <input
                        type="text"
                        required
                        disabled={isEditingEmp}
                        value={empForm.username}
                        onChange={(e) => setEmpForm(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full glass-input py-2 text-sm disabled:opacity-50"
                        placeholder="johndoe"
                      />
                    </div>
                    {!isEditingEmp && (
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-semibold text-white/50">Password</label>
                        <input
                          type="password"
                          required
                          value={empForm.password}
                          onChange={(e) => setEmpForm(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full glass-input py-2 text-sm"
                          placeholder="Password credentials..."
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full glass-btn mt-6 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Writing Database Records...
                      </>
                    ) : (
                      <>
                        {isEditingEmp ? 'Apply Edits' : 'Complete Onboarding'}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((emp) => (
              <div key={emp.employeeId} className="glass-card p-6 flex flex-col justify-between hover:border-white/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {emp.profilePhoto ? (
                      <img src={emp.profilePhoto} alt={emp.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={20} className="text-cyber-blue" />
                    )}
                  </div>
                  <div className="text-left">
                    <h4 className="text-base font-bold text-white leading-tight">{emp.name}</h4>
                    <span className="text-xs text-cyber-blue font-mono font-semibold">{emp.employeeId}</span>
                    <p className="text-xs text-white/60 mt-1">{emp.designation} ({emp.department})</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5 text-left text-xs text-white/50 font-mono">
                  <p>Email: <span className="text-white/70">{emp.email}</span></p>
                  <p>Mobile: <span className="text-white/70">{emp.mobileNumber || '-'}</span></p>
                  <p>Joined: <span className="text-white/70">{emp.joiningDate}</span></p>
                  <p className="flex items-center gap-1.5">
                    Account Status: 
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      emp.status === 'suspended' 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {emp.status}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-6 justify-end pt-4 border-t border-white/5">
                  <button
                    onClick={() => handleEditClick(emp)}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-cyber-blue hover:bg-cyber-blue/10 hover:border-cyber-blue/20 transition-all"
                    title="Edit employee details"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleSuspendToggle(emp.employeeId, emp.status)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      emp.status === 'suspended' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                    }`}
                    title={emp.status === 'suspended' ? 'Activate employee' : 'Suspend employee'}
                  >
                    {emp.status === 'suspended' ? 'Activate' : 'Suspend'}
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(emp.employeeId)}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                    title="Permanently remove employee"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {filteredEmployees.length === 0 && (
              <div className="col-span-full py-16 text-center glass-card border-dashed">
                <Users className="mx-auto text-white/10 mb-2" size={36} />
                <p className="text-white/40 font-mono text-sm">No employees match your search constraints.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* TAB PANEL: LEAVES */}
      {/* ==================================================== */}
      {currentTab === 'leaves' && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Employee Leave Request Queue</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs uppercase font-mono">
                  <th className="pb-3 pl-4">Employee</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Leave Range</th>
                  <th className="pb-3">Reason</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((lv) => (
                  <tr key={lv.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="py-4 pl-4">
                      <p className="font-semibold text-white">{lv.employeeName}</p>
                      <span className="text-xs text-cyber-blue font-mono">{lv.employeeId}</span>
                    </td>
                    <td className="py-4 text-white/60">{lv.department}</td>
                    <td className="py-4 font-mono text-white/70">
                      {lv.startDate} to {lv.endDate}
                    </td>
                    <td className="py-4 text-white/60 max-w-xs truncate" title={lv.reason}>
                      {lv.reason}
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                        lv.status === 'Approved' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : lv.status === 'Rejected'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {lv.status}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-4">
                      {lv.status === 'Pending' ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleLeaveDecision(lv.id, 'Approved')}
                            className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all"
                            title="Approve Leave"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => handleLeaveDecision(lv.id, 'Rejected')}
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all"
                            title="Reject Leave"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-white/30 text-xs font-mono">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-white/30 font-mono text-xs">No leave requests logged in database.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB PANEL: REPORTS */}
      {/* ==================================================== */}
      {currentTab === 'reports' && (
        <div className="space-y-6">
          
          {/* Filters controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Daily Report Card */}
            <div className="glass-card p-6">
              <h3 className="text-base font-bold text-white mb-2">Daily Attendance Logs</h3>
              <p className="text-xs text-white/40 mb-4">View comprehensive logs for a single day.</p>
              
              <div className="flex gap-3 mb-6">
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="glass-input py-2 text-sm flex-1 cursor-pointer"
                />
                <button
                  onClick={() => handleExportCSV('daily')}
                  className="glass-btn flex items-center gap-1.5 py-2 text-xs font-semibold"
                >
                  <Download size={14} />
                  Export CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="glass-btn-secondary flex items-center gap-1.5 py-2 text-xs font-semibold"
                >
                  Print PDF
                </button>
              </div>

              {dailyReportData ? (
                <div className="space-y-4 text-left">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded bg-white/5 border border-white/5">
                      <p className="text-white/40">Present</p>
                      <p className="text-emerald-400 font-bold mt-1">{dailyReportData.summary.present + dailyReportData.summary.late}</p>
                    </div>
                    <div className="p-2 rounded bg-white/5 border border-white/5">
                      <p className="text-white/40">Leaves</p>
                      <p className="text-cyber-purple font-bold mt-1">{dailyReportData.summary.leave}</p>
                    </div>
                    <div className="p-2 rounded bg-white/5 border border-white/5">
                      <p className="text-white/40">Absent</p>
                      <p className="text-red-400 font-bold mt-1">{dailyReportData.summary.absent}</p>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-white/5 rounded-xl">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead className="bg-slate-950/60 sticky top-0 font-mono text-white/40 border-b border-white/5">
                        <tr>
                          <th className="p-2 pl-3">Employee</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">In/Out</th>
                          <th className="p-2 pr-3 text-right">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyReportData.records.map((r: any) => (
                          <tr key={r.employeeId} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-2 pl-3">
                              <p className="font-semibold text-white leading-none">{r.name}</p>
                              <span className="text-[10px] text-white/30 font-mono mt-0.5 block">{r.employeeId}</span>
                            </td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                r.status === 'Present' || r.status === 'Late'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : r.status === 'Half Day'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : r.status === 'Leave'
                                  ? 'bg-cyber-purple/10 text-cyber-purple'
                                  : 'bg-red-500/10 text-red-400'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="p-2 font-mono text-white/60">{r.entryTime}/{r.exitTime}</td>
                            <td className="p-2 pr-3 text-right font-mono text-white/70">{r.workingHours} hrs</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-white/30 text-xs font-mono">Querying report data...</div>
              )}
            </div>

            {/* Monthly Report Card */}
            <div className="glass-card p-6">
              <h3 className="text-base font-bold text-white mb-2">Monthly Aggregate Analytics</h3>
              <p className="text-xs text-white/40 mb-4">View compiled stats for a full month.</p>

              <div className="flex gap-3 mb-6">
                <input
                  type="month"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  className="glass-input py-2 text-sm flex-1 cursor-pointer"
                />
                <button
                  onClick={() => handleExportCSV('monthly')}
                  className="glass-btn flex items-center gap-1.5 py-2 text-xs font-semibold"
                >
                  <Download size={14} />
                  Export CSV
                </button>
              </div>

              {monthlyReportData ? (
                <div className="max-h-[320px] overflow-y-auto border border-white/5 rounded-xl">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead className="bg-slate-950/60 sticky top-0 font-mono text-white/40 border-b border-white/5">
                      <tr>
                        <th className="p-2 pl-3">Employee</th>
                        <th className="p-2 text-center">P/L/HD</th>
                        <th className="p-2 text-center">Leave/Abs</th>
                        <th className="p-2 pr-3 text-right">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyReportData.records.map((r: any) => (
                        <tr key={r.employeeId} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-2 pl-3">
                            <p className="font-semibold text-white leading-none">{r.name}</p>
                            <span className="text-[10px] text-white/30 font-mono mt-0.5 block">{r.employeeId}</span>
                          </td>
                          <td className="p-2 text-center text-white/60 font-mono">
                            {r.present}/{r.late}/{r.halfDay}
                          </td>
                          <td className="p-2 text-center text-white/60 font-mono">
                            {r.leave}/{r.absent}
                          </td>
                          <td className="p-2 pr-3 text-right font-mono font-bold text-cyber-blue">
                            {r.attendancePercentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-white/30 text-xs font-mono">Querying report data...</div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* TAB PANEL: AUDIT LOGS */}
      {/* ==================================================== */}
      {currentTab === 'logs' && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Security Compliance Audit Trail</h3>
            <span className="px-3 py-1 rounded bg-cyber-blue/10 border border-cyber-blue/20 text-xs font-mono text-cyber-blue flex items-center gap-1.5 animate-pulse">
              <ShieldAlert size={14} />
              REAL-TIME AUDITING ACTIVE
            </span>
          </div>

          <div className="max-h-[500px] overflow-y-auto border border-white/5 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/60 sticky top-0 text-white/40 font-mono border-b border-white/5">
                <tr>
                  <th className="py-3 pl-4">Timestamp</th>
                  <th className="py-3">Action Type</th>
                  <th className="py-3">Operator User</th>
                  <th className="py-3 pr-4">Details Summary</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 font-mono">
                    <td className="py-3 pl-4 text-white/40 text-[10px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className="text-cyber-purple font-bold font-sans uppercase text-[10px] tracking-wider">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 text-cyber-blue font-bold">{log.userId}</td>
                    <td className="py-3 pr-4 text-white/75 font-sans">{log.details}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-white/30 text-xs">No audit logs recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB PANEL: SETTINGS */}
      {/* ==================================================== */}
      {currentTab === 'settings' && settings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Office Rules Configurations */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="text-cyber-blue" size={20} />
              <h3 className="text-lg font-bold text-white">Office Hour & Attendance Policies</h3>
            </div>
            
            <form onSubmit={handleSettingsUpdate} className="space-y-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/50">Office Start Time</label>
                  <input
                    type="time"
                    required
                    value={settings.officeStartTime}
                    onChange={(e) => setSettings((prev: any) => ({ ...prev, officeStartTime: e.target.value }))}
                    className="w-full glass-input py-2 text-sm cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/50">Late Arrival Threshold</label>
                  <input
                    type="time"
                    required
                    value={settings.lateThresholdTime}
                    onChange={(e) => setSettings((prev: any) => ({ ...prev, lateThresholdTime: e.target.value }))}
                    className="w-full glass-input py-2 text-sm cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/50">Office End Time</label>
                  <input
                    type="time"
                    required
                    value={settings.officeEndTime}
                    onChange={(e) => setSettings((prev: any) => ({ ...prev, officeEndTime: e.target.value }))}
                    className="w-full glass-input py-2 text-sm cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/50">Max Late Entry Time</label>
                  <input
                    type="time"
                    required
                    value={settings.maxLateTime}
                    onChange={(e) => setSettings((prev: any) => ({ ...prev, maxLateTime: e.target.value }))}
                    className="w-full glass-input py-2 text-sm cursor-pointer"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-white/50">Required Work Hours (Min)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={24}
                    value={settings.minimumWorkHours}
                    onChange={(e) => setSettings((prev: any) => ({ ...prev, minimumWorkHours: Number(e.target.value) }))}
                    className="w-full glass-input py-2 text-sm"
                  />
                  <p className="text-[10px] text-white/30 font-mono mt-1">If worked hours fall below this threshold, status is rewritten to Half Day.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full glass-btn mt-6 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Applying timing config changes...
                  </>
                ) : (
                  <>
                    Save System Settings
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            
            {/* Admin Credentials change */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="text-cyber-purple" size={20} />
                <h3 className="text-lg font-bold text-white">Change Administrator Credentials</h3>
              </div>
              <p className="text-xs text-white/40 mb-6">Secures administrative login access credentials.</p>

              <form onSubmit={handleAdminCredsUpdate} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/50">New Admin Username</label>
                  <input
                    type="text"
                    value={newAdminUser}
                    onChange={(e) => setNewAdminUser(e.target.value)}
                    className="w-full glass-input py-2 text-sm"
                    placeholder="New admin username..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/50">New Admin Password</label>
                  <input
                    type="password"
                    value={newAdminPass}
                    onChange={(e) => setNewAdminPass(e.target.value)}
                    className="w-full glass-input py-2 text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full glass-btn from-cyber-purple/80 to-pink-500/80 shadow-cyber-purple/20 hover:shadow-cyber-purple/30 mt-6 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Updating cryptography keys...
                    </>
                  ) : (
                    <>
                      Save New Credentials
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Database Backup & Restore */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="text-amber-500" size={20} />
                <h3 className="text-lg font-bold text-white">Database Backup & Disaster Recovery</h3>
              </div>
              <p className="text-xs text-white/40 mb-6 font-sans">
                Exports all system documents (users, configurations, records, logs) as a portable JSON file, or restores database status from a backup file.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleBackup}
                  className="glass-btn-secondary py-3 text-xs flex items-center justify-center gap-1.5"
                >
                  <Download size={14} />
                  Backup Database
                </button>

                <div className="relative">
                  <label className="glass-btn-secondary py-3 text-xs flex items-center justify-center gap-1.5 cursor-pointer text-center h-full w-full">
                    <Upload size={14} />
                    Restore Database
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestore}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
