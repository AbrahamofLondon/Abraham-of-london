/* pages/admin/pdf-dashboard.tsx — PDF INTELLIGENCE ENGINE (INTEGRITY MODE) */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";
import { usePDFDashboard } from "@/hooks/usePDFDashboard";
import { useToast } from "@/hooks/useToast";

// Core Dashboard Components
import DashboardHeader from "@/components/DashboardHeader";
import PDFListPanel from "@/components/PDFListPanel";
import PDFViewerPanel from "@/components/PDFViewerPanel";
import StatusMessage from "@/components/StatusMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import PDFFilters from "@/components/PDFFilters";
import DashboardStats from "@/components/DashboardStats";
import PDFQuickActions from "@/components/PDFQuickActions";
import PDFActionsBar from "@/components/PDFActionsBar";
import ErrorBoundary from "@/components/ErrorBoundary";

// Specialized Data Visualization Modules
import PDFDataDashboard from "@/components/dashboard/PDFDataDashboard";
import LiveDataDashboard from "@/components/dashboard/LiveDataDashboard";

interface PDFDashboardProps {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
  };
}

const PDFDashboard: React.FC<PDFDashboardProps> = ({ user }) => {
  const router = useRouter();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<"list" | "grid" | "detail" | "live">("grid");
  const [selectedPDFs, setSelectedPDFs] = useState<Set<string>>(new Set());

  const searchQuery = (router.query.search as string) || "";
  const category = (router.query.category as string) || "all";
  const sortBy = (router.query.sort as string) || "updatedAt";
  const sortOrder = ((router.query.order as string) === "asc" ? "asc" : "desc") as "asc" | "desc";

  const {
    filteredPDFs,
    selectedPDF,
    isGenerating,
    generationStatus,
    filters,
    categories,
    stats,
    isLoading,
    error,
    setSelectedPDFId,
    generatePDF,
    generateAllPDFs,
    refreshPDFList,
    updateFilter,
    setGenerationStatus,
    deletePDF,
    duplicatePDF,
    renamePDF,
    searchPDFs,
    sortPDFs,
    clearFilters,
    batchDelete,
  } = usePDFDashboard({
    userId: user?.id || "anonymous",
    initialFilters: {
      search: searchQuery,
      category,
      sortBy,
      sortOrder,
      status: "all",
    },
  });

  // Persist Filter State to URL (clean query — no undefined)
  useEffect(() => {
    const query: Record<string, string> = {};

    if (filters.search) query.search = filters.search;
    if (filters.category && filters.category !== "all") query.category = filters.category;
    if (filters.sortBy && filters.sortBy !== "updatedAt") query.sort = filters.sortBy;
    if (filters.sortOrder && filters.sortOrder !== "desc") query.order = filters.sortOrder;

    // keep existing "live" param if present
    if (router.query.live === "true") query.live = "true";

    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.category, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    if (error) toast.error("Dashboard Error", error.message);
  }, [error, toast]);

  const handleSelectPDF = (pdfId: string) => setSelectedPDFId(pdfId);

  const togglePDFSelection = (pdfId: string) => {
    setSelectedPDFs((prev) => {
      const next = new Set(prev);
      next.has(pdfId) ? next.delete(pdfId) : next.add(pdfId);
      return next;
    });
  };

  const clearSelection = () => setSelectedPDFs(new Set());

  const handleBatchDelete = async () => {
    if (selectedPDFs.size === 0) return;

    if (confirm(`Authorize destruction of ${selectedPDFs.size} restricted volumes?`)) {
      try {
        await batchDelete(Array.from(selectedPDFs));
        clearSelection();
        toast.success("Sequence Complete", `${selectedPDFs.size} records purged.`);
      } catch {
        toast.error("Authority Rejected", "Batch deletion failed.");
      }
    }
  };

  const toggleLiveView = () => {
    const newMode = viewMode === "live" ? "grid" : "live";
    setViewMode(newMode);

    const query: Record<string, string> = {};
    if (filters.search) query.search = filters.search;
    if (filters.category && filters.category !== "all") query.category = filters.category;
    if (filters.sortBy && filters.sortBy !== "updatedAt") query.sort = filters.sortBy;
    if (filters.sortOrder && filters.sortOrder !== "desc") query.order = filters.sortOrder;

    if (newMode === "live") query.live = "true";

    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner message="Decrypting Vault Contents..." />
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<DashboardError onRetry={refreshPDFList} />}>
      <div className="min-h-screen bg-zinc-950 text-white selection:bg-gold/30">
        <div className="max-w-[1600px] mx-auto p-6 md:p-10">
          <DashboardHeader
            title="Intelligence Pipeline"
            subtitle="Abraham of London • Restricted Portfolio Management"
            stats={stats}
            user={user}
            onRefresh={refreshPDFList}
            onGenerateAll={generateAllPDFs}
            isGenerating={isGenerating}
            additionalActions={
              <button
                onClick={toggleLiveView}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                  viewMode === "live"
                    ? "bg-gold border-gold text-black shadow-lg shadow-gold/20"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {viewMode === "live" ? "Exit Live Pulse" : "Initiate Live Pulse"}
              </button>
            }
          />

          {generationStatus && <StatusMessage status={generationStatus} onDismiss={() => setGenerationStatus(null)} />}

          {viewMode === "live" ? (
            <div className="space-y-8 animate-in fade-in duration-700">
              <LiveDataDashboard theme="dark" onPDFSelect={handleSelectPDF} />
              <div className="flex justify-center">
                <button
                  onClick={toggleLiveView}
                  className="px-8 py-4 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  ← Return to Manuscript Registry
                </button>
              </div>
            </div>
          ) : (
            <>
              <PDFQuickActions
                selectedCount={selectedPDFs.size}
                onRefresh={refreshPDFList}
                onGenerateAll={generateAllPDFs}
                onBatchDelete={handleBatchDelete}
                onClearSelection={clearSelection}
                isGenerating={isGenerating}
                additionalButtons={<div className="h-4 w-px bg-zinc-800 mx-2 hidden sm:block" />}
              />

              <div className="mb-10">
                <PDFFilters
                  searchQuery={filters.search}
                  selectedCategory={filters.category}
                  sortBy={filters.sortBy}
                  sortOrder={filters.sortOrder}
                  categories={categories}
                  onSearchChange={searchPDFs}
                  onCategoryChange={(value) => updateFilter({ category: value })}
                  onSortChange={sortPDFs}
                  onClearFilters={clearFilters}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Sidebar: Registry */}
                <div className="lg:col-span-4">
                  <div className="rounded-[2rem] border border-white/5 bg-zinc-900/30 backdrop-blur-md p-8 sticky top-10">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                        Indexed Manuscripts ({filteredPDFs.length})
                      </h2>
                    </div>

                    <PDFListPanel
                      pdfs={filteredPDFs}
                      selectedPDFId={selectedPDF?.id || null}
                      selectedPDFs={selectedPDFs}
                      isGenerating={isGenerating}
                      viewMode={viewMode}
                      onSelectPDF={handleSelectPDF}
                      onGeneratePDF={generatePDF}
                      onToggleSelection={togglePDFSelection}
                      onDeletePDF={deletePDF}
                      onDuplicatePDF={duplicatePDF}
                    />

                    <div className="mt-8 pt-8 border-t border-white/5">
                      <DashboardStats stats={stats} selectedCount={selectedPDFs.size} />
                    </div>
                  </div>
                </div>

                {/* Main: Viewer */}
                <div className="lg:col-span-8">
                  <div className="rounded-[2rem] border border-white/5 bg-zinc-900/20 backdrop-blur-sm p-2 md:p-10 min-h-[800px] flex flex-col">
                    {selectedPDF && (
                      <PDFActionsBar
                        pdf={selectedPDF}
                        isGenerating={isGenerating}
                        onGeneratePDF={() => generatePDF(selectedPDF.id)}
                        onDeletePDF={() => deletePDF(selectedPDF.id)}
                        onDuplicatePDF={() => duplicatePDF(selectedPDF.id)}
                        onRenamePDF={() => {
                          const newName = prompt("Enter Institutional Designation:", selectedPDF.title);
                          if (newName) renamePDF(selectedPDF.id, newName);
                        }}
                        canEdit={!!user?.permissions?.includes("pdf:edit")}
                        canDelete={!!user?.permissions?.includes("pdf:delete")}
                      />
                    )}

                    <div className="flex-grow mt-6">
                      <PDFViewerPanel
                        pdf={selectedPDF}
                        isGenerating={isGenerating}
                        onGeneratePDF={generatePDF}
                        refreshKey={stats.totalPDFs}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mt-20 border-t border-white/5 pt-12">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-zinc-600">Archival Analytics</h3>
            <PDFDataDashboard view="analytics" theme="dark" onPDFSelect={handleSelectPDF} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

const DashboardError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="min-h-screen bg-black flex items-center justify-center p-8">
    <div className="max-w-md text-center">
      <div className="text-gold text-4xl mb-6">!</div>
      <h2 className="text-2xl font-serif font-bold text-white mb-4">Registry Desynchronized</h2>
      <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
        The PDF Intelligence System encountered a structural error. Re-authentication may be required.
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={onRetry}
          className="px-8 py-3 bg-gold text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
        >
          Re-Sync Registry
        </button>
      </div>
    </div>
  </div>
);

export default withAdminAuth(PDFDashboard);