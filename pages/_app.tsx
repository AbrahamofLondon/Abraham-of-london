// pages/_app.tsx - PROFESSIONAL PRODUCTION VERSION
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import Head from "next/head";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";

// Font configuration
import { fontVariables, fontBodyClass } from "@/lib/next-fonts";

// Styles
import "../styles/tailwind.css";

// Context providers
import { ThemeProvider } from "@/lib/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import { InnerCircleProvider } from "@/lib/inner-circle/InnerCircleContext";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

function useRouteProtection() {
  const router = useRouter();
  
  useEffect(() => {
    const protectedRoutes = [
      /^\/strategic-frameworks\/.*-canon/,
      /^\/strategic-frameworks\/ultimate-purpose/,
      /^\/canon\/.*/,
      /^\/inner-circle\/.*(?!locked|join|request)/,
    ];
    
    const currentPath = router.pathname;
    const isProtectedRoute = protectedRoutes.some(pattern => pattern.test(currentPath));
    
    if (isProtectedRoute && typeof window !== 'undefined') {
      const token = localStorage.getItem('innerCircleToken');
      if (!token) {
        const returnTo = encodeURIComponent(router.asPath);
        router.push(`/inner-circle/locked?returnTo=${returnTo}`);
      }
    }
  }, [router]);
}

function usePageView() {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          page_path: url,
        });
      }
      
      const isProtected = url.includes('canon') || url.includes('strategic-frameworks');
      if (isProtected && typeof window !== 'undefined') {
        const token = localStorage.getItem('innerCircleToken');
        if (token) {
          console.log('Inner Circle access to:', url);
        }
      }
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);
}

function usePerformanceMonitoring() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
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
  useRouteProtection();

  const hasRecaptcha = useMemo(() => {
    return typeof RECAPTCHA_SITE_KEY === "string" && RECAPTCHA_SITE_KEY.trim().length > 10;
  }, []);

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
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#030712" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Font variables */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              ${fontVariables}
              --font-family-sans: var(--font-inter), system-ui, -apple-system, sans-serif;
              --font-family-mono: var(--font-mono), monospace;
              --font-family-serif: var(--font-editorial), Georgia, serif;
            }
          `
        }} />
      </Head>

      {/* Global performance CSS */}
      <style jsx global>{`
        html {
          font-family: var(--font-family-sans);
          scroll-behavior: smooth;
          -webkit-tap-highlight-color: transparent;
        }
        
        body {
          overflow-x: hidden;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        :focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
        
        /* Selection styling */
        ::selection {
          background-color: rgba(245, 158, 11, 0.3);
          color: inherit;
        }
        
        /* Smooth scrolling for anchor links */
        html:has(:target) {
          scroll-behavior: smooth;
          scroll-padding-top: 5rem;
        }
      `}</style>

      {hasRecaptcha && (
        <Script
          id="recaptcha-v3"
          src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
            RECAPTCHA_SITE_KEY!.trim()
          )}`}
          strategy="afterInteractive"
        />
      )}

      <Script
        id="inner-circle-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (typeof window !== 'undefined') {
                const token = localStorage.getItem('innerCircleToken');
                if (token) {
                  try {
                    const decoded = JSON.parse(atob(token.split('.')[1]));
                    const now = Date.now() / 1000;
                    
                    if (decoded.exp < now) {
                      localStorage.removeItem('innerCircleToken');
                      localStorage.removeItem('innerCircleUser');
                    }
                  } catch {
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
            <InnerCircleProvider>
              {isProtectedRoute ? (
                <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
                  <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-slate-400">Verifying access...</p>
                  </div>
                </div>
              ) : null}
              
              <div className={`min-h-screen ${fontBodyClass}`}>
                <Component {...pageProps} />
              </div>
            </InnerCircleProvider>
          </AuthProvider>
        </ThemeProvider>
      </SessionProvider>
    </>
  );
}