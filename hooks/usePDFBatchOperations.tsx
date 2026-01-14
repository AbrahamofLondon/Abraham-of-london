// hooks/usePDFBatchOperations.tsx
import { useState, useCallback } from 'react';

export const usePDFBatchOperations = () => {
  const [selectedPDFs, setSelectedPDFs] = useState<Set<string>>(new Set());

  const togglePDFSelection = useCallback((pdfId: string) => {
    setSelectedPDFs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pdfId)) {
        newSet.delete(pdfId);
      } else {
        newSet.add(pdfId);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPDFs(new Set());
  }, []);

  const batchDelete = useCallback(() => {
    console.log('Batch deleting PDFs:', Array.from(selectedPDFs));
    clearSelection();
  }, [selectedPDFs, clearSelection]);

  const batchExport = useCallback(() => {
    console.log('Batch exporting PDFs:', Array.from(selectedPDFs));
  }, [selectedPDFs]);

  const batchTag = useCallback((tag: string) => {
    console.log('Batch tagging PDFs:', Array.from(selectedPDFs), 'with tag:', tag);
  }, [selectedPDFs]);

  return {
    selectedPDFs,
    togglePDFSelection,
    clearSelection,
    batchDelete,
    batchExport,
    batchTag,
  };
};