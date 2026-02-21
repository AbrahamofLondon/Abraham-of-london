// lib/inner-circle/InnerCircleContext.tsx — INSTITUTIONAL GRADE
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Router from 'next/router'; // ✅ Safe singleton

interface InnerCircleUser {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  expiresAt: number;
  createdAt: number;
}

interface InnerCircleContextType {
  user: InnerCircleUser | null;
  isLoading: boolean;
  login: (token: string, userData: InnerCircleUser) => void;
  logout: () => void;
  checkAccess: (path: string) => boolean;
  refreshUser: () => Promise<void>;
}

const InnerCircleContext = createContext<InnerCircleContextType | undefined>(undefined);

export const useInnerCircle = () => {
  const context = useContext(InnerCircleContext);
  if (!context) {
    throw new Error('useInnerCircle must be used within InnerCircleProvider');
  }
  return context;
};

interface InnerCircleProviderProps {
  children: ReactNode;
}

// Safe navigation helper (prevents server-side execution)
function safeNavigate(path: string) {
  if (typeof window === 'undefined') return;
  Router.replace(path);
}

export const InnerCircleProvider: React.FC<InnerCircleProviderProps> = ({ children }) => {
  const [user, setUser] = useState<InnerCircleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize from localStorage on client
  useEffect(() => {
    if (!mounted) return;

    const token = localStorage.getItem('innerCircleToken');
    const userStr = localStorage.getItem('innerCircleUser');
    
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        // Check if token is expired
        if (userData.expiresAt > Date.now() / 1000) {
          setUser(userData);
        } else {
          localStorage.removeItem('innerCircleToken');
          localStorage.removeItem('innerCircleUser');
        }
      } catch (error) {
        console.error('Error parsing inner circle user:', error);
        localStorage.removeItem('innerCircleToken');
        localStorage.removeItem('innerCircleUser');
      }
    }
    setIsLoading(false);
  }, [mounted]);

  const login = (token: string, userData: InnerCircleUser) => {
    if (!mounted) return;
    localStorage.setItem('innerCircleToken', token);
    localStorage.setItem('innerCircleUser', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    if (!mounted) return;
    localStorage.removeItem('innerCircleToken');
    localStorage.removeItem('innerCircleUser');
    setUser(null);
    safeNavigate('/'); // SPA-smooth navigation
  };

  const refreshUser = async () => {
    if (!mounted) return;
    
    const token = localStorage.getItem('innerCircleToken');
    if (!token) {
      logout();
      return;
    }

    try {
      const response = await fetch('/api/inner-circle/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('innerCircleToken', data.token);
        localStorage.setItem('innerCircleUser', JSON.stringify(data.user));
        setUser(data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const checkAccess = (path: string): boolean => {
    if (!user) return false;

    // ✅ Fixed regex patterns for actual routes
    const protectedRoutes = [
      /^\/canon\/.*/i,
      /^\/resources\/strategic-frameworks\/.*/i,
      /^\/vault\/.*/i,
    ];

    const isProtected = protectedRoutes.some((pattern) => pattern.test(path));
    if (!isProtected) return true;

    return user.tier !== 'free';
  };

  // During SSR/prerender, return children without any logic
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <InnerCircleContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        checkAccess,
        refreshUser,
      }}
    >
      {children}
    </InnerCircleContext.Provider>
  );
};