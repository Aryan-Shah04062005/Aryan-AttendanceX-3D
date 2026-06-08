import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { 
  Sparkles, LogIn, LogOut, Loader2, CalendarPlus, 
  CheckCircle, AlertCircle, RefreshCw 
} from 'lucide-react';


interface EmployeeDashboardProps {
  currentTab: string;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ currentTab }) => {
  const { user, profile } = useAuth();

  
  // Data States
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [todayStatus, setTodayStatus] = useState<any>(null);
  
  // Interactive UI States
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Leave Form State
  const [leaveForm, setLeaveForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  // Profile credentials update

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const todayRes = await api.get('/attendance/today');
      setTodayStatus(todayRes.data);

      const attRes = await api.get('/attendance/my');
      setAttendance(attRes.data);

      const leavesRes = await api.get('/leaves');
      setLeaves(leavesRes.data);
    } catch (err) {
      console.error('Error fetching employee dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Clock in handler
  const handleClockIn = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/attendance/clock-in');
      setSuccess(res.data.message);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record check-in.');
    } finally {
      setActionLoading(false);
    }
  };

  // Clock out handler
  const handleClockOut = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/attendance/clock-out');
      setSuccess(res.data.message);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record check-out.');
    } finally {
      setActionLoading(false);
    }
  };

  // Leave submission
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason) {
      setError('Please provide a brief reason for your leave request.');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/leaves', leaveForm);
      setSuccess(res.data.message);
      setLeaveForm({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: ''
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setActionLoading(false);
    }
  };



  // Computations
  const totalDays = attendance.length;
  const presents = attendance.filter(r => r.status === 'Present' || r.status === 'Late' || r.status === 'Half Day').length;
  const lates = attendance.filter(r => r.status === 'Late').length;
  const halfDays = attendance.filter(r => r.status === 'Half Day').length;
  const absents = attendance.filter(r => r.status === 'Absent').length;

  const attendancePercentage = totalDays > 0 ? parseFloat((((presents) / totalDays) * 100).toFixed(1)) : 0;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-cyber-purple">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="text-sm font-mono uppercase tracking-widest animate-pulse">Initializing neural biometrics client...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6 select-none relative z-10">
      
      {/* Notifications Banner */}
      {(error || success) && (
        <div className="flex flex-col gap-2">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </span>
              <button onClick={() => setError('')}><LogIn size={14} className="rotate-185" /></button>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle size={16} />
                {success}
              </span>
              <button onClick={() => setSuccess('')}><LogIn size={14} className="rotate-185" /></button>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB PANEL: CLOCK PORTAL */}
      {/* ==================================================== */}
      {currentTab === 'clock' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Clock Terminal */}
          <div className="glass-card p-8 md:col-span-2 flex flex-col items-center justify-between text-center min-h-[350px]">
            <div className="w-full text-left flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white leading-none">Biometric Entry Clock</h3>
                <span className="text-[10px] text-cyber-purple font-mono uppercase tracking-widest mt-1 block">Live Synchronization</span>
              </div>
              <button 
                onClick={fetchData} 
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10"
                title="Force refresh status"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Glowing Digital Time */}
            <div className="my-8">
              <h1 className="text-6xl font-extrabold text-white font-mono tracking-widest text-neon-glow leading-none">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </h1>
              <p className="text-sm text-cyber-silver font-semibold mt-4">
                {time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                onClick={handleClockIn}
                disabled={actionLoading || !!todayStatus}
                className="glass-btn flex items-center justify-center gap-2 py-4 shadow-lg shadow-cyber-blue/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <LogIn size={18} />
                    Check In Entry
                  </>
                )}
              </button>

              <button
                onClick={handleClockOut}
                disabled={actionLoading || !todayStatus || !!todayStatus?.exitTime}
                className="glass-btn from-cyber-purple/80 to-pink-500/80 shadow-cyber-purple/10 hover:from-cyber-purple hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 py-4"
              >
                {actionLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <LogOut size={18} />
                    Check Out Exit
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Today's Status Summary */}
          <div className="glass-card p-6 flex flex-col justify-between h-full">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Today's Shift Status</h3>
            
            <div className="flex-1 flex flex-col justify-center gap-6 my-4 text-left">
              {todayStatus ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase border ${
                      todayStatus.status === 'Present' || todayStatus.status === 'Late'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : todayStatus.status === 'Half Day'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : todayStatus.status === 'Leave'
                        ? 'bg-cyber-purple/10 text-cyber-purple border-cyber-purple/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {todayStatus.status}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-white/5 pt-3">
                    <span className="text-xs text-white/40">Check In:</span>
                    <span className="text-sm font-semibold text-white font-mono">{todayStatus.entryTime || '-'}</span>
                  </div>

                  <div className="flex justify-between border-t border-white/5 pt-3">
                    <span className="text-xs text-white/40">Check Out:</span>
                    <span className="text-sm font-semibold text-white font-mono">{todayStatus.exitTime || '-'}</span>
                  </div>

                  <div className="flex justify-between border-t border-white/5 pt-3">
                    <span className="text-xs text-white/40">Total Hours:</span>
                    <span className="text-sm font-bold text-cyber-blue font-mono">{todayStatus.workingHours || 0} hrs</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="mx-auto text-white/10 mb-2 animate-bounce" size={28} />
                  <p className="text-white/40 text-xs font-mono">No entry logs recorded for today.</p>
                  <p className="text-[10px] text-cyber-purple mt-1 uppercase font-mono tracking-wider">Please clock in above</p>
                </div>
              )}
            </div>

            {/* Profile micro card */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                {profile?.profilePhoto ? (
                  <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Sparkles className="text-cyber-purple" size={16} />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{profile?.name || user?.username}</p>
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">{profile?.designation}</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* TAB PANEL: MY ATTENDANCE */}
      {/* ==================================================== */}
      {currentTab === 'attendance' && (
        <div className="space-y-6">
          
          {/* Stats Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            {/* Main Circle Gauge */}
            <div className="glass-card p-4 col-span-2 md:col-span-1 flex flex-col justify-between items-center text-center">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Attendance Rate</span>
              
              <div className="relative my-4 flex items-center justify-center">
                {/* SVG Gauge */}
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-white/5 fill-none" strokeWidth="6" />
                  <circle 
                    cx="40" cy="40" r="34" 
                    className="stroke-cyber-purple fill-none transition-all duration-1000" 
                    strokeWidth="6" 
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - attendancePercentage / 100)}`}
                  />
                </svg>
                <span className="absolute text-sm font-bold text-white">{attendancePercentage}%</span>
              </div>
              
              <span className="text-[10px] text-white/30 font-mono">Present Days / Active Shift</span>
            </div>

            <div className="glass-card p-4 flex flex-col justify-between">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Present Days</span>
              <div className="mt-4">
                <p className="text-2xl font-extrabold text-emerald-400">{presents - lates}</p>
                <span className="text-[10px] text-white/30">Regular Check-Ins</span>
              </div>
            </div>

            <div className="glass-card p-4 flex flex-col justify-between">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Late Check-Ins</span>
              <div className="mt-4">
                <p className="text-2xl font-extrabold text-amber-400">{lates}</p>
                <span className="text-[10px] text-white/30">Arrived after threshold</span>
              </div>
            </div>

            <div className="glass-card p-4 flex flex-col justify-between">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Half Days</span>
              <div className="mt-4">
                <p className="text-2xl font-extrabold text-indigo-400">{halfDays}</p>
                <span className="text-[10px] text-white/30">Worked hours &lt; 8hrs</span>
              </div>
            </div>

            <div className="glass-card p-4 flex flex-col justify-between">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Absent Days</span>
              <div className="mt-4">
                <p className="text-2xl font-extrabold text-red-400">{absents}</p>
                <span className="text-[10px] text-white/30">No check-in or max late</span>
              </div>
            </div>

          </div>

          {/* Historical Logs List */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Attendance Logs History</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 text-[10px] uppercase font-mono">
                    <th className="pb-3 pl-4">Date</th>
                    <th className="pb-3">Clock In</th>
                    <th className="pb-3">Clock Out</th>
                    <th className="pb-3">Worked Hours</th>
                    <th className="pb-3 pr-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 font-mono">
                      <td className="py-3 pl-4 text-white font-sans">{r.date}</td>
                      <td className="py-3 text-white/60">{r.entryTime || '-'}</td>
                      <td className="py-3 text-white/60">{r.exitTime || '-'}</td>
                      <td className="py-3 text-cyber-blue font-bold">{r.workingHours} hrs</td>
                      <td className="py-3 pr-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                          r.status === 'Present' || r.status === 'Late'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : r.status === 'Half Day'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : r.status === 'Leave'
                            ? 'bg-cyber-purple/10 text-cyber-purple border-cyber-purple/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-white/30 text-xs font-sans">No historical logs found in database.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* TAB PANEL: LEAVE MANAGEMENT */}
      {/* ==================================================== */}
      {currentTab === 'leaves' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Request Form */}
          <div className="glass-card p-6 md:col-span-1 h-fit">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
              <CalendarPlus className="text-cyber-purple" size={18} />
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">File Leave Request</h3>
            </div>
            
            <form onSubmit={handleLeaveSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/50">Start Date</label>
                <input
                  type="date"
                  required
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full glass-input py-2 text-sm cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/50">End Date</label>
                <input
                  type="date"
                  required
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full glass-input py-2 text-sm cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/50">Reason / Details</label>
                <textarea
                  required
                  rows={4}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full glass-input py-2 text-sm resize-none"
                  placeholder="Describe your reason for requesting leave..."
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full glass-btn from-cyber-purple/80 to-pink-500/80 shadow-cyber-purple/20 hover:shadow-cyber-purple/30 mt-4 flex items-center justify-center gap-2 py-3"
              >
                {actionLoading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    Submit File Request
                  </>
                )}
              </button>
            </form>
          </div>

          {/* History List */}
          <div className="glass-card p-6 md:col-span-2">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Leave Request History</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 text-[10px] uppercase font-mono">
                    <th className="pb-3 pl-4">Leave Range</th>
                    <th className="pb-3">Reason</th>
                    <th className="pb-3 text-right pr-4">Approval Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((lv) => (
                    <tr key={lv.id} className="border-b border-white/5 hover:bg-white/5 font-mono">
                      <td className="py-4 pl-4 text-white font-sans">
                        {lv.startDate} <span className="text-white/40">to</span> {lv.endDate}
                      </td>
                      <td className="py-4 text-white/60 max-w-xs truncate" title={lv.reason}>
                        {lv.reason}
                      </td>
                      <td className="py-4 pr-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                          lv.status === 'Approved' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : lv.status === 'Rejected'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {lv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-white/30 text-xs font-sans">No leave requests logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
