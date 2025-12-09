// pages/_app.tsx - CORRECTED VERSION
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect } from "react";

import "@/styles/globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";

// Remove content initialization from _app.tsx
// Content should be loaded per-page via getStaticProps or API routes

function usePageView() {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (_url: string) => {
      // Hook in GA / Plausible etc later
      // console.log("Page view:", _url);
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);
}

export default function MyApp({ Component, pageProps }: AppProps) {
  usePageView();

  return (
    <ThemeProvider defaultTheme="dark">
      <Component {...pageProps} />
    </ThemeProvider>
  );
}