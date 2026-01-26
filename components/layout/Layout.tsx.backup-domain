import React, { ReactNode } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Fixed imports - using named exports
import { Header as PDFHeader } from '@/components/PDFDashboard/Header';
import { Sidebar as PDFSidebar } from '@/components/PDFDashboard/Sidebar';

// Create a simple Footer component inline
const Footer = () => (
  <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-12">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Company Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Abraham of London</h3>
          <p className="text-gray-600 mb-4">
            Premium investment insights and strategies for Inner Circle members.
          </p>
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} All rights reserved.
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Quick Links</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/inner-circle/dashboard" className="text-gray-600 hover:text-blue-600">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/inner-circle/content" className="text-gray-600 hover:text-blue-600">
                Content Library
              </Link>
            </li>
            <li>
              <Link href="/inner-circle/profile" className="text-gray-600 hover:text-blue-600">
                Your Profile
              </Link>
            </li>
            <li>
              <Link href="/inner-circle/settings" className="text-gray-600 hover:text-blue-600">
                Settings
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Support</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/help" className="text-gray-600 hover:text-blue-600">
                Help Center
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-gray-600 hover:text-blue-600">
                Contact Support
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-gray-600 hover:text-blue-600">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-gray-600 hover:text-blue-600">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
        <p>Inner Circle Dashboard v1.0.0 • Built with Next.js</p>
      </div>
    </div>
  </footer>
);

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  requireAuth?: boolean;
  userTier?: string;
  fullWidth?: boolean;
  noHeader?: boolean;
  noFooter?: boolean;
  noSidebar?: boolean;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'Inner Circle | Abraham of London',
  description = 'Exclusive content, insights, and tools for Inner Circle members',
  keywords = 'inner circle, premium content, trading insights, investment strategies',
  ogImage = '/og-image.jpg',
  requireAuth = false,
  userTier,
  fullWidth = false,
  noHeader = false,
  noFooter = false,
  noSidebar = false,
  className = ''
}) => {
  const router = useRouter();
  const isInnerCirclePage = router.pathname.startsWith('/inner-circle');

  // Check authentication (simplified - in production use context/state)
  React.useEffect(() => {
    if (requireAuth && typeof window !== 'undefined') {
      const hasAccess = document.cookie.includes('innerCircleAccess=true');
      if (!hasAccess && !router.pathname.includes('/login')) {
        router.push(`/inner-circle/login?returnTo=${router.asPath}`);
      }
    }
  }, [requireAuth, router]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://abrahamoflondon.com${router.asPath}`} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://abrahamoflondon.com${router.asPath}`} />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Abraham of London - Inner Circle",
              "url": "https://abrahamoflondon.com",
              "description": description,
              "publisher": {
                "@type": "Organization",
                "name": "Abraham of London",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://abrahamoflondon.com/logo.png"
                }
              }
            })
          }}
        />
      </Head>

      {/* Analytics Scripts */}
      {process.env.NODE_ENV === 'production' && (
        <>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XXXXXXXXXX');
            `}
          </Script>
        </>
      )}

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {!noHeader && <PDFHeader 
          stats={{
            totalPDFs: 0,
            generated: 0,
            missingPDFs: 0,
            errors: 0,
            availablePDFs: 0,
            categories: [],
            generating: 0,
            lastUpdated: new Date().toISOString()
          }}
          filterState={{
            searchQuery: '',
            selectedCategory: '',
            sortBy: 'title',
            sortOrder: 'asc',
            statusFilter: 'all' // Added this missing property
          }}
          categories={[]}
          viewMode="list"
          selectedPDFs={new Set()}
          isGenerating={false}
          onRefresh={() => {}}
          onGenerateAll={async () => {}}
          onFilterChange={() => {}}
          onSearch={() => {}}
          onSort={() => {}}
          onClearFilters={() => {}}
          onViewModeChange={() => {}}
          onBatchDelete={async () => {}}
          onBatchExport={async () => {}}
          enableSharing={false}
        />}
        
        <div className="flex flex-1">
          {!noSidebar && isInnerCirclePage && <PDFSidebar 
            pdfs={[]}
            selectedPDFId={null}
            selectedPDFs={new Set()}
            stats={{
              totalPDFs: 0,
              generated: 0,
              missingPDFs: 0,
              errors: 0,
              availablePDFs: 0,
              categories: [],
              generating: 0,
              lastUpdated: new Date().toISOString()
            }}
            isGenerating={false}
            viewMode="list"
            onSelectPDF={() => {}}
            onGeneratePDF={async () => {}}
            onToggleSelection={() => {}}
            onClearSelection={() => {}}
            onDeletePDF={async () => {}}
            onDuplicatePDF={async () => {}}
            onRenamePDF={async () => {}}
            onUpdateMetadata={async () => {}}
            canEdit={false}
            canDelete={false}
          />}
          
          <main className={`flex-1 ${fullWidth ? '' : 'container mx-auto px-4 py-8'} ${className}`}>
            {children}
          </main>
        </div>
        
        {!noFooter && <Footer />}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 z-50 transform origin-left scale-x-0 transition-transform duration-300"></div>

      {/* Back to Top */}
      <button
        id="back-to-top"
        className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hidden items-center justify-center z-40"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>

      {/* Script for interactive elements */}
      <Script id="layout-scripts" strategy="afterInteractive">
        {`
          // Progress bar
          window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            const progressBar = document.querySelector('.progress-bar');
            if (progressBar) {
              progressBar.style.transform = 'scaleX(' + (scrolled / 100) + ')';
            }
          });

          // Back to top button
          const backToTop = document.getElementById('back-to-top');
          if (backToTop) {
            window.addEventListener('scroll', () => {
              if (window.scrollY > 300) {
                backToTop.classList.remove('hidden');
                backToTop.classList.add('flex');
              } else {
                backToTop.classList.add('hidden');
                backToTop.classList.remove('flex');
              }
            });
          }

          // Smooth scroll for anchor links
          if (typeof document !== 'undefined') {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
              anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                  target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
                }
              });
            });
          }
        `}
      </Script>
    </>
  );
};

export default Layout;