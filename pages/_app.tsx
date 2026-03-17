/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/_app.tsx

import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { SessionProvider } from "next-auth/react";

import "@/styles/tailwind.css";

import { Inter, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";

const aolSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const aolMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const aolSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const fontVariables = `${aolSans.variable} ${aolMono.variable} ${aolSerif.variable}`;
const fontBodyClass = aolSans.className;

const ThemeProvider = dynamic(
  () => import("@/lib/ThemeContext").then((m) => m.ThemeProvider),
  { ssr: false }
);

const AuthProvider = dynamic(
  () => import("@/hooks/useAuth").then((m) => m.AuthProvider),
  { ssr: false }
);

const InnerCircleProvider = dynamic(
  () => import("@/lib/inner-circle/InnerCircleContext").then((m) => m.InnerCircleProvider),
  { ssr: false }
);

const AnalyticsProvider = dynamic(
  () => import("@/contexts/AnalyticsContext").then((m) => m.AnalyticsProvider),
  { ssr: false }
);

const PDFDashboardProvider = dynamic(
  () => import("@/contexts/PDFDashboardContext").then((m) => m.PDFDashboardProvider),
  { ssr: false }
);

function AppProviders({
  children,
  session,
  enablePdfDashboard,
}: {
  children: React.ReactNode;
  session: any;
  enablePdfDashboard: boolean;
}) {
  const content = enablePdfDashboard ? (
    <PDFDashboardProvider>{children}</PDFDashboardProvider>
  ) : (
    <>{children}</>
  );

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
  pageProps: { session, ...pageProps },
}: AppProps) {
  const router = useRouter();
  const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  const enablePdfDashboard = useMemo(() => {
    const path = router.pathname || "";

    return (
      path.startsWith("/vault") ||
      path.startsWith("/inner-circle") ||
      path.startsWith("/admin") ||
      path.startsWith("/pdf-dashboard")
    );
  }, [router.pathname]);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </Head>

      {isClient && GA_ID ? (
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
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `,
            }}
          />
        </>
      ) : null}

      <AppProviders session={session} enablePdfDashboard={enablePdfDashboard}>
        <div
          className={`min-h-screen w-full bg-black text-cream ${fontVariables} ${fontBodyClass}`}
        >
          <Component {...pageProps} />
        </div>
      </AppProviders>
    </>
  );
}