/* components/layout/Layout.tsx — UNIFIED SSOT OPERATIONAL LAYOUT */
import React, { ReactNode } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import Sidebar from './Sidebar'; // Importing the refined Sidebar we just built

// -------------------- Environment‑aware base URL --------------------
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  ogImage?: string;
  fullWidth?: boolean;
  noSidebar?: boolean;
  className?: string;
  currentPath?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'Inner Circle | Abraham of London',
  description = 'Institutional intelligence and strategic briefs for the Inner Circle.',
  ogImage = '/og-image.jpg',
  fullWidth = false,
  noSidebar = false,
  className = '',
  currentPath = '/'
}) => {
  const currentUrl = `${BASE_URL}${currentPath}`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* Open Graph / SSOT Meta */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={currentUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        
        <link rel="canonical" href={currentUrl} />
      </Head>

      <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans">
        <div className="flex flex-1 overflow-hidden h-screen">
          {/* Unified Sidebar: 
             Replaced PDFSidebar with the "Operator Status" Sidebar built in the previous step.
          */}
          {!noSidebar && (
            <Sidebar currentPath={currentPath} isOpen={true} />
          )}
          
          <main className={`flex-1 overflow-y-auto bg-white ${fullWidth ? '' : 'p-8 md:p-12'} ${className}`}>
            <div className={fullWidth ? '' : 'max-w-7xl mx-auto'}>
              {children}
            </div>
            
            {/* Minimalist Operational Footer */}
            <footer className="mt-20 border-t border-gray-100 py-10 text-center">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400">
                Abraham of London Institutional Infrastructure v2.0
              </p>
            </footer>
          </main>
        </div>
      </div>

      {/* Progress Bar & Smooth State Handling */}
      <div className="progress-bar fixed top-0 left-0 w-full h-0.5 bg-blue-600 z-[100] transform origin-left scale-x-0 transition-transform duration-300"></div>

      <Script id="layout-logic" strategy="afterInteractive">
        {`
          window.addEventListener('scroll', () => {
            const winScroll = document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            const pb = document.querySelector('.progress-bar');
            if (pb) pb.style.transform = 'scaleX(' + (scrolled / 100) + ')';
          });
        `}
      </Script>
    </>
  );
};

export default Layout;