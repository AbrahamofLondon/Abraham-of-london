// contexts/PDFDashboardContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { usePDFDashboard } from '@/hooks/usePDFDashboard';
import { UsePDFDashboardReturn } from '@/types/pdf-dashboard';

const PDFDashboardContext = createContext<UsePDFDashboardReturn | undefined>(undefined);

export const PDFDashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dashboard = usePDFDashboard();
  
  return (
    <PDFDashboardContext.Provider value={dashboard}>
      {children}
    </PDFDashboardContext.Provider>
  );
};

export const usePDFDashboardContext = () => {
  const context = useContext(PDFDashboardContext);
  if (!context) {
    throw new Error('usePDFDashboardContext must be used within PDFDashboardProvider');
  }
  return context;
};