src/components/SiteLayout.tsx
import React from 'react';
import Head from 'next/head';

interface SiteLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

const SiteLayout: React.FC<SiteLayoutProps> = ({
  children,
  title = 'Abraham of London',
  description = 'Faith-rooted strategy for fathers, founders, and board-level leaders who refuse to outsource responsibility.',
  className = ''
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className={`min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${className}`}>
        {/* Site header would go here */}
        <header className="border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="text-xl font-serif font-semibold text-softGold">
                Abraham of London
              </div>
              <nav className="hidden md:flex space-x-6">
                <a href="/" className="hover:text-softGold transition-colors">Home</a>
                <a href="/resources" className="hover:text-softGold transition-colors">Resources</a>
                <a href="/about" className="hover:text-softGold transition-colors">About</a>
                <a href="/contact" className="hover:text-softGold transition-colors">Contact</a>
              </nav>
            </div>
          </div>
        </header>

        <main>{children}</main>

        {/* Site footer would go here */}
        <footer className="border-t border-gray-200 dark:border-gray-700 mt-16">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="text-center text-gray-600 dark:text-gray-400">
              <p>&copy; {new Date().getFullYear()} Abraham of London. All rights reserved.</p>
              <p className="mt-2 text-sm">Building fathers, founders & faithful leaders.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default SiteLayout;