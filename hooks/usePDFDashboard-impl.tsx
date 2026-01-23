// hooks/usePDFDashboard-impl.tsx
import { useState, useCallback, useMemo, useEffect } from "react";
import type {
  PDFItem,
  FilterState,
  DashboardStats,
  GenerationStatus,
  GenerationResponse,
  UsePDFDashboardReturn,
  UsePDFDashboardOptions,
} from "@/types/pdf-dashboard";
import { PDFService } from "@/services/pdf-service";

function parseFileSize(size: string | number | undefined): number {
  if (size === undefined || size === null) return 0;
  
  if (typeof size === "number") {
    return size;
  }

  const trimmed = String(size).trim();
  if (!trimmed) return 0;

  // Support raw numbers-as-string (bytes)
  const raw = Number(trimmed);
  if (Number.isFinite(raw)) return raw;

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)?$/i);
  if (!match) return 0;

  const value = Number(match[1]);
  const unit = (match[2] || "B").toUpperCase();

  const mult =
    unit === "B"
      ? 1
      : unit === "KB"
      ? 1024
      : unit === "MB"
      ? 1024 ** 2
      : unit === "GB"
      ? 1024 ** 3
      : unit === "TB"
      ? 1024 ** 4
      : 1;

  return value * mult;
}

function safeIsoNow(): string {
  return new Date().toISOString();
}

