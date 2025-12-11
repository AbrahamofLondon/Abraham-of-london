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

  // Only wrap with SessionProvider if we're sure it exists
  let content = (
    <ThemeProvider defaultTheme="dark">
      <Component {...pageProps} />
    </ThemeProvider>
  );

  // Try to add SessionProvider, but don't break if it fails
  if (typeof window !== 'undefined') {
    try {
      const { SessionProvider } = require('next-auth/react');
      content = (
        <SessionProvider session={pageProps.session}>
          <ThemeProvider defaultTheme="dark">
            <Component {...pageProps} />
          </ThemeProvider>
        </SessionProvider>
      );
    } catch (error) {
      console.warn('SessionProvider not available, continuing without it');
      // Use the content without SessionProvider
    }
  }

  return content;
}