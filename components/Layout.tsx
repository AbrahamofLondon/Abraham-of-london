// components/Layout.tsx
import React, { ReactNode } from 'react';
import Head from 'next/head';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://abrahamoflondon.org';

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph (Facebook, LinkedIn, etc.) Meta Tags */}
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Abraham of London" />
        <meta property="og:description" content="Abraham of London - Fearless Fatherhood, Legacy, Faith, and Leadership." />
        <meta property="og:image" content={`${siteUrl}/assets/images/social/og-image.jpg`} /> {/* Confirmed JPG path */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@abrahamoflondon" />
        <meta name="twitter:creator" content="@abrahamoflondon" />
        <meta name="twitter:title" content="Abraham of London" />
        <meta name="twitter:description" content="Abraham of London - Fearless Fatherhood, Legacy, Faith, and Leadership." />
        <meta name="twitter:image" content={`${siteUrl}/assets/images/social/twitter-image.jpg`} /> {/* Confirmed JPG path */}

      </Head>

      <div className="min-h-screen flex flex-col font-body">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </>
  );
};

export default Layout;