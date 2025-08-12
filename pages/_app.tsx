// pages/_app.tsx
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import '../styles/globals.css';

// Safe accessor: do NOT redeclare window.gtag globally
function getGtag(): ((...args: unknown[]) => void) | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  return typeof w.gtag === 'function' ? w.gtag : undefined;
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

function pageview(url: string) {
  const gtag = getGtag();
  if (!GA_ID || !gtag) return;
  gtag('event', 'page_view', {
    page_title: typeof document !== 'undefined' ? document.title : undefined,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    page_path: url,
  });
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // initial
    pageview(router.asPath);
    // SPA nav
    const handleRouteChange = (url: string) => pageview(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events, router.asPath]);

  return (
    <>
      {GA_ID && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              // Disable auto page_view; we'll send manually
              gtag('config', '${GA_ID}', {
                send_page_view: false,
                debug_mode: ${process.env.NODE_ENV !== 'production'}
              });
            `}
          </Script>
        </>
      )}
      <Component {...pageProps} />
    </>
  );
}
