// pages/_app.tsx
import Head from "next/head";
// FIX 1: Add missing Next.js import s
import dynamic from "next/dynamic";
import Script from "next/script";
import { AppProps } from "next/app";
import { useRouter } from "next/router";
// FIX 2: Add missing React import s
import { useEffect } from "react";
import { ThemeProvider } from "@/lib/ThemeContext";
import { pageview, gaEnabled, GA_ID } from "@/lib/gtag";
import "@/styles/globals.css";

import ThemeToggle from "@/components/ThemeToggle";

// dynamic and ssr:false must be import ed from 'next/dynamic'
const ScrollProgress = dynamic(
  () => import("@/components/ScrollProgress").then((m) => m.default),
  {
    ssr: false,
  },
);

// useRouter and useEffect must be import ed from 'next/router' and 'react'
function AnalyticsRouterTracker() {
  const router = useRouter();
  useEffect(() => {
    if (!gaEnabled || process.env.NODE_ENV !== "production") return;
    const handle = (url: string) => pageview(url);
    pageview(router.asPath);
    router.events.on("routeChangeComplete", handle);
    router.events.on("hashChangeComplete", handle);
    return () => {
      router.events.off("routeChangeComplete", handle);
      router.events.off("hashChangeComplete", handle);
    };
  }, [router]);
  return null;
}

// AppProps must be import ed from 'next/app'
export default function MyApp({ Component, pageProps }: AppProps) {
  const isProd = process.env.NODE_ENV === "production";
  return (
    <>
      <Head d>
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,viewport-fit=cover"
        />
        {gaEnabled && isProd && (
          <>
            <link rel="preconnect" href="https://www.googletagmanager.com" />
            <link
              rel="preconnect"
              href="https://www.google-analytics.com"
              crossOrigin=""
            />
          </>
        )}
      </Head>

      {/* Script must be import ed from 'next/script' */}
      {gaEnabled && isProd && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?i d=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script
            i
            d="ga-init"
            strategy="afterInteractive"
          >{`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true, transport_type: 'beacon', page_path: window.location.pathname });`}</Script>
        </>
      )}

      <ThemeProvider>
        <AnalyticsRouterTracker />

        {/* Keep ThemeToggle visible but prevent it from blocking header hit-testing */}
        <div className="fixed right-4 top-20 z-[60] md:hidden pointer-events-auto">
          <ThemeToggle />
        </div>

        <ScrollProgress
          zIndexClass="z-50"
          colorClass="bg-emerald-600"
          heightClass="h-1"
        />
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}
