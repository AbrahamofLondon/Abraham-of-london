// contexts/AnalyticsContext.tsx
import React, { createContext, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { AnalyticsEvent } from '@/types/pdf-dashboard';

interface AnalyticsContextType {
  trackEvent: (event: AnalyticsEvent) => void;
  trackError: (error: Error | string, details?: any) => void;
  trackPageView: (path: string) => void;
  setUser: (userId: string, traits?: Record<string, any>) => void;
}

interface AnalyticsProviderProps {
  children: ReactNode;
  enabled?: boolean;
  debug?: boolean;
  endpoint?: string;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// CHANGE: Named function instead of arrow function
export function AnalyticsProvider({ 
  children, 
  enabled = true,
  debug = process.env.NODE_ENV === 'development',
  endpoint = '/api/analytics/event'
}: AnalyticsProviderProps) {
  const queueRef = useRef<AnalyticsEvent[]>([]);
  const userIdRef = useRef<string | null>(null);
  const userTraitsRef = useRef<Record<string, any>>({});

  // Helper to send events
  const sendEvent = useCallback(async (event: AnalyticsEvent) => {
    if (!enabled) return;
    
    if (debug) {
      console.log('📊 Analytics Event:', event);
    }
    
    const enrichedEvent = {
      ...event,
      userId: userIdRef.current,
      userTraits: userTraitsRef.current,
      timestamp: event.timestamp || new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedEvent)
      });
      
      if (!response.ok && debug) {
        console.warn('Analytics event failed:', response.status);
      }
    } catch (error) {
      if (debug) {
        console.warn('Analytics send failed, queueing:', error);
      }
      queueRef.current.push(enrichedEvent);
    }
  }, [enabled, debug, endpoint]);
  
  useEffect(() => {
    if (!enabled) return;
    
    const retryInterval = setInterval(() => {
      if (queueRef.current.length > 0) {
        const events = [...queueRef.current];
        queueRef.current = [];
        events.forEach(event => sendEvent(event));
      }
    }, 30000);
    
    return () => clearInterval(retryInterval);
  }, [enabled, sendEvent]);
  
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    sendEvent(event);
  }, [sendEvent]);
  
  const trackError = useCallback((error: Error | string, details?: any) => {
    if (!enabled) return;
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    if (debug) {
      console.error('📊 Error Tracked:', errorMessage, details);
    }
    
    trackEvent({
      name: 'error',
      properties: {
        message: errorMessage,
        details,
        stack: error instanceof Error ? error.stack : undefined
      }
    });
  }, [enabled, debug, trackEvent]);
  
  const trackPageView = useCallback((path: string) => {
    if (!enabled) return;
    
    trackEvent({
      name: 'page_view',
      properties: { path }
    });
  }, [enabled, trackEvent]);
  
  const setUser = useCallback((userId: string, traits?: Record<string, any>) => {
    userIdRef.current = userId;
    userTraitsRef.current = traits || {};
    
    trackEvent({
      name: 'identify',
      properties: { userId, traits }
    });
  }, [trackEvent]);
  
  useEffect(() => {
    if (!enabled) return;
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    trackPageView(path);
  }, [enabled, trackPageView]);
  
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    
    const handleRouteChange = () => {
      trackPageView(window.location.pathname);
    };
    
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [enabled, trackPageView]);
  
  const value: AnalyticsContextType = {
    trackEvent,
    trackError,
    trackPageView,
    setUser
  };
  
  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// CHANGE: Named export for hook (better for Fast Refresh)
export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}

// Keep default export for backward compatibility
export default AnalyticsProvider;