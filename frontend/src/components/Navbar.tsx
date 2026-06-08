import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { LogOut, User, Calendar, Settings, FileSpreadsheet, Users, ShieldAlert, Award } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, profile, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <nav className="sticky top-0 z-30 w-full px-6 py-4 backdrop-blur-md border-b border-white/10 bg-slate-950/60 shadow-glass shadow-slate-950/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Futuristic Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyber-blue to-cyber-purple flex items-center justify-center shadow-neon-blue">
            <span className="text-white font-extrabold text-lg tracking-wider">A</span>
            <div className="absolute inset-0 bg-white/20 rounded-xl animate-ping opacity-20 pointer-events-none" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold bg-gradient-to-r from-white via-cyber-silver to-cyber-blue bg-clip-text text-transparent tracking-tight leading-none">
              Aryan AttendanceX
            </h1>
            <span className="text-[10px] text-cyber-purple font-mono uppercase tracking-widest">3D Dashboard</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex items-center gap-2">
          {isAdmin ? (
            <>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentTab === 'dashboard'
                    ? 'bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 text-white border border-cyber-blue/30 shadow-glass-inset'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Award size={16} className={currentTab === 'dashboard' ? 'text-cyber-blue' : ''} />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentTab('employees')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentTab === 'employees'
                    ? 'bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 text-white border border-cyber-blue/30 shadow-glass-inset'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Users size={16} className={currentTab === 'employees' ? 'text-cyber-blue' : ''} />
                Directory
              </button>
              <button
                onClick={() => setCurrentTab('leaves')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentTab === 'leaves'
                    ? 'bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 text-white border border-cyber-blue/30 shadow-glass-inset'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Calendar size={16} className={currentTab === 'leaves' ? 'text-cyber-blue' : ''} />
                Leaves
              </button>
              <button
                onClick={() => setCurrentTab('reports')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentTab === 'reports'
                    ? 'bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 text-white border border-cyber-blue/30 shadow-glass-inset'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <FileSpreadsheet size={16} className={currentTab === 'reports' ? 'text-cyber-blue' : ''} />
                Reports
              </button>
              <button
                onClick={() => setCurrentTab('logs')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentTab === 'logs'
                    ? 'bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 text-white border border-cyber-blue/30 shadow-glass-inset'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <ShieldAlert size={16} className={currentTab === 'logs' ? 'text-cyber-blue' : ''} />
                Audit Logs
              </button>
              <button
                onClick={() => setCurrentTab('settings')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentTab === 'settings'
                    ? 'bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 text-white border border-cyber-blue/30 shadow-glass-inset'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Settings size={16} className={currentTab === 'settings' ? 'text-cyber-blue' : ''} />
                Settings
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCurrentTab('clock')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentTab === 'clock'
                    ? 'bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 text-white border border-cyber-blue/30 shadow-glass-inset'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Award size={16} className={currentTab === 'clock' ? 'text-cyber-blue' : ''} />
                Clock Portal
              </button>
              <button
                onClick={() => setCurrentTab('attendance')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentTab === 'attendance'
                    ? 'bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 text-white border border-cyber-blue/30 shadow-glass-inset'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Calendar size={16} className={currentTab === 'attendance' ? 'text-cyber-blue' : ''} />
                My Attendance
              </button>
              <button
                onClick={() => setCurrentTab('leaves')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentTab === 'leaves'
                    ? 'bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 text-white border border-cyber-blue/30 shadow-glass-inset'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Calendar size={16} className={currentTab === 'leaves' ? 'text-cyber-blue' : ''} />
                Leave Management
              </button>
            </>
          )}
        </div>

        {/* User profile details & Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
              {profile?.profilePhoto ? (
                <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-cyber-blue" />
              )}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-semibold text-white leading-none">
                {profile?.name || user.username}
              </p>
              <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest mt-0.5">
                {user.role}
              </p>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300 active:scale-95"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};
