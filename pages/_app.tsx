import "@/styles/globals.css"; // ✅ MUST be the very first line of execution
import type { AppProps, NextWebVitalsMetric } from "next/app";
import { useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Script from "next/script";
import Head from "next/head";

import { ThemeProvider } from "@/lib/ThemeContext";
import { pageview, gaEnabled, gaEvent, GA_ID } from "@/lib/gtag";

import ThemeToggle from "@/components/ThemeToggle";

const ScrollProgress = dynamic(() => import("@/components/ScrollProgress"), { ssr: false });

/**
 * Component to track Next.js router events for Google Analytics page views.
 */
function AnalyticsRouterTracker() {
  const router = useRouter();
  
  const handleRouteChange = useCallback((url: string) => {
    if (gaEnabled && process.env.NODE_ENV === "production") {
      pageview(url);
    }
  }, [router.asPath]);

  useEffect(() => {
    handleRouteChange(router.asPath);
    
    router.events.on("routeChangeComplete", handleRouteChange);
    router.events.on("hashChangeComplete", handleRouteChange);
    
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
      router.events.off("hashChangeComplete", handleRouteChange);
    };
  }, [router.events, router.asPath, handleRouteChange]);

  return null;
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const isProd = process.env.NODE_ENV === "production";
  const shouldLoadGa = gaEnabled && isProd;

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
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
          <Script 
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} 
            strategy="afterInteractive" 
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true, transport_type: 'beacon' }); 
            `}
          </Script>
        </>
      )}

      {/* Application Content and Global Context */}
      <ThemeProvider>
        <AnalyticsRouterTracker />

        <div 
          className="fixed right-4 top-20 z-[60] md:hidden" 
          style={{ pointerEvents: 'auto' }}
        >
          <ThemeToggle />
        </div>

        <ScrollProgress zIndexClass="z-50" colorClass="bg-emerald-600" heightClass="h-1" />
        
        <Component {...pageProps} />
        
      </ThemeProvider>
    </>
  );
}

/**
 * Web Vitals reporting to Google Analytics.
 */
export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (!gaEnabled || process.env.NODE_ENV === "development") return;
  
  const value = Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value);
  
  try {
    gaEvent("web-vital", { 
      id: metric.id, 
      name: metric.name, 
      label: metric.label, 
      value 
    });
  } catch (error) {
    // silent fail
  }
}