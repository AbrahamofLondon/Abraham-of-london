// components/print/BrandFrame.tsx (Updated)

import * as React from "react";
import Head from "next/head";
import Image from "next/image";

// ... (BrandFrameProps remains the same) ...

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://www.abrahamoflondon.org").replace(/\/$/, "");

const DEFAULT_LOGO = "/assets/images/logo/abraham-of-london-logo.svg";

export default function BrandFrame({
  title,
  subtitle,
  children,
// ... (rest of props destructuring remains the same)
  marginsMm = 14,
  hideChromeOnFirstPage = false,
}: BrandFrameProps) {
  const onPrint = React.useCallback(() => {
    if (typeof window !== "undefined" && "print" in window) window.print();
  }, []);
  const siteHost = React.useMemo(() => SITE_URL.replace(/^https?:\/\//, ""), []);

  return (
    <>
      <Head>
        <title>{`${title} | ${siteName}`}</title>{/* ADDED: Clean title for browser/print */}
        {robots && <meta name="robots" content={robots} />}
        {logoSrc?.startsWith("/") && <link rel="preload" as="image" href={logoSrc} />}
      </Head>

{/* ... (rest of JSX remains the same) ... */}

      {/* Print rules + brand fallbacks */}
      <style jsx global>{`
        @media print {
          :root {
            --color-primary: #0b2e1f;
            --color-on-primary: #faf7f2;
            --color-secondary: #faf7f2;
            --color-on-secondary: #333333;
            --color-accent: #d4af37;
            --color-lightGrey: #e5e5e5;
            --color-warmWhite: #faf7f2;
          }
          @page { size: ${pageSize}; margin: ${marginsMm}mm; }
          html, body { background: #ffffff !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          header, footer { break-inside: avoid; page-break-inside: avoid; }
          a[href^="http"]:after { content: " (" attr(href) ")"; font-size: .9em; }
          .shadow-card, .shadow-cardHover { box-shadow: none !important; }
          .rounded-xl, .rounded-lg, .rounded-md, .rounded { border-radius: 0 !important; }
          .print-firstpage-cover .brand-chrome { display: block; }
          .print-firstpage-cover :global(.cover-page) { page-break-after: always; }
          .print-firstpage-cover :global(.cover-page) + .brand-chrome { display: none !important; }
        }
        /* FIX: Re-adding a global definition for the color variable using a hyphen to ensure Tailwind classes resolve */
        :root {
            --color-on-secondary: #333333; /* default value for use in a Tailwind utility */
        }
      `}</style>
    </>
  );
}