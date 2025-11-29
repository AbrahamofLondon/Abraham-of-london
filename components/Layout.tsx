// components/Layout.tsx
import * as React from "react";
import Head from "next/head";
import LuxuryNavbar from "@/components/LuxuryNavbar";
import Footer from "@/components/Footer";
import { getPageTitle } from "@/lib/siteConfig";

type LayoutProps = {
  children: React.ReactNode;
  title?: string;
  pageTitle?: string;
  transparentHeader?: boolean;
  className?: string;
};

export default function Layout({
  children,
  title,
  pageTitle,
  transparentHeader: _transparentHeader = false, // kept for API compatibility, intentionally unused
  className = "",
}: LayoutProps): JSX.Element {
  const effectiveTitle = getPageTitle(title ?? pageTitle);

  return (
    <div
      className={`min-h-screen flex flex-col bg-charcoal text-cream ${className}`}
    >
      <Head>
        <title>{effectiveTitle}</title>
        <meta
          name="description"
          content="Abraham of London — faithful strategy for fathers, founders, and board-level leaders."
        />
        <meta name="theme-color" content="#1a1a1a" />
        <meta name="color-scheme" content="dark" />
      </Head>

      <LuxuryNavbar variant="dark" transparent={false} />

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
