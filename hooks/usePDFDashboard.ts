// hooks/usePDFDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import { PDFItem, PDFStats } from '@/lib/pdf/types';
import { getAllPDFItems } from '@/scripts/pdf-registry';

interface FilterState {
  type: string;
  status: string;
  search: string;
}

interface GenerationStatus {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface DashboardStats extends PDFStats {
  availablePDFs: number;
  missingPDFs: number;
  categories: string[];
}

export const usePDFDashboard = () => {
  const [pdfItems, setPdfs] = useState<PDFItem[]>([]);
  const [selectedPDFId, setSelectedPDFId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [filterState, setFilterState] = useState<FilterState>({
    type: 'all',
    status: 'all',
    search: '',
  });

  const refreshPDFList = useCallback(async () => {
    try {
      // Use the static registry directly since this is client-side
      const items = getAllPDFItems();
      setPdfs(items);
    } catch (error) {
      console.error('Failed to fetch PDFs:', error);
    }
  }, []);

  useEffect(() => {
    refreshPDFList();
  }, [refreshPDFList]);

  const filteredPDFs: PDFItem[] = pdfItems.filter(pdf => {
    if (filterState.type !== 'all' && pdf.type !== filterState.type) return false;
    if (filterState.status !== 'all') {
      if (filterState.status === 'generated' && !pdf.exists) return false;
      if (filterState.status === 'missing' && pdf.exists) return false;
      if (filterState.status === 'error' && !pdf.error) return false;
    }
    if (filterState.search && !pdf.title.toLowerCase().includes(filterState.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Get unique categories
  const categories = Array.from(new Set(pdfItems.map(p => p.type)));

  // Create dashboard stats with all required properties
  const stats: DashboardStats = {
    totalPDFs: pdfItems.length,
    generated: pdfItems.filter(p => p.exists).length,
    missing: pdfItems.filter(p => !p.exists && !p.error).length,
    errors: pdfItems.filter(p => p.error).length,
    // Map the existing stats to the required names
    availablePDFs: pdfItems.filter(p => p.exists).length,
    missingPDFs: pdfItems.filter(p => !p.exists && !p.error).length,
    // Include categories in stats
    categories: categories,
  };

  const generatePDF = useCallback(async (id: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/pdfs/generate/${id}`, { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        setGenerationStatus({ message: `Generated ${id} successfully`, type: 'success' });
        refreshPDFList();
      } else {
        setGenerationStatus({ message: `Failed to generate ${id}: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      setGenerationStatus({ message: `Error generating ${id}`, type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  }, [refreshPDFList]);

  const generateAllPDFs = useCallback(async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/pdfs/generate-all', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        setGenerationStatus({ 
          message: `Generated ${result.generated} PDFs successfully`, 
          type: 'success' 
        });
        refreshPDFList();
      } else {
        setGenerationStatus({ 
          message: `Failed to generate PDFs: ${result.error}`, 
          type: 'error' 
        });
      }
    } catch (error) {
      setGenerationStatus({ message: 'Error generating PDFs', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  }, [refreshPDFList]);

  const updateFilter = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  }, []);

  const selectedPDF = selectedPDFId 
    ? pdfItems.find(p => p.id === selectedPDFId) 
    : filteredPDFs[0] || null;

  return {
    selectedPDF,
    isGenerating,
    generationStatus,
    filterState,
    filteredPDFs,
    categories,
    stats,
    setSelectedPDFId,
    generatePDF,
    generateAllPDFs,
    refreshPDFList,
    updateFilter,
    setGenerationStatus,
  };
};