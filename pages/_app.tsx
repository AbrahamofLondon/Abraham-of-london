// pages/_app.tsx
import type { AppProps, NextWebVitalsMetric } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Script from "next/script";
import Head from "next/head";

import { ThemeProvider } from "@/lib/ThemeContext";
import { pageview, gaEnabled, gaEvent, GA_ID } from "@/lib/gtag";
import "@/styles/globals.css";
const ScrollProgress = dynamic(() => import("@/components/ScrollProgress"), { ssr: false });
const ThemeToggle = dynamic(() => import("@/components/ThemeToggle"), { ssr: false });

interface AnalyticsRouterTrackerProps {}

function AnalyticsRouterTracker(_props: AnalyticsRouterTrackerProps): JSX.Element | null {
  const router = useRouter();
  
  useEffect(() => {
    if (!gaEnabled || process.env.env.NODE_ENV !== "production") return;

    const handleRouteChange = (url: string): void => {
      pageview(url);
    };

    // Track initial pageview
    pageview(router.asPath);

    // Add event listeners
    router.events.on("routeChangeComplete", handleRouteChange);
    router.events.on("hashChangeComplete", handleRouteChange);

    // Cleanup function
    return (): void => {
      router.events.off("routeChangeComplete", handleRouteChange);
      router.events.off("hashChangeComplete", handleRouteChange);
    };
  }, [router]);

  return null;
}

export default function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  const isProd = process.env.NODE_ENV === "production";
  
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {gaEnabled && isProd && (
          <>
            <link rel="preconnect" href="https://www.googletagmanager.com" />
            <link 
              rel="preconnect" 
              href="https://www.google-analytics.com" 
              crossOrigin="anonymous" 
            />
          </>
        )}
      </Head>

      {gaEnabled && isProd && (
        <>
          <Script 
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} 
            strategy="afterInteractive" 
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { 
                anonymize_ip: true, 
                transport_type: 'beacon', 
                page_path: window.location.pathname 
              });
            `}
          </Script>
        </>
      )}

      <ThemeProvider>
        <AnalyticsRouterTracker />
        <ScrollProgress 
          zIndexClass="z-50" 
          colorClass="bg-emerald-600" 
          heightClass="h-1" 
        />
        <div className="fixed right-4 top-4 z-50 md:hidden">
          <ThemeToggle />
        </div>
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}

export function reportWebVitals(metric: NextWebVitalsMetric): void {
  if (!gaEnabled || process.env.NODE_ENV !== "production") return;
  
  const value = metric.name === "CLS" 
    ? Math.round(metric.value * 1000) 
    : Math.round(metric.value);
  
  try {
    gaEvent("web-vital", { 
      event_category: "Web Vitals",
      event_label: metric.label,
      value: value,
      non_interaction: true,
      // Include additional metric properties
      metric_id: metric.id,
      metric_name: metric.name,
      metric_delta: metric.delta,
      metric_rating: metric.rating || 'unknown'
    });
  } catch (error) {
    // Silent fail in production
    if (process.env.NODE_ENV === "development") {
      console.warn("GA event failed:", error);
    }
  }
}

// Add proper typing for global gtag function
declare global {
  interface Window {
    gtag: (
      command: string, 
      action: string, 
      params?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}