export function usePDFDashboard(
  options: UsePDFDashboardOptions = {}
): UsePDFDashboardReturn {
  const {
    initialViewMode = "list",
    defaultCategory = "all",
    autoRefreshInterval = 30000,
    enableAutoRefresh = true,
    initialFilter,
    maxItems,
  } = options;

  const [pdfs, setPdfs] = useState<PDFItem[]>([]);
  const [selectedPDFId, setSelectedPDFId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "detail">(initialViewMode);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: initialFilter?.searchQuery ?? "",
    selectedCategory: initialFilter?.selectedCategory ?? defaultCategory,
    sortBy: initialFilter?.sortBy ?? "title",
    sortOrder: initialFilter?.sortOrder ?? "asc",
    statusFilter: initialFilter?.statusFilter ?? "all",
  });

  const loadPDFs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await PDFService.getPDFs();
      const sliced = typeof maxItems === "number" && maxItems > 0 ? data.slice(0, maxItems) : data;

      setPdfs(sliced);

      // Auto select first item if nothing selected
      setSelectedPDFId((prev) => {
        if (prev) return prev;
        
        if (sliced.length === 0) return null;
        
        const firstItem = sliced[0];
        return firstItem?.id || null;
      });
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Failed to load PDFs");
      setError(e);
      setPdfs([]);
    } finally {
      setIsLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    void loadPDFs();
  }, [loadPDFs]);

  useEffect(() => {
    if (!enableAutoRefresh) return;
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      if (!isLoading && !isGenerating) {
        void loadPDFs();
      }
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [enableAutoRefresh, autoRefreshInterval, isLoading, isGenerating, loadPDFs]);

  const categories = useMemo(() => {
    const uniques = Array.from(
      new Set(pdfs.map((p) => p.category).filter((c): c is string => !!c))
    );
    return ["all", ...uniques];
  }, [pdfs]);

  const filteredPDFs = useMemo(() => {
    const q = filterState.searchQuery.trim().toLowerCase();

    const matchSearch = (p: PDFItem) => {
      if (!q) return true;
      return (
        p.id.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false) ||
        (p.category?.toLowerCase().includes(q) ?? false) ||
        (p.type?.toLowerCase().includes(q) ?? false)
      );
    };

    const matchCategory = (p: PDFItem) =>
      filterState.selectedCategory === "all" || p.category === filterState.selectedCategory;

    const matchStatus = (p: PDFItem) => {
      const f = filterState.statusFilter;
      if (f === "all") return true;
      if (f === "generated") return p.exists === true;
      if (f === "missing") return !p.exists && !p.error && !p.isGenerating;
      if (f === "error") return !!p.error;
      if (f === "generating") return !!p.isGenerating;
      return true;
    };

    const sorted = pdfs
      .filter((p) => matchSearch(p) && matchCategory(p) && matchStatus(p))
      .sort((a, b) => {
        const order = filterState.sortOrder === "asc" ? 1 : -1;

        switch (filterState.sortBy) {
          case "title":
            return order * a.title.localeCompare(b.title);
          case "category":
            return order * (a.category || "").localeCompare(b.category || "");
          case "date": {
            const da = new Date(a.lastGenerated || a.updatedAt || a.createdAt || 0).getTime();
            const db = new Date(b.lastGenerated || b.updatedAt || b.createdAt || 0).getTime();
            return order * (da - db);
          }
          case "size": {
            const sa = parseFileSize(a.fileSize);
            const sb = parseFileSize(b.fileSize);
            return order * (sa - sb);
          }
          default:
            return 0;
        }
      });

    return sorted;
  }, [pdfs, filterState]);

  const selectedPDF = useMemo(() => {
    if (!selectedPDFId) return null;
    return pdfs.find((p) => p.id === selectedPDFId) || null;
  }, [pdfs, selectedPDFId]);

  const stats = useMemo<DashboardStats>(() => {
    const totalPDFs = pdfs.length;
    const generated = pdfs.filter((p) => p.exists).length;
    const errors = pdfs.filter((p) => !!p.error).length;
    const generating = pdfs.filter((p) => !!p.isGenerating).length;
    const missingPDFs = pdfs.filter((p) => !p.exists && !p.error).length;

    return {
      totalPDFs,
      availablePDFs: generated,
      missingPDFs,
      categories: categories.filter((c) => c !== "all"),
      generated,
      errors,
      generating,
      lastUpdated: safeIsoNow(),
    };
  }, [pdfs, categories]);

  const updateFilter = useCallback((updates: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...updates }));
  }, []);

  const searchPDFs = useCallback(
    (query: string) => updateFilter({ searchQuery: query }),
    [updateFilter]
  );

  const sortPDFs = useCallback((sortBy: string) => {
    setFilterState((prev) => {
      const same = prev.sortBy === (sortBy as FilterState["sortBy"]);
      const nextOrder: FilterState["sortOrder"] = same && prev.sortOrder === "asc" ? "desc" : "asc";

      return {
        ...prev,
        sortBy: sortBy as FilterState["sortBy"],
        sortOrder: nextOrder,
      };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState({
      searchQuery: "",
      selectedCategory: "all",
      sortBy: "title",
      sortOrder: "asc",
      statusFilter: "all",
    });
  }, []);

  const generatePDF = useCallback(
    async (pdfId?: string, options?: any): Promise<GenerationResponse> => {
      const idToGenerate = pdfId || selectedPDFId;

      if (!idToGenerate) {
        return { success: false, error: "No PDF selected for generation" };
      }

      const pdf = pdfs.find((p) => p.id === idToGenerate);
      if (!pdf) {
        return { success: false, error: `PDF with ID ${idToGenerate} not found` };
      }

      try {
        setIsGenerating(true);
        setGenerationStatus({ type: "info", message: "Generating PDF…", progress: 0 });

        // mark generating locally
        setPdfs((prev) =>
          prev.map((p) =>
            p.id === idToGenerate ? { ...p, isGenerating: true, error: undefined } : p
          )
        );

        const result = await PDFService.generatePDF(idToGenerate, options);

        setPdfs((prev) =>
          prev.map((p) => {
            if (p.id !== idToGenerate) return p;

            const next: PDFItem = {
              ...p,
              isGenerating: false,
              exists: true,
              lastGenerated: result.generatedAt || safeIsoNow(),
            };

            // Only set optional fields if defined
            if (result.fileUrl) next.fileUrl = result.fileUrl;
            if (result.fileSize !== undefined) {
              // Ensure fileSize is a number for PDFItem type
              next.fileSize = typeof result.fileSize === 'number' 
                ? result.fileSize 
                : parseFileSize(result.fileSize);
            }

            // Remove error key if it existed
            if (next.error) delete (next as any).error;

            return next;
          })
        );

        setGenerationStatus({
          type: "success",
          message: `Successfully generated "${pdf.title}"`,
          progress: 100,
        });

        return {
          success: true,
          pdfId: idToGenerate,
          filename: pdf.title,
          fileUrl: result.fileUrl,
          // Convert fileSize to number for GenerationResponse
          fileSize: typeof result.fileSize === 'number' 
            ? result.fileSize 
            : parseFileSize(result.fileSize),
          generatedAt: result.generatedAt,
        };
      } catch (err) {
        const e = err instanceof Error ? err : new Error("Failed to generate PDF");

        setPdfs((prev) =>
          prev.map((p) =>
            p.id === idToGenerate ? { ...p, isGenerating: false, error: e.message } : p
          )
        );

        setGenerationStatus({
          type: "error",
          message: `Failed to generate PDF: ${e.message}`,
          details: e.stack,
          actionLabel: "Retry",
          onAction: () => {
            void generatePDF(idToGenerate, options);
          },
        });

        return { success: false, error: e.message };
      } finally {
        setIsGenerating(false);
      }
    },
    [pdfs, selectedPDFId]
  );

  const generateAllPDFs = useCallback(async (): Promise<GenerationResponse> => {
    try {
      setIsGenerating(true);

      const missing = pdfs.filter((p) => !p.exists && !p.error);
      if (missing.length === 0) {
        return { success: true, message: "All PDFs are already generated", count: 0, generatedAt: safeIsoNow() };
      }

      setGenerationStatus({
        type: "info",
        message: `Generating ${missing.length} PDFs…`,
        progress: 0,
      });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < missing.length; i++) {
        const item = missing[i];
        if (!item) continue;

        setGenerationStatus({
          type: "info",
          message: `Generating ${i + 1}/${missing.length}: ${item.title}`,
          progress: Math.round((i / missing.length) * 100),
        });

        try {
          const result = await PDFService.generatePDF(item.id);

          setPdfs((prev) =>
            prev.map((p) => {
              if (p.id !== item.id) return p;

              const next: PDFItem = {
                ...p,
                exists: true,
                isGenerating: false,
                lastGenerated: result.generatedAt || safeIsoNow(),
              };

              if (result.fileUrl) next.fileUrl = result.fileUrl;
              if (result.fileSize !== undefined) {
                next.fileSize = typeof result.fileSize === 'number'
                  ? result.fileSize
                  : parseFileSize(result.fileSize);
              }
              if (next.error) delete (next as any).error;

              return next;
            })
          );

          successCount++;
        } catch (err) {
          const e = err instanceof Error ? err : new Error("Generation failed");
          setPdfs((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, isGenerating: false, error: e.message } : p))
          );
          errorCount++;
        }
      }

      const message =
        errorCount === 0
          ? `Generated ${successCount} PDFs successfully`
          : `Generated ${successCount} PDFs; ${errorCount} failed`;

      setGenerationStatus({
        type: errorCount === 0 ? "success" : "warning",
        message,
        progress: 100,
      });

      return {
        success: errorCount === 0,
        count: successCount,
        generatedAt: safeIsoNow(),
        error: errorCount > 0 ? `${errorCount} PDFs failed to generate` : undefined,
      };
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Failed to generate PDFs");
      setGenerationStatus({ type: "error", message: "Failed to generate PDFs", details: e.message });
      return { success: false, error: e.message };
    } finally {
      setIsGenerating(false);
    }
  }, [pdfs]);

  const deletePDF = useCallback(
    async (pdfId: string): Promise<void> => {
      await PDFService.deletePDF(pdfId);
      setPdfs((prev) => prev.filter((p) => p.id !== pdfId));
      setSelectedPDFId((prev) => (prev === pdfId ? null : prev));
    },
    []
  );

  const duplicatePDF = useCallback(
    async (pdfId: string): Promise<PDFItem> => {
      const dup = await PDFService.duplicatePDF(pdfId);
      setPdfs((prev) => [...prev, dup]);
      return dup;
    },
    []
  );

  const renamePDF = useCallback(
    async (pdfId: string, newTitle: string): Promise<void> => {
      await PDFService.renamePDF(pdfId, newTitle);
      setPdfs((prev) =>
        prev.map((p) =>
          p.id === pdfId ? { ...p, title: newTitle, updatedAt: safeIsoNow() } : p
        )
      );
    },
    []
  );

  const updatePDFMetadata = useCallback(
    async (pdfId: string, metadata: Partial<PDFItem>): Promise<void> => {
      await PDFService.updateMetadata(pdfId, metadata);
      setPdfs((prev) =>
        prev.map((p) =>
          p.id === pdfId ? { ...p, ...metadata, updatedAt: safeIsoNow() } : p
        )
      );
    },
    []
  );

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
}

export default usePDFDashboard;