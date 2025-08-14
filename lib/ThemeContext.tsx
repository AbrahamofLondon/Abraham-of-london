// lib/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
Â  theme: Theme;
Â  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
Â  const [theme, setTheme] = useState<Theme>('light');

Â  useEffect(() => {
Â  Â  const storedTheme = localStorage.getItem('theme') as Theme;
Â  Â  if (storedTheme) {
Â  Â  Â  setTheme(storedTheme);
Â  Â  }
Â  }, []);

Â  const toggleTheme = () => {
Â  Â  const newTheme = theme === 'light' ? 'dark' : 'light';
Â  Â  setTheme(newTheme);
Â  Â  localStorage.setItem('theme', newTheme);
Â  Â  document.documentElement.className = newTheme;
Â  };

Â  useEffect(() => {
Â  Â  document.documentElement.className = theme;
Â  }, [theme]);

Â  return (
Â  Â  <ThemeContext.Provider value={{ theme, toggleTheme }}>
Â  Â  Â  {children}
Â  Â  </ThemeContext.Provider>
Â  );
};

export const useTheme = () => {
Â  const context = useContext(ThemeContext);
Â  if (context === undefined) {
Â  Â  throw new Error('useTheme must be used within a ThemeProvider');
Â  }
Â  return context;
};
