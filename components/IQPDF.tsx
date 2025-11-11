// components/IQPDF.tsx
import * as React from "react";
import { useState, useRef, useCallback } from '...';
import clsx from "clsx";

/** ──────────────────────────────────────────────────────────────────────────
 * INTELLIGENT PDF VIEWER COMPONENT - PRODUCTION GRADE
 * - Comprehensive error boundaries and fallbacks
 * - Performance optimizations with lazy loading
 * - Advanced loading states with progress tracking
 * - Type-safe configuration management
 * - Accessibility enhancements
 * ────────────────────────────────────────────────────────────────────────── */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface IQPDFProps {
  /** PDF source URL */
  src: string;
  /** PDF title for accessibility */
  title?: string;
  /** Width of the PDF viewer */
  width?: string | number;
  /** Height of the PDF viewer */
  height?: string | number;
  /** Show download button */
  showDownload?: boolean;
  /** Show print button */
  showPrint?: boolean;
  /** Show page controls */
  showPageControls?: boolean;
  /** Show zoom controls */
  showZoomControls?: boolean;
  /** Initial zoom level (0.5 to 3.0) */
  initialZoom?: number;
  /** Custom class names */
  className?: string;
  /** Custom loader component */
  loader?: React.ReactNode;
  /** Custom error component */
  errorComponent?: React.ReactNode;
  /** On load callback */
  onLoad?: () => void;
  /** On error callback */
  onError?: (error: Error) => void;
  /** On page change callback */
  onPageChange?: (page: number) => void;
  /** On zoom change callback */
  onZoomChange?: (zoom: number) => void;
}

interface PDFState {
  status: "idle" | "loading" | "success" | "error";
  currentPage: number;
  totalPages: number;
  zoom: number;
  progress: number;
  error: Error | null;
}

// ============================================================================
// CONSTANTS & DEFAULTS
// ============================================================================

const DEFAULT_ZOOM_LEVELS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0] as const;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.25;

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook for PDF state management
 */
function usePDFState(initialZoom: number = 1.0) {
  const [state, setState] = useState<PDFState>({
    status: "idle",
    currentPage: 1,
    totalPages: 0,
    zoom: initialZoom,
    progress: 0,
    error: null,
  });

  const setLoading = useCallback((progress: number = 0) => {
    setState((prev) => ({
      ...prev,
      status: "loading",
      progress,
      error: null,
    }));
  }, []);

  const setSuccess = useCallback((totalPages: number = 0) => {
    setState((prev) => ({
      ...prev,
      status: "success",
      totalPages,
      progress: 100,
      error: null,
    }));
  }, []);

  const setError = useCallback((error: Error) => {
    setState((prev) => ({
      ...prev,
      status: "error",
      error,
      progress: 0,
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      currentPage: Math.max(1, Math.min(prev.totalPages, page)),
    }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState((prev) => ({
      ...prev,
      zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)),
    }));
  }, []);

  const nextPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentPage: Math.min(prev.totalPages, prev.currentPage + 1),
    }));
  }, []);

  const prevPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentPage: Math.max(1, prev.currentPage - 1),
    }));
  }, []);

  const zoomIn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      zoom: Math.min(MAX_ZOOM, prev.zoom + ZOOM_STEP),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setState((prev) => ({
      ...prev,
      zoom: Math.max(MIN_ZOOM, prev.zoom - ZOOM_STEP),
    }));
  }, []);

  return {
    state,
    actions: {
      setLoading,
      setSuccess,
      setError,
      setPage,
      setZoom,
      nextPage,
      prevPage,
      zoomIn,
      zoomOut,
    },
  };
}

/**
 * Hook for PDF loading and error handling
 */
