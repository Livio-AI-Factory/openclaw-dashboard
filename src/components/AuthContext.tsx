'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  email: string;
  name: string;
  workspace: string;
  role: string;
  loginTime: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
}

const ADMIN_EMAILS = [
  'ashwin@golivio.com',
  'vignesh@golivio.com',
  'sagar@golivio.com',
  'navneet@golivio.com',
  'manju@golivio.com',
];

function getExpectedPassword(email: string): string {
  const firstname = email.split('@')[0].toLowerCase();
  return `${firstname}livio@2026`;
}

function getWorkspace(email: string): string {
  const firstname = email.split('@')[0].toLowerCase();
  return `${firstname}_workspace`;
}

function getName(email: string): string {
  const firstname = email.split('@')[0].toLowerCase();
  return firstname.charAt(0).toUpperCase() + firstname.slice(1);
}

const SESSION_KEY = 'livio_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  logout: () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        // Check 24h expiry
        if (Date.now() - parsed.loginTime < SESSION_DURATION) {
          setUser(parsed);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  // Auto-logout check every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        if (Date.now() - user.loginTime >= SESSION_DURATION) {
          logout();
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback((email: string, password: string): boolean => {
    const expected = getExpectedPassword(email.toLowerCase());
    if (password === expected) {
      const newUser: User = {
        email: email.toLowerCase(),
        name: getName(email),
        workspace: getWorkspace(email),
        role: ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'employee',
        loginTime: Date.now(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
      setUser(newUser);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const isAdmin = user ? ADMIN_EMAILS.includes(user.email) : false;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
