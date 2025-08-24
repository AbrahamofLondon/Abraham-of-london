// pages/_app.tsx
"use client";

import type { AppProps, NextWebVitalsMetric } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { ThemeProvider, useTheme } from "@/lib/ThemeContext";
import { pageview, gaEnabled, gaEvent } from "@/lib/gtag";
import { sans, serif, cursive } from "@/lib/fonts";
import "@/styles/globals.css";

// The corrected type for ThemeWrapper. 
// It should not be AppProps because it doesn't receive the router.
type ThemeWrapperProps = {
  Component: AppProps["Component"];
  pageProps: AppProps["pageProps"];
};

const ThemeWrapper = ({ Component, pageProps }: ThemeWrapperProps) => {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (!gaEnabled || process.env.NODE_ENV !== "production") return;

    const handleRouteChange = (url: string) => pageview(url);
    pageview(router.asPath);
    router.events.on("routeChangeComplete", handleRouteChange);
    router.events.on("hashChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
      router.events.off("hashChangeComplete", handleRouteChange);
    };
  }, [router]);

  return (
    <>
      <button
        onClick={toggle}
        className="p-2 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded"
      >
        Toggle {theme === "dark" ? "Light" : "Dark"} Mode
      </button>
      <Component {...pageProps} />
    </>
  );
};

const ScrollProgress = dynamic(() => import("@/components/ScrollProgress"), {
  ssr: false,
});

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={`${sans.variable} ${serif.variable} ${cursive.variable}`}>
      <ThemeProvider>
        <ScrollProgress zIndexClass="z-50" colorClass="bg-emerald-600" heightClass="h-1" />
        <ThemeWrapper Component={Component} pageProps={pageProps} />
      </ThemeProvider>
    </div>
  );
}

export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (!gaEnabled || process.env.NODE_ENV !== "production") return;

  const value = metric.name === "CLS" ? Math.round(metric.value * 1000) : Math.round(metric.value);

  try {
    gaEvent("web-vital", {
      id: metric.id,
      name: metric.name,
      label: metric.label,
      value,
    });
  } catch {
    // no-op
  }
}