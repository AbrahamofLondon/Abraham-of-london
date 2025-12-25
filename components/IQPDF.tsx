// components/IQPDF.tsx
"use client";

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import clsx from "clsx";

/**
 * INTELLIGENT PDF VIEWER (iframe-based)
 * - No pdf.js dependency (keeps bundle sane)
 * - Strong typing & SSR safety
 * - Graceful loading/error states
 * - Optional controls (zoom/page/print/download)
 */

/* ============================== Types ============================== */

export interface IQPDFProps {
  /** PDF source URL (absolute or site-relative) */
  src: string;
  /** PDF title for accessibility and downloads */
  title?: string;
  /** Container width (px, %, etc.) */
  width?: string | number;
  /** Container height (px, %, etc.) */
  height?: string | number;
  /** UI toggles */
  showDownload?: boolean;
  showPrint?: boolean;
  showPageControls?: boolean; // page controls are visual only (iframe does not expose page count)
  showZoomControls?: boolean;
  /** Initial zoom (0.5-3.0) */
  initialZoom?: number;
  /** Extra className for container */
  className?: string;
  /** Optional custom loader/error components */
  loader?: React.ReactNode;
  errorComponent?: React.ReactNode;
  /** Callbacks */
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onPageChange?: (page: number) => void; // visual only
  onZoomChange?: (zoom: number) => void;
}

interface PDFState {
  status: "idle" | "loading" | "success" | "error";
  currentPage: number;
  totalPages: number; // not measurable via iframe; kept for UI parity
  zoom: number;
  progress: number; // simulated progress (0-100)
  error: Error | null;
}

/* ============================ Constants ============================ */

const DEFAULT_ZOOM_LEVELS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0] as const;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.25;

/* ============================= Hooks =============================== */

function usePDFState(initialZoom: number) {
  const [state, setState] = useState<PDFState>({
    status: "idle",
    currentPage: 1,
    totalPages: 0,
    zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, initialZoom || 1.0)),
    progress: 0,
    error: null,
  });

  const setStatusLoading = useCallback(() => {
    setState((s) => ({ ...s, status: "loading", progress: 0, error: null }));
  }, []);

  const setStatusSuccess = useCallback((totalPages = 0) => {
    setState((s) => ({
      ...s,
      status: "success",
      totalPages,
      progress: 100,
      error: null,
    }));
  }, []);

  const setStatusError = useCallback((error: Error) => {
    setState((s) => ({ ...s, status: "error", error, progress: 0 }));
  }, []);

  const setProgress = useCallback((progress: number) => {
    const clamped = Math.max(0, Math.min(100, progress));
    setState((s) => ({ ...s, progress: clamped }));
  }, []);

  const setPage = useCallback((page: number) => {
    setState((s) => ({
      ...s,
      currentPage: Math.max(
        1,
        Math.min(s.totalPages || 1, Math.floor(page || 1))
      ),
    }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    setState((s) => ({ ...s, zoom: z }));
  }, []);

  const nextPage = useCallback(() => {
    setState((s) => ({
      ...s,
      currentPage: Math.min(s.totalPages || s.currentPage, s.currentPage + 1),
    }));
  }, []);

  const prevPage = useCallback(() => {
    setState((s) => ({
      ...s,
      currentPage: Math.max(1, s.currentPage - 1),
    }));
  }, []);

  const zoomIn = useCallback(() => {
    setState((s) => ({ ...s, zoom: Math.min(MAX_ZOOM, s.zoom + ZOOM_STEP) }));
  }, []);

  const zoomOut = useCallback(() => {
    setState((s) => ({ ...s, zoom: Math.max(MIN_ZOOM, s.zoom - ZOOM_STEP) }));
  }, []);

  return {
    state,
    actions: {
      setStatusLoading,
      setStatusSuccess,
      setStatusError,
      setProgress,
      setPage,
      setZoom,
      nextPage,
      prevPage,
      zoomIn,
      zoomOut,
    },
  };
}

/** Resolve src into a usable absolute URL for the iframe/download link */
function useResolvedPdfUrl(src: string, onError?: (e: Error) => void) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (!src) {
      const err = new Error("PDF source URL is required");
      setIsValid(false);
      onError?.(err);
      return;
    }

    try {
      // If absolute http/https URL, use as-is
      if (/^https?:\/\//i.test(src)) {
        setPdfUrl(src);
        setIsValid(true);
        return;
      }

      // If site-relative, prefix with origin (client-only)
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const base = process.env.NEXT_PUBLIC_SITE_URL || origin || "";
      const clean = src.startsWith("/") ? src : `/${src}`;
      setPdfUrl(`${base}${clean}`);
      setIsValid(true);
    } catch {
      const err = new Error(`Invalid PDF URL: ${src}`);
      setIsValid(false);
      onError?.(err);
    }
  }, [src, onError]);

  return { pdfUrl, isValid };
}

