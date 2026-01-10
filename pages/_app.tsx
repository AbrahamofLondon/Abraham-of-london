// pages/_app.tsx - UPDATED FOR PRODUCTION
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import Head from "next/head";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";

// ✅ IMPORTANT: Change from .scss to .css since we fixed the build
import "../styles/tailwind.css";

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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Add favicon */}
        <link rel="icon" href="/favicon.ico" />
        {/* Preconnect to fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>

      {/* Global CSS for performance */}
      <style jsx global>{`
        /* Critical CSS for initial load */
        html {
          scroll-behavior: smooth;
        }
        
        /* Prevent layout shift */
        html, body {
          overflow-x: hidden;
        }
        
        /* Improve font rendering */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Focus styles for accessibility */
        :focus-visible {
          outline: 2px solid #d6b26a;
          outline-offset: 2px;
        }
      `}</style>

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
                      console.log('Inner Circle token expired');
                    } else {
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
            <InnerCircleProvider>
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