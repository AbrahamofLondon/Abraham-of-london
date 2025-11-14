// components/Layout.tsx
import * as React from "react";
import Head from "next/head";

type LayoutProps = {
  children: React.ReactNode;
  /** canonical title prop */
  title?: string;
  /** legacy alias, supported for compatibility */
  pageTitle?: string;
};

export default function Layout({ children, title, pageTitle }: LayoutProps): JSX.Element {
  const base = "Abraham of London";
  const effective = (title ?? pageTitle) ? `${title ?? pageTitle} | ${base}` : base;

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{effective}</title>
      </Head>
      <header className="bg-gray-900 text-white p-4" />
      <main className="flex-grow">{children}</main>
      <footer className="bg-gray-900 text-white p-4 text-center">
        &copy; {new Date().getFullYear()} {base}. All rights reserved.
      </footer>
    </div>
  );
}