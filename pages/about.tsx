import React from 'react';
import Head from 'next/head';

interface LayoutProps {
  children: React.ReactNode;
  pageTitle?: string; // Optional prop for page title
}

export default function Layout({ children, pageTitle }: LayoutProps) {
  const defaultTitle = 'Abraham of London';
  const title = pageTitle ? `${pageTitle} | ${defaultTitle}` : defaultTitle;

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{title}</title>
        {/* Add other meta tags or global styles here if needed */}
      </Head>
      <header className="bg-gray-900 text-white p-4">
        {/* Header content (e.g., navigation) */}
      </header>
      <main className="flex-grow">{children}</main>
      <footer className="bg-gray-900 text-white p-4 text-center">
        {/* Footer content */}
        &copy; {new Date().getFullYear()} {defaultTitle}. All rights reserved.
      </footer>
    </div>
  );
}
