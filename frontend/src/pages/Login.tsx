import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Lock, User, Terminal, Loader2, Sparkles } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (role: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleMode, setRoleMode] = useState<'admin' | 'employee'>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const role = await login(username, password);
      onLoginSuccess(role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    if (roleMode === 'admin') {
      setUsername('Aryan');
      setPassword('Aryanshah');
    } else {
      setUsername('EMP001');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-cyber-dark">
      
      {/* Background radial overlays for extra glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyber-blue/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-cyber-purple/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Futuristic Floating Dashboard Card */}
      <div className={`w-full max-w-md glass-card ${roleMode === 'admin' ? 'hover:border-cyber-blue/20 hover:shadow-neon-blue' : 'hover:border-cyber-purple/20 hover:shadow-neon-purple'} p-8 border border-white/10 relative z-10 transition-all duration-500`}>
        
        {/* Hologram Scanner Line Effect */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyber-blue to-transparent animate-pulse" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-cyber-blue/10 to-cyber-purple/10 border border-white/10 mb-4 animate-float">
            <Sparkles className={roleMode === 'admin' ? 'text-cyber-blue' : 'text-cyber-purple'} size={28} />
          </div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-white via-cyber-silver to-cyber-blue bg-clip-text text-transparent leading-none">
            Aryan AttendanceX
          </h2>
          <p className="text-xs text-white/50 tracking-wider uppercase font-mono mt-2">
            3D Employee Portal v1.0
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded-xl border border-white/5 mb-6">
          <button
            onClick={() => {
              setRoleMode('admin');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all duration-300 ${
              roleMode === 'admin'
                ? 'bg-cyber-blue/15 text-cyber-blue border border-cyber-blue/30 shadow-glass-inset'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            Admin Portal
          </button>
          <button
            onClick={() => {
              setRoleMode('employee');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all duration-300 ${
              roleMode === 'employee'
                ? 'bg-cyber-purple/15 text-cyber-purple border border-cyber-purple/30 shadow-glass-inset'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            Employee Portal
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/60 ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full glass-input pl-11"
                placeholder={roleMode === 'admin' ? 'Aryan' : 'Employee Username'}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/60 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-11"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full glass-btn mt-6 flex items-center justify-center gap-2 ${
              roleMode === 'admin'
                ? 'from-cyber-blue/80 to-indigo-500/80 shadow-cyber-blue/20 hover:shadow-cyber-blue/30'
                : 'from-cyber-purple/80 to-pink-500/80 shadow-cyber-purple/20 hover:shadow-cyber-purple/30'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Verifying Cryptography...
              </>
            ) : (
              <>
                Initialize Access Key
              </>
            )}
          </button>
        </form>

        {/* Credentials Helper Overlay */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <button
            type="button"
            onClick={handleFillDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            <Terminal size={12} className={roleMode === 'admin' ? 'text-cyber-blue' : 'text-cyber-purple'} />
            Auto-Fill Demo Credentials
          </button>
          <div className="mt-2 text-[10px] font-mono text-white/30">
            {roleMode === 'admin' ? (
              <span>Default credentials: Aryan / Aryanshah</span>
            ) : (
              <span>Requires onboarding a user via Admin Portal</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
