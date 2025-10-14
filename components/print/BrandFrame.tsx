// components/BrandFrame.tsx
import * as React from "react";
import Head from "next/head";

type BrandFrameProps = {
  /** Main document title (rendered as H1 on page and in print) */
  title: string;
  /** Optional subheading under the title */
  subtitle?: string;
  /** Content body (rendered inside a prose container) */
  children: React.ReactNode;
  /** Hide the large page watermark (keeps small logo only) */
  noWatermark?: boolean;
  /** Override robots meta; defaults to "noindex" for printable docs */
  robots?: "noindex" | "index,follow" | "index" | "noindex,nofollow";
  /** Override site name in header/footer */
  siteName?: string;
  /** Override small tagline under the brand */
  tagline?: string;
  /** Override logo path (relative or absolute) */
  logoSrc?: string;
  /** Hide the print button (useful when embedding) */
  hidePrintButton?: boolean;
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
}: BrandFrameProps) {
  // SSR-safe print handler
  const onPrint = React.useCallback(() => {
    if (typeof window !== "undefined" && "print" in window) window.print();
  }, []);

  const siteHost = React.useMemo(() => SITE_URL.replace(/^https?:\/\//, ""), []);

  return (
    <>
      <Head>
        {/* Printable docs are typically not intended for indexing */}
        {robots && <meta name="robots" content={robots} />}
        {/* Preload logo for cleaner LCP on export/print */}
        {logoSrc?.startsWith("/") && <link rel="preload" as="image" href={logoSrc} />}
      </Head>

      <div className="mx-auto max-w-4xl bg-white print:p-0">
        {/* Header */}
        <header className="relative z-10 flex items-center justify-between gap-4 border-b border-lightGrey/80 px-6 py-5 print:px-0 print:py-0 print:border-0">
          <div className="flex items-center gap-3">
            {/* Use <img> for reliable print rendering across browsers */}
            <img
              src={logoSrc}
              alt={siteName}
              className="h-9 w-auto"
              style={{ filter: "saturate(0.9)" }}
            />
            <div className="leading-tight">
              <p className="font-serif text-xl text-forest">{siteName}</p>
              {tagline ? (
                <p className="text-xs tracking-wide text-deepCharcoal/70">
                  {tagline}
                </p>
              ) : null}
            </div>
          </div>

          {!hidePrintButton && (
            <button
              type="button"
              onClick={onPrint}
              className="aol-btn print:hidden"
              aria-label="Print or save this document as PDF"
            >
              Print / Save as PDF
            </button>
          )}
        </header>

        {/* Watermark — only visible in print to keep screen clean */}
        {!noWatermark && (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0 hidden print:block"
          >
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
          {subtitle ? (
            <p className="mb-6 text-sm text-deepCharcoal/70">{subtitle}</p>
          ) : null}

          {/* Prose with dark-mode support on screen; force black text in print */}
          <article className="prose md:prose-lg max-w-none text-deepCharcoal dark:prose-invert print:text-black">
            {children}
          </article>
        </main>

        {/* Footer */}
        <footer className="relative z-10 mt-8 border-t border-lightGrey/80 px-6 py-4 text-[12px] text-deepCharcoal/70 print:px-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>
              © {new Date().getFullYear()} {siteName} ·{" "}
              <span className="text-forest">{siteHost}</span>
            </p>
            <p className="tracking-wide">
              “As iron sharpens iron…” — <em>Proverbs 27:17</em>
            </p>
          </div>
        </footer>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }
          html,
          body {
            background: #ffffff !important;
          }
          /* ensure brand colors are preserved by printers */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Avoid broken splits for header/footer */
          header,
          footer {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Improve link readability in print (append URL after text) */
          a[href^="http"]:after {
            content: " (" attr(href) ")";
            font-size: 0.9em;
          }
          /* Tame shadows and rounded corners on print */
          .shadow-card,
          .shadow-cardHover {
            box-shadow: none !important;
          }
          .rounded-xl,
          .rounded-lg,
          .rounded-md,
          .rounded {
            border-radius: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
