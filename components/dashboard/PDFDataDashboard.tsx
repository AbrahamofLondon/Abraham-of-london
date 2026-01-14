// components/dashboard/PDFDataDashboard.tsx
import React from 'react';
import { PDFDashboardProvider } from '@/contexts/PDFDashboardContext';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import LiveDataDashboard from './LiveDataDashboard';
import PDFDashboard from '@/components/PDFDashboard';

interface PDFDataDashboardProps {
  view?: 'dashboard' | 'analytics' | 'live';
  theme?: 'light' | 'dark';
  onPDFSelect?: (pdfId: string) => void;
}

export const PDFDataDashboard: React.FC<PDFDataDashboardProps> = ({
  view = 'dashboard',
  theme = 'light',
  onPDFSelect,
}) => {
  return (
    <AnalyticsProvider>
      <PDFDashboardProvider>
        {view === 'live' ? (
          <LiveDataDashboard 
            theme={theme}
            onPDFSelect={onPDFSelect}
          />
        ) : view === 'analytics' ? (
          <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
            <h2 className="text-2xl font-bold mb-6">PDF Analytics Dashboard</h2>
            {/* Add analytics components here */}
          </div>
        ) : (
          <PDFDashboard />
        )}
      </PDFDashboardProvider>
    </AnalyticsProvider>
  );
};

export default PDFDataDashboard;