declare global {
  interface Window {
    // gtag accepts string event name and params object
    gtag?: (command: 'config' | 'event' | string, 
            targetId: string, 
            params?: Record<string, unknown>) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID && typeof window.gtag === 'function') {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Log specific events
export type GAEvent = {
  action: string;
  category: string;
  label: string;
  value?: number;
};

export const event = ({ action, category, label, value }: GAEvent) => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID && typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
};
