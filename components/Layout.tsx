// components/Layout.tsx
import React, { ReactNode } from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
Â  children: ReactNode;
Â  pageTitle?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, pageTitle }) => {
Â  const title = pageTitle ? `${pageTitle} | Abraham of London` : 'Abraham of London';

Â  return (
Â  Â  <>
Â  Â  Â  <Head>
Â  Â  Â  Â  <title>{title}</title>
Â  Â  Â  Â  {/* Add the font link to ensure Playfair Display is available */}
Â  Â  Â  Â  <link rel="preconnect" href="https://fonts.googleapis.com" />
Â  Â  Â  Â  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
Â  Â  Â  Â  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
Â  Â  Â  </Head>
Â  Â  Â  <div className="flex flex-col min-h-screen">
Â  Â  Â  Â  <Header />
Â  Â  Â  Â  <main className="flex-1">
Â  Â  Â  Â  Â  {children}
Â  Â  Â  Â  </main>
Â  Â  Â  Â  <Footer />
Â  Â  Â  </div>
Â  Â  </>
Â  );
};

export default Layout;
