// components/PDFDashboard/index.tsx
import React, { Suspense, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import { usePDFDashboard } from '@/hooks/usePDFDashboard';
import { usePDFAnalytics } from '@/hooks/usePDFAnalytics';
import { usePDFAccessControl } from '@/hooks/usePDFAccessControl';
import { usePDFBatchOperations } from '@/hooks/usePDFBatchOperations';
import { Header } from './Header';
import { StatusMessage } from './StatusMessage';
import { Sidebar } from './Sidebar';
import { PDFViewer } from './PDFViewer';
import { PDFActionsBar } from './PDFActionsBar';
import { PDFQuickActions } from './PDFQuickActions';
import { PDFRecentActivity } from './PDFRecentActivity';
import { PDFExportPanel } from './PDFExportPanel';
import { PDFShareModal } from './PDFShareModal';

// Lazy load heavy components
const PDFAnnotations = React.lazy(() => import('./PDFAnnotations'));
const PDFComparisonView = React.lazy(() => import('./PDFComparisonView'));

interface PDFDashboardProps {
  initialViewMode?: 'list' | 'grid' | 'detail';
  enableAnalytics?: boolean;
  enableSharing?: boolean;
  enableAnnotations?: boolean;
  defaultCategory?: string;
  onPDFOpen?: (pdfId: string) => void;
  onPDFGenerated?: (pdfId: string) => void;
  onError?: (error: Error) => void;
}

const PDFDashboard: React.FC<PDFDashboardProps> = ({
  initialViewMode = 'list',
  enableAnalytics = true,
  enableSharing = false,
  enableAnnotations = false,
  defaultCategory = 'all',
  onPDFOpen,
  onPDFGenerated,
  onError,
}) => {
  const {
    selectedPDF,
    isGenerating,
    generationStatus,
    filterState,
    filteredPDFs,
    categories,
    stats,
    isLoading,
    error: dashboardError,
    viewMode,
    setSelectedPDFId,
    generatePDF,
    generateAllPDFs,
    refreshPDFList,
    updateFilter,
    setGenerationStatus,
    deletePDF,
    duplicatePDF,
    renamePDF,
    updatePDFMetadata,
    setViewMode,
    searchPDFs,
    sortPDFs,
    clearFilters,
  } = usePDFDashboard({
    initialViewMode,
    defaultCategory,
  });

  // Analytics tracking
  const { trackEvent, trackError } = usePDFAnalytics({
    enabled: enableAnalytics,
  });

  // Access control
  const { canEdit, canDelete, canShare } = usePDFAccessControl();

  // Batch operations
  const {
    selectedPDFs,
    togglePDFSelection,
    clearSelection,
    batchDelete,
    batchExport,
    batchTag,
  } = usePDFBatchOperations();

  // Handle PDF selection with analytics
  const handleSelectPDF = useCallback((pdfId: string) => {
    setSelectedPDFId(pdfId);
    if (onPDFOpen) onPDFOpen(pdfId);
    
    if (enableAnalytics) {
      trackEvent('pdf_open', { pdfId, timestamp: new Date().toISOString() });
    }
  }, [setSelectedPDFId, onPDFOpen, enableAnalytics, trackEvent]);

  // Handle PDF generation with analytics
  const handleGeneratePDF = useCallback(async (pdfId?: string, options?: any) => {
    try {
      const result = await generatePDF(pdfId, options);
      if (onPDFGenerated && result?.pdfId) onPDFGenerated(result.pdfId);
      
      if (enableAnalytics) {
        trackEvent('pdf_generated', { 
          pdfId: result?.pdfId || pdfId, 
          options,
          success: true 
        });
      }
      
      return result;
    } catch (error) {
      if (enableAnalytics) {
        trackEvent('pdf_generation_failed', { 
          pdfId,
          error: error instanceof Error ? error.message : 'Unknown error',
          options 
        });
      }
      
      if (onError) onError(error as Error);
      throw error;
    }
  }, [generatePDF, onPDFGenerated, onError, enableAnalytics, trackEvent]);

  // Handle errors
  React.useEffect(() => {
    if (dashboardError && onError) {
      onError(dashboardError);
    }
  }, [dashboardError, onError]);

  // Handle generation status changes
  React.useEffect(() => {
    if (generationStatus && generationStatus.type === 'error') {
      trackError(generationStatus.message, generationStatus.details);
    }
  }, [generationStatus, trackError]);

  return (
    <ErrorBoundary 
      fallback={<PDFDashboardError onRetry={refreshPDFList} />}
      onError={trackError}
    >
      <AnalyticsProvider enabled={enableAnalytics}>
        <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white">
          <div className="max-w-8xl mx-auto p-4 md:p-6 lg:p-8">
            {/* Loading state */}
            {isLoading && <LoadingOverlay message="Loading PDF Dashboard..." />}

            {/* Header Section */}
            <Header
              stats={stats}
              filterState={filterState}
              categories={categories}
              viewMode={viewMode}
              selectedPDFs={selectedPDFs}
              isGenerating={isGenerating}
              onRefresh={refreshPDFList}
              onGenerateAll={generateAllPDFs}
              onFilterChange={updateFilter}
              onSearch={searchPDFs}
              onSort={sortPDFs}
              onClearFilters={clearFilters}
              onViewModeChange={setViewMode}
              onBatchDelete={batchDelete}
              onBatchExport={batchExport}
              enableSharing={enableSharing}
            />

            {/* Status Messages */}
            {generationStatus && (
              <StatusMessage
                message={generationStatus.message}
                type={generationStatus.type}
                details={generationStatus.details}
                progress={generationStatus.progress}
                actionLabel={generationStatus.actionLabel}
                onAction={generationStatus.onAction}
                onDismiss={() => setGenerationStatus(null)}
                autoDismiss={generationStatus.type !== 'error'}
                dismissAfter={5000}
              />
            )}

            {/* Quick Actions Panel */}
            <PDFQuickActions
              isGenerating={isGenerating}
              onGenerateAll={generateAllPDFs}
              onRefresh={refreshPDFList}
              onBatchTag={batchTag}
              selectedCount={selectedPDFs.size}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mt-6">
              {/* Sidebar */}
              <div className="lg:col-span-3 xl:col-span-3 space-y-6">
                <Sidebar
                  pdfs={filteredPDFs}
                  selectedPDFId={selectedPDF?.id || null}
                  selectedPDFs={selectedPDFs}
                  stats={stats}
                  isGenerating={isGenerating}
                  viewMode={viewMode}
                  onSelectPDF={handleSelectPDF}
                  onGeneratePDF={handleGeneratePDF}
                  onToggleSelection={togglePDFSelection}
                  onClearSelection={clearSelection}
                  onDeletePDF={deletePDF}
                  onDuplicatePDF={duplicatePDF}
                  onRenamePDF={renamePDF}
                  onUpdateMetadata={updatePDFMetadata}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />

                {/* Recent Activity Panel */}
                <PDFRecentActivity
                  pdfs={filteredPDFs.slice(0, 5)}
                  onSelectPDF={handleSelectPDF}
                />
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-9 xl:col-span-9 space-y-6">
                {/* PDF Actions Bar */}
                {selectedPDF && (
                  <PDFActionsBar
                    pdf={selectedPDF}
                    isGenerating={isGenerating}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canShare={enableSharing && canShare}
                    onGeneratePDF={() => handleGeneratePDF(selectedPDF.id)}
                    onDeletePDF={deletePDF}
                    onDuplicatePDF={duplicatePDF}
                    onRenamePDF={renamePDF}
                    onUpdateMetadata={updatePDFMetadata}
                    onShare={() => {/* Open share modal */}}
                  />
                )}

                {/* PDF Viewer & Content */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-4 md:p-6">
                  <PDFViewer
                    pdf={selectedPDF}
                    isGenerating={isGenerating}
                    onGeneratePDF={handleGeneratePDF}
                    refreshKey={stats.totalPDFs}
                    viewMode={viewMode}
                    enableAnnotations={enableAnnotations}
                  />

                  {/* Annotations Panel (Lazy Loaded) */}
                  {selectedPDF && enableAnnotations && (
                    <Suspense fallback={<div className="mt-6 p-4 text-gray-400">Loading annotations...</div>}>
                      <PDFAnnotations
                        pdfId={selectedPDF.id}
                        onSave={(annotations) => {
                          updatePDFMetadata(selectedPDF.id, { annotations });
                        }}
                      />
                    </Suspense>
                  )}

                  {/* Export Panel */}
                  {selectedPDF && (
                    <PDFExportPanel
                      pdf={selectedPDF}
                      onExport={(format) => {
                        trackEvent('pdf_export', { pdfId: selectedPDF.id, format });
                      }}
                    />
                  )}
                </div>

                {/* Comparison View (Lazy Loaded) */}
                {selectedPDFs.size > 1 && (
                  <Suspense fallback={<div className="mt-6 p-4 text-gray-400">Loading comparison...</div>}>
                    <PDFComparisonView
                      pdfIds={Array.from(selectedPDFs)}
                      onClose={clearSelection}
                    />
                  </Suspense>
                )}
              </div>
            </div>

            {/* Share Modal */}
            {enableSharing && selectedPDF && (
              <PDFShareModal
                pdf={selectedPDF}
                isOpen={false} // Control via state
                onClose={() => {/* Close modal */}}
                onShare={(shareOptions) => {
                  trackEvent('pdf_shared', { 
                    pdfId: selectedPDF.id, 
                    ...shareOptions 
                  });
                }}
              />
            )}
          </div>
        </div>
      </AnalyticsProvider>
    </ErrorBoundary>
  );
};

// Error component
const PDFDashboardError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
    <div className="max-w-md text-center">
      <div className="text-red-500 text-6xl mb-6">⚠️</div>
      <h2 className="text-2xl font-bold text-white mb-3">Dashboard Error</h2>
      <p className="text-gray-400 mb-6">
        Unable to load the PDF dashboard. Please check your connection and try again.
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Retry
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
);

// Performance optimizations
PDFDashboard.displayName = 'PDFDashboard';

// Default props for safer usage
PDFDashboard.defaultProps = {
  enableAnalytics: true,
  enableSharing: false,
  enableAnnotations: false,
  initialViewMode: 'list',
  defaultCategory: 'all',
} as Partial<PDFDashboardProps>;

export default React.memo(PDFDashboard);
