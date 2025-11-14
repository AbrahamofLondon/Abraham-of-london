// components/Layout.tsx
import * as React from "react";
import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type LayoutProps = {
  children: React.ReactNode;
  /** canonical title prop */
  title?: string | null;
  /** legacy alias, supported for compatibility */
  pageTitle?: string | null;
};

export default function Layout({
  children,
  title,
  pageTitle,
}: LayoutProps): JSX.Element {
  const baseTitle = "Abraham of London";
  const rawTitle = title ?? pageTitle;
  const effectiveTitle = rawTitle ? `${rawTitle} | ${baseTitle}` : baseTitle;

  return (
    <>
      <Head>
        <title>{effectiveTitle}</title>
      </Head>

      <div className="flex min-h-screen flex-col bg-warmWhite text-deepCharcoal">
        {/* Global header (already handles fixed positioning + main offset internally) */}
        <Header />

        <main className="flex-1">
          {children}
        </main>

        <Footer />
      </div>
    </>
  );
}