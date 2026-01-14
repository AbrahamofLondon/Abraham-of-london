// hooks/usePDFAnalytics.tsx
export const usePDFAnalytics = ({ enabled = true } = {}) => {
  const trackEvent = useCallback((event: string, data?: any) => {
    if (enabled) {
      console.log('Analytics Event:', event, data);
    }
  }, [enabled]);

  const trackError = useCallback((message: string, details?: any) => {
    if (enabled) {
      console.error('Analytics Error:', message, details);
    }
  }, [enabled]);

  return { trackEvent, trackError };
};