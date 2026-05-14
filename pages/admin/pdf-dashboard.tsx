import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps, NextPage } from "next";

import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { usePDFDashboard } from "@/hooks/usePDFDashboard";
import { useToast } from "@/hooks/useToast";
import { getInstitutionalAnalyticsServer } from "@/lib/server/institutional-analytics";
import type {
  FilterState,
  PDFItem,
  DashboardStats as CanonicalDashboardStats,
  AdminUser,
} from "@/types/pdf-dashboard";

import AdminLayout from "@/components/admin/AdminLayout";
import DashboardHeader from "@/components/DashboardHeader";
import PDFViewerPanel from "@/components/PDFViewerPanel";
import StatusMessage from "@/components/StatusMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import PDFFilters from "@/components/PDFFilters";
import DashboardStats from "@/components/DashboardStats";
import PDFQuickActions from "@/components/PDFQuickActions";
import PDFActionsBar from "@/components/PDFActionsBar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PDFDataDashboard } from "@/components/dashboard/PDFDataDashboard";
import { LiveDataDashboard } from "@/components/dashboard/LiveDataDashboard";

type InstitutionalAnalyticsPayload = {
  rawPdfs: unknown[];
  stats: unknown;
};

interface PDFDashboardProps {
  user?: AdminUser;
  initialAnalytics: InstitutionalAnalyticsPayload | null;
  analyticsError: string | null;
}

type HeaderStats = {
  total: number;
  available: number;
  missing: number;
};

// Type for PDFActionsBar that matches exactly what the component needs
type ActionsBarPDF = PDFItem & {
  status: 'generated' | 'missing';
};

function extractPermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return ["pdf:edit", "pdf:delete"];
  const out = value.map((p) => String(p)).filter(Boolean);
  return out.length > 0 ? out : ["pdf:edit", "pdf:delete"];
}

function normalizeSortBy(value: string): FilterState["sortBy"] {
  return value === "title" ||
    value === "date" ||
    value === "size" ||
    value === "category"
    ? value
    : "date";
}

function transformStatsForDashboard(stats: CanonicalDashboardStats | undefined): HeaderStats {
  return {
    total: stats?.totalPDFs || 0,
    available: stats?.availablePDFs || 0,
    missing: stats?.missingPDFs || 0
  };
}

// Convert PDFItem to ActionsBarPDF format - preserves all PDFItem properties
function toActionsBarPDF(pdf: PDFItem | null): ActionsBarPDF | null {
  if (!pdf) return null;
  
  return {
    ...pdf,
    status: pdf.exists ? "generated" : "missing"
  };
}

export const getServerSideProps: GetServerSideProps<PDFDashboardProps> = async (context) => {
  const admin = await requireAdminPage(context);
  if (!admin.ok) return { redirect: admin.redirect } as any;

  const effectiveEmail = admin.adminEmail;
  const effectiveName = effectiveEmail || "Administrator";
  const effectiveRole = "admin";
  const effectivePermissions = { isAdmin: true, isOwner: effectiveEmail === "info@abrahamoflondon.org", isAuthenticated: true };

  try {
    const result = await getInstitutionalAnalyticsServer();
    return {
      props: {
        user: {
          id: String(admin.adminEmail || "admin"),
          email: String(effectiveEmail),
          name: String(effectiveName),
          role: String(effectiveRole),
          permissions: extractPermissions(effectivePermissions),
        },
        initialAnalytics: result.success ? (result.data as InstitutionalAnalyticsPayload) : null,
        analyticsError: result.success ? null : result.error || "Analytics failed to load",
      },
    };
  } catch (e: any) {
    return {
      props: {
        user: {
          id: String(admin.adminEmail || "admin"),
          email: String(effectiveEmail),
          name: String(effectiveName),
          role: String(effectiveRole),
          permissions: extractPermissions(effectivePermissions),
        },
        initialAnalytics: null,
        analyticsError: e?.message || "Unknown SSR error",
      },
    };
  }

};

