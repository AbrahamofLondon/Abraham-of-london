// lib/gtag.ts
export const GA_TRACKING_ID = 'G-XXXXXXXXXX'; // <-- Replace with your GA4 Measurement ID

// Log the pageview with the given URL
export const pageview = (url: string) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

// Log specific events you might want to track
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label: string;
  value: number;
}) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
