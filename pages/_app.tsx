/* ============================================================================
   FILE: pages/_app.tsx
   STATUS: SSR-stable global app shell
   PRINCIPLES:
   - Single render path for server and client
   - No mounted-gating of the app shell
   - Theme script injected in Head for pre-hydration theme sync
   - Providers remain mounted consistently
   - Optional PDF dashboard provider added deterministically by route
============================================================================ */

import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import React, { ReactElement, ReactNode, useMemo } from "react";
import { useRouter } from "next/router";
import { SessionProvider } from "next-auth/react";
import { Inter, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";

import "@/styles/globals.css";
import { ThemeScript, ThemeProvider } from "@/lib/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import { InnerCircleProvider } from "@/lib/inner-circle/InnerCircleContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { PDFDashboardProvider } from "@/contexts/PDFDashboardContext";

const aolSans = Inter({
  subsets: ["latin"],
  variable: "--font-family-sans",
  display: "swap",
});

const aolMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-family-mono",
  display: "swap",
});

const aolSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300"],
  style: ["normal", "italic"],
  variable: "--font-family-serif",
  display: "swap",
});

type ProviderComposerProps = {
  children: ReactNode;
  session?: import("next-auth").Session | null;
  enablePdfDashboard: boolean;
};

function AppProviders({
  children,
  session,
  enablePdfDashboard,
}: ProviderComposerProps): React.ReactElement {
  let content = children;

  if (enablePdfDashboard) {
    content = <PDFDashboardProvider>{content}</PDFDashboardProvider>;
  }

  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <AuthProvider>
          <InnerCircleProvider>
            <AnalyticsProvider>{content}</AnalyticsProvider>
          </InnerCircleProvider>
        </AuthProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

export default function MyApp({
  Component,
  pageProps,
}: AppProps): React.ReactElement {
  const router = useRouter();
  const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const session = (pageProps as { session?: import("next-auth").Session | null }).session;

  const enablePdfDashboard = useMemo(() => {
    const guardedPaths = ["/vault", "/inner-circle", "/admin", "/pdf-dashboard"];
    return guardedPaths.some((path) => router.pathname.startsWith(path));
  }, [router.pathname]);

  const getLayout =
    (Component as { getLayout?: (page: ReactElement) => ReactNode }).getLayout ??
    ((page: ReactElement) => page);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <ThemeScript />
      </Head>

      {GA_ID ? (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script
            id="ga-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                  transport_type: 'beacon'
                });
              `,
            }}
          />
        </>
      ) : null}

      <div
        className={[
          aolSans.variable,
          aolMono.variable,
          aolSerif.variable,
          "min-h-screen",
          "bg-[#050505]",
          "font-sans",
          "text-white",
          "antialiased",
        ].join(" ")}
      >
        <AppProviders
          session={session}
          enablePdfDashboard={enablePdfDashboard}
        >
          {getLayout(<Component {...pageProps} />)}
        </AppProviders>
      </div>
    </>
  );
}