const PDFDashboardPage: NextPage<PDFDashboardProps> = ({
  user,
  initialAnalytics,
  analyticsError,
}) => {
  const router = useRouter();
  const toastApi = useToast();
  const [panelMode, setPanelMode] = useState<"grid" | "live">("grid");
  const [selectedPDFs, setSelectedPDFs] = useState<Set<string>>(new Set());

  const {
    filteredPDFs,
    selectedPDF,
    isGenerating,
    generationStatus,
    filterState,
    categories,
    stats,
    isLoading,
    error,
    setSelectedPDFId,
    setViewMode,
    setGenerationStatus,
    refreshPDFList,
    generatePDF,
    generateAllPDFs,
    updateFilter,
    searchPDFs,
    clearFilters,
    deletePDF,
    duplicatePDF,
    renamePDF,
  } = usePDFDashboard({
    initialFilter: {
      searchQuery: (router.query.search as string) || "",
      selectedCategory: (router.query.category as string) || "all",
      sortBy: normalizeSortBy((router.query.sort as string) || "date"),
      sortOrder: (router.query.order as string) === "asc" ? "asc" : "desc",
      statusFilter: "all",
    },
  });

  const actionsBarSelectedPDF = useMemo(() => toActionsBarPDF(selectedPDF), [selectedPDF]);

  useEffect(() => {
    if (analyticsError) toastApi.warning("Analytics Warning", analyticsError);
    if (error) toastApi.error("Dashboard Error", error.message);
  }, [analyticsError, error, toastApi]);

  useEffect(() => {
    const query: Record<string, string> = {};
    if (filterState.searchQuery) query.search = filterState.searchQuery;
    if (filterState.selectedCategory && filterState.selectedCategory !== "all") {
      query.category = filterState.selectedCategory;
    }
    if (filterState.sortBy && filterState.sortBy !== "date") query.sort = filterState.sortBy;
    if (filterState.sortOrder && filterState.sortOrder !== "desc") query.order = filterState.sortOrder;
    if (panelMode === "live") query.live = "true";
    
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [filterState, panelMode, router]);

  useEffect(() => {
    setViewMode("grid");
  }, [setViewMode]);

  const handleSelectPDF = (pdfId: string) => setSelectedPDFId(pdfId);
  
  const togglePDFSelection = (pdfId: string) => {
    setSelectedPDFs(prev => {
      const next = new Set(prev);
      next.has(pdfId) ? next.delete(pdfId) : next.add(pdfId);
      return next;
    });
  };

  const clearSelection = () => setSelectedPDFs(new Set());

  const handleBatchDelete = async () => {
    if (!selectedPDFs.size) return;
    if (confirm(`Authorize destruction of ${selectedPDFs.size} restricted volumes?`)) {
      try {
        await Promise.all(Array.from(selectedPDFs).map(deletePDF));
        clearSelection();
        toastApi.success("Sequence Complete", `${selectedPDFs.size} records purged.`);
      } catch {
        toastApi.error("Authority Rejected", "Batch deletion failed.");
      }
    }
  };

  const toggleLiveView = () => setPanelMode(prev => prev === "live" ? "grid" : "live");

  if (isLoading) {
    return (
      <AdminLayout title="PDF Analytics">
        <div className="flex min-h-[480px] items-center justify-center bg-black">
          <LoadingSpinner message="Decrypting Vault Contents..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="PDF Analytics">
      <ErrorBoundary fallback={<DashboardError onRetry={refreshPDFList} />}>
        <div className="min-h-screen bg-zinc-950 text-white">
          <div className="mx-auto max-w-[1600px] p-6 md:p-10">
          <DashboardHeader
            title="Intelligence Registry"
            subtitle="Restricted portfolio oversight and archival command"
            stats={transformStatsForDashboard(stats)}
            user={user}
            onRefresh={refreshPDFList}
            onGenerateAll={generateAllPDFs}
            isGenerating={isGenerating}
          />

          <div className="mt-6">
            <button
              onClick={toggleLiveView}
              className={`rounded-xl border px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                panelMode === "live"
                  ? "border-gold bg-gold text-black"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {panelMode === "live" ? "Exit Live Pulse" : "Initiate Live Pulse"}
            </button>
          </div>

          {generationStatus && (
            <StatusMessage status={generationStatus} onDismiss={() => setGenerationStatus(null)} />
          )}

          {panelMode === "live" ? (
            <div className="mt-8 space-y-8">
              <LiveDataDashboard theme="dark" onPDFSelect={handleSelectPDF} />
              <div className="flex justify-center">
                <button
                  onClick={toggleLiveView}
                  className="rounded-xl border border-white/5 bg-zinc-900 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-800 hover:text-white"
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
              />

              <div className="mb-10 mt-8">
                <PDFFilters
                  searchQuery={filterState.searchQuery}
                  selectedCategory={filterState.selectedCategory}
                  sortBy={filterState.sortBy}
                  sortOrder={filterState.sortOrder}
                  categories={categories}
                  onSearchChange={searchPDFs}
                  onCategoryChange={(value) => updateFilter({ selectedCategory: value })}
                  onSortChange={(value) => updateFilter({ sortBy: value as any })}
                  onSortOrderChange={(value) => updateFilter({ sortOrder: value })}
                  onClearFilters={clearFilters}
                />
              </div>

              <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <div className="sticky top-10 rounded-[2rem] border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-md">
                    <h2 className="mb-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                      Indexed Manuscripts ({filteredPDFs.length})
                    </h2>

                    <div className="space-y-3">
                      {filteredPDFs.map((pdf) => {
                        const isActive = selectedPDF?.id === pdf.id;
                        const isChecked = selectedPDFs.has(pdf.id);

                        return (
                          <div
                            key={pdf.id}
                            className={`rounded-2xl border p-4 transition-all ${
                              isActive
                                ? "border-gold/40 bg-gold/10"
                                : "border-white/5 bg-black/20 hover:border-white/10"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePDFSelection(pdf.id)}
                                className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
                              />
                              <button
                                type="button"
                                onClick={() => handleSelectPDF(pdf.id)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="truncate text-sm font-semibold text-white">
                                    {pdf.title}
                                  </p>
                                  <span
                                    className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${
                                      pdf.exists
                                        ? "bg-emerald-500/10 text-emerald-300"
                                        : "bg-zinc-700/40 text-zinc-400"
                                    }`}
                                  >
                                    {pdf.exists ? "ready" : "missing"}
                                  </span>
                                </div>
                                <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
                                  {pdf.description || "No description available."}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-[9px] font-mono uppercase tracking-[0.16em] text-zinc-600">
                                  <span>{pdf.category || "Uncategorized"}</span>
                                  <span>•</span>
                                  <span>{pdf.type}</span>
                                </div>
                              </button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                onClick={() => generatePDF(pdf.id)}
                                disabled={isGenerating}
                                className="rounded-xl border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300 hover:bg-white hover:text-black disabled:opacity-50"
                              >
                                Generate
                              </button>
                              <button
                                onClick={() => duplicatePDF(pdf.id)}
                                className="rounded-xl border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300 hover:bg-white hover:text-black"
                              >
                                Duplicate
                              </button>
                              <button
                                onClick={() => deletePDF(pdf.id)}
                                className="rounded-xl border border-red-500/20 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-300 hover:bg-red-500/10"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-8 border-t border-white/5 pt-8">
                      <DashboardStats
                        stats={transformStatsForDashboard(stats)}
                        selectedCount={selectedPDFs.size}
                      />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <div className="flex min-h-[800px] flex-col rounded-[2rem] border border-white/5 bg-zinc-900/20 p-2 backdrop-blur-sm md:p-10">
                    {actionsBarSelectedPDF && (
                      <PDFActionsBar
                        pdf={actionsBarSelectedPDF}
                        isGenerating={isGenerating}
                        onGeneratePDF={() => generatePDF(actionsBarSelectedPDF.id)}
                        onDeletePDF={() => deletePDF(actionsBarSelectedPDF.id)}
                        onDuplicatePDF={() => duplicatePDF(actionsBarSelectedPDF.id)}
                        onRenamePDF={() => {
                          const newName = prompt("Enter Institutional Designation:", actionsBarSelectedPDF.title);
                          if (newName) renamePDF(actionsBarSelectedPDF.id, newName);
                        }}
                        canEdit={!!user?.permissions?.includes("pdf:edit")}
                        canDelete={!!user?.permissions?.includes("pdf:delete")}
                      />
                    )}

                    <div className="mt-6 flex-grow">
                      <PDFViewerPanel
                        pdf={selectedPDF}
                        isGenerating={isGenerating}
                        onGeneratePDF={generatePDF}
                        refreshKey={stats?.totalPDFs || 0}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mt-20 border-t border-white/5 pt-12">
            <h3 className="mb-8 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
              Archival Analytics
            </h3>
            <PDFDataDashboard
              theme="dark"
              onPDFSelect={handleSelectPDF}
            />
          </div>
          </div>
        </div>
      </ErrorBoundary>
    </AdminLayout>
  );
};

const DashboardError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="flex min-h-screen items-center justify-center bg-black p-8">
    <div className="max-w-md text-center">
      <div className="mb-6 text-4xl text-gold">!</div>
      <h2 className="mb-4 font-serif text-2xl font-bold text-white">Registry Desynchronized</h2>
      <p className="mb-8 text-sm leading-relaxed text-zinc-500">
        The PDF Intelligence System encountered a structural error.
      </p>
      <button
        onClick={onRetry}
        className="rounded-xl bg-gold px-8 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:bg-white"
      >
        Re-Sync Registry
      </button>
    </div>
  </div>
);

export default PDFDashboardPage;
