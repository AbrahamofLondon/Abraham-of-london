// hooks/usePDFBatchOperations.tsx
import { useState, useCallback } from "react";

interface UsePDFBatchOperations {
  selectedPDFs: Set<string>;
  togglePDFSelection: (pdfId: string) => void;
  clearSelection: () => void;
  batchDelete: (pdfIds?: string[]) => Promise<void>;
  batchExport: (pdfIdsOrFormat?: string[] | string, maybeFormat?: string) => Promise<void>;
  batchTag: (tag: string, pdfIds?: string[]) => Promise<void>;
}

export const usePDFBatchOperations = (): UsePDFBatchOperations => {
  const [selectedPDFs, setSelectedPDFs] = useState<Set<string>>(new Set());

  const togglePDFSelection = useCallback((pdfId: string) => {
    setSelectedPDFs((prev) => {
      const next = new Set(prev);
      if (next.has(pdfId)) next.delete(pdfId);
      else next.add(pdfId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedPDFs(new Set()), []);

  const resolveIds = useCallback(
    (pdfIds?: string[]) => (pdfIds && pdfIds.length ? pdfIds : Array.from(selectedPDFs)),
    [selectedPDFs]
  );

  const batchDelete = useCallback(
    async (pdfIds?: string[]) => {
      const ids = resolveIds(pdfIds);
      if (!ids.length) return;

      console.log("Batch deleting PDFs:", ids);
      // TODO: await PDFService.batchDelete(ids);

      clearSelection();
    },
    [resolveIds, clearSelection]
  );

  // Supports BOTH:
  // - batchExport("pdf")
  // - batchExport(["a","b"], "pdf")
  const batchExport = useCallback(
    async (pdfIdsOrFormat?: string[] | string, maybeFormat?: string) => {
      let ids: string[] = [];
      let format = "pdf";

      if (Array.isArray(pdfIdsOrFormat)) {
        ids = pdfIdsOrFormat;
        format = maybeFormat || "pdf";
      } else {
        // first arg is format
        format = (pdfIdsOrFormat as string) || "pdf";
        ids = Array.from(selectedPDFs);
      }

      if (!ids.length) return;

      console.log("Batch exporting PDFs:", ids, "format:", format);
      // TODO: await PDFService.batchExport(ids, format);
    },
    [selectedPDFs]
  );

  const batchTag = useCallback(
    async (tag: string, pdfIds?: string[]) => {
      const ids = resolveIds(pdfIds);
      if (!ids.length) return;

      console.log("Batch tagging PDFs:", ids, "tag:", tag);
      // TODO: await PDFService.batchTag(ids, tag);
    },
    [resolveIds]
  );

  return {
    selectedPDFs,
    togglePDFSelection,
    clearSelection,
    batchDelete,
    batchExport,
    batchTag,
  };
};