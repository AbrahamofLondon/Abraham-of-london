// components/print/BrandFrame.tsx

import * as React from "react";
import Head from "next/head";
import Image from "next/image";

type BrandFrameProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  noWatermark?: boolean;
  robots?: "noindex" | "index,follow" | "index" | "noindex,nofollow";
  siteName?: string;
  tagline?: string;
  logoSrc?: string;
  hidePrintButton?: boolean;
  /** A4 (default) or A6 */
  pageSize?: "A4" | "A6" | string;
  /** page margin in mm */
  marginsMm?: number;
  /** hide header/footer on the first printed page (use when you render a full-bleed cover before BrandFrame) */
  hideChromeOnFirstPage?: boolean;
};

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
  noWatermark,
  robots = "noindex",
  siteName = "Abraham of London",
  tagline = "Present men, forged together",
  logoSrc = DEFAULT_LOGO,
  hidePrintButton = false,
  pageSize = "A4",
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
        {robots && <meta name="robots" content={robots} />}
        {logoSrc?.startsWith("/") && <link rel="preload" as="image" href={logoSrc} />}
      </Head>

      <div className={`mx-auto max-w-4xl bg-white print:p-0 ${hideChromeOnFirstPage ? "print-firstpage-cover" : ""}`}>
        {/* Header */}
        <header className="brand-chrome relative z-10 flex items-center justify-between gap-4 border-b border-lightGrey/80 px-6 py-5 print:px-0 print:py-0 print:border-0">
          <div className="flex items-center gap-3">
            <Image
              src={logoSrc}
              alt={siteName}
              width={36}
              height={36}
              className="h-9 w-auto print:saturate-90"
              style={{ filter: "saturate(0.9)" }}
              sizes="36px"
            />
            <div className="leading-tight">
              <p className="font-serif text-xl text-forest">{siteName}</p>
              {tagline ? (
                <p className="text-xs tracking-wide text-[color:var(--color-on-secondary)/0.7]">{tagline}</p>
              ) : null}
            </div>
          </div>

          {!hidePrintButton && (
            <button type="button" onClick={onPrint} className="aol-btn print:hidden" aria-label="Print or save this document as PDF">
              Print / Save as PDF
            </button>
          )}
        </header>

        {/* Watermark (print only) */}
        {!noWatermark && (
          <div aria-hidden className="pointer-events-none fixed inset-0 z-0 hidden print:block">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${logoSrc})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center 55%",
                backgroundSize: "60%",
                opacity: 0.04,
                filter: "grayscale(100%)",
              }}
            />
          </div>
        )}

        {/* Content */}
        <main className="relative z-10 px-6 py-8 print:px-0">
          <h1 className="mb-1 font-serif text-3xl text-forest">{title}</h1>
          {subtitle ? <p className="mb-6 text-sm text-[color:var(--color-on-secondary)/0.7]">{subtitle}</p> : null}
          <article className="prose md:prose-lg max-w-none text-deepCharcoal dark:prose-invert print:text-black">{children}</article>
        </main>

        {/* Footer */}
        <footer className="brand-chrome relative z-10 mt-8 border-t border-lightGrey/80 px-6 py-4 text-[12px] text-[color:var(--color-on-secondary)/0.7] print:px-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>
              © {new Date().getFullYear()} {siteName} · <span className="text-forest">{siteHost}</span>
            </p>
            <p className="tracking-wide">“As iron sharpens iron…” — <em>Proverbs 27:17</em></p>
          </div>
        </footer>
      </div>

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
      `}</style>
    </>
  );
}