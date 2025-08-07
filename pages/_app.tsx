import { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head'; // Keep this for non-SEO head tags
import { DefaultSeo } from 'next-seo';
import { AnimatePresence, motion } from 'framer-motion';

import * as gtag from '../lib/gtag';
import Layout from '../components/Layout';
import '../styles/globals.css';

// Default SEO values
const SEO = {
  title: 'Abraham of London',
  description: 'Fatherhood. Leadership. Personal Responsibility. Discover the Abraham of London platform.',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://abraham-of-london.netlify.app/',
    site_name: 'Abraham of London',
    images: [
      {
        // Corrected path based on your file structure
        url: '/assets/images/social/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Abraham of London',
      },
    ],
  },
  twitter: {
    handle: '@abrahamlondon',
    site: '@abrahamlondon',
    cardType: 'summary_large_image',
  },
};

export default function App({ Component, pageProps, router }: AppProps) {
  const nextRouter = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      gtag.pageview(url);
    };

    nextRouter.events.on('routeChangeComplete', handleRouteChange);

    if (typeof window !== 'undefined') {
      gtag.pageview(window.location.pathname);
    }

    return () => {
      nextRouter.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [nextRouter.events]);

  return (
    <>
      <Head>
        {/*
          Meta tags that are NOT SEO-related can live here.
          The SEO is handled by the <DefaultSeo /> component.
          The favicon link is handled in _document.tsx
        */}
        <meta charSet="UTF-8" />
        <meta name="theme-color" content="#000000" />
      </Head>

      <DefaultSeo {...SEO} />

      <Layout>
        <AnimatePresence mode="wait">
          <motion.div
            key={router.route}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <Component {...pageProps} />
          </motion.div>
        </AnimatePresence>
      </Layout>
    </>
  );
}