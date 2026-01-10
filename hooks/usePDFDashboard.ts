import { useState, useEffect, useCallback, useMemo } from 'react';

interface UsePDFDashboardOptions {
  userId: string;
  initialFilters?: {
    search?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
  };
}

export const usePDFDashboard = (options: UsePDFDashboardOptions) => {
  const { userId, initialFilters = {} } = options;

  // State
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [selectedPDFId, setSelectedPDFId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<any>(null);
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    category: initialFilters.category || 'all',
    status: initialFilters.status || 'all',
    sortBy: initialFilters.sortBy || 'updatedAt',
    sortOrder: initialFilters.sortOrder || 'desc',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load PDFs
  const loadPDFs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (filters.category !== 'all') queryParams.set('category', filters.category);
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.status !== 'all') queryParams.set('status', filters.status);
      
      const response = await fetch(`/api/pdfs/list?${queryParams.toString()}`);
      const data = await response.json();
      
      if (data.success && data.pdfs) {
        setPdfs(data.pdfs);
        if (data.pdfs.length > 0 && !selectedPDFId) {
          setSelectedPDFId(data.pdfs[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load PDFs'));
      console.error('Error loading PDFs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, selectedPDFId]);

  // Derived data
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(pdfs.map(pdf => pdf.category))];
    return ['all', ...uniqueCategories];
  }, [pdfs]);

  const filteredPDFs = useMemo(() => {
    let filtered = [...pdfs];

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(pdf => pdf.category === filters.category);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(pdf => pdf.status === filters.status);
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(pdf => 
        pdf.title?.toLowerCase().includes(searchLower) ||
        pdf.description?.toLowerCase().includes(searchLower) ||
        pdf.id?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy];
      const bValue = b[filters.sortBy];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      const aTime = new Date(aValue || 0).getTime();
      const bTime = new Date(bValue || 0).getTime();
      
      return filters.sortOrder === 'asc'
        ? aTime - bTime
        : bTime - aTime;
    });

    return filtered;
  }, [pdfs, filters]);

  const selectedPDF = useMemo(() => 
    pdfs.find(pdf => pdf.id === selectedPDFId) || null,
    [pdfs, selectedPDFId]
  );

  const stats = useMemo(() => {
    const totalPDFs = pdfs.length;
    const generatedPDFs = pdfs.filter(pdf => pdf.status === 'generated').length;
    const pendingPDFs = pdfs.filter(pdf => pdf.status === 'pending').length;
    const failedPDFs = pdfs.filter(pdf => pdf.status === 'failed').length;
    
    return {
      totalPDFs,
      availablePDFs: generatedPDFs,
      pendingPDFs,
      failedPDFs,
      categories: categories.length - 1,
    };
  }, [pdfs, categories]);

  // Generate PDF
  const generatePDF = useCallback(async (pdfId?: string) => {
    setIsGenerating(true);
    setGenerationStatus({
      message: pdfId ? `Generating PDF...` : 'Starting generation...',
      type: 'info',
    });
    
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: pdfId,
          userId 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setGenerationStatus({
          message: `✅ ${data.filename || 'PDF'} generated successfully`,
          type: 'success',
        });
        await loadPDFs();
      } else {
        setGenerationStatus({
          message: `❌ Failed to generate: ${data.error || 'Unknown error'}`,
          type: 'error',
        });
      }
    } catch (error) {
      setGenerationStatus({
        message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [loadPDFs, userId]);

  // Generate all PDFs
  const generateAllPDFs = useCallback(async () => {
    setIsGenerating(true);
    setGenerationStatus({
      message: 'Generating all PDFs...',
      type: 'info',
    });
    
    try {
      const response = await fetch('/api/generate-all-pdfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setGenerationStatus({
          message: `✅ Generated ${data.count || 0} PDFs successfully`,
          type: 'success',
        });
        await loadPDFs();
      } else {
        setGenerationStatus({
          message: `❌ Bulk generation failed: ${data.error || 'Unknown error'}`,
          type: 'error',
        });
      }
    } catch (error) {
      setGenerationStatus({
        message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadPDFs, userId]);

  // Delete PDF
  const deletePDF = useCallback(async (pdfId: string) => {
    try {
      const response = await fetch(`/api/pdfs/${pdfId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        await loadPDFs();
      } else {
        throw new Error(data.error || 'Failed to delete PDF');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Delete failed'));
    }
  }, [loadPDFs, userId]);

  // Duplicate PDF
  const duplicatePDF = useCallback(async (pdfId: string) => {
    try {
      const response = await fetch('/api/pdfs/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfId, userId }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        await loadPDFs();
      } else {
        throw new Error(data.error || 'Failed to duplicate PDF');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Duplicate failed'));
    }
  }, [loadPDFs, userId]);

  // Rename PDF
  const renamePDF = useCallback(async (pdfId: string, title: string) => {
    try {
      const response = await fetch(`/api/pdfs/${pdfId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, userId }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        await loadPDFs();
      } else {
        throw new Error(data.error || 'Failed to rename PDF');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Rename failed'));
    }
  }, [loadPDFs, userId]);

  // Batch delete
  const batchDelete = useCallback(async (pdfIds: string[]) => {
    try {
      const response = await fetch('/api/pdfs/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfIds, userId }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        await loadPDFs();
      } else {
        throw new Error(data.error || 'Batch delete failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Batch delete failed'));
    }
  }, [loadPDFs, userId]);

  // Batch export
  const batchExport = useCallback(async (pdfIds: string[], format: string) => {
    try {
      const response = await fetch('/api/pdfs/batch-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfIds, format, userId }),
      });
      
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Batch export failed'));
      throw err;
    }
  }, [userId]);

  // Update filters
  const updateFilter = useCallback((updates: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const searchPDFs = useCallback((search: string) => {
    updateFilter({ search });
  }, [updateFilter]);

  const sortPDFs = useCallback((sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    updateFilter({ sortBy, sortOrder });
  }, [updateFilter]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: 'all',
      status: 'all',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  }, []);

  // Initial load
  useEffect(() => {
    loadPDFs();
  }, [loadPDFs]);

  return {
    // State
    pdfs,
    filteredPDFs,
    selectedPDF,
    selectedPDFId,
    isGenerating,
    generationStatus,
    filters,
    categories,
    stats,
    isLoading,
    error,

    // Actions
    setSelectedPDFId,
    generatePDF,
    generateAllPDFs,
    refreshPDFList: loadPDFs,
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
  };
};
