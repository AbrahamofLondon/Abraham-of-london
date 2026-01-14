// hooks/usePDFDashboard.ts
import { useState, useCallback, useMemo, useEffect } from 'react';
import { PDFItem, FilterState, DashboardStats, GenerationStatus } from '@/types/pdf-dashboard';
import { PDFService } from '@/services/pdf-service';

interface UsePDFDashboardOptions {
  initialViewMode?: 'list' | 'grid' | 'detail';
  defaultCategory?: string;
  autoRefreshInterval?: number;
}

export const usePDFDashboard = (options: UsePDFDashboardOptions = {}) => {
  const {
    initialViewMode = 'list',
    defaultCategory = 'all',
    autoRefreshInterval = 30000,
  } = options;

  const [pdfs, setPdfs] = useState<PDFItem[]>([]);
  const [selectedPDFId, setSelectedPDFId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'detail'>(initialViewMode);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Filter state
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    selectedCategory: defaultCategory,
    sortBy: 'title',
    sortOrder: 'asc',
    statusFilter: 'all',
  });

  // Load PDFs
  const loadPDFs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await PDFService.getPDFs();
      setPdfs(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load PDFs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPDFs();
  }, [loadPDFs]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefreshInterval) return;
    
    const interval = setInterval(() => {
      loadPDFs();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, loadPDFs]);

  // Filtered PDFs
  const filteredPDFs = useMemo(() => {
    return pdfs.filter(pdf => {
      // Search filter
      const matchesSearch = !filterState.searchQuery || 
        pdf.title.toLowerCase().includes(filterState.searchQuery.toLowerCase()) ||
        pdf.description?.toLowerCase().includes(filterState.searchQuery.toLowerCase()) ||
        pdf.id.toLowerCase().includes(filterState.searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = filterState.selectedCategory === 'all' || 
        pdf.category === filterState.selectedCategory;

      // Status filter
      const matchesStatus = filterState.statusFilter === 'all' ||
        (filterState.statusFilter === 'generated' && pdf.exists) ||
        (filterState.statusFilter === 'missing' && !pdf.exists) ||
        (filterState.statusFilter === 'error' && pdf.error);

      return matchesSearch && matchesCategory && matchesStatus;
    }).sort((a, b) => {
      // Sorting
      const order = filterState.sortOrder === 'asc' ? 1 : -1;
      switch (filterState.sortBy) {
        case 'title':
          return order * a.title.localeCompare(b.title);
        case 'date':
          return order * (new Date(a.lastGenerated || 0).getTime() - new Date(b.lastGenerated || 0).getTime());
        case 'size':
          const sizeA = parseFileSize(a.fileSize || '0KB');
          const sizeB = parseFileSize(b.fileSize || '0KB');
          return order * (sizeA - sizeB);
        default:
          return 0;
      }
    });
  }, [pdfs, filterState]);

  // Categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(pdfs.map(pdf => pdf.category).filter(Boolean)));
    return ['all', ...uniqueCategories];
  }, [pdfs]);

  // Stats
  const stats = useMemo((): DashboardStats => {
    const totalPDFs = pdfs.length;
    const generated = pdfs.filter(p => p.exists).length;
    const missing = pdfs.filter(p => !p.exists && !p.error).length;
    const errors = pdfs.filter(p => p.error).length;
    const generating = pdfs.filter(p => p.isGenerating).length;

    return {
      totalPDFs,
      generated,
      missing,
      errors,
      generating,
      availablePDFs: generated,
      lastUpdated: new Date().toISOString(),
    };
  }, [pdfs]);

  // Selected PDF
  const selectedPDF = useMemo(() => {
    return pdfs.find(pdf => pdf.id === selectedPDFId) || null;
  }, [pdfs, selectedPDFId]);

  // Generate single PDF
  const generatePDF = useCallback(async (pdfId?: string, options?: any) => {
    try {
      setIsGenerating(true);
      setGenerationStatus({
        type: 'info',
        message: `Generating PDF...`,
        progress: 0,
      });

      const idToGenerate = pdfId || selectedPDFId;
      if (!idToGenerate) throw new Error('No PDF selected for generation');

      const pdf = pdfs.find(p => p.id === idToGenerate);
      if (!pdf) throw new Error(`PDF with ID ${idToGenerate} not found`);

      // Update local state
      setPdfs(prev => prev.map(p => 
        p.id === idToGenerate 
          ? { ...p, isGenerating: true, error: null }
          : p
      ));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationStatus(prev => prev ? {
          ...prev,
          progress: Math.min(prev.progress + 20, 80)
        } : null);
      }, 500);

      // Call PDF service
      const result = await PDFService.generatePDF(idToGenerate, options);

      // Clear interval and update
      clearInterval(progressInterval);
      
      setPdfs(prev => prev.map(p => 
        p.id === idToGenerate 
          ? { 
              ...p, 
              isGenerating: false, 
              exists: true,
              fileUrl: result.fileUrl,
              fileSize: result.fileSize,
              lastGenerated: new Date().toISOString(),
            }
          : p
      ));

      setGenerationStatus({
        type: 'success',
        message: `Successfully generated "${pdf.title}"`,
        progress: 100,
      });

      return result;
    } catch (err) {
      const error = err as Error;
      setPdfs(prev => prev.map(p => 
        p.id === pdfId 
          ? { ...p, isGenerating: false, error: error.message }
          : p
      ));
      
      setGenerationStatus({
        type: 'error',
        message: `Failed to generate PDF: ${error.message}`,
        details: error.stack,
        actionLabel: 'Retry',
        onAction: () => generatePDF(pdfId, options),
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [pdfs, selectedPDFId]);

  // Generate all PDFs
  const generateAllPDFs = useCallback(async () => {
    try {
      setIsGenerating(true);
      const missingPDFs = pdfs.filter(p => !p.exists && !p.error);
      
      setGenerationStatus({
        type: 'info',
        message: `Generating ${missingPDFs.length} PDFs...`,
        progress: 0,
      });

      for (let i = 0; i < missingPDFs.length; i++) {
        const pdf = missingPDFs[i];
        
        setGenerationStatus({
          type: 'info',
          message: `Generating ${i + 1}/${missingPDFs.length}: ${pdf.title}`,
          progress: Math.round((i / missingPDFs.length) * 100),
        });

        try {
          await PDFService.generatePDF(pdf.id);
          setPdfs(prev => prev.map(p => 
            p.id === pdf.id 
              ? { ...p, exists: true, lastGenerated: new Date().toISOString() }
              : p
          ));
        } catch (err) {
          console.error(`Failed to generate ${pdf.title}:`, err);
          setPdfs(prev => prev.map(p => 
            p.id === pdf.id 
              ? { ...p, error: (err as Error).message }
              : p
          ));
        }
      }

      setGenerationStatus({
        type: 'success',
        message: `Generated ${missingPDFs.length} PDFs successfully`,
        progress: 100,
      });

      setTimeout(() => setGenerationStatus(null), 3000);
    } catch (err) {
      setGenerationStatus({
        type: 'error',
        message: 'Failed to generate PDFs',
        details: (err as Error).message,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [pdfs]);

  // Update filter
  const updateFilter = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  }, []);

  // Search PDFs
  const searchPDFs = useCallback((query: string) => {
    updateFilter({ searchQuery: query });
  }, [updateFilter]);

  // Sort PDFs
  const sortPDFs = useCallback((sortBy: string, sortOrder: 'asc' | 'desc' = 'asc') => {
    updateFilter({ sortBy, sortOrder });
  }, [updateFilter]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilterState({
      searchQuery: '',
      selectedCategory: 'all',
      sortBy: 'title',
      sortOrder: 'asc',
      statusFilter: 'all',
    });
  }, []);

  // Delete PDF
  const deletePDF = useCallback(async (pdfId: string) => {
    try {
      await PDFService.deletePDF(pdfId);
      setPdfs(prev => prev.filter(p => p.id !== pdfId));
      
      if (selectedPDFId === pdfId) {
        setSelectedPDFId(null);
      }
    } catch (err) {
      console.error('Failed to delete PDF:', err);
      throw err;
    }
  }, [selectedPDFId]);

  // Duplicate PDF
  const duplicatePDF = useCallback(async (pdfId: string) => {
    try {
      const duplicate = await PDFService.duplicatePDF(pdfId);
      setPdfs(prev => [...prev, duplicate]);
    } catch (err) {
      console.error('Failed to duplicate PDF:', err);
      throw err;
    }
  }, []);

  // Rename PDF
  const renamePDF = useCallback(async (pdfId: string, newTitle: string) => {
    try {
      await PDFService.renamePDF(pdfId, newTitle);
      setPdfs(prev => prev.map(p => 
        p.id === pdfId ? { ...p, title: newTitle } : p
      ));
    } catch (err) {
      console.error('Failed to rename PDF:', err);
      throw err;
    }
  }, []);

  // Update PDF metadata
  const updatePDFMetadata = useCallback(async (pdfId: string, metadata: Partial<PDFItem>) => {
    try {
      await PDFService.updateMetadata(pdfId, metadata);
      setPdfs(prev => prev.map(p => 
        p.id === pdfId ? { ...p, ...metadata } : p
      ));
    } catch (err) {
      console.error('Failed to update PDF metadata:', err);
      throw err;
    }
  }, []);

  return {
    // State
    pdfs,
    filteredPDFs,
    selectedPDF,
    selectedPDFId,
    isLoading,
    isGenerating,
    viewMode,
    filterState,
    categories,
    stats,
    generationStatus,
    error,

    // Actions
    setSelectedPDFId,
    setViewMode,
    setGenerationStatus,
    refreshPDFList: loadPDFs,
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
  };
};

// Helper function
function parseFileSize(size: string): number {
  const match = size.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB|TB)$/i);
  if (!match) return 0;
  
  const [, value, unit] = match;
  const num = parseFloat(value);
  
  switch (unit.toUpperCase()) {
    case 'KB': return num * 1024;
    case 'MB': return num * 1024 * 1024;
    case 'GB': return num * 1024 * 1024 * 1024;
    case 'TB': return num * 1024 * 1024 * 1024 * 1024;
    default: return num;
  }
}