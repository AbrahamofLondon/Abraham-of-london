// components/Layout.tsx
import React, { type ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

const origin =
  process.env.NEXT_PUBLIC_SITE_URL || "https://abraham-of-london.netlify.app";

const Layout: React.FC<LayoutProps> = ({ children, pageTitle }) => {
  const defaultTitle = "Abraham of London";
  const title = pageTitle ? `${pageTitle} | ${defaultTitle}` : defaultTitle;

  const logoVariants = {
    initial: { opacity: 0, rotate: -15 },
    animate: { opacity: 1, rotate: 0, transition: { duration: 0.6, ease: "easeOut" } },
    hover: { scale: 1.06, transition: { duration: 0.25 } },
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <Head>
        {/* Primary Meta */}
        <title>{title}</title>
        <meta name="description" content="Abraham of London – Leadership, Fatherhood & Resilience" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Favicon (keep both common locations to avoid 404s) */}
        <link rel="icon" href="/assets/images/logo/abraham-of-london-logo.svg" />
        <link rel="alternate icon" href="/assets/logo/Abraham-of-London-logo.svg" />

        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content="Abraham of London – Leadership, Fatherhood & Resilience" />
        <meta property="og:image" content={`${origin}/assets/images/social/og-image.jpg`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={origin} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content="Abraham of London – Leadership, Fatherhood & Resilience" />
        <meta name="twitter:image" content={`${origin}/assets/images/social/twitter-image.webp`} />
        <meta name="theme-color" content="#033221" />
      </Head>

      {/* Header / Nav */}
      <motion.header
        className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur"
        initial="initial"
        animate="animate"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <motion.div className="flex items-center gap-3" variants={logoVariants} whileHover="hover">
            <Link href="/" aria-label="Home" className="shrink-0">
              <Image
                src="/assets/images/logo/abraham-of-london-logo.svg"
                alt="Abraham of London Logo"
                width={40}
                height={40}
                priority
              />
            </Link>
            <Link
              href="/"
              className="text-lg font-semibold text-gray-900 hover:text-forest transition-colors"
            >
              Abraham of London
            </Link>
          </motion.div>

          <nav className="hidden gap-6 text-sm font-medium text-gray-700 md:flex">
            <Link href="/blog" className="hover:text-gray-900">Blog</Link>
            <Link href="/books" className="hover:text-gray-900">Books</Link>
            <Link href="/about" className="hover:text-gray-900">About</Link>
            <Link href="/contact" className="hover:text-gray-900">Contact</Link>
            <Link href="/ventures" className="hover:text-gray-900">Ventures</Link>
          </nav>
        </div>
      </motion.header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 md:flex-row md:gap-0">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Abraham of London. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://twitter.com/AbrahamAda48634" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Image src="/assets/images/social/twitter.svg" alt="Twitter" width={24} height={24} />
            </a>
            <a href="https://www.linkedin.com/in/abraham-adaramola-06630321/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Image src="/assets/images/social/linkedin.svg" alt="LinkedIn" width={24} height={24} />
            </a>
            <a href="https://www.instagram.com/abraham_of_london" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Image src="/assets/images/social/instagram.svg" alt="Instagram" width={24} height={24} />
            </a>
            <a href="https://youtube.com/" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <Image src="/assets/images/social/youtube.svg" alt="YouTube" width={24} height={24} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
