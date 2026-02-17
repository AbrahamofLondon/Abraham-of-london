// components/PDFDashboard/PDFViewer.tsx
import React, { useState, useEffect } from 'react';
import { PDFItem } from '@/lib/pdf/types';
import { 
  Download, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  Printer, 
  Copy, 
  Check,
  FileText,
  AlertCircle,
  Clock,
  Maximize2,
  Minimize2,
  Grid3x3,
  List,
  LayoutGrid
} from 'lucide-react';

interface PDFViewerProps {
  pdf: PDFItem | null;
  isGenerating: boolean;
  onGeneratePDF: (id: string) => Promise<any> | void;
  refreshKey?: number;
  viewMode?: 'list' | 'grid' | 'detail';
  enableAnnotations?: boolean;
  error?: string | null; // Add error prop
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdf,
  isGenerating,
  onGeneratePDF,
  refreshKey,
  viewMode = 'detail',
  enableAnnotations = false,
  error: pdfError = null, // ← FIXED: Added missing comma on the line above
}) => {
  // ALL HOOKS AT TOP LEVEL
  const [zoom, setZoom] = useState(100);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Handle mounting (only needed for client-side rendering)
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  // Load PDF when selected PDF changes
  useEffect(() => {
    const loadPdf = async () => {
      if (!pdf?.fileUrl) {
        setPdfBlobUrl(null);
        return;
      }

      setLoadingPdf(true);
      setLoadError(null);

      try {
        // Handle both absolute URLs and relative paths
        const url = pdf.fileUrl.startsWith('http') 
          ? pdf.fileUrl 
          : `${window.location.origin}${pdf.fileUrl}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setLoadError(err instanceof Error ? err.message : 'Failed to load PDF');
        setPdfBlobUrl(null);
      } finally {
        setLoadingPdf(false);
      }
    };

    loadPdf();

    // Cleanup blob URL on unmount or when PDF changes
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdf?.fileUrl, refreshKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const handleDownload = () => {
    if (!pdfBlobUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = `${pdf?.title || 'document'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!pdfBlobUrl) return;
    
    const printWindow = window.open(pdfBlobUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  };

  const handleCopyLink = () => {
    if (!pdf?.fileUrl) return;
    
    const fullUrl = pdf.fileUrl.startsWith('http') 
      ? pdf.fileUrl 
      : `${window.location.origin}${pdf.fileUrl}`;
    
    navigator.clipboard.writeText(fullUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setLoadError('Failed to copy link');
      });
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      const element = document.documentElement;
      element.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getPDFStatus = () => {
    if (!pdf) return { text: 'No PDF selected', color: 'text-gray-400' };
    if (isGenerating) return { text: 'Generating...', color: 'text-amber-500' };
    if (pdfError) return { text: 'Error: ' + pdfError, color: 'text-red-500' };
    if (pdf.exists) return { text: 'Ready to view', color: 'text-green-500' };
    return { text: 'PDF not generated', color: 'text-gray-400' };
  };

  const status = getPDFStatus();

  // Get view mode icon
  const getViewModeIcon = () => {
    switch (viewMode) {
      case 'list': return <List className="h-4 w-4" />;
      case 'grid': return <Grid3x3 className="h-4 w-4" />;
      case 'detail': return <LayoutGrid className="h-4 w-4" />;
      default: return <LayoutGrid className="h-4 w-4" />;
    }
  };

  // Determine container classes based on view mode
  const getContainerClasses = () => {
    const baseClasses = `bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl overflow-hidden transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
    }`;
    
    switch (viewMode) {
      case 'list':
        return `${baseClasses} max-h-[400px]`;
      case 'grid':
        return `${baseClasses} max-h-[500px]`;
      case 'detail':
      default:
        return `${baseClasses}`;
    }
  };

  // Early returns - AFTER all hooks
  if (!mounted) return null;
  
  if (!pdf) {
    return (
      <div className={getContainerClasses()}>
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
          <FileText className="h-24 w-24 text-gray-600 mb-6" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No PDF Selected</h3>
          <p className="text-gray-500 text-center max-w-md">
            Select a PDF from the sidebar to view and manage it here.
          </p>
          <div className="mt-4 text-sm text-gray-400 flex items-center gap-2">
            {getViewModeIcon()}
            <span>View Mode: {viewMode}</span>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className={getContainerClasses()}>
      {/* Header */}
      <div className="border-b border-gray-800 p-6 bg-gradient-to-r from-gray-900 to-black">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <FileText className="h-6 w-6 text-blue-400 flex-shrink-0" />
              <h2 className="text-xl font-bold truncate">{pdf.title}</h2>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                {status.text}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-400 ml-2">
                {getViewModeIcon()}
                <span>{viewMode}</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm truncate">{pdf.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
              <span>Type: {pdf.type}</span>
              {pdf.fileSize && <span>Size: {pdf.fileSize}</span>}
              {(pdf.lastModified || pdf.updatedAt) && (
                <span>Last Modified: {new Date(pdf.lastModified || pdf.updatedAt || '').toLocaleDateString()}</span>
              )}
              {enableAnnotations && (
                <span className="text-blue-400">Annotations Enabled</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!pdf.exists && !isGenerating && !pdfError && (
              <button
                onClick={() => onGeneratePDF(pdf.id)}
                disabled={isGenerating}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-lg font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Generate PDF
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={handleFullscreen}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-gray-800 p-4 bg-gray-900/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleResetZoom}
              className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
            >
              {zoom}%
            </button>
            
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 300}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {enableAnnotations && (
              <button
                onClick={() => setShowAnnotations(!showAnnotations)}
                className={`p-2 rounded-lg flex items-center gap-2 transition-colors ${
                  showAnnotations ? 'bg-blue-900/30 text-blue-400' : 'bg-gray-800 hover:bg-gray-700'
                }`}
                title={showAnnotations ? 'Hide Annotations' : 'Show Annotations'}
              >
                {showAnnotations ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                <span className="text-sm hidden md:inline">Annotations</span>
              </button>
            )}
            
            <button
              onClick={handleCopyLink}
              disabled={!pdf.exists}
              className={`p-2 rounded-lg flex items-center gap-2 transition-colors ${
                copied ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 hover:bg-gray-700'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
              title="Copy Link"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              <span className="text-sm hidden md:inline">Copy Link</span>
            </button>
            
            <button
              onClick={handlePrint}
              disabled={!pdf.exists || loadingPdf}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              title="Print"
            >
              <Printer className="h-5 w-5" />
              <span className="text-sm hidden md:inline">Print</span>
            </button>
            
            <button
              onClick={handleDownload}
              disabled={!pdf.exists || loadingPdf}
              className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              title="Download"
            >
              <Download className="h-5 w-5" />
              <span className="text-sm hidden md:inline">Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div className={`p-6 bg-gradient-to-b from-gray-950 to-black overflow-auto ${
        viewMode === 'list' ? 'h-[200px]' : 
        viewMode === 'grid' ? 'h-[300px]' : 
        'h-[calc(100%-200px)]'
      }`}>
        {loadError && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Error: {loadError}</p>
            </div>
          </div>
        )}

        {pdfError && !isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="mb-6 p-6 bg-gradient-to-br from-red-900/20 to-black rounded-full">
              <AlertCircle className="h-20 w-20 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-red-400 mb-3">PDF Generation Failed</h3>
            <p className="text-gray-400 max-w-md mb-2">Error: {pdfError}</p>
            <p className="text-gray-500 max-w-md mb-6">
              There was an issue generating this PDF. Please try again.
            </p>
            <button
              onClick={() => onGeneratePDF(pdf.id)}
              disabled={isGenerating}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-lg font-medium flex items-center gap-3 transition-all disabled:opacity-50"
            >
              <RefreshCw className="h-5 w-5" />
              Retry Generation
            </button>
          </div>
        ) : !pdf.exists && !isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="mb-6 p-6 bg-gradient-to-br from-gray-900 to-black rounded-full">
              <FileText className="h-20 w-20 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-400 mb-3">PDF Not Generated</h3>
            <p className="text-gray-500 max-w-md mb-6">
              This PDF hasn't been generated yet. Click the "Generate PDF" button to create it.
            </p>
            <button
              onClick={() => onGeneratePDF(pdf.id)}
              disabled={isGenerating}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-lg font-medium flex items-center gap-3 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  Generate PDF Now
                </>
              )}
            </button>
          </div>
        ) : isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="relative mb-8">
              <div className="h-32 w-32 rounded-full border-4 border-gray-800 border-t-amber-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="h-12 w-12 text-amber-500 animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-amber-500 mb-3">Generating PDF</h3>
            <p className="text-gray-400 max-w-md">
              Your PDF is being generated. This may take a few moments...
            </p>
            <div className="mt-6 text-sm text-gray-500">
              <Clock className="h-4 w-4 inline mr-2 animate-pulse" />
              Processing {pdf.title}
            </div>
          </div>
        ) : loadingPdf ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-gray-800 border-t-blue-500 animate-spin" />
            </div>
            <p className="mt-4 text-gray-400">Loading PDF...</p>
          </div>
        ) : pdfBlobUrl ? (
          <div className="relative h-full">
            {/* PDF Container */}
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden h-full">
              <iframe
                src={pdfBlobUrl}
                title={pdf.title}
                className="w-full h-full border-0"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: '0 0' }}
              />
            </div>

            {/* Zoom Indicator */}
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
              {zoom}%
            </div>

            {/* PDF Info Overlay */}
            {showAnnotations && enableAnnotations && (
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white p-4 rounded-lg max-w-xs">
                <h4 className="font-semibold mb-2">PDF Details</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex justify-between">
                    <span className="text-gray-300">Type:</span>
                    <span>{pdf.type}</span>
                  </li>
                  {pdf.fileSize && (
                    <li className="flex justify-between">
                      <span className="text-gray-300">Size:</span>
                      <span>{pdf.fileSize}</span>
                    </li>
                  )}
                  <li className="flex justify-between">
                    <span className="text-gray-300">Zoom:</span>
                    <span>{zoom}%</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-300">View Mode:</span>
                    <span>{viewMode}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-300">Status:</span>
                    <span className="text-green-400">Ready</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="mb-6 p-6 bg-gradient-to-br from-gray-900 to-black rounded-full">
              <FileText className="h-20 w-20 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-400 mb-3">PDF Unavailable</h3>
            <p className="text-gray-500 max-w-md">
              The PDF could not be loaded. Please try generating it again or check the file URL.
            </p>
            <button
              onClick={() => onGeneratePDF(pdf.id)}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg font-medium flex items-center gap-3 transition-all"
            >
              <RefreshCw className="h-5 w-5" />
              Regenerate PDF
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4 bg-gradient-to-r from-gray-900 to-black">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-4 text-gray-400">
            <span>PDF ID: {pdf.id}</span>
            {(pdf.lastModified || pdf.updatedAt) && (
              <span>Last updated: {new Date(pdf.lastModified || pdf.updatedAt || '').toLocaleString()}</span>
            )}
            <div className="flex items-center gap-1">
              {getViewModeIcon()}
              <span>Mode: {viewMode}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onGeneratePDF(pdf.id)}
              disabled={isGenerating}
              className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            {pdf.fileUrl && (
              <a
                href={pdf.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                Open in new tab
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};