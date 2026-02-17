/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import {
  useEffect,
  useMemo,
  useState,
  Component as ReactComponent,
  ReactNode,
  useRef,
} from "react";
import { SessionProvider } from "next-auth/react";

import "@/styles/tailwind.css";

import { fontVariables, fontBodyClass } from "@/lib/next-fonts";
import { ThemeProvider } from "@/lib/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import { InnerCircleProvider } from "@/lib/inner-circle/InnerCircleContext";
import { PDFDashboardProvider } from "@/contexts/PDFDashboardContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { safePostJson } from "@/lib/build-safe";

/* -----------------------------------------------------------------------------
  GLOBAL ERROR BOUNDARY
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
    try {
      await safePostJson("/api/analytics/error", {
        error: error.message,
        stack: error.stack,
        info: errorInfo,
        timestamp: new Date().toISOString(),
        fatal: true,
      });
    } catch {
      // never crash because logging failed
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
  CONFIG
----------------------------------------------------------------------------- */
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

/* -----------------------------------------------------------------------------
  UI LOCK CLEANUP (fixes “blur persists across pages”)
----------------------------------------------------------------------------- */
function clearUiLocks() {
  if (typeof document === "undefined") return;

  const html = document.documentElement;
  const body = document.body;
  const main = document.querySelector("main");

  const killClasses = [
    "blur",
    "is-blurred",
    "vault-blur",
    "gated",
    "locked",
    "content-blur",
    "blurred",
    "no-scroll",
    "overflow-hidden",
    "modal-open",
  ];

  killClasses.forEach((c) => {
    html.classList.remove(c);
    body.classList.remove(c);
    main?.classList.remove(c);
  });

  ["data-gated", "data-locked", "data-blur", "aria-hidden"].forEach((attr) => {
    html.removeAttribute(attr);
    body.removeAttribute(attr);
    main?.removeAttribute(attr);
  });

  // Reset body lock patterns used by drawers/modals
  body.style.position = "";
  body.style.top = "";
  body.style.width = "";
  body.style.overflow = "";
  body.style.overflowY = "";
  body.style.paddingRight = "";

  // Kill inline filter/blur styles if they were set
  body.style.filter = "";
  (body.style as any).backdropFilter = "";

  if (main && (main as HTMLElement).style) {
    (main as HTMLElement).style.filter = "";
    ((main as HTMLElement).style as any).backdropFilter = "";
  }
}

/* -----------------------------------------------------------------------------
  APP
----------------------------------------------------------------------------- */
export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const router = useRouter();
  const [routeLoading, setRouteLoading] = useState(false);

  const loadingTimerRef = useRef<number | null>(null);

  const hasRecaptcha = useMemo(() => {
    return typeof RECAPTCHA_SITE_KEY === "string" && RECAPTCHA_SITE_KEY.trim().length > 10;
  }, []);

  useEffect(() => {
    clearUiLocks();
  }, []);

  useEffect(() => {
    const start = () => {
      setRouteLoading(true);

      if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = window.setTimeout(() => {
        setRouteLoading(false);
        clearUiLocks();
      }, 8000);
    };

    const stop = () => {
      setRouteLoading(false);
      clearUiLocks();
      if (loadingTimerRef.current) {
        window.clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", stop);
    router.events.on("routeChangeError", stop);

    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", stop);
      router.events.off("routeChangeError", stop);
      if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    };
  }, [router.events]);

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#854d0e" />
        <style dangerouslySetInnerHTML={{ __html: `:root { ${fontVariables} }` }} />
      </Head>

      {GA_ID ? (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`}
          />
          <Script
            id="ga-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { anonymize_ip: true });
              `,
            }}
          />
        </>
      ) : null}

      {hasRecaptcha ? (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
            RECAPTCHA_SITE_KEY!.trim()
          )}`}
          strategy="afterInteractive"
        />
      ) : null}

      <SessionProvider session={session}>
        <ThemeProvider defaultTheme="system">
          <AuthProvider>
            <InnerCircleProvider>
              <AnalyticsProvider>
                <PDFDashboardProvider>
                  <GlobalErrorBoundary>
                    {routeLoading ? (
                      <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/80 backdrop-blur-sm"
                        aria-hidden="true"
                      >
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
                      </div>
                    ) : null}

                    {/* Hard stop for bleed at the root wrapper */}
                    <div className={`min-h-screen w-full max-w-full overflow-x-hidden ${fontBodyClass}`}>
                      <Component {...pageProps} />
                    </div>
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