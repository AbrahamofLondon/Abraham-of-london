// lib/inner-circle/InnerCircleContext.tsx - CLIENT-SAFE VERSION
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

// NO Redis imports - client-side only

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

export const InnerCircleProvider: React.FC<InnerCircleProviderProps> = ({ children }) => {
  const [user, setUser] = useState<InnerCircleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize from localStorage on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
    }
  }, []);

  const login = (token: string, userData: InnerCircleUser) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('innerCircleToken', token);
      localStorage.setItem('innerCircleUser', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('innerCircleToken');
      localStorage.removeItem('innerCircleUser');
      setUser(null);
      router.push('/');
    }
  };

  const refreshUser = async () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('innerCircleToken');
    if (!token) {
      logout();
      return;
    }

    try {
      // Client-side API call to refresh user
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
    
    // Add your access logic here
    const protectedRoutes = [
      /^\/canon\/.*/,
      /^\/strategic-frameworks\/.*/,
    ];
    
    const isProtected = protectedRoutes.some(pattern => pattern.test(path));
    
    if (!isProtected) return true;
    
    // Check if user has access to this specific content
    return user.tier !== 'free'; // Example: free tier has no access
  };

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