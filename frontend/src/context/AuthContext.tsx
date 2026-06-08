import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'employee';
  status: 'active' | 'suspended';
}

interface EmployeeProfile {
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  mobileNumber: string;
  email: string;
  joiningDate: string;
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  profile: EmployeeProfile | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<string>;
  logout: () => void;
  updateCredentials: (username?: string, password?: string) => Promise<void>;
  updateProfileState: (updates: Partial<EmployeeProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load auth details from local storage on mount
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedProfile = localStorage.getItem('profile');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<string> => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token: receivedToken, user: receivedUser, profile: receivedProfile } = response.data;

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      
      setToken(receivedToken);
      setUser(receivedUser);

      if (receivedProfile) {
        localStorage.setItem('profile', JSON.stringify(receivedProfile));
        setProfile(receivedProfile);
      } else {
        localStorage.removeItem('profile');
        setProfile(null);
      }

      return receivedUser.role;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed. Check your network or credentials.';
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const updateCredentials = async (username?: string, password?: string) => {
    try {
      await api.put('/auth/profile', { username, password });
      
      if (user && username) {
        const updatedUser = { ...user, username };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        if (profile) {
          const updatedProfile = { ...profile, username };
          localStorage.setItem('profile', JSON.stringify(updatedProfile));
          setProfile(updatedProfile);
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update credentials.';
      throw new Error(msg);
    }
  };

  const updateProfileState = (updates: Partial<EmployeeProfile>) => {
    if (profile) {
      const updatedProfile = { ...profile, ...updates };
      localStorage.setItem('profile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        login,
        logout,
        updateCredentials,
        updateProfileState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
