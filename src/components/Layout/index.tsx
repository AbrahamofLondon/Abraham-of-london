src/components/Layout/index.tsx
import React from 'react';
import Head from 'next/head';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  siteTitle?: string;
  siteTagline?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title,
  siteTitle = "Abraham of London",
  siteTagline = "Faith-rooted strategy for fathers, founders, and board-level leaders"
}) => {
  return (
    <>
      <Head>
        <title>{title ? `${title} | ${siteTitle}` : siteTitle}</title>
        <meta name="description" content={siteTagline} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        {/* Header would go here */}
        <main>{children}</main>
        {/* Footer would go here */}
      </div>
    </>
  );
};

export default Layout;