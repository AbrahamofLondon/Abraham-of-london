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
  const title = pageTitle
    ? `${pageTitle} | Abraham of London`
    : "Abraham of London";

  return (
    <>
      <Head>
        <title>{title}</title>
        {/* Add the font link to ensure Playfair Display is available */}
      </Head>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;



