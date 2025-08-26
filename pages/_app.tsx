"use client";

import type { AppProps, NextWebVitalsMetric } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/lib/ThemeContext";     // <-- named import
import { pageview, gaEnabled, gaEvent } from "@/lib/gtag";
import { sans, serif, cursive } from "@/lib/fonts";
import "@/styles/globals.css";

// Both components must default-export (see above)
const ScrollProgress = dynamic(() => import("@/components/ScrollProgress"), { ssr: false });
const ThemeToggle    = dynamic(() => import("@/components/ThemeToggle"),    { ssr: false });

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
    <div className={`${sans.variable} ${serif.variable} ${cursive.variable}`}>
      <ThemeProvider>
        <AnalyticsRouterTracker />
        <ScrollProgress zIndexClass="z-50" colorClass="bg-emerald-600" heightClass="h-1" />
        <div className="fixed right-4 top-4 z-50">
          <ThemeToggle />
        </div>
        <Component {...pageProps} />
      </ThemeProvider>
    </div>
  );
}

export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (!gaEnabled || process.env.NODE_ENV !== "production") return;
  const value = metric.name === "CLS" ? Math.round(metric.value * 1000) : Math.round(metric.value);
  try {
    gaEvent("web-vital", { id: metric.id, name: metric.name, label: metric.label, value });
  } catch {}
}
