// pages/_app.tsx - FIXED IMPORTS
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";

// Font configuration
import { fontVariables, fontBodyClass } from "@/lib/next-fonts";

// Styles
import "@/styles/tailwind.css";

// Context providers
import { ThemeProvider } from "@/lib/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import { InnerCircleProvider } from "@/lib/inner-circle/InnerCircleContext";

// FIX: Update import paths to match actual folders
import { PDFDashboardProvider } from '@/contexts/PDFDashboardContext';  // ✅ plural "contexts"
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';        // ✅ plural "contexts"

// Types
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

// Custom hooks for route protection and analytics
function useRouteProtection() {
  const router = useRouter();
  
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // List of protected routes that require Inner Circle access
      const protectedRoutes = [
        /^\/strategic-frameworks\/.*-canon/,
        /^\/strategic-frameworks\/ultimate-purpose/,
        /^\/canon\/.*/,
        /^\/inner-circle\/.*(?!locked|join|request)/,
        /^\/dashboard\/pdf\/.*/,
        /^\/admin\/.*/,
      ];
      
      const currentPath = url;
      const isProtectedRoute = protectedRoutes.some(pattern => pattern.test(currentPath));
      
      if (isProtectedRoute && typeof window !== 'undefined') {
        const token = localStorage.getItem('innerCircleToken');
        const user = localStorage.getItem('innerCircleUser');
        
        if (!token || !user) {
          const returnTo = encodeURIComponent(currentPath);
          router.push(`/inner-circle/locked?returnTo=${returnTo}`);
          return;
        }
        
        try {
          // Verify token expiration
          const decoded = JSON.parse(atob(token.split('.')[1]));
          const now = Date.now() / 1000;
          
          if (decoded.exp < now) {
            localStorage.removeItem('innerCircleToken');
            localStorage.removeItem('innerCircleUser');
            const returnTo = encodeURIComponent(currentPath);
            router.push(`/inner-circle/locked?returnTo=${returnTo}`);
          }
        } catch {
          localStorage.removeItem('innerCircleToken');
          localStorage.removeItem('innerCircleUser');
          const returnTo = encodeURIComponent(currentPath);
          router.push(`/inner-circle/locked?returnTo=${returnTo}`);
        }
      }
    };
    
    // Check initial route
    handleRouteChange(router.pathname);
    
    // Subscribe to route changes
    router.events.on('routeChangeStart', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);
}

function usePageViewTracking() {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          page_path: url,
          send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
        });
      }
      
      // Custom analytics for protected content
      const isProtectedContent = url.includes('canon') || url.includes('strategic-frameworks') || url.includes('dashboard');
      if (isProtectedContent && typeof window !== 'undefined') {
        const token = localStorage.getItem('innerCircleToken');
        if (token) {
          console.log('🔒 Inner Circle access tracked:', url);
          // Send to your analytics service
          fetch('/api/analytics/page-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url,
              timestamp: new Date().toISOString(),
              userType: 'inner-circle'
            })
          }).catch(console.error);
        }
      }
    };

    // Track initial page load
    if (typeof window !== 'undefined') {
      handleRouteChange(window.location.pathname);
    }

    // Subscribe to route changes
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);
}

function usePerformanceMonitoring() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Core Web Vitals monitoring
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const metric = {
            name: entry.name,
            value: entry.startTime,
            rating: 'good',
            timestamp: new Date().toISOString()
          };
          
          // Log to console in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`📊 Performance: ${entry.name} = ${entry.startTime}ms`);
          }
          
          // Send to analytics in production
          if (process.env.NODE_ENV === 'production') {
            fetch('/api/analytics/performance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(metric)
            }).catch(console.error);
          }
        }
      });
      
      // Observe Core Web Vitals
      observer.observe({ 
        entryTypes: [
          'largest-contentful-paint', 
          'first-input', 
          'layout-shift',
          'navigation',
          'resource'
        ] 
      });
      
      return () => observer.disconnect();
    }
  }, []);
}

function useServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(registration => {
            console.log('✅ Service Worker registered:', registration);
          })
          .catch(error => {
            console.log('❌ Service Worker registration failed:', error);
          });
      });
    }
  }, []);
}

