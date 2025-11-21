// components/Layout.tsx
import * as React from "react";
import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPageTitle } from "@/lib/siteConfig"; // Import the function

type LayoutProps = {
  children: React.ReactNode;
  title?: string;
  pageTitle?: string;
  transparentHeader?: boolean;
};

export default function Layout({
  children,
  title,
  pageTitle,
  transparentHeader = false,
}: LayoutProps): JSX.Element {
  const effectiveTitle = getPageTitle(title ?? pageTitle);

  return (
    <div className="min-h-screen flex flex-col bg-white text-deepCharcoal">
      <Head>
        <title>{effectiveTitle}</title>
        <meta
          name="description"
          content="Abraham of London — faithful strategy for fathers, founders, and board-level leaders."
        />
      </Head>

      <Header transparent={transparentHeader} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}