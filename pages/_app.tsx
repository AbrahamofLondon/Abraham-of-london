/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/_app.tsx — PRODUCTION GRADE (single export, SSR-safe, dynamic providers)

import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import dynamic from "next/dynamic";
import { useEffect, useState, Component as ReactComponent, type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

import "@/styles/tailwind.css";

// ✅ BRAND TYPOGRAPHY LOADER (Pages Router)
import { Inter, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";

const aolSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const aolMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const aolSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const fontVariables = `${aolSans.variable} ${aolMono.variable} ${aolSerif.variable}`;
const fontBodyClass = aolSans.className; // Use Inter as base body font

// ============================================================================
// 🛡️ BUILD GUARD — Must be top-level, syntactically valid
// ============================================================================
const IS_BUILD = 
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";

// ============================================================================
// 🚀 DYNAMIC PROVIDERS — Only load on client, never during build/SSR
// ============================================================================

// Theme provider (critical for UI, but safe to load client-side)
const ThemeProvider = dynamic(
  () => import("@/lib/ThemeContext").then(m => m.ThemeProvider),
  { 
    ssr: false,
    loading: ({ children }: any) => <>{children}</> // Pass through children while loading
  }
);

// Auth providers (core functionality)
const AuthProvider = dynamic(
  () => import("@/hooks/useAuth").then(m => m.AuthProvider),
  { 
    ssr: false,
    loading: ({ children }: any) => <>{children}</>
  }
);

const InnerCircleProvider = dynamic(
  () => import("@/lib/inner-circle/InnerCircleContext").then(m => m.InnerCircleProvider),
  { 
    ssr: false,
    loading: ({ children }: any) => <>{children}</>
  }
);

// Dashboard providers
const PDFDashboardProvider = dynamic(
  () => import("@/contexts/PDFDashboardContext").then(m => m.PDFDashboardProvider),
  { 
    ssr: false,
    loading: ({ children }: any) => <>{children}</>
  }
);

const AnalyticsProvider = dynamic(
  () => import("@/contexts/AnalyticsContext").then(m => m.AnalyticsProvider),
  { 
    ssr: false,
    loading: ({ children }: any) => <>{children}</>
  }
);

/* -----------------------------------------------------------------------------
  GLOBAL ERROR BOUNDARY
----------------------------------------------------------------------------- */
class GlobalErrorBoundary extends ReactComponent<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-center p-6">
          <h2 className="font-serif text-3xl italic text-white mb-4">Vault Sync Error.</h2>
          <button
            onClick={() => window.location.reload()}
            className="text-amber-500 uppercase tracking-widest text-xs border border-amber-500/20 px-6 py-2 rounded-full"
          >
            Recalibrate System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* -----------------------------------------------------------------------------
  ROUTE LOADING OVERLAY (no Router.events, export-safe)
----------------------------------------------------------------------------- */
function RouteLoadingOverlay({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    if (!isClient) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      if (!href) return;

      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.getAttribute("target") === "_blank"
      ) {
        return;
      }

      setRouteLoading(true);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setRouteLoading(false), 2000);
    };

    const handlePopState = () => {
      setRouteLoading(true);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setRouteLoading(false), 2000);
    };

    document.addEventListener("click", handleLinkClick);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleLinkClick);
      window.removeEventListener("popstate", handlePopState);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isClient]);

  return (
    <>
      {isClient && routeLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      )}
      {children}
    </>
  );
}

/* -----------------------------------------------------------------------------
  APP — Single top-level export, branches at runtime
----------------------------------------------------------------------------- */
export default function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  // 🛡️ DURING BUILD/EXPORT: Minimal, deterministic render
  if (IS_BUILD) {
    return (
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <div className={`min-h-screen w-full ${fontVariables} ${fontBodyClass} bg-black text-cream`}>
          <Component {...pageProps} />
        </div>
      </>
    );
  }

  // 🚀 RUNTIME: Full featured app with all providers
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {isClient && GA_ID ? (
        <>
          <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
          <Script
            id="ga-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html:
                `window.dataLayer = window.dataLayer || [];` +
                `function gtag(){dataLayer.push(arguments);}` +
                `gtag('js', new Date());` +
                `gtag('config', '${GA_ID}');`,
            }}
          />
        </>
      ) : null}

      <SessionProvider session={session}>
        <ThemeProvider>
          <AuthProvider>
            <InnerCircleProvider>
              <AnalyticsProvider>
                <PDFDashboardProvider>
                  <GlobalErrorBoundary>
                    <RouteLoadingOverlay>
                      <div className={`min-h-screen w-full ${fontVariables} ${fontBodyClass} bg-black text-cream`}>
                        <Component {...pageProps} />
                      </div>
                    </RouteLoadingOverlay>
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