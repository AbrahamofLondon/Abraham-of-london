/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState, Component as ReactComponent, ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

import "@/styles/tailwind.css";

import { fontVariables, fontBodyClass } from "@/lib/next-fonts";
import { ThemeProvider } from "@/lib/server/theme-stub";
import { AuthProvider } from "@/hooks/useAuth";
import { InnerCircleProvider } from "@/lib/inner-circle/InnerCircleContext";
import { PDFDashboardProvider } from "@/contexts/PDFDashboardContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { safeLocalStorage, safePostJson } from "@/lib/build-safe";

/* -----------------------------------------------------------------------------
  HELPER – Base64 decode that works on server AND client
----------------------------------------------------------------------------- */
function safeAtob(str: string): string {
  if (typeof window === "undefined") return "";
  try {
    return atob(str);
  } catch {
    return "";
  }
}

/* -----------------------------------------------------------------------------
  GLOBAL ERROR BOUNDARY
  Captures runtime failures in MDX components or hooks to prevent total app crash.
----------------------------------------------------------------------------- */
class GlobalErrorBoundary extends ReactComponent<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: any) {
    // Async logging – safe, no unhandled promise
    try {
      await safePostJson("/api/analytics/error", {
        error: error.message,
        stack: error.stack,
        info: errorInfo,
        timestamp: new Date().toISOString(),
        fatal: true,
      });
    } catch (logError) {
      // Fail silently – logging should never crash the app
      console.error("[ErrorBoundary] Failed to log error:", logError);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
          <div className="mb-8 h-px w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
          <h2 className="font-serif text-3xl italic text-white mb-4">
            A temporary interruption in the archive.
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-gray-500 mb-8 uppercase tracking-[0.2em]">
            Institutional strategy remains secure. We are recalibrating the interface.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full border border-white/10 bg-white/5 px-8 py-3 text-xs font-bold uppercase tracking-widest text-amber-500 hover:bg-white/10 transition-all"
          >
            Refresh System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* -----------------------------------------------------------------------------
  CONFIGURATION & CONSTANTS
----------------------------------------------------------------------------- */
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

/* -----------------------------------------------------------------------------
  INNER CIRCLE TOKEN VALIDATION (SSR‑safe)
----------------------------------------------------------------------------- */
function readValidInnerCircleToken(): { token: string; user: string } | null {
  if (typeof window === "undefined") return null; // never run on server

  const token = safeLocalStorage.getItem("innerCircleToken");
  const user = safeLocalStorage.getItem("innerCircleUser");
  if (!token || !user) return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(safeAtob(parts[1])) as { exp?: number };
    if (typeof payload.exp === "number" && payload.exp < Date.now() / 1000) {
      safeLocalStorage.removeItem("innerCircleToken");
      safeLocalStorage.removeItem("innerCircleUser");
      return null;
    }
    return { token, user };
  } catch {
    return null;
  }
}

/* -----------------------------------------------------------------------------
  MAIN APP COMPONENT
----------------------------------------------------------------------------- */
export default function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter();
  const [routeLoading, setRouteLoading] = useState(false);
  const [verifyingAccess, setVerifyingAccess] = useState(false);

  const hasRecaptcha = useMemo(() => {
    return typeof RECAPTCHA_SITE_KEY === "string" && RECAPTCHA_SITE_KEY.trim().length > 10;
  }, []);

  // --- Route loading indicator ---
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

  // --- Protected route guard (only runs client‑side) ---
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (typeof window === "undefined") return;

      const path = url.split("?")[0] || "/";
      if (!isProtectedPath(path)) return;

      setVerifyingAccess(true);
      if (!readValidInnerCircleToken()) {
        router
          .push(`/inner-circle/locked?returnTo=${encodeURIComponent(url)}`)
          .finally(() => setVerifyingAccess(false));
      } else {
        setVerifyingAccess(false);
      }
    };

    // Initial check
    handleRouteChange(router.asPath);

    router.events.on("routeChangeStart", handleRouteChange);
    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, [router]);

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#030712" />
        <style dangerouslySetInnerHTML={{ __html: `:root { ${fontVariables} }` }} />
      </Head>

      {GA_ID && (
        <>
          <Script
            id="ga-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
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
      )}

      {hasRecaptcha && (
        <Script
          id="recaptcha-v3"
          src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
            RECAPTCHA_SITE_KEY!.trim()
          )}`}
          strategy="afterInteractive"
        />
      )}

      <SessionProvider session={session}>
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            <InnerCircleProvider>
              <AnalyticsProvider>
                <PDFDashboardProvider>
                  <GlobalErrorBoundary>
                    {/* Route loading overlay */}
                    {routeLoading && (
                      <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
                      </div>
                    )}

                    {/* Access verification overlay – only shown when actually needed */}
                    {verifyingAccess && (
                      <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm z-[9998] flex items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                      </div>
                    )}

                    <div className={`min-h-screen ${fontBodyClass} relative`}>
                      <Component {...pageProps} />
                    </div>

                    {/* Dev badge */}
                    {process.env.NODE_ENV === "development" && (
                      <div className="fixed bottom-4 right-4 bg-red-600 text-white text-[10px] px-3 py-1 rounded-full z-[9997] font-bold tracking-widest uppercase">
                        Active Dev Environment
                      </div>
                    )}
                  </GlobalErrorBoundary>
                </PDFDashboardProvider>
              </AnalyticsProvider>
            </InnerCircleProvider>
          </AuthProvider>
        </ThemeProvider>
      </SessionProvider>
    </>
  );
}