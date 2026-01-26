// components/PDFDashboard/index.tsx
import React, { Suspense, useCallback, useEffect, useMemo } from "react";
import type { ErrorInfo } from "react";

import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";

import usePDFDashboard from "@/hooks/usePDFDashboard";
import { usePDFAnalytics } from "@/hooks/usePDFAnalytics";
import { usePDFAccessControl } from "@/hooks/usePDFAccessControl";
import { usePDFBatchOperations } from "@/hooks/usePDFBatchOperations";

import { Header } from "./Header";
import { StatusMessage } from "./StatusMessage";
import { Sidebar } from "./Sidebar";
import { PDFViewer } from "./PDFViewer";
import PDFActionsBar from "./PDFActionsBar";
import { PDFQuickActions } from "./PDFQuickActions";
import { PDFRecentActivity } from "./PDFRecentActivity";
import { PDFExportPanel } from "./PDFExportPanel";
import { PDFShareModal } from "./PDFShareModal";
import { safeSlice } from "@/lib/utils/safe";


const PDFAnnotations = React.lazy(() => import("./PDFAnnotations"));
const PDFComparisonView = React.lazy(() => import("./PDFComparisonView"));

type ViewMode = "list" | "grid" | "detail";

interface PDFDashboardProps {
  initialViewMode?: ViewMode;
  enableAnalytics?: boolean;
  enableSharing?: boolean;
  enableAnnotations?: boolean;
  defaultCategory?: string;
  onPDFOpen?: (pdfId: string) => void;
  onPDFGenerated?: (pdfId: string) => void;
  onError?: (error: Error) => void;
}

