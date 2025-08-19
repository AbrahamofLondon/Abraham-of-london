// pages/_app.tsx
"use client";

import type { AppProps, NextWebVitalsMetric } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";

import { pageview, gaEnabled, gaEvent } from "@/lib/gtag";
import { ThemeProvider } from "@/lib/ThemeContext";
import { sans, serif, cursive } from "@/lib/fonts";
import "@/styles/globals.css";

import ScrollProgress from "@/components/ScrollProgress";

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    if (!gaEnabled) return;
    const handleRouteChange = (url: string) => pageview(url);
    // fire for the first load
    pageview(router.asPath);

    router.events.on("routeChangeComplete", handleRouteChange);
    router.events.on("hashChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
      router.events.off("hashChangeComplete", handleRouteChange);
    };
  }, [router]);

  return (
    <div className={`${sans.variable} ${serif.variable} ${cursive.variable}`}>
      <ThemeProvider>
        <ScrollProgress zIndexClass="z-50" colorClass="bg-emerald-600" heightClass="h-1" />
        <Component {...pageProps} />
      </ThemeProvider>
    </div>
  );
}

export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (!gaEnabled) return;
  gaEvent("web-vital", {
    id: metric.id,
    name: metric.name,
    label: metric.label,
    value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
  });
}
