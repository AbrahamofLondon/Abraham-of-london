// components/Layout.tsx
import React, { ReactNode } from "react";
import Head from "next/head";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, pageTitle }) => {
  const title = pageTitle ? `${pageTitle} | Abraham of London` : "Abraham of London";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#0b2e1f" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Playfair Display for headlines; Inter for UI/body */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="flex min-h-screen flex-col">
        <Header />
        {/* Offset for the fixed header to prevent content being hidden */}
        <main id="main-content" className="flex-1 pt-20 md:pt-24">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;
