// pages/_app.tsx
import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { SessionProvider } from "next-auth/react";

import "@/styles/tailwind.css";

import { fontVariables, fontBodyClass } from "@/lib/next-fonts";
import { ThemeProvider } from "@/lib/server/theme-stub";
import { AuthProvider } from "@/hooks/useAuth";
import { InnerCircleProvider } from "@/lib/inner-circle/InnerCircleContext";

import { PDFDashboardProvider } from "@/contexts/PDFDashboardContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";

import { safeLocalStorage, safePostJson } from "@/lib/build-safe";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const PROTECTED_ROUTES: RegExp[] = [
  /^\/strategic-frameworks\/.*-canon/,
  /^\/strategic-frameworks\/ultimate-purpose/,
  /^\/canon\/.*/,
  /^\/inner-circle\/.*(?!locked|join|request)/,
  /^\/dashboard\/.*/,
  /^\/admin\/.*/,
];

function isProtectedPath(path: string): boolean {
  return PROTECTED_ROUTES.some((re) => re.test(path));
}

function readValidInnerCircleToken(): { token: string; user: string } | null {
  const token = safeLocalStorage.getItem("innerCircleToken");
  const user = safeLocalStorage.getItem("innerCircleUser");
  if (!token || !user) return null;

  // Expect JWT-like token for exp check (best effort)
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payloadJson = atob(parts[1]);
    const payload = JSON.parse(payloadJson) as { exp?: number };
    const now = Date.now() / 1000;

    if (typeof payload.exp === "number" && payload.exp < now) {
      safeLocalStorage.removeItem("innerCircleToken");
      safeLocalStorage.removeItem("innerCircleUser");
      return null;
    }

    return { token, user };
  } catch {
    safeLocalStorage.removeItem("innerCircleToken");
    safeLocalStorage.removeItem("innerCircleUser");
    return null;
  }
}

export default function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter();
  const [routeLoading, setRouteLoading] = useState(false);
  const [verifyingAccess, setVerifyingAccess] = useState(false);

  const hasRecaptcha = useMemo(() => {
    return typeof RECAPTCHA_SITE_KEY === "string" && RECAPTCHA_SITE_KEY.trim().length > 10;
  }, []);

  // Route change loading indicator
  useEffect(() => {
    const start = () => setRouteLoading(true);
    const stop = () => setRouteLoading(false);

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", stop);
    router.events.on("routeChangeError", stop);

    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", stop);
      router.events.off("routeChangeError", stop);
    };
  }, [router.events]);

  // Route protection (Pages Router only)
  useEffect(() => {
    const handle = (url: string) => {
      if (typeof window === "undefined") return;
      const path = url.split("?")[0] || "/";

      if (!isProtectedPath(path)) return;

      setVerifyingAccess(true);
      const creds = readValidInnerCircleToken();

      if (!creds) {
        const returnTo = encodeURIComponent(url);
        router.push(`/inner-circle/locked?returnTo=${returnTo}`).finally(() => setVerifyingAccess(false));
        return;
      }

      setVerifyingAccess(false);
    };

    // initial
    handle(router.asPath);

    router.events.on("routeChangeStart", handle);
    return () => router.events.off("routeChangeStart", handle);
  }, [router]);

  // GA pageview + internal page-view tracking
  useEffect(() => {
    const track = (url: string) => {
      if (typeof window === "undefined") return;

      // Google Analytics page_view
      if (GA_ID && window.gtag) {
        window.gtag("event", "page_view", {
          page_title: document.title,
          page_location: window.location.href,
          page_path: url,
          send_to: GA_ID,
        });
      }

      // Custom tracking for protected content
      const path = url.split("?")[0] || "/";
      if (isProtectedPath(path)) {
        const token = safeLocalStorage.getItem("innerCircleToken");
        if (token) {
          safePostJson("/api/analytics/page-view", {
            url,
            timestamp: new Date().toISOString(),
            userType: "inner-circle",
          });
        }
      }
    };

    // initial + route changes
    track(router.asPath);
    router.events.on("routeChangeComplete", track);
    return () => router.events.off("routeChangeComplete", track);
  }, [router.events, router.asPath]);

  // Performance monitoring (defensive)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("PerformanceObserver" in window)) return;

    const supportedTypes = new Set(
      // @ts-expect-error - TS may not know entryTypes on this browser
      PerformanceObserver.supportedEntryTypes || []
    );

    const desired = ["largest-contentful-paint", "layout-shift", "first-input", "navigation", "resource"];
    const entryTypes = desired.filter((t) => supportedTypes.has(t));

    if (entryTypes.length === 0) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (process.env.NODE_ENV === "development") {
          // Keep it readable
          // eslint-disable-next-line no-console
          console.log(`📊 Perf: ${entry.name}`, entry);
        } else {
          safePostJson("/api/analytics/performance", {
            name: entry.name,
            startTime: entry.startTime,
            entryType: entry.entryType,
            timestamp: new Date().toISOString(),
          });
        }
      }
    });

    observer.observe({ entryTypes: entryTypes as any });
    return () => observer.disconnect();
  }, []);

  // Service worker registration (keep it tight)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    if (window.location.protocol !== "https:") return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  // Global error tracking (no console override)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onError = (event: ErrorEvent) => {
      safePostJson("/api/analytics/error", {
        error: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      safePostJson("/api/analytics/error", {
        error: (event.reason && (event.reason.message || String(event.reason))) || "Unhandled promise rejection",
        url: window.location.href,
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5" />
        <meta name="theme-color" content="#030712" />
        <meta name="description" content="Institutional Publishing Dashboard - Manage and generate PDF documents efficiently" />

        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                ${fontVariables}
              }
            `,
          }}
        />
      </Head>

      {/* Google Analytics */}
      {GA_ID ? (
        <>
          <Script id="ga-src" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
          <Script
            id="ga-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { anonymize_ip: true });
              `,
            }}
          />
        </>
      ) : null}

      {/* reCAPTCHA v3 */}
      {hasRecaptcha ? (
        <Script
          id="recaptcha-v3"
          src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY!.trim())}`}
          strategy="afterInteractive"
        />
      ) : null}

      <SessionProvider session={session}>
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            <InnerCircleProvider>
              <AnalyticsProvider>
                <PDFDashboardProvider>
                  {/* Overlays */}
                  {routeLoading ? (
                    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto mb-4" />
                        <p className="text-gray-300 text-sm">Loading...</p>
                      </div>
                    </div>
                  ) : null}

                  {verifyingAccess ? (
                    <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm z-[9998] flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto mb-4" />
                        <p className="text-gray-400 text-sm">Verifying access credentials...</p>
                      </div>
                    </div>
                  ) : null}

                  <div className={`min-h-screen ${fontBodyClass} relative`}>
                    <Component {...pageProps} />
                  </div>

                  {process.env.NODE_ENV === "development" ? (
                    <div className="fixed bottom-4 right-4 bg-red-600 text-white text-xs px-3 py-1 rounded-full z-[9997]">
                      DEVELOPMENT
                    </div>
                  ) : null}
                </PDFDashboardProvider>
              </AnalyticsProvider>
            </InnerCircleProvider>
          </AuthProvider>
        </ThemeProvider>
      </SessionProvider>
    </>
  );
}