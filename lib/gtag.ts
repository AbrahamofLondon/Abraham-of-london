// lib/gtag.ts

// The gtag function can accept various commands, so we use a tuple type
// to represent the different argument signatures. This is more specific than 'any'.
type GtagArgs = 
  | ['config', string, { page_path: string }]
  | ['event', string, Record<string, unknown>]
  | [string, ...unknown[]]; // A fallback for other possible gtag commands

// Declare the gtag type on the Window object
declare global {
  interface Window {
    gtag: (...args: GtagArgs) => void;
  }
}

export const GA_TRACKING_ID: string = process.env.NEXT_PUBLIC_GA_ID ?? "";

// Track a pageview
export const pageview = (url: string): void => {
  if (!GA_TRACKING_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("config", GA_TRACKING_ID, {
    page_path: url,
  });
};

// Log specific events
export const event = (
  action: string,
  params: Record<string, unknown> // Changed 'any' to 'unknown'
): void => {
  if (!GA_TRACKING_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", action, params);
};