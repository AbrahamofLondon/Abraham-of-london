"use client";

import type { AppProps, NextWebVitalsMetric } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

import { pageview, gaEnabled, gaEvent } from "@/lib/gtag";
import { ThemeProvider, useTheme } from "@/lib/ThemeContext"; // Updated import
import { sans, serif, cursive } from "@/lib/fonts";
import "@/styles/globals.css";

// Avoid SSR for this UI-only component
const ScrollProgress = dynamic(() => import("@/components/ScrollProgress"), {
  ssr: false,
});

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme(); // Use new context values

  useEffect(() => {
    // Only track in production when GA is configured
    if (!gaEnabled || process.env.NODE_ENV !== "production") return;

    const handleRouteChange = (url: string) => pageview(url);

    // First load
    pageview(router.asPath);

    router.events.on("routeChangeComplete", handleRouteChange);
    router.events.on("hashChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
      router.events.off("hashChangeComplete", handleRouteChange);
    };
  }, [router, router.events]);

  return (
    <div className={`${sans.variable} ${serif.variable} ${cursive.variable}`}>
      <ThemeProvider>
        <button
          onClick={toggle}
          className="p-2 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded"
        >
          Toggle {theme === "dark" ? "Light" : "Dark"} Mode
        </button>
        <ScrollProgress zIndexClass="z-50" colorClass="bg-emerald-600" heightClass="h-1" />
        <Component {...pageProps} />
      </ThemeProvider>
    </div>
  );
}

export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (!gaEnabled || process.env.NODE_ENV !== "production") return;

  // GA expects integers; CLS is sent in ms
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
  } catch {
    // no-op: never let analytics break the app
  }
}