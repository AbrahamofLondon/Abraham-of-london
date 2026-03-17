// components/pdf/PdfForensics.tsx
import React from "react";

type PdfForensicsProps = {
  watermarkId?: string | null;
  expectedFooter?: string | null;
  tokenId?: string | null;
  classification?: string | null;
  issuedTo?: string | null;
  issuedAt?: Date | string | null;
};

function safeText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeSlice(value: unknown, end: number): string {
  return typeof value === "string" ? value.slice(0, end) : "";
}

function formatIssuedAt(value: Date | string | null | undefined): string | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return (
    date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC"
  );
}

export const PdfForensics = ({
  watermarkId,
  expectedFooter,
  tokenId,
  classification = "RESTRICTED",
  issuedTo,
  issuedAt,
}: PdfForensicsProps) => {
  const formattedDate = formatIssuedAt(issuedAt);

  const safeWatermarkId = safeText(watermarkId, "INSTITUTIONAL");
  const safeTokenId = safeText(tokenId, "______");
  const safeFooter = safeText(expectedFooter, "Issued by Abraham of London");
  const safeClassification = safeText(classification, "RESTRICTED");
  const issuedToShort = safeSlice(issuedTo, 8);

  return (
    <div className="pdf-forensics print-only">
      {/* Header trace - appears on every page */}
      <div className="fixed top-6 left-6 text-[6px] font-mono text-gray-400/30 print:text-black/20">
        <span>ABRAHAM OF LONDON • {safeSlice(safeWatermarkId, 8) || "INSTITUTIONAL"}</span>
      </div>

      <div className="fixed top-6 right-6 text-[6px] font-mono text-gray-400/30 print:text-black/20">
        <span>TRACE: {safeSlice(safeTokenId, 12) || "______"}</span>
      </div>

      {/* Classification ribbon - first page only */}
      {safeClassification && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 text-[8px] font-mono tracking-[0.2em] text-amber-600/40 print:text-amber-800/30">
          {safeClassification.toUpperCase()} • INSTITUTIONAL INTELLIGENCE
        </div>
      )}

      {/* Footer attribution - appears on every page */}
      <div className="fixed bottom-6 left-6 text-[6px] font-mono text-gray-400/30 print:text-black/20">
        <span>{safeFooter}</span>
      </div>

      {/* Page numbers - handled by CSS */}
      <div className="fixed bottom-6 right-6 text-[6px] font-mono text-gray-400/30 print:text-black/20">
        <span className="page-number" />
      </div>

      {/* Diagonal overlay watermark - subtle repeating pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.03] print:opacity-[0.02]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 text-[40px] font-mono whitespace-nowrap text-gray-600 print:text-gray-400">
          {safeWatermarkId} • {safeTokenId} • {safeWatermarkId}
        </div>
      </div>

      {/* Member-specific footer on last page */}
      {(issuedToShort || formattedDate) && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[5px] font-mono text-gray-300/20 print:text-gray-500/20">
          {issuedToShort && `Issued to: ${issuedToShort}`}
          {issuedToShort && formattedDate && " • "}
          {formattedDate && `Issued at: ${formattedDate}`}
        </div>
      )}

      <style>{`
        @media print {
          .print-only {
            display: block !important;
          }

          .page-number::after {
            content: "Page " counter(page);
          }
        }
      `}</style>
    </div>
  );
};

export default PdfForensics;