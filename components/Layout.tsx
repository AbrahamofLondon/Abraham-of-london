/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getPageTitle, absUrl, siteConfig } from '@/lib/imports';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface SiteLayoutProps {
  pageTitle: string;
  children: React.ReactNode;
  className?: string;
  skipToContentId?: string;
}

export default function SiteLayout({
  pageTitle,
  children,
  className = "",
  skipToContentId = "main-content",
}: SiteLayoutProps) {
  const router = useRouter();
  const currentPath = router.asPath || "/";
  const fullTitle = React.useMemo(() => getPageTitle(pageTitle), [pageTitle]);
  const fullCanonicalUrl = React.useMemo(() => absUrl(currentPath), [currentPath]);

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="canonical" href={fullCanonicalUrl} />
        
        {/* Preloading Editorial New for authority */}
        <link rel="preload" href="/fonts/EditorialNew-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/EditorialNew-Italic.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </Head>

      <div className={`flex min-h-screen flex-col bg-background text-foreground antialiased ${className}`}>
        {/* Fine-line glass header */}
        <Header className="border-b border-border/50 bg-background/80 backdrop-blur-xs" />
        
        {/* System Terminal Status Line */}
        <div className="w-full bg-surface border-b border-border/30 py-1.5 overflow-hidden">
          <div className="container mx-auto px-6 flex justify-between items-center text-[8px] font-mono uppercase tracking-[0.4em] text-zinc-600">
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 bg-primary rounded-full animate-pulse" />
              Node: LON_ST_4.2
            </span>
            <span className="hidden md:block">Registry Status: Synchronized</span>
            <span>Security Level: Directorate</span>
          </div>
        </div>

        <main id={skipToContentId} className="flex-1 relative focus:outline-none" tabIndex={-1}>
          <div className="relative z-10 font-sans">
            {children}
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}