// lib/gtag.ts
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export const GA_TRACKING_ID = 'G-XXXXXXXXXX'; // 🔁 Replace with actual GA ID

type GTagEvent = {
  action: string;
  category: string;
  label: string;
  value: number;
};

export const pageview = (url: string): void => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

export const event = ({ action, category, label, value }: GTagEvent): void => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
};
