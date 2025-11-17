// components/Layout.tsx
import * as React from "react";
import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPageTitle } from "@/lib/siteConfig";

type LayoutProps = {
  children: React.ReactNode;
  /** canonical title prop */
  title?: string;
  /** legacy alias, supported for compatibility */
  pageTitle?: string;
};

export default function Layout({
  children,
  title,
  pageTitle,
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

      {/* Global header / nav */}
      <Header />

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Global footer */}
      <Footer />
    </div>
  );
}