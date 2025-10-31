// pages/_app.tsx
import type { AppProps, NextWebVitalsMetric } from "next/app";
import { useEffect, useCallback } from "react"; // 💡 UPGRADE: Import useCallback
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Script from "next/script";
import Head from "next/head";

import { ThemeProvider } from "@/lib/ThemeContext";
// 🔑 CRITICAL: Ensure gtag import path is correct and accessible
import { pageview, gaEnabled, gaEvent, GA_ID } from "@/lib/gtag";

// Assuming ThemeToggle path based on standard structure
import ThemeToggle from "@/components/ThemeToggle";

// 💡 UPGRADE: Using Next.js standard type for dynamic components
const ScrollProgress = dynamic(() => import("@/components/ScrollProgress"), { ssr: false });

/**
 * Component to track Next.js router events for Google Analytics page views.
 * Runs only in production if GA is enabled.
 */
function AnalyticsRouterTracker() {
  const router = useRouter();
  
  // 💡 UPGRADE: Use useCallback for event handler stability
  const handleRouteChange = useCallback((url: string) => {
    // Only track if GA is enabled and we are in production
    if (gaEnabled && process.env.NODE_ENV === "production") {
      pageview(url);
    }
  }, []);

  useEffect(() => {
    // Initial page view (since 'routeChangeComplete' doesn't fire on initial load)
    handleRouteChange(router.asPath); 
    
    // Attach event listeners
    router.events.on("routeChangeComplete", handleRouteChange);
    router.events.on("hashChangeComplete", handleRouteChange);
    
    // Cleanup event listeners on component unmount
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
      router.events.off("hashChangeComplete", handleRouteChange);
    };
  }, [router.events, router.asPath, handleRouteChange]); // 💡 UPGRADE: Dependency array cleanup

  return null;
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const isProd = process.env.NODE_ENV === "production";
  const shouldLoadGa = gaEnabled && isProd; // Unified condition

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* 💡 UPGRADE: Unified preconnect links */}
        {shouldLoadGa && (
          <>
            <link rel="preconnect" href="https://www.googletagmanager.com" />
            <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" /> 
          </>
        )}
      </Head>

      {/* Google Analytics Scripts */}
      {shouldLoadGa && (
        <>
          {/* Main GA script with afterInteractive strategy */}
          <Script 
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} 
            strategy="afterInteractive" 
          />
          {/* Inline script for initialization */}
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              // 💡 UPGRADE: Ensuring transport_type is consistent with recommended beacon usage
              gtag('config', '${GA_ID}', { anonymize_ip: true, transport_type: 'beacon' }); 
            `}
          </Script>
        </>
      )}

      {/* Application Content and Global Context */}
      <ThemeProvider>
        {/* 💡 UPGRADE: Call the tracker inside ThemeProvider but outside main content */}
        <AnalyticsRouterTracker />

        {/* Mobile-only ThemeToggle, placed globally */}
        <div 
          className="fixed right-4 top-20 z-[60] md:hidden" 
          style={{ pointerEvents: 'auto' }} // 💡 FIX: Explicitly set pointer-events style if needed
        >
          <ThemeToggle />
        </div>

        {/* Global UI Components */}
        <ScrollProgress zIndexClass="z-50" colorClass="bg-emerald-600" heightClass="h-1" />
        
        {/* The main page component */}
        <Component {...pageProps} />
        
      </ThemeProvider>
    </>
  );
}

/**
 * Web Vitals reporting to Google Analytics.
 */
export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (!gaEnabled || process.env.NODE_ENV !== "production") return;
  
  // 💡 UPGRADE: Simplified value calculation for clarity
  const value = Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value);
  
  try {
    gaEvent("web-vital", { 
      id: metric.id, 
      name: metric.name, 
      label: metric.label, 
      value 
    });
  } catch (error) {
    // console.error("Error reporting Web Vitals:", error); // Could log this for debugging
  }
}