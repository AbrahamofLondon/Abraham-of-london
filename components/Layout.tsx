// components/Layout.tsx
import React, { ReactNode } from 'react';
import Head from 'next/head';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Define your site's base URL dynamically or as a constant
  // For production, this should be your actual live domain.
  // For local development, it will be localhost.
  // You might want to use an environment variable for this: process.env.NEXT_PUBLIC_SITE_URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://abrahamoflondon.org'; // IMPORTANT: REPLACE WITH YOUR ACTUAL LIVE DOMAIN

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" /> {/* Consider adding a favicon */}

        {/* Open Graph (Facebook, LinkedIn, etc.) Meta Tags */}
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Abraham of London" /> {/* Your main site title */}
        <meta property="og:description" content="Abraham of London - Fearless Fatherhood, Legacy, Faith, and Leadership." /> {/* Your main site description */}
        <meta property="og:image" content={`${siteUrl}/assets/images/og-image.jpg`} /> {/* Absolute URL for OG Image */}
        <meta property="og:image:width" content="1200" /> {/* Recommended width */}
        <meta property="og:image:height" content="630" /> {/* Recommended height */}

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@abrahamoflondon" /> {/* Optional: Your Twitter handle */}
        <meta name="twitter:creator" content="@abrahamoflondon" /> {/* Optional: Creator's Twitter handle */}
        <meta name="twitter:title" content="Abraham of London" />
        <meta name="twitter:description" content="Abraham of London - Fearless Fatherhood, Legacy, Faith, and Leadership." />
        <meta name="twitter:image" content={`${siteUrl}/assets/images/twitter-image.webp`} /> {/* Absolute URL for Twitter Image */}

        {/* You can add a default favicon here if you want, e.g., <link rel="icon" href="/favicon.ico" /> */}
        {/* Other common SEO meta tags can go here */}
      </Head>

      <div className="min-h-screen flex flex-col font-body">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        {/* If you have a Footer component, you would include it here: */}
        {/* <Footer /> */}
      </div>
    </>
  );
};

export default Layout;