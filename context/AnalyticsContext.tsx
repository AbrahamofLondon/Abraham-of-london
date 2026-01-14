// contexts/AnalyticsContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { AnalyticsEvent } from '@/types/pdf-dashboard';

interface AnalyticsContextType {
  trackEvent: (event: AnalyticsEvent) => void;
  trackError: (error: Error | string, details?: any) => void;
  trackPageView: (path: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ 
  children: ReactNode; 
  enabled?: boolean 
}> = ({ children, enabled = true }) => {
  
  const trackEvent = (event: AnalyticsEvent) => {
    if (!enabled) return;
    
    console.log('📊 Analytics Event:', event);
    
    // Send to your analytics service
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      })
    }).catch(console.error);
  };
  
  const trackError = (error: Error | string, details?: any) => {
    if (!enabled) return;
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    console.error('📊 Error Tracked:', errorMessage, details);
    
    trackEvent({
      name: 'error',
      properties: {
        message: errorMessage,
        details,
        stack: error instanceof Error ? error.stack : undefined
      }
    });
  };
  
  const trackPageView = (path: string) => {
    if (!enabled) return;
    
    trackEvent({
      name: 'page_view',
      properties: { path }
    });
  };
  
  return (
    <AnalyticsContext.Provider value={{ trackEvent, trackError, trackPageView }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
};