/* =========================== Subcomponents ========================= */

interface PDFControlsProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  showPageControls?: boolean;
  showZoomControls?: boolean;
  showDownload?: boolean;
  showPrint?: boolean;
  pdfUrl?: string | null;
  title?: string;
}

const PDFControls = React.memo(function PDFControls({
  currentPage,
  totalPages,
  zoom,
  onPageChange,
  onZoomChange,
  onNextPage,
  onPrevPage,
  onZoomIn,
  onZoomOut,
  showPageControls = true,
  showZoomControls = true,
  showDownload = true,
  showPrint = true,
  pdfUrl,
  title = "document",
}: PDFControlsProps) {
  const pageInputRef = useRef<HTMLInputElement>(null);

  const handlePageInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const page = parseInt(e.target.value, 10);
      if (!Number.isNaN(page)) onPageChange(page);
    },
    [onPageChange]
  );

  const handlePageInputBlur = useCallback(() => {
    if (pageInputRef.current) pageInputRef.current.value = String(currentPage);
  }, [currentPage]);

  const handlePrint = useCallback(() => {
    if (!pdfUrl) return;
    const win = window.open(pdfUrl, "_blank");
    if (win) {
      win.onload = () => {
        try {
          win.print();
        } catch {
          /* ignore */
        }
      };
    }
  }, [pdfUrl]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 p-4">
      {/* Page Controls (visual only; iframe can't control pages) */}
      {showPageControls && totalPages > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className={clsx(
              "rounded border border-gray-300 bg-white p-2",
              "hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50",
              "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            )}
            aria-label="Previous page"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <input
              ref={pageInputRef}
              type="number"
              min={1}
              max={totalPages}
              defaultValue={currentPage}
              onChange={handlePageInput}
              onBlur={handlePageInputBlur}
              className="w-16 rounded border border-gray-300 px-2 py-1 text-center"
              aria-label="Current page"
            />
            <span>of {totalPages}</span>
          </div>

          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className={clsx(
              "rounded border border-gray-300 bg-white p-2",
              "hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50",
              "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            )}
            aria-label="Next page"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Zoom Controls */}
      {showZoomControls && (
        <div className="flex items-center gap-2">
          <button
            onClick={onZoomOut}
            disabled={zoom <= MIN_ZOOM}
            className={clsx(
              "rounded border border-gray-300 bg-white p-2",
              "hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50",
              "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            )}
            aria-label="Zoom out"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>

          <select
            value={zoom}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Zoom level"
          >
            {DEFAULT_ZOOM_LEVELS.map((level) => (
              <option key={level} value={level}>
                {Math.round(level * 100)}%
              </option>
            ))}
          </select>

          <button
            onClick={onZoomIn}
            disabled={zoom >= MAX_ZOOM}
            className={clsx(
              "rounded border border-gray-300 bg-white p-2",
              "hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50",
              "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            )}
            aria-label="Zoom in"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        {showDownload && pdfUrl && (
          <a
            href={pdfUrl}
            download={title ? `${title}.pdf` : "document.pdf"}
            className={clsx(
              "rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium",
              "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            )}
          >
            Download
          </a>
        )}

        {showPrint && (
          <button
            onClick={handlePrint}
            className={clsx(
              "rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium",
              "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            )}
          >
            Print
          </button>
        )}
      </div>
    </div>
  );
});

PDFControls.displayName = "PDFControls";

function PDFLoadingState({
  progress,
  loader,
}: {
  progress: number;
  loader?: React.ReactNode;
}) {
  if (loader) return <>{loader}</>;
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-8"
      role="status"
      aria-label="Loading PDF document"
    >
      <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      <p className="mb-2 text-gray-600">Loading PDF document...</p>
      <div className="h-2 w-48 rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-gray-500">{progress}%</p>
    </div>
  );
}

function PDFErrorState({
  error,
  errorComponent,
  onRetry,
}: {
  error: Error;
  errorComponent?: React.ReactNode;
  onRetry?: () => void;
}) {
  if (errorComponent) return <>{errorComponent}</>;
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg bg-red-50 p-8 text-center"
      role="alert"
      aria-label="Error loading PDF"
    >
      <div className="mb-4 text-4xl text-red-500" aria-hidden="true">
        📄❌
      </div>
      <h3 className="mb-2 text-lg font-semibold text-red-800">
        Failed to Load Document
      </h3>
      <p className="mb-4 max-w-md text-red-600">
        {error.message ||
          "Unable to load the PDF document. Please check the file URL and try again."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/* =========================== Main Component ======================== */

const IQPDF = React.memo(function IQPDF({
  src,
  title = "PDF Document",
  width = "100%",
  height = "600px",
  showDownload = true,
  showPrint = true,
  showPageControls = false, // default off (iframe cannot read page count)
  showZoomControls = true,
  initialZoom = 1.0,
  className,
  loader,
  errorComponent,
  onLoad,
  onError,
  onPageChange,
  onZoomChange,
}: IQPDFProps) {
  const { state, actions } = usePDFState(initialZoom);
  const { pdfUrl, isValid } = useResolvedPdfUrl(src, onError);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressTimerRef = useRef<number | null>(null);

  // Simulated progress UX
  useEffect(() => {
    if (!isValid || !pdfUrl) return;
    actions.setStatusLoading();
    actions.setProgress(0);

    let prog = 0;
    progressTimerRef.current = window.setInterval(() => {
      prog = Math.min(prog + 10, 90);
      actions.setProgress(prog);
    }, 200);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [pdfUrl, isValid, actions]);

  // Callbacks
  const handleIframeLoad = useCallback(() => {
    // Finish progress
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    actions.setStatusSuccess(0); // totalPages unknown in iframe
    onLoad?.();
  }, [actions, onLoad]);

  const handleIframeError = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    const err = new Error(`Failed to load PDF from: ${src}`);
    actions.setStatusError(err);
    onError?.(err);
  }, [src, actions, onError]);

  // Notify parent on state changes
  useEffect(() => {
    if (state.currentPage > 0) onPageChange?.(state.currentPage);
  }, [state.currentPage, onPageChange]);

  useEffect(() => {
    onZoomChange?.(state.zoom);
  }, [state.zoom, onZoomChange]);

  const containerStyle = useMemo<React.CSSProperties>(
    () => ({ width, height }),
    [width, height]
  );

  // Loading state
  if (state.status === "loading") {
    return (
      <div className={className} style={containerStyle}>
        <PDFLoadingState progress={state.progress} loader={loader} />
      </div>
    );
  }

  // Error state
  if (state.status === "error" || !isValid) {
    return (
      <div className={className} style={containerStyle}>
        <PDFErrorState
          error={state.error || new Error("Invalid PDF source")}
          errorComponent={errorComponent}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Main viewer
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-lg border border-gray-300 bg-white",
        className
      )}
      style={containerStyle}
    >
      <PDFControls
        currentPage={state.currentPage}
        totalPages={state.totalPages}
        zoom={state.zoom}
        onPageChange={actions.setPage}
        onZoomChange={actions.setZoom}
        onNextPage={actions.nextPage}
        onPrevPage={actions.prevPage}
        onZoomIn={actions.zoomIn}
        onZoomOut={actions.zoomOut}
        showPageControls={showPageControls}
        showZoomControls={showZoomControls}
        showDownload={showDownload}
        showPrint={showPrint}
        pdfUrl={pdfUrl}
        title={title}
      />

      <div className="flex-1 overflow-auto bg-gray-100">
        {pdfUrl ? (
          <iframe
            ref={iframeRef}
            src={`${pdfUrl}#view=fitH`} // basic fit; visual zoom applied via CSS scaling below
            title={title}
            className="h-full w-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{
              minHeight: "400px",
              transform: `scale(${state.zoom})`,
              transformOrigin: "0 0",
              width: `${100 / state.zoom}%`,
              height: `${100 / state.zoom}%`,
            }}
            aria-label={`PDF document: ${title}`}
          />
        ) : (
          <PDFErrorState
            error={new Error("PDF URL not available")}
            errorComponent={errorComponent}
          />
        )}
      </div>
    </div>
  );
});

IQPDF.displayName = "IQPDF";

/* ============================ Variants ============================ */

export const MinimalPDF = React.memo(function MinimalPDF(props: IQPDFProps) {
  return (
    <IQPDF
      {...props}
      showDownload={false}
      showPrint={false}
      showPageControls={false}
      showZoomControls={false}
    />
  );
});

export const PrintablePDF = React.memo(function PrintablePDF(
  props: IQPDFProps
) {
  return (
    <IQPDF
      {...props}
      showDownload
      showPrint
      showPageControls={false}
      showZoomControls
    />
  );
});

export const EmbeddedPDF = React.memo(function EmbeddedPDF(props: IQPDFProps) {
  return (
    <IQPDF
      {...props}
      height="400px"
      showDownload={false}
      showPrint={false}
      showPageControls={false}
      showZoomControls={false}
    />
  );
});

export default IQPDF;
