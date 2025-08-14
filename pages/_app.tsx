// pages/_app.tsx
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { pageview, gaEnabled } from '@/lib/gtag';
import '@/styles/globals.css'; // keep if you have it

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    if (!gaEnabled) return;

    const handleRouteChange = (url: string) => pageview(url);

    // Fire on first load too
    pageview(router.asPath);

    router.events.on('routeChangeComplete', handleRouteChange);
    router.events.on('hashChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      router.events.off('hashChangeComplete', handleRouteChange);
    };
  }, [router]);

  return <Component {...pageProps} />;
}


