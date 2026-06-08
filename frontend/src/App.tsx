import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ParticleBackground } from './components/ParticleBackground.js';
import { Navbar } from './components/Navbar.js';
import { Login } from './pages/Login.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import { EmployeeDashboard } from './pages/EmployeeDashboard.js';
import { Loader2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('');

  // Auto initialize tabs on login state changes
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setCurrentTab('dashboard');
      } else {
        setCurrentTab('clock');
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-cyber-dark text-cyber-blue">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="text-sm font-mono uppercase tracking-widest animate-pulse">Establishing secure session connection...</p>
      </div>
    );
  }

  return (
    <>
      {/* 3D Drifting Particle Background */}
      <ParticleBackground />

      {!user ? (
        <Login onLoginSuccess={(role) => setCurrentTab(role === 'admin' ? 'dashboard' : 'clock')} />
      ) : (
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
          
          <main className="flex-1 flex flex-col w-full">
            {user.role === 'admin' ? (
              <AdminDashboard currentTab={currentTab} />
            ) : (
              <EmployeeDashboard currentTab={currentTab} />
            )}
          </main>
        </div>
      )}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
