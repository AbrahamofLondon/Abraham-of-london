// pages/_app.tsx
import type { AppProps, NextWebVitalsMetric } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Script from "next/script";
import Head from "next/head";

import { ThemeProvider } from "@/lib/ThemeContext";
import { pageview, gaEnabled, gaEvent, GA_ID } from "@/lib/gtag";
import "@/styles/globals.css";

const ScrollProgress = dynamic(() => import("@/components/ScrollProgress"), { ssr: false });
const ThemeToggle = dynamic(() => import("@/components/ThemeToggle"), { ssr: false });

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

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {gaEnabled && process.env.NODE_ENV === "production" && (
          <>
            <link rel="preconnect" href="https://www.googletagmanager.com" />
            <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="" />
          </>
        )}
      </Head>

      {gaEnabled && process.env.NODE_ENV === "production" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true, transport_type: 'beacon', page_path: window.location.pathname });
            `}
          </Script>
        </>
      )}

      <ThemeProvider>
        <AnalyticsRouterTracker />
        <ScrollProgress zIndexClass="z-50" colorClass="bg-emerald-600" heightClass="h-1" />

        {/* If your Header already shows a ThemeToggle, remove this */}
        <div className="fixed right-4 top-4 z-50 md:hidden">
          <ThemeToggle />
        </div>

        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}

export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (!gaEnabled || process.env.NODE_ENV !== "production") return;

  const value =
    metric.name === "CLS"
      ? Math.round(metric.value * 1000)
      : Math.round(metric.value);

  try {
    gaEvent("web-vital", {
      id: metric.id,
      name: metric.name,
      label: metric.label,
      value,
    });
  } catch {}
}
e });
  } catch {}
}