const PDFDashboard: React.FC<PDFDashboardProps> = ({
  initialViewMode = "list",
  enableAnalytics = true,
  enableSharing = false,
  enableAnnotations = false,
  defaultCategory = "all",
  onPDFOpen,
  onPDFGenerated,
  onError,
}) => {
  const {
    filteredPDFs,
    selectedPDF,
    selectedPDFId,
    isLoading,
    isGenerating,

    viewMode,
    setViewMode,

    filterState,
    categories,
    stats,

    generationStatus,
    setGenerationStatus,
    error: dashboardError,

    setSelectedPDFId,
    refreshPDFList,
    generatePDF,
    generateAllPDFs,
    updateFilter,
    searchPDFs,
    sortPDFs,
    clearFilters,
    deletePDF,
    duplicatePDF,
    renamePDF,
    updatePDFMetadata,
  } = usePDFDashboard({ initialViewMode, defaultCategory });

  const { trackEvent, trackError } = usePDFAnalytics({ enabled: enableAnalytics });
  const { canEdit, canDelete, canShare } = usePDFAccessControl();

  const { selectedPDFs, togglePDFSelection, clearSelection, batchDelete, batchExport, batchTag } =
    usePDFBatchOperations();

  const selectedIds = useMemo(() => Array.from(selectedPDFs), [selectedPDFs]);

  const handleBoundaryError = useCallback(
    (error: Error, errorInfo: ErrorInfo) => {
      trackError(error.message, { errorInfo, stack: error.stack });
      onError?.(error);
    },
    [trackError, onError],
  );

  const handleSelectPDF = useCallback(
    (pdfId: string) => {
      setSelectedPDFId(pdfId);
      onPDFOpen?.(pdfId);

      if (enableAnalytics) {
        trackEvent("pdf_open", { pdfId, timestamp: new Date().toISOString() });
      }
    },
    [setSelectedPDFId, onPDFOpen, enableAnalytics, trackEvent],
  );

  const handleGeneratePDF = useCallback(
    async (pdfId?: string, options?: unknown) => {
      const result = await generatePDF(pdfId, options);
      const generatedId = (result as any)?.pdfId || pdfId;

      if (generatedId) onPDFGenerated?.(generatedId);

      if (enableAnalytics) {
        trackEvent("pdf_generated", {
          pdfId: generatedId,
          options,
          success: Boolean((result as any)?.success),
          timestamp: new Date().toISOString(),
        });
      }

      return result;
    },
    [generatePDF, onPDFGenerated, enableAnalytics, trackEvent],
  );

  /**
   * IMPORTANT:
   * - Header expects: () => Promise<any>  (or Promise<void>)
   * - PDFQuickActions often expects: () => void | Promise<void>
   *
   * So:
   * - Provide the REAL Promise-returning function to Header
   * - Provide a void-safe wrapper to QuickActions
   */
  const handleGenerateAllPromise = useCallback(async () => {
    // Always return a Promise (do NOT void this)
    await generateAllPDFs();
  }, [generateAllPDFs]);

  const handleGenerateAllVoid = useCallback(() => {
    // Fire-and-forget wrapper for components that want void
    void handleGenerateAllPromise();
  }, [handleGenerateAllPromise]);

  const handleDeletePDF = useCallback(
    async (id: string) => {
      await deletePDF(id);
      if (enableAnalytics) trackEvent("pdf_deleted", { pdfId: id, timestamp: new Date().toISOString() });
    },
    [deletePDF, enableAnalytics, trackEvent],
  );

  const handleDuplicatePDF = useCallback(
    async (id: string) => {
      await duplicatePDF(id);
      if (enableAnalytics) trackEvent("pdf_duplicated", { pdfId: id, timestamp: new Date().toISOString() });
    },
    [duplicatePDF, enableAnalytics, trackEvent],
  );

  const handleRenamePDF = useCallback(
    async (id: string, newTitle: string) => {
      await renamePDF(id, newTitle);
      if (enableAnalytics) {
        trackEvent("pdf_renamed", { pdfId: id, title: newTitle, timestamp: new Date().toISOString() });
      }
    },
    [renamePDF, enableAnalytics, trackEvent],
  );

  const handleUpdateMetadata = useCallback(
    async (id: string, metadata: any) => {
      await updatePDFMetadata(id, metadata);
      if (enableAnalytics) {
        trackEvent("pdf_metadata_updated", { pdfId: id, timestamp: new Date().toISOString() });
      }
    },
    [updatePDFMetadata, enableAnalytics, trackEvent],
  );

  useEffect(() => {
    if (dashboardError) onError?.(dashboardError);
  }, [dashboardError, onError]);

  useEffect(() => {
    if (generationStatus?.type === "error") {
      trackError(generationStatus.message, generationStatus.details);
    }
  }, [generationStatus, trackError]);

  return (
    <ErrorBoundary fallback={<PDFDashboardError onRetry={refreshPDFList} />} onError={handleBoundaryError}>
      <AnalyticsProvider enabled={enableAnalytics}>
        <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white">
          <div className="max-w-8xl mx-auto p-4 md:p-6 lg:p-8">
            {isLoading && <LoadingOverlay message="Loading PDF Dashboard..." />}

            <Header
              stats={stats}
              filterState={filterState}
              categories={categories}
              viewMode={viewMode}
              selectedPDFs={selectedPDFs}
              isGenerating={isGenerating}
              onRefresh={refreshPDFList}
              // ✅ Must return Promise (no `void`)
              onGenerateAll={handleGenerateAllPromise}
              onFilterChange={updateFilter}
              onSearch={searchPDFs}
              onSort={sortPDFs}
              onClearFilters={clearFilters}
              onViewModeChange={setViewMode}
              onBatchDelete={batchDelete}
              onBatchExport={batchExport}
              enableSharing={enableSharing}
            />

            {generationStatus && (
              <StatusMessage
                message={generationStatus.message}
                type={generationStatus.type === "warning" ? "info" : generationStatus.type}
                details={generationStatus.details}
                progress={generationStatus.progress}
                actionLabel={generationStatus.actionLabel}
                onAction={generationStatus.onAction}
                onDismiss={() => setGenerationStatus(null)}
                autoDismiss={generationStatus.type !== "error"}
                dismissAfter={5000}
              />
            )}

            <PDFQuickActions
              isGenerating={isGenerating}
              // ✅ Void-safe (QuickActions typically wants void/Promise<void>)
              onGenerateAll={handleGenerateAllVoid}
              onRefresh={refreshPDFList}
              onBatchTag={batchTag}
              selectedCount={selectedPDFs.size}
              selectedIds={selectedIds}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mt-6">
              <div className="lg:col-span-3 xl:col-span-3 space-y-6">
                <Sidebar
                  pdfs={filteredPDFs}
                  selectedPDFId={selectedPDFId}
                  selectedPDFs={selectedPDFs}
                  stats={stats}
                  isGenerating={isGenerating}
                  viewMode={viewMode}
                  onSelectPDF={handleSelectPDF}
                  onGeneratePDF={(id) => void handleGeneratePDF(id)}
                  onToggleSelection={togglePDFSelection}
                  onClearSelection={clearSelection}
                  onDeletePDF={handleDeletePDF}
                  onDuplicatePDF={handleDuplicatePDF}
                  onRenamePDF={handleRenamePDF}
                  onUpdateMetadata={handleUpdateMetadata}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />

                <PDFRecentActivity pdfs={safeSlice(filteredPDFs, 0, 5)} onSelectPDF={handleSelectPDF} />
              </div>

              <div className="lg:col-span-9 xl:col-span-9 space-y-6">
                {selectedPDF && (
                  <PDFActionsBar
                    // If PDFActionsBar is typed to a different PDFItem, we keep runtime-safe cast here.
                    // (Real fix is to unify the PDFItem type source across hooks/components.)
                    pdf={selectedPDF as any}
                    isGenerating={isGenerating}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canShare={enableSharing && canShare}
                    onGeneratePDF={() => void handleGeneratePDF((selectedPDF as any).id)}
                    onDeletePDF={() => void handleDeletePDF((selectedPDF as any).id)}
                    onDuplicatePDF={() => void handleDuplicatePDF((selectedPDF as any).id)}
                    onRenamePDF={(newTitle) => void handleRenamePDF((selectedPDF as any).id, newTitle)}
                    onUpdateMetadata={(metadata) => void handleUpdateMetadata((selectedPDF as any).id, metadata)}
                    onShare={() => {}}
                  />
                )}

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-4 md:p-6">
                  <PDFViewer
                    pdf={selectedPDF as any}
                    isGenerating={isGenerating}
                    onGeneratePDF={handleGeneratePDF}
                    refreshKey={(stats as any)?.totalPDFs ?? (stats as any)?.total ?? 0}
                    viewMode={viewMode}
                    enableAnnotations={enableAnnotations}
                  />

                  {selectedPDF && enableAnnotations && (
                    <Suspense fallback={<div className="mt-6 p-4 text-gray-400">Loading annotations...</div>}>
                      <PDFAnnotations
                        pdfId={(selectedPDF as any).id}
                        onSave={(annotations: any) =>
                          void handleUpdateMetadata((selectedPDF as any).id, { annotations })
                        }
                      />
                    </Suspense>
                  )}

                  {selectedPDF && (
                    <PDFExportPanel
                      pdf={selectedPDF as any}
                      onExport={(format: any) =>
                        trackEvent("pdf_export", {
                          pdfId: (selectedPDF as any).id,
                          format,
                          timestamp: new Date().toISOString(),
                        })
                      }
                    />
                  )}
                </div>

                {selectedPDFs.size > 1 && (
                  <Suspense fallback={<div className="mt-6 p-4 text-gray-400">Loading comparison...</div>}>
                    <PDFComparisonView pdfIds={selectedIds} onClose={clearSelection} />
                  </Suspense>
                )}
              </div>
            </div>

            {enableSharing && selectedPDF && (
              <PDFShareModal
                pdf={selectedPDF as any}
                isOpen={false}
                onClose={() => {}}
                onShare={(shareOptions: any) =>
                  trackEvent("pdf_shared", {
                    pdfId: (selectedPDF as any).id,
                    ...shareOptions,
                    timestamp: new Date().toISOString(),
                  })
                }
              />
            )}
          </div>
        </div>
      </AnalyticsProvider>
    </ErrorBoundary>
  );
};

const PDFDashboardError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
    <div className="max-w-md text-center">
      <div className="text-red-500 text-6xl mb-6">⚠️</div>
      <h2 className="text-2xl font-bold text-white mb-3">Dashboard Error</h2>
      <p className="text-gray-400 mb-6">Unable to load the PDF dashboard. Please check your connection and try again.</p>
      <div className="flex gap-4 justify-center">
        <button
          type="button"
          onClick={onRetry}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
);

PDFDashboard.displayName = "PDFDashboard";
export default React.memo(PDFDashboard);