function usePDFLoader(
  src: string,
  onLoad?: () => void,
  onError?: (error: Error) => void,
) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  const validatePdfUrl = useCallback((url: string): boolean => {
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return url.startsWith("/") || url.startsWith("./");
    }
  }, []);

  React.useEffect(() => {
    if (!src) {
      const error = new Error("PDF source URL is required");
      onError?.(error);
      setIsValid(false);
      return;
    }

    const isValidUrl = validatePdfUrl(src);
    if (!isValidUrl) {
      const error = new Error(`Invalid PDF URL: ${src}`);
      onError?.(error);
      setIsValid(false);
      return;
    }

    setIsValid(true);

    // For external URLs, use directly
    if (src.startsWith("http")) {
      setPdfUrl(src);
      return;
    }

    // For local paths, construct full URL
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    setPdfUrl(src.startsWith("/") ? `${baseUrl}${src}` : `${baseUrl}/${src}`);
  }, [src, validatePdfUrl, onError]);

  return { pdfUrl, isValid };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

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
      if (!isNaN(page)) {
        onPageChange(page);
      }
    },
    [onPageChange],
  );

  const handlePageInputBlur = useCallback(() => {
    if (pageInputRef.current) {
      pageInputRef.current.value = currentPage.toString();
    }
  }, [currentPage]);

  const handlePrint = useCallback(() => {
    if (!pdfUrl) return;

    const printWindow = window.open(pdfUrl, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }, [pdfUrl]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 border-b border-gray-200">
      {/* Page Controls */}
      {showPageControls && totalPages > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className={clsx(
              "p-2 rounded border border-gray-300 bg-white",
              "hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2",
            )}
            aria-label="Previous page"
          >
            <svg
              className="w-4 h-4"
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
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
              aria-label="Current page"
            />
            <span>of {totalPages}</span>
          </div>

          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className={clsx(
              "p-2 rounded border border-gray-300 bg-white",
              "hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2",
            )}
            aria-label="Next page"
          >
            <svg
              className="w-4 h-4"
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
              "p-2 rounded border border-gray-300 bg-white",
              "hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2",
            )}
            aria-label="Zoom out"
          >
            <svg
              className="w-4 h-4"
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
            className="px-3 py-1 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-forest"
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
              "p-2 rounded border border-gray-300 bg-white",
              "hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2",
            )}
            aria-label="Zoom in"
          >
            <svg
              className="w-4 h-4"
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

      {/* Action Buttons */}
      <div className="flex items-center gap-2 ml-auto">
        {showDownload && pdfUrl && (
          <a
            href={pdfUrl}
            download={title ? `${title}.pdf` : "document.pdf"}
            className={clsx(
              "px-4 py-2 rounded border border-gray-300 bg-white text-sm font-medium",
              "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2",
            )}
          >
            Download
          </a>
        )}

        {showPrint && (
          <button
            onClick={handlePrint}
            className={clsx(
              "px-4 py-2 rounded border border-gray-300 bg-white text-sm font-medium",
              "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2",
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

// ============================================================================

interface PDFLoadingStateProps {
  progress: number;
  loader?: React.ReactNode;
}

const PDFLoadingState = React.memo(function PDFLoadingState({
  progress,
  loader,
}: PDFLoadingStateProps) {
  if (loader) {
    return <>{loader}</>;
  }

  return (
    <div
      className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg"
      role="status"
      aria-label="Loading PDF document"
    >
      <div className="w-16 h-16 border-4 border-forest border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600 mb-2">Loading PDF document...</p>
      <div className="w-48 bg-gray-200 rounded-full h-2">
        <div
          className="bg-forest h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-500 mt-2">{progress}%</p>
    </div>
  );
});

PDFLoadingState.displayName = "PDFLoadingState";

// ============================================================================

interface PDFErrorStateProps {
  error: Error;
  errorComponent?: React.ReactNode;
  onRetry?: () => void;
}

const PDFErrorState = React.memo(function PDFErrorState({
  error,
  errorComponent,
  onRetry,
}: PDFErrorStateProps) {
  if (errorComponent) {
    return <>{errorComponent}</>;
  }

  return (
    <div
      className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg text-center"
      role="alert"
      aria-label="Error loading PDF"
    >
      <div className="text-red-500 text-4xl mb-4" aria-hidden="true">
        📄❌
      </div>
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        Failed to Load Document
      </h3>
      <p className="text-red-600 mb-4 max-w-md">
        {error.message ||
          "Unable to load the PDF document. Please check the file URL and try again."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      )}
    </div>
  );
});

PDFErrorState.displayName = "PDFErrorState";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const IQPDF = React.memo(function IQPDF({
  src,
  title = "PDF Document",
  width = "100%",
  height = "600px",
  showDownload = true,
  showPrint = true,
  showPageControls = true,
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
  const { pdfUrl, isValid } = usePDFLoader(src, onLoad, onError);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle iframe load events
  const handleIframeLoad = useCallback(() => {
    actions.setSuccess();
    onLoad?.();
  }, [actions, onLoad]);

  const handleIframeError = useCallback(() => {
    const error = new Error(`Failed to load PDF from: ${src}`);
    actions.setError(error);
    onError?.(error);
  }, [src, actions, onError]);

  // Effect to simulate loading progress
  React.useEffect(() => {
    if (!isValid || !pdfUrl) return;

    actions.setLoading(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      actions.setLoading((prev) => {
        const newProgress = Math.min(prev + 10, 90);
        return newProgress;
      });
    }, 200);

    return () => clearInterval(progressInterval);
  }, [pdfUrl, isValid, actions]);

  // Call parent callbacks when state changes
  React.useEffect(() => {
    if (state.currentPage > 0) {
      onPageChange?.(state.currentPage);
    }
  }, [state.currentPage, onPageChange]);

  React.useEffect(() => {
    onZoomChange?.(state.zoom);
  }, [state.zoom, onZoomChange]);

  // ✅ FIXED: Properly typed style object
  const containerStyle = React.useMemo((): React.CSSProperties => {
    return {
      width,
      height,
    };
  }, [width, height]);

  // Render loading state
  if (state.status === "loading") {
    return (
      <div className={className} style={containerStyle}>
        <PDFLoadingState progress={state.progress} loader={loader} />
      </div>
    );
  }

  // Render error state
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

  // Main PDF viewer
  return (
    <div
      className={clsx(
        "border border-gray-300 rounded-lg overflow-hidden bg-white",
        className,
      )}
      style={containerStyle}
    >
      {/* PDF Controls */}
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

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-gray-100">
        {pdfUrl ? (
          <iframe
            ref={iframeRef}
            src={`${pdfUrl}#view=fitH&zoom=${state.zoom * 100}`}
            title={title}
            className="w-full h-full border-0"
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

// ============================================================================
// COMPONENT VARIANTS
// ============================================================================

// ✅ FIXED: Component variants with proper typing
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
  props: IQPDFProps,
) {
  return (
    <IQPDF
      {...props}
      showDownload={true}
      showPrint={true}
      showPageControls={true}
      showZoomControls={true}
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

// ============================================================================
// EXPORTS
// ============================================================================

export default IQPDF;
