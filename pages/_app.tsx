// pages/_app.tsx
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import Head from "next/head";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";

import "../styles/globals.scss"; // ✅ Global styles must live here (and only here)

import { ThemeProvider } from "@/lib/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

function usePageView() {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (_url: string) => {
      // Hook in GA / Plausible later if needed
      // Example: window.gtag?.("config", "G-XXXX", { page_path: _url });
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);
}

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  usePageView();

  const hasRecaptcha = useMemo(() => {
    return typeof RECAPTCHA_SITE_KEY === "string" && RECAPTCHA_SITE_KEY.trim().length > 10;
  }, []);

  return (
    <>
      {/* Baseline document head defaults (safe in _app) */}
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* ✅ reCAPTCHA v3 should live in _app via next/script (NOT in _document) */}
      {hasRecaptcha ? (
        <Script
          id="recaptcha-v3"
          src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
            RECAPTCHA_SITE_KEY!.trim()
          )}`}
          strategy="afterInteractive"
        />
      ) : null}

      <SessionProvider session={session}>
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            <Component {...pageProps} />
          </AuthProvider>
        </ThemeProvider>
      </SessionProvider>
    </>
  );
}