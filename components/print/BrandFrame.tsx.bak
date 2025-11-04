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
  author?: string;   // For Print Header/Footer
  date?: string;     // For Print Header/Footer
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
const TEXT_COLOR = '#333333';          // soft-charcoal
const BG_COLOR = '#FAF7F2';            // warm-cream

export default function BrandFrame({
  title,
  subtitle,
  children,
  logoSrc = DEFAULT_LOGO,
  siteName = "Abraham of London",
  siteUrl = SITE_URL,
  robots = "noindex, nofollow",
  // FIX: pageSize is now correctly set with a default value in the signature
  pageSize = "A4", 
  marginsMm = 20, // Default margin (increased for luxury feel)
  hideChromeOnFirstPage = false,
  author,
  date,
}: BrandFrameProps) {
  const onPrint = React.useCallback(() => {
    if (typeof window !== "undefined" && "print" in window) window.print();
  }, []);
  // FIX APPLIED: Added siteUrl to the dependency array to satisfy React Hook rules
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
        {/* UPGRADE: PRINT HEADER (Chrome) - Using luxury typography and colors */}
        <div className="brand-chrome hidden print:block fixed w-full top-0 left-0">
          <header 
            className="flex justify-between items-center py-4 px-5 border-b border-light-gray"
            style={{ backgroundColor: BG_COLOR }} // Ensure background is set for clean print
          >
            <div className="flex items-center space-x-4">
              <Image
                src={logoSrc}
                alt={`${siteName} Logo`}
                width={30}
                height={30}
                className="w-8 h-8 object-contain"
              />
              {/* Luxury: Main Title in Serif, Subtitle in subtle Muted Gold */}
              <div>
                <span className="text-lg font-serif font-bold" style={{ color: BRAND_PRIMARY_COLOR }}>
                  {title}
                </span> 
                {subtitle && <p className="text-xs mt-0.5" style={{ color: BRAND_ACCENT_COLOR }}>
                  {subtitle}
                </p>}
              </div>
            </div>
            {/* Document Info (Author & Date) for Print */}
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

        {/* UPGRADE: PRINT FOOTER (Minimalist Site Host/Copyright) */}
        <footer 
          className="brand-chrome hidden print:block fixed w-full bottom-0 left-0 text-center py-2 text-xs border-t border-light-gray"
          style={{ color: TEXT_COLOR, backgroundColor: BG_COLOR }}
        >
          &copy; {new Date().getFullYear()} {siteName}. All Rights Reserved. ({siteHost})
        </footer>

        {/* Screen/Preview Chrome */}
        <div className="hidden screen:block fixed top-4 right-4 z-50">
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
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { size: A4; margin: 20mm; } /* pulled from props */
           
          /* FIX: Use pageSize and marginsMm from props */
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

          /* Font Overrides for Print Quality */
          h1, h2, h3, h4, .font-serif {
            font-family: var(--font-serif, 'Playfair Display', Georgia, serif) !important;
          }
          body {
            font-family: var(--font-sans, 'Inter', ui-sans-serif, system-ui) !important;
          }
          
          /* Hides screen button/chrome when printing */
          .screen\\:block { display: none !important; }
          .print\\:block { display: block !important; } 
          
          header, footer { 
            break-inside: avoid; 
            page-break-inside: avoid;
            background-color: ${BG_COLOR} !important; /* Force BG for overlap safety */
          }
          
          /* Minimalistic link display */
          a[href^="http"]:after { 
            content: " [" attr(href) "]"; 
            font-size: .8em; 
            color: var(--color-on-secondary); 
            text-decoration: none; 
          }
          
          /* Remove shadows and excessive border-radius on print */
          .shadow-card, .shadow-cardHover, .shadow-xl { box-shadow: none !important; }
          .rounded-xl, .rounded-lg, .rounded-md, .rounded { border-radius: 0 !important; }
          
          /* Cover page logic */
          .print-firstpage-cover .brand-chrome { display: block; }
          .print-firstpage-cover :global(.cover-page) { page-break-after: always; }
          .print-firstpage-cover :global(.cover-page) + .brand-chrome { display: none !important; }
        }
      `}</style>
    </>
  );
}
