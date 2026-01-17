"use client";

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import DashboardHeader from '@/components/DashboardHeader';
import PDFListPanel from '@/components/PDFListPanel';
import PDFViewerPanel from '@/components/PDFViewerPanel';
import StatusMessage from '@/components/StatusMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import PDFFilters from '@/components/PDFFilters';
import DashboardStats from '@/components/DashboardStats';

// Type definitions - CRITICAL: Define these BEFORE any useState calls
type GenerationStatus =
  | { type: "idle" }
  | { type: "working"; message?: string }
  | { type: "success"; message?: string }
  | { type: "error"; message: string };

type PDFItem = {
  id: string;
  title?: string;
  description?: string;
  slug?: string;
  category: string;
  exists: boolean;
  fileSize?: number;
  [key: string]: any;
};

interface Filters {
  searchQuery: string;
  selectedCategory: string;
}

interface Stats {
  totalPDFs: number;
  availablePDFs: number;
  missingPDFs: number;
  categories: string[];
  totalFileSize: number;
  averageFileSize: number;
  byAccessLevel: Record<string, number>;
  byCategory: Record<string, number>;
}

// Custom hook that uses API calls instead of direct imports
const usePDFDashboard = () => {
  const [pdfs, setPdfs] = useState<PDFItem[]>([]);
  const [selectedPDFId, setSelectedPDFId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({ type: "idle" });
  const [filters, setFilters] = useState<Filters>({
    searchQuery: '',
    selectedCategory: 'all',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load PDFs from API
  const loadPDFs = useCallback(async () => {
    try {
      const response = await fetch('/api/pdfs/list');
      const data = await response.json();
      
      if (data.success && data.pdfs) {
        setPdfs(data.pdfs);
        if (data.pdfs.length > 0 && !selectedPDFId) {
          setSelectedPDFId(data.pdfs[0].id);
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load PDFs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setGenerationStatus({
        type: "error",
        message: `❌ Failed to load PDFs: ${errorMessage}`,
      });
      setIsLoading(false);
    }
  }, [selectedPDFId]);

  useEffect(() => {
    loadPDFs();
  }, [loadPDFs]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(pdfs.map(pdf => pdf.category))];
    return ['all', ...uniqueCategories];
  }, [pdfs]);

  const filteredPDFs = useMemo(() => {
    const searchLower = filters.searchQuery.toLowerCase();
    return pdfs.filter(pdf => {
      const matchesSearch = filters.searchQuery === '' || 
        pdf.title?.toLowerCase().includes(searchLower) ||
        pdf.description?.toLowerCase().includes(searchLower) ||
        pdf.id?.toLowerCase().includes(searchLower);
      
      const matchesCategory = filters.selectedCategory === 'all' || 
        pdf.category === filters.selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [pdfs, filters]);

  const stats = useMemo((): Stats => {
    const availablePDFs = pdfs.filter(p => p.exists).length;
    const categoryCounts = pdfs.reduce<Record<string, number>>((acc, pdf) => {
      acc[pdf.category] = (acc[pdf.category] || 0) + 1;
      return acc;
    }, {});

    return {
      totalPDFs: pdfs.length,
      availablePDFs: availablePDFs,
      missingPDFs: pdfs.length - availablePDFs,
      categories: categories.filter(c => c !== 'all'),
      totalFileSize: pdfs.reduce((sum, p) => sum + (p.fileSize || 0), 0),
      averageFileSize: pdfs.length > 0 
        ? pdfs.reduce((sum, p) => sum + (p.fileSize || 0), 0) / pdfs.length 
        : 0,
      byAccessLevel: {},
      byCategory: categoryCounts,
    };
  }, [pdfs, categories]);

  const selectedPDF = useMemo<PDFItem | null>(() => {
    if (!selectedPDFId) return null;
    return pdfs.find(pdf => pdf.id === selectedPDFId) || null;
  }, [selectedPDFId, pdfs]);

  const generatePDF = async (id: string) => {
    setIsGenerating(true);
    setGenerationStatus({
      type: "working",
      message: `Generating ${id}...`,
    });
    
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setGenerationStatus({
          type: "success",
          message: `✅ ${data.filename} generated successfully`,
        });
        // Refresh the list
        await loadPDFs();
      } else {
        setGenerationStatus({
          type: "error",
          message: `❌ Failed to generate: ${data.error || 'Unknown error'}`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setGenerationStatus({
        type: "error",
        message: `❌ Network error: ${errorMessage}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAllPDFs = async () => {
    setIsGenerating(true);
    setGenerationStatus({
      type: "working",
      message: 'Generating all known PDFs...',
    });
    
    try {
      const response = await fetch('/api/generate-all-pdfs', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setGenerationStatus({
          type: "success",
          message: `✅ Generated ${data.count} PDFs successfully`,
        });
        await loadPDFs();
      } else {
        setGenerationStatus({
          type: "error",
          message: `❌ Bulk generation failed: ${data.error || 'Unknown error'}`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setGenerationStatus({
        type: "error",
        message: `❌ Network error: ${errorMessage}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const refreshPDFList = async () => {
    try {
      await loadPDFs();
      setGenerationStatus({
        type: "success",
        message: '📂 PDF list refreshed',
      });
      setTimeout(() => setGenerationStatus({ type: "idle" }), 3000);
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  };

  const updateFilters = (updates: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const clearStatus = () => {
    setGenerationStatus({ type: "idle" });
  };

  return {
    pdfs,
    filteredPDFs,
    selectedPDF,
    isGenerating,
    generationStatus,
    filters,
    categories,
    stats,
    isLoading,
    setSelectedPDFId,
    generatePDF,
    generateAllPDFs,
    refreshPDFList,
    updateFilters,
    clearStatus,
  };
};

// Main Dashboard Component
const PDFDashboard: React.FC = () => {
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
    setSelectedPDFId,
    generatePDF,
    generateAllPDFs,
    refreshPDFList,
    updateFilters,
    clearStatus,
  } = usePDFDashboard();

  const handleSearchChange = useCallback((value: string) => {
    updateFilters({ searchQuery: value });
  }, [updateFilters]);

  const handleCategoryChange = useCallback((value: string) => {
    updateFilters({ selectedCategory: value });
  }, [updateFilters]);

  const handlePDFSelect = useCallback((id: string) => {
    setSelectedPDFId(id);
  }, [setSelectedPDFId]);

  const handleGenerateSinglePDF = useCallback(async (id: string) => {
    await generatePDF(id);
  }, [generatePDF]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <LoadingSpinner message="Initializing PDF Intelligence System..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <ErrorBoundary>
          <DashboardHeader
            title="PDF Intelligence"
            subtitle="Institutional Publishing • Dynamic Registry"
            stats={stats}
            onRefresh={refreshPDFList}
            onGenerateAll={generateAllPDFs}
            isGenerating={isGenerating}
          />

          {generationStatus.type !== "idle" && (
            <StatusMessage
              status={{
                message: generationStatus.message || '',
                type: generationStatus.type === "working" ? "info" : generationStatus.type,
              }}
              onDismiss={clearStatus}
              autoDismiss={generationStatus.type !== "error" ? 3000 : undefined}
            />
          )}

          <div className="mb-6">
            <PDFFilters
              searchQuery={filters.searchQuery}
              selectedCategory={filters.selectedCategory}
              categories={categories}
              onSearchChange={handleSearchChange}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 md:p-6 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                    Document Registry ({filteredPDFs.length})
                  </h2>
                  <span className="text-xs text-gray-500 font-mono">
                    {stats.availablePDFs}/{stats.totalPDFs} files
                  </span>
                </div>
                
                <PDFListPanel
                  pdfs={filteredPDFs}
                  selectedPDFId={selectedPDF?.id ?? null}
                  isGenerating={isGenerating}
                  onSelectPDF={handlePDFSelect}
                  onGeneratePDF={handleGenerateSinglePDF}
                />
                
                <DashboardStats stats={stats} />
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 md:p-8 shadow-2xl min-h-[600px] md:min-h-[800px]">
                <PDFViewerPanel
                  pdf={selectedPDF}
                  isGenerating={isGenerating}
                  onGeneratePDF={handleGenerateSinglePDF}
                  refreshKey={stats.totalPDFs}
                />
              </div>
            </div>
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default PDFDashboard;