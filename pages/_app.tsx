// pages/_app.tsx
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect } from "react";

import "@/styles/globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";

function usePageView() {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (_url: string) => {
      // Hook in GA / Plausible later if needed
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