function useErrorTracking() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalError = console.error;
      console.error = (...args) => {
        originalError.apply(console, args);
        
        // Send error to analytics
        fetch('/api/analytics/error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: args.join(' '),
            url: window.location.href,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          })
        }).catch(console.error);
      };
      
      // Global error handler
      window.addEventListener('error', (event) => {
        fetch('/api/analytics/error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            url: window.location.href,
            timestamp: new Date().toISOString()
          })
        }).catch(console.error);
      });
      
      // Unhandled promise rejection
      window.addEventListener('unhandledrejection', (event) => {
        fetch('/api/analytics/error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: event.reason?.message || 'Unhandled promise rejection',
            url: window.location.href,
            timestamp: new Date().toISOString()
          })
        }).catch(console.error);
      });
      
      return () => {
        console.error = originalError;
      };
    }
  }, []);
}

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Initialize all hooks
  useRouteProtection();
  usePageViewTracking();
  usePerformanceMonitoring();
  useServiceWorkerRegistration();
  useErrorTracking();

  // Show loading state for route changes
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // Check if reCAPTCHA is configured
  const hasRecaptcha = useMemo(() => {
    return typeof RECAPTCHA_SITE_KEY === "string" && RECAPTCHA_SITE_KEY.trim().length > 10;
  }, []);

  // Check if current route is protected
  const isProtectedRoute = useMemo(() => {
    if (typeof window === 'undefined') return false;
    
    const protectedRoutes = [
      /^\/strategic-frameworks\/.*-canon/,
      /^\/strategic-frameworks\/ultimate-purpose/,
      /^\/canon\/.*/,
      /^\/dashboard\/.*/,
      /^\/admin\/.*/,
    ];
    
    return protectedRoutes.some(pattern => pattern.test(window.location.pathname));
  }, []);

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5" />
        <meta name="theme-color" content="#030712" />
        <meta name="description" content="Institutional Publishing Dashboard - Manage and generate PDF documents efficiently" />
        
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* SEO Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="keywords" content="PDF, dashboard, documents, publishing, management" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="PDF Intelligence Dashboard" />
        <meta property="og:description" content="Professional PDF management and generation dashboard" />
        <meta property="og:site_name" content="Institutional Publishing" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PDF Intelligence Dashboard" />
        <meta name="twitter:description" content="Professional PDF management and generation dashboard" />
        
        {/* Font variables */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              ${fontVariables}
              --font-family-sans: var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              --font-family-mono: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              --font-family-serif: var(--font-editorial), Georgia, Cambria, 'Times New Roman', Times, serif;
              
              /* Color variables */
              --color-primary: 245 158 11; /* amber-500 */
              --color-secondary: 139 92 246; /* purple-500 */
              --color-danger: 239 68 68; /* red-500 */
              --color-success: 34 197 94; /* green-500 */
              --color-warning: 234 179 8; /* yellow-500 */
              --color-info: 59 130 246; /* blue-500 */
            }
          `
        }} />
      </Head>

      {/* Global performance CSS */}
      <style jsx global>{`
        /* Reset and base styles */
        *,
        *::before,
        *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          font-family: var(--font-family-sans);
          scroll-behavior: smooth;
          -webkit-tap-highlight-color: transparent;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-size-adjust: 100%;
          text-rendering: optimizeLegibility;
        }

        body {
          overflow-x: hidden;
          background-color: #030712;
          color: #f8fafc;
          min-height: 100vh;
          position: relative;
        }

        /* Focus styles */
        :focus-visible {
          outline: 2px solid rgb(var(--color-primary));
          outline-offset: 2px;
          border-radius: 0.25rem;
        }

        /* Remove focus outline for mouse users */
        :focus:not(:focus-visible) {
          outline: none;
        }

        /* Selection styling */
        ::selection {
          background-color: rgba(var(--color-primary), 0.3);
          color: inherit;
          text-shadow: none;
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 5px;
          transition: background 0.2s;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.8);
        }

        /* Smooth scrolling for anchor links */
        html:has(:target) {
          scroll-behavior: smooth;
          scroll-padding-top: 5rem;
        }

        /* Print styles */
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          
          .no-print {
            display: none !important;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* Google Analytics Script */}
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <>
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          />
          <Script
            id="google-analytics-config"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true,
                });
              `,
            }}
          />
        </>
      )}

      {/* reCAPTCHA */}
      {hasRecaptcha && (
        <Script
          id="recaptcha-v3"
          src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
            RECAPTCHA_SITE_KEY!.trim()
          )}`}
          strategy="afterInteractive"
        />
      )}

      {/* Service Worker Registration */}
      <Script
        id="service-worker"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('Service Worker registration successful:', registration);
                  },
                  function(err) {
                    console.log('Service Worker registration failed:', err);
                  }
                );
              });
            }
          `
        }}
      />

      {/* Session and token management */}
      <Script
        id="session-management"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (typeof window !== 'undefined') {
                // Clean up expired tokens on load
                const token = localStorage.getItem('innerCircleToken');
                const user = localStorage.getItem('innerCircleUser');
                
                if (token && user) {
                  try {
                    const decoded = JSON.parse(atob(token.split('.')[1]));
                    const now = Date.now() / 1000;
                    
                    if (decoded.exp < now) {
                      localStorage.removeItem('innerCircleToken');
                      localStorage.removeItem('innerCircleUser');
                      console.log('Expired token cleaned up');
                    }
                  } catch (error) {
                    localStorage.removeItem('innerCircleToken');
                    localStorage.removeItem('innerCircleUser');
                    console.log('Invalid token cleaned up');
                  }
                }
                
                // Monitor storage events (for multiple tabs)
                window.addEventListener('storage', function(event) {
                  if (event.key === 'innerCircleToken' && !event.newValue) {
                    // Token was removed in another tab
                    localStorage.removeItem('innerCircleUser');
                    if (window.location.pathname.includes('/dashboard') || 
                        window.location.pathname.includes('/canon')) {
                      window.location.href = '/inner-circle/locked?reason=session-ended';
                    }
                  }
                });
              }
            })();
          `
        }}
      />

      {/* Providers Hierarchy */}
      <SessionProvider session={session}>
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            <InnerCircleProvider>
              <AnalyticsProvider>
                <PDFDashboardProvider>
                  {/* Global Loading Overlay */}
                  {isLoading && (
                    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-3 border-amber-500 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-300 text-sm">Loading...</p>
                      </div>
                    </div>
                  )}

                  {/* Protected Route Overlay */}
                  {isProtectedRoute && (
                    <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm z-[9998] flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-400 text-sm">Verifying access credentials...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Main Content */}
                  <div className={`min-h-screen ${fontBodyClass} relative`}>
                    <Component {...pageProps} />
                  </div>

                  {/* Development Banner */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="fixed bottom-4 right-4 bg-red-600 text-white text-xs px-3 py-1 rounded-full z-[9997]">
                      DEVELOPMENT
                    </div>
                  )}
                </PDFDashboardProvider>
              </AnalyticsProvider>
            </InnerCircleProvider>
          </AuthProvider>
        </ThemeProvider>
      </SessionProvider>
    </>
  );
}