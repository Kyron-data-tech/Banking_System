import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  isSuperAdmin: () => boolean;
  isBankStaff: () => boolean;
  isCorporate: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (stored && token) setUser(JSON.parse(stored));
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    const userData: AuthUser = {
      id: data.userId,
      email: data.email,
      fullName: data.fullName,
      roles: data.roles || [],
    };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const hasRole = (role: string) => user?.roles?.includes(role) ?? false;
  const isSuperAdmin = () => hasRole('ROLE_BANK_SUPER_ADMIN');
  const isBankStaff = () => user?.roles?.some(r => r.startsWith('ROLE_BANK_')) ?? false;
  const isCorporate = () => user?.roles?.some(r => r.startsWith('ROLE_CORP_')) ?? false;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hasRole, isSuperAdmin, isBankStaff, isCorporate }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
