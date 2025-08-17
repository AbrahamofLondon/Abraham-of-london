// components/Layout.tsx
import React, { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <Head>
        {/* Primary Meta Tags */}
        <title>Abraham of London</title>
        <meta name="description" content="Abraham of London – Leadership, Fatherhood & Resilience" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Favicon */}
        <link rel="icon" href="/assets/logo/Abraham-of-London-logo.svg" />

        {/* Open Graph Meta */}
        <meta property="og:title" content="Abraham of London" />
        <meta property="og:description" content="Leadership, Fatherhood & Resilience" />
        <meta property="og:image" content="/assets/social/og-image.jpg" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://abraham-of-london.netlify.app/" />

        {/* Twitter Meta */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Abraham of London" />
        <meta name="twitter:description" content="Leadership, Fatherhood & Resilience" />
        <meta name="twitter:image" content="/assets/social/twitter-image.jpg" />
      </Head>

      {/* Header */}
      <header className="border-b border-gray-200 bg-gray-50">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/assets/logo/Abraham-of-London-logo.svg"
              alt="Abraham of London Logo"
              width={40}
              height={40}
              priority
            />
            <span className="font-bold text-lg">Abraham of London</span>
          </Link>

          <nav className="flex space-x-6 text-sm font-medium text-gray-700">
            <Link href="/blog" className="hover:text-gray-900">
              Blog
            </Link>
            <Link href="/books" className="hover:text-gray-900">
              Books
            </Link>
            <Link href="/about" className="hover:text-gray-900">
              About
            </Link>
            <Link href="/contact" className="hover:text-gray-900">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-6">
        <div className="container mx-auto flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0 px-4">
          <p className="text-sm text-gray-600">© {new Date().getFullYear()} Abraham of London. All rights reserved.</p>
          <div className="flex space-x-4">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <Image
                src="/assets/social/twitter.svg"
                alt="Twitter"
                width={24}
                height={24}
              />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <Image
                src="/assets/social/linkedin.svg"
                alt="LinkedIn"
                width={24}
                height={24}
              />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <Image
                src="/assets/social/instagram.svg"
                alt="Instagram"
                width={24}
                height={24}
              />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
