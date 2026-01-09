// pages/_app.tsx
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import Head from "next/head";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";

import "../styles/globals.scss"; // ✅ Global styles must live here (and only here)

import { ThemeProvider } from "@/lib/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth"; // Your existing admin auth
import { InnerCircleProvider } from "@/lib/inner-circle/InnerCircleContext"; // New provider

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

// Route protection middleware (client-side only)
function useRouteProtection() {
  const router = useRouter();
  
  useEffect(() => {
    // List of protected routes that require inner-circle access
    const protectedRoutes = [
      /^\/strategic-frameworks\/.*-canon/,
      /^\/strategic-frameworks\/ultimate-purpose/,
      /^\/canon\/.*/,
      /^\/inner-circle\/.*(?!locked|join|request)/,
    ];
    
    const currentPath = router.pathname;
    const isProtectedRoute = protectedRoutes.some(pattern => pattern.test(currentPath));
    
    if (isProtectedRoute && typeof window !== 'undefined') {
      // Check for inner-circle access token
      const token = localStorage.getItem('innerCircleToken');
      if (!token) {
        // Store the intended destination
        const returnTo = encodeURIComponent(router.asPath);
        router.push(`/inner-circle/locked?returnTo=${returnTo}`);
      }
    }
  }, [router]);
}

// Track page views for analytics
function usePageView() {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // GA/Plausible integration
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          page_path: url,
        });
      }
      
      // Track inner-circle access attempts
      const isProtected = url.includes('canon') || url.includes('strategic-frameworks');
      if (isProtected && typeof window !== 'undefined') {
        const token = localStorage.getItem('innerCircleToken');
        if (token) {
          // Log successful access
          console.log('Inner Circle access to:', url);
        }
      }
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);
}

// Performance monitoring
function usePerformanceMonitoring() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Report LCP, FID, CLS if needed
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log(`${entry.name}: ${entry.startTime}`);
        }
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      
      return () => observer.disconnect();
    }
  }, []);
}

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  usePageView();
  usePerformanceMonitoring();
  useRouteProtection(); // Add route protection

  const hasRecaptcha = useMemo(() => {
    return typeof RECAPTCHA_SITE_KEY === "string" && RECAPTCHA_SITE_KEY.trim().length > 10;
  }, []);

  // Check if we're on a protected route
  const isProtectedRoute = useMemo(() => {
    if (typeof window === 'undefined') return false;
    
    const protectedRoutes = [
      /^\/strategic-frameworks\/.*-canon/,
      /^\/strategic-frameworks\/ultimate-purpose/,
      /^\/canon\/.*/,
    ];
    
    return protectedRoutes.some(pattern => pattern.test(window.location.pathname));
  }, []);

  return (
    <>
      {/* Baseline document head defaults (safe in _app) */}
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Add security headers */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'unsafe-inline';" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </Head>

      {/* ✅ reCAPTCHA v3 should live in _app via next/script (NOT in _document) */}
      {hasRecaptcha ? (
        <Script
          id="recaptcha-v3"
          src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
            RECAPTCHA_SITE_KEY!.trim()
          )}`}
          strategy="afterInteractive"
          onLoad={() => {
            console.log('reCAPTCHA loaded successfully');
          }}
        />
      ) : null}

      {/* Optional: Load inner-circle token restoration script */}
      <Script
        id="inner-circle-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Restore inner-circle session if available
              if (typeof window !== 'undefined') {
                const token = localStorage.getItem('innerCircleToken');
                if (token) {
                  // Validate token on load
                  try {
                    const decoded = JSON.parse(atob(token.split('.')[1]));
                    const now = Date.now() / 1000;
                    
                    if (decoded.exp < now) {
                      // Token expired
                      localStorage.removeItem('innerCircleToken');
                      localStorage.removeItem('innerCircleUser');
                      console.log('Inner Circle token expired');
                    } else {
                      // Token valid
                      console.log('Inner Circle session restored');
                    }
                  } catch (error) {
                    console.error('Invalid inner-circle token');
                    localStorage.removeItem('innerCircleToken');
                    localStorage.removeItem('innerCircleUser');
                  }
                }
              }
            })();
          `
        }}
      />

      <SessionProvider session={session}>
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            {/* Wrap with InnerCircleProvider for context access */}
            <InnerCircleProvider>
              {/* Show loading state for protected routes */}
              {isProtectedRoute ? (
                <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
                  <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-slate-400">Verifying access...</p>
                  </div>
                </div>
              ) : null}
              
              <Component {...pageProps} />
            </InnerCircleProvider>
          </AuthProvider>
        </ThemeProvider>
      </SessionProvider>
    </>
  );
}