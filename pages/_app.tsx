import { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head'; // Keep this for non-SEO head tags
import { DefaultSeo } from 'next-seo';
import { AnimatePresence, motion } from 'framer-motion';

import * as gtag from '../lib/gtag';
import Layout from '../components/Layout';
import '../styles/globals.css';
<<<<<<< Updated upstream
=======

// *** IMPORTANT: These font definitions must be directly in _app.tsx ***
import localFont from 'next/font/local'; // Ensure this import is here

export const geist = localFont({
  src: [
    {
      path: '/fonts/Geist-Regular.woff2', // Corrected path
      weight: '400',
      style: 'normal',
    },
    {
      path: '/fonts/Geist-SemiBold.woff2', // Corrected path
      weight: '600',
      style: 'normal',
    },
    {
      path: '/fonts/Geist-Bold.woff2', // Corrected path
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-geist',
  display: 'swap',
});

// If you have geistMono or geistSans (from previous examples), also include them here
// For example:
// export const geistMono = localFont({
//   src: [
//     { path: '/fonts/GeistMono-Regular.woff2', weight: '400', style: 'normal' },
//     { path: '/fonts/GeistMono-Medium.woff2', weight: '500', style: 'normal' }, // Note: Corrected 'value' to 'style'
//   ],
//   variable: '--font-geist-mono',
//   display: 'swap',
// });

>>>>>>> Stashed changes

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
<<<<<<< Updated upstream

    nextRouter.events.on('routeChangeComplete', handleRouteChange);

    if (typeof window !== 'undefined') {
      gtag.pageview(window.location.pathname);
    }

=======
    router.events.on('routeChangeComplete', handleRouteChange);
    gtag.pageview(window.location.pathname);
>>>>>>> Stashed changes
    return () => {
      nextRouter.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [nextRouter.events]);

  return (
<<<<<<< Updated upstream
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
=======
    // Apply the font variable to the root element.
    // If you have `geistMono` as well, add its variable too:
    // <div className={`${geist.variable} ${geistMono.variable} font-sans`}>
    <div className={`${geist.variable} font-sans`}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </div>
>>>>>>> Stashed changes
  );
}