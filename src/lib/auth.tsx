import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Role } from '@/types';

export interface AuthUser {
  role: Role;
  email: string;
  name: string;
  id: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (role: Role, email: string) => AuthUser;
  logout: () => void;
  canAccess: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'bmhs_auth_user';

const ADMIN_EMAILS = ['admin@bmhs.edu.pk', 'bismillahmodelhighschool@gmail.com'];

const ROLE_ACCESS: Record<Role, string[]> = {
  admin: [
    '/dashboard', '/students', '/teachers', '/parents', '/attendance',
    '/fees', '/results', '/classes', '/timetable', '/announcements', '/settings',
  ],
  teacher: ['/dashboard', '/attendance', '/results', '/timetable', '/announcements'],
  parent: ['/dashboard', '/results', '/fees', '/announcements'],
  student: ['/dashboard', '/results', '/timetable', '/announcements'],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* invalid */ }
    }
  }, []);

  function login(role: Role, email: string): AuthUser {
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase().trim());
    const effectiveRole: Role = isAdmin ? 'admin' : role;
    const name = isAdmin
      ? 'Shakeel Ahmad Faisal'
      : email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const newUser: AuthUser = { role: effectiveRole, email, name, id: crypto.randomUUID() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  function canAccess(path: string): boolean {
    if (!user) return false;
    const allowed = ROLE_ACCESS[user.role] || [];
    return allowed.includes(path);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
