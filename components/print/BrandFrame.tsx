// components/print/BrandFrame.tsx
import * as React from "react";

export interface BrandFrameProps {
  /** Optional – used mainly for subtle branding / semantics */
  title?: string;
  subtitle?: string;
  author?: string;
  date?: string;
  /** CSS page size for print */
  pageSize?: "A4" | "A5" | "letter" | "legal";
  /** Margin (in mm) applied for @page and inner padding */
  marginsMm?: number;
  children: React.ReactNode;
}

const PAGE_SIZES: Record<NonNullable<BrandFrameProps["pageSize"]>, string> = {
  A4: "w-[210mm] h-[297mm]",
  A5: "w-[148mm] h-[210mm]",
  letter: "w-[216mm] h-[279mm]",
  legal: "w-[216mm] h-[356mm]",
};

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.valueOf())) return dateString;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

const BrandFrame: React.FC<BrandFrameProps> = ({
  title,
  subtitle,
  author,
  date,
  pageSize = "A4",
  marginsMm = 18,
  children,
}) => {
  const sizeClass = PAGE_SIZES[pageSize] ?? PAGE_SIZES.A4;
  const printedOn =
    typeof Date !== "undefined" ? new Date().toLocaleDateString("en-GB") : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8 print:bg-white print:p-0">
      {/* Print container */}
      <div
        className={`${sizeClass} bg-white shadow-2xl print:shadow-none`}
        style={{ padding: `${marginsMm}mm` }}
      >
        {/* Optional subtle brand header (NOT the main content header) */}
        <header className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3 print:mb-3 print:pb-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Abraham of London
            </div>
            {title && (
              <div className="mt-1 text-sm font-medium text-deepCharcoal">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="mt-0.5 text-xs text-gray-500">{subtitle}</div>
            )}
          </div>
          <div className="text-right text-[10px] text-gray-500">
            {author && <div>Author: {author}</div>}
            {date && <div>Date: {formatDate(date)}</div>}
          </div>
        </header>

        {/* Main content – the page is responsible for its own article header */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="mt-6 border-t border-gray-200 pt-3 text-center text-[10px] text-gray-500 print:mt-4 print:pt-2">
          <div className="flex items-center justify-between">
            <span>Abraham of London</span>
            <span>{printedOn}</span>
          </div>
        </footer>
      </div>

      {/* Global print styles for page size & margins */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${pageSize};
            margin: ${marginsMm}mm;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }

          .print\\:bg-white {
            background: white !important;
          }

          .print\\:p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BrandFrame;
