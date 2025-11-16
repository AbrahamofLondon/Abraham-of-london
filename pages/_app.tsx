// pages/_app.tsx
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { useRouter } from "next/router";
import { useEffect } from "react";

import "@/styles/globals.css";

function usePageView() {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (_url: string) => {
      // Hook in GA / Plausible / whatever later
      // console.log("Page view:", _url);
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);
}

export default function App({ Component, pageProps }: AppProps) {
  usePageView();

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <Component {...pageProps} />
    </ThemeProvider>
  );
}