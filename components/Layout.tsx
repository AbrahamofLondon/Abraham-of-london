import React, { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
  pageTitle?: string; // Optional dynamic title
}

const Layout: React.FC<LayoutProps> = ({ children, pageTitle }) => {
  const defaultTitle = 'Abraham of London';
  const title = pageTitle ? `${pageTitle} | ${defaultTitle}` : defaultTitle;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://abraham-of-london.netlify.app';

  // Animation variants for logo
  const logoVariants = {
    initial: { opacity: 0, rotate: -15 },
    animate: { opacity: 1, rotate: 0, transition: { duration: 0.6, ease: 'easeOut' } },
    hover: { scale: 1.1, transition: { duration: 0.3 } },
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Head>
        {/* Primary Meta Tags */}
        <title>{title}</title>
        <meta name="description" content={`${title} – Leadership, Fatherhood & Resilience`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Favicon */}
        <link rel="icon" href="/assets/logo/Abraham-of-London-logo.svg" />

        {/* Open Graph Meta */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={`${title} – Leadership, Fatherhood & Resilience`} />
        <meta property="og:image" content={`${origin}/assets/social/og-image.jpg`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${origin}${pageTitle ? `/${pageTitle.toLowerCase().replace(/ /g, '-')}` : ''}`} />

        {/* Twitter Meta */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={`${title} – Leadership, Fatherhood & Resilience`} />
        <meta name="twitter:image" content={`${origin}/assets/social/twitter-image.jpg`} />
        <meta name="theme-color" content="#1e3a8a" />
      </Head>

      {/* Header */}
      <motion.header
        className="border-b border-gray-200 bg-gray-50 dark:bg-gray-800/90 sticky top-0 z-50 backdrop-blur-md"
        initial="initial"
        animate="animate"
      >
        <div className="container mx-auto flex items-center justify-between p-4">
          <motion.div className="flex items-center space-x-2">
            <motion.div
              variants={logoVariants}
              whileHover="hover"
            >
              <Link href="/" aria-label="Home">
                <Image
                  src="/assets/logo/Abraham-of-London-logo.svg"
                  alt="Abraham of London Logo"
                  width={40}
                  height={40}
                  priority
                />
              </Link>
            </motion.div>
            <Link href="/" className="font-bold text-lg text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
              Abraham of London
            </Link>
          </motion.div>

          <nav className="flex space-x-6 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Link href="/blog" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="/books" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Books
            </Link>
            <Link href="/about" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Contact
            </Link>
            <Link href="/ventures" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Ventures
            </Link>
          </nav>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 dark:bg-gray-800 py-8">
        <div className="container mx-auto flex flex-col items-center justify-between space-y-6 md:flex-row md:space-y-0 px-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">© {new Date().getFullYear()} Abraham of London. All rights reserved.</p>
          <div className="flex space-x-4">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Image
                src="/assets/social/twitter.svg"
                alt="Twitter"
                width={24}
                height={24}
                className="hover:scale-110 transition-transform duration-200"
              />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Image
                src="/assets/social/linkedin.svg"
                alt="LinkedIn"
                width={24}
                height={24}
                className="hover:scale-110 transition-transform duration-200"
              />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Image
                src="/assets/social/instagram.svg"
                alt="Instagram"
                width={24}
                height={24}
                className="hover:scale-110 transition-transform duration-200"
              />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <Image
                src="/assets/social/youtube.svg"
                alt="YouTube"
                width={24}
                height={24}
                className="hover:scale-110 transition-transform duration-200"
              />
            </a>
          </div>
          <form className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Join our newsletter"
              className="p-2 rounded-l-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Email for newsletter signup"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label="Subscribe to newsletter"
            >
              Subscribe
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
