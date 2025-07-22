// components/Layout.tsx
import React, { ReactNode } from 'react';
import Head from 'next/head';
import Header from './Header'; // This correctly points to Header.tsx now
// import Footer from './Footer'; // If you have a Footer component

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <Head>
        {/* Common meta tags, if any */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Favicon etc. */}
      </Head>
      <div className="min-h-screen flex flex-col font-body"> {/* Apply font-body here */}
        <Header /> {/* Your header component */}
        <main className="flex-grow">
          {children}
        </main>
        {/* {Footer && <Footer />}  Your footer component if you have one */}
      </div>
    </>
  );
};

export default Layout;