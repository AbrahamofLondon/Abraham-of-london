/* contexts/PDFDashboardContext.tsx - PDF ANALYTICS DASHBOARD CONTEXT */

import React, { createContext, useContext, ReactNode } from 'react';
import { usePDFDashboard } from '@/hooks/usePDFDashboard-impl';
import type { UsePDFDashboardReturn } from '@/types/pdf-dashboard';

// Create context with proper typing
const PDFDashboardContext = createContext<UsePDFDashboardReturn | undefined>(undefined);

interface PDFDashboardProviderProps {
  children: ReactNode;
  options?: {
    initialViewMode?: 'list' | 'grid' | 'detail';
    defaultCategory?: string;
    autoRefreshInterval?: number;
    enableAutoRefresh?: boolean;
    maxItems?: number;
  };
}

export const PDFDashboardProvider: React.FC<PDFDashboardProviderProps> = ({ 
  children, 
  options = {} 
}) => {
  const dashboard = usePDFDashboard(options);
  
  return (
    <PDFDashboardContext.Provider value={dashboard}>
      {children}
    </PDFDashboardContext.Provider>
  );
};

// Custom hook to use the PDF Dashboard context
export const usePDFDashboardContext = (): UsePDFDashboardReturn => {
  const context = useContext(PDFDashboardContext);
  if (!context) {
    throw new Error('usePDFDashboardContext must be used within PDFDashboardProvider');
  }
  return context;
};

// Export the context for direct usage if needed
export { PDFDashboardContext };