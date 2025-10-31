"use client"; // REQUIRED: This component uses client-side hooks (useCallback, useMemo)

import * as React from "react";
import Head from "next/head";
import Image from "next/image";

// Defining the required props interface
interface BrandFrameProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  logoSrc?: string;
  siteName?: string;
  siteUrl?: string;
  robots?: string;
  marginsMm?: number;
  pageSize?: string; // Accepts "A4", "Letter", "A6", etc.
  hideChromeOnFirstPage?: boolean;
  author?: string; // For Print Header/Footer
  date?: string;   // For Print Header/Footer
}

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://www.abrahamoflondon.org").replace(/\/$/, "");

const DEFAULT_LOGO = "/assets/images/logo/abraham-of-london-logo.svg";

// Tailwind-compatible color names for inline styles
const BRAND_PRIMARY_COLOR = '#0B2E1F'; // deep-forest
const BRAND_ACCENT_COLOR = '#C5A352'; // muted-gold
const TEXT_COLOR = '#333333';      // soft-charcoal
const BG_COLOR = '#FAF7F2';        // warm-cream

export default function BrandFrame({
  title,
  subtitle,
  children,
  logoSrc = DEFAULT_LOGO,
  siteName = "Abraham of London",
  siteUrl = SITE_URL,
  robots = "noindex, nofollow",
  pageSize = "A4",
  marginsMm = 20,
  hideChromeOnFirstPage = false,
  author,
  date,
}: BrandFrameProps) {
  const onPrint = React.useCallback(() => {
    if (typeof window !== "undefined" && "print" in window) window.print();
  }, []);
  const siteHost = React.useMemo(() => siteUrl.replace(/^https?:\/\//, ""), [siteUrl]);

  return (
    <>
      <Head>
        <title>{`${title} | ${siteName}`}</title>
        {robots && <meta name="robots" content={robots} />}
        {logoSrc?.startsWith("/") && <link rel="preload" as="image" href={logoSrc} />}
      </Head>

      <div
        className={`print-document ${hideChromeOnFirstPage ? 'print-firstpage-cover' : ''} font-sans`}
        style={{ color: BRAND_PRIMARY_COLOR }}
      >
        {/* PRINT HEADER (Chrome) */}
        <div className="brand-chrome hidden print:block fixed w-full top-0 left-0">
          <header
            className="flex justify-between items-center py-4 px-5 border-b border-light-gray"
            style={{ backgroundColor: BG_COLOR }}
          >
            <div className="flex items-center space-x-4">
              <Image
                src={logoSrc}
                alt={`${siteName} Logo`}
                width={30}
                height={30}
                className="w-8 h-8 object-contain"
              />
              <div>
                <span className="text-lg font-serif font-bold" style={{ color: BRAND_PRIMARY_COLOR }}>
                  {title}
                </span>
                {subtitle && <p className="text-xs mt-0.5" style={{ color: BRAND_ACCENT_COLOR }}>
                  {subtitle}
                </p>}
              </div>
            </div>
            <div className="text-right">
              {author && <div className="text-xs" style={{ color: TEXT_COLOR }}>
                {author}
              </div>}
              {date && <div className="text-xs font-serif" style={{ color: BRAND_ACCENT_COLOR }}>
                {date}
              </div>}
            </div>
          </header>
        </div>

        <main className="min-h-screen">
          {children}
        </main>

        {/* PRINT FOOTER */}
        <footer
          className="brand-chrome hidden print:block fixed w-full bottom-0 left-0 text-center py-2 text-xs border-t border-light-gray"
          style={{ color: TEXT_COLOR, backgroundColor: BG_COLOR }}
        >
          &copy; {new Date().getFullYear()} {siteName}. All Rights Reserved. ({siteHost})
        </footer>

        {/* Screen/Preview Chrome */}
        <div className="print:hidden fixed top-4 right-4 z-50">
          <button
            onClick={onPrint}
            className="bg-deep-forest text-warm-white px-4 py-2 rounded-lg shadow-xl hover:bg-muted-gold hover:text-deep-forest transition-colors duration-200"
          >
            Print/Save PDF
          </button>
        </div>
      </div>

      {/* Print rules + brand fallbacks */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${pageSize};
            margin: ${marginsMm}mm;
          }

          html, body {
            background: #ffffff !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          h1, h2, h3, h4, .font-serif {
            font-family: var(--font-serif, 'Playfair Display', Georgia, serif) !important;
          }
          body {
            font-family: var(--font-sans, 'Inter', ui-sans-serif, system-ui) !important;
          }

          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }

          header, footer {
            break-inside: avoid;
            page-break-inside: avoid;
            background-color: ${BG_COLOR} !important;
          }

          a[href^="http"]:after {
            content: " [" attr(href) "]";
            font-size: .8em;
            text-decoration: none;
          }
          
          .shadow-xl { box-shadow: none !important; }
          .rounded-lg { border-radius: 0 !important; }

          /* Cover page logic */
          .print-firstpage-cover .brand-chrome { display: block; }
          .print-firstpage-cover :global(.cover-page) { page-break-after: always; }
          .print-firstpage-cover :global(.cover-page) + .brand-chrome { display: none !important; }
        }
      `}</style>
    </>
  );
}