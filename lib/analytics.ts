// lib/analytics.ts

/**
 * Simple analytics tracking for form submissions and user interactions
 */

export type AnalyticsEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

export const trackEvent = (event: AnalyticsEvent): void => {
  // For Google Analytics 4
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
    });
  }

  // For Plausible Analytics
  if (typeof window !== "undefined" && (window as any).plausible) {
    (window as any).plausible(event.action, {
      props: {
        category: event.category,
        label: event.label,
        value: event.value,
      },
    });
  }

  // For development logging
  if (process.env.NODE_ENV === "development") {
    console.log("Analytics Event:", event);
  }
};

export const trackPageView = (url: string): void => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.log("Page View:", url);
  }
};

export const trackFormSubmission = (
  formName: string,
  success: boolean = true,
): void => {
  trackEvent({
    action: "form_submission",
    category: "Contact",
    label: `${formName} - ${success ? "success" : "failure"}`,
    value: success ? 1 : 0,
  });
};

export const trackDownload = (
  resourceName: string,
  resourceType: string,
): void => {
  trackEvent({
    action: "download",
    category: "Resource",
    label: resourceName,
    value: 1,
  });
};

// Simple server-side analytics for form submissions
export const logFormSubmission = async (formData: {
  name?: string;
  email?: string;
  subject?: string;
  success: boolean;
  error?: string;
}): Promise<void> => {
  // In a real implementation, you might send this to your analytics service
  // For now, we'll just log it and potentially send to a webhook

  const analyticsData = {
    timestamp: new Date().toISOString(),
    type: "form_submission",
    form: "contact",
    ...formData,
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("Form Submission:", analyticsData);
  }

  // Optional: Send to analytics webhook
  if (process.env.ANALYTICS_WEBHOOK_URL) {
    try {
      await fetch(process.env.ANALYTICS_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(analyticsData),
      });
    } catch (error) {
      console.error("Failed to send analytics data:", error);
    }
  }
};
