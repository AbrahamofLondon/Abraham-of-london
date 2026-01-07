// pages/admin/pdfdashboard.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { withAdminAuth } from '@/lib/auth/withAdminAuth';
import { usePDFDashboard } from '@/hooks/usePDFDashboard';
import { useToast } from '@/hooks/useToast';
import DashboardHeader from '@/components/DashboardHeader';
import PDFListPanel from '@/components/PDFListPanel';
import PDFViewerPanel from '@/components/PDFViewerPanel';
import StatusMessage from '@/components/StatusMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import PDFFilters from '@/components/PDFFilters';
import DashboardStats from '@/components/DashboardStats';
import PDFQuickActions from "@/components/PDFQuickActions";
import PDFActionsBar from "@/components/PDFActionsBar";
import ErrorBoundary from '@/components/ErrorBoundary';

// Types
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
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'detail'>('grid');
  const [selectedPDFs, setSelectedPDFs] = useState<Set<string>>(new Set());

  // Get URL params
  const searchQuery = router.query.search as string || '';
  const category = router.query.category as string || 'all';
  const sortBy = router.query.sort as string || 'updatedAt';
  const sortOrder = router.query.order as 'asc' | 'desc' || 'desc';

  // Dashboard hook
  const {
    pdfs,
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
    batchExport,
  } = usePDFDashboard({
    userId: user?.id || 'anonymous',
    initialFilters: {
      search: searchQuery,
      category,
      sortBy,
      sortOrder,
      status: 'all',
    },
  });

  // Update URL when filters change
  useEffect(() => {
    const query: Record<string, string> = {};
    
    if (filters.search) query.search = filters.search;
    if (filters.category !== 'all') query.category = filters.category;
    if (filters.sortBy !== 'updatedAt') query.sort = filters.sortBy;
    if (filters.sortOrder !== 'desc') query.order = filters.sortOrder;
    
    router.push({
      pathname: router.pathname,
      query,
    }, undefined, { shallow: true });
  }, [filters, router]);

  // Error handling
  useEffect(() => {
    if (error) {
      toast.error('Dashboard Error', error.message);
    }
  }, [error, toast]);

  // Handle PDF selection
  const handleSelectPDF = (pdfId: string) => {
    setSelectedPDFId(pdfId);
  };

  // Handle batch selection
  const togglePDFSelection = (pdfId: string) => {
    setSelectedPDFs(prev => {
      const next = new Set(prev);
      if (next.has(pdfId)) {
        next.delete(pdfId);
      } else {
        next.add(pdfId);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedPDFs(new Set());

  // Handle batch delete
  const handleBatchDelete = async () => {
    if (selectedPDFs.size === 0) return;
    
    if (confirm(`Delete ${selectedPDFs.size} PDF(s)? This action cannot be undone.`)) {
      try {
        await batchDelete(Array.from(selectedPDFs));
        clearSelection();
        toast.success('Success', `${selectedPDFs.size} PDF(s) deleted successfully`);
      } catch (error) {
        toast.error('Delete Failed', 'Failed to delete PDFs');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <LoadingSpinner message="Initializing PDF Intelligence System..." />
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<DashboardError onRetry={refreshPDFList} />}>
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
        <div className="max-w-8xl mx-auto p-4 md:p-8">
          {/* Dashboard Header */}
          <DashboardHeader
            title="PDF Intelligence System"
            subtitle="Institutional Publishing • Dynamic Registry"
            stats={stats}
            user={user}
            onRefresh={refreshPDFList}
            onGenerateAll={generateAllPDFs}
            isGenerating={isGenerating}
          />

          {/* Status Messages */}
          {generationStatus && (
            <StatusMessage
              status={generationStatus}
              onDismiss={() => setGenerationStatus(null)}
            />
          )}

          {/* Quick Actions Bar */}
          <PDFQuickActions
            selectedCount={selectedPDFs.size}
            onRefresh={refreshPDFList}
            onGenerateAll={generateAllPDFs}
            onBatchDelete={handleBatchDelete}
            onClearSelection={clearSelection}
            isGenerating={isGenerating}
          />

          {/* Filters Section */}
          <div className="mb-6">
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            {/* Sidebar - PDF List */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl border border-gray-700/50 bg-gray-800/30 backdrop-blur-sm p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                    Document Registry ({filteredPDFs.length})
                  </h2>
                  <span className="text-xs text-gray-500 font-mono">
                    {stats.availablePDFs}/{stats.totalPDFs} files
                  </span>
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

                <DashboardStats stats={stats} selectedCount={selectedPDFs.size} />
              </div>
            </div>

            {/* Main Viewer Area */}
            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-gray-700/50 bg-gray-800/30 backdrop-blur-sm p-4 md:p-8 min-h-[600px]">
                {/* Actions Bar */}
                {selectedPDF && (
                  <PDFActionsBar
                    pdf={selectedPDF}
                    isGenerating={isGenerating}
                    onGeneratePDF={() => generatePDF(selectedPDF.id)}
                    onDeletePDF={() => deletePDF(selectedPDF.id)}
                    onDuplicatePDF={() => duplicatePDF(selectedPDF.id)}
                    onRenamePDF={() => {
                      const newName = prompt('Enter new name:', selectedPDF.title);
                      if (newName) renamePDF(selectedPDF.id, newName);
                    }}
                    canEdit={user?.permissions.includes('pdf:edit')}
                    canDelete={user?.permissions.includes('pdf:delete')}
                  />
                )}

                {/* PDF Viewer */}
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
      </div>
    </ErrorBoundary>
  );
};

// Error Component
const DashboardError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center p-8">
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

// Export with authentication HOC
export default withAdminAuth(PDFDashboard);