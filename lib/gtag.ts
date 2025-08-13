// lib/gtag.ts
// Google Analytics 4 tracking utilities with TypeScript support

declare global {
  interface Window {
    gtag: (
      command: "config" | "event",
      targetId: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

export const GA_TRACKING_ID: string | undefined = process.env.NEXT_PUBLIC_GA_ID;

const isProduction =
  typeof window !== "undefined" &&
  typeof window.gtag === "function" &&
  Boolean(GA_TRACKING_ID) &&
  process.env.NODE_ENV === "production";

export const pageview = (url: string): void => {
  if (!isProduction) return;
  window.gtag("config", GA_TRACKING_ID as string, {
    page_path: url,
  });
};

export interface GTagEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export const event = ({ action, category, label, value }: GTagEvent): void => {
  if (!isProduction) return;
  window.gtag("event", GA_TRACKING_ID as string, {
    event_category: category,
    event_label: label,
    value,
  });
};
