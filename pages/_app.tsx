// pages/_app.tsx
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect } from "react";

import "@/styles/globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";

// Optional: simple hook to instrument page views later (GA, Plausible, etc.)
function usePageView() {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (_url: string) => {
      // Plug in analytics here if/when needed
      // e.g. window.gtag("config", GA_ID, { page_path: _url });
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