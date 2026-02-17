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

  if (typeof size === "number") return size;

  const trimmed = String(size).trim();
  if (!trimmed) return 0;

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

// Defensive coercion: tolerate array, tolerate { pdfs: [...] }, tolerate nonsense.
function coercePDFArray(input: unknown): PDFItem[] {
  if (Array.isArray(input)) return input as PDFItem[];
  if (input && typeof input === "object" && Array.isArray((input as any).pdfs)) {
    return (input as any).pdfs as PDFItem[];
  }
  return [];
}

export function usePDFDashboard(options: UsePDFDashboardOptions = {}): UsePDFDashboardReturn {
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

      // ✅ Contract: getPDFs() MUST return PDFItem[]
      const raw = await PDFService.getPDFs(1, 1000);
      const list = coercePDFArray(raw);

      const sliced =
        typeof maxItems === "number" && maxItems > 0 ? list.slice(0, maxItems) : list;

      setPdfs(sliced);

      setSelectedPDFId((prev) => {
        if (prev) return prev;
        if (sliced.length === 0) return null;
        return (sliced[0] as any)?.id || null;
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
      if (!isLoading && !isGenerating) void loadPDFs();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [enableAutoRefresh, autoRefreshInterval, isLoading, isGenerating, loadPDFs]);

  const categories = useMemo(() => {
    const safe = Array.isArray(pdfs) ? pdfs : [];
    const uniques = Array.from(
      new Set(
        safe
          .map((p: any) => (p?.category ? String(p.category) : ""))
          .filter((c) => !!c)
      )
    );
    return ["all", ...uniques];
  }, [pdfs]);

  const filteredPDFs = useMemo(() => {
    const safe = Array.isArray(pdfs) ? pdfs : [];
    const q = filterState.searchQuery.trim().toLowerCase();

    const matchSearch = (p: any) => {
      if (!q) return true;
      const id = String(p?.id || "").toLowerCase();
      const title = String(p?.title || "").toLowerCase();
      const desc = String(p?.description || "").toLowerCase();
      const cat = String(p?.category || "").toLowerCase();
      const type = String(p?.type || "").toLowerCase();

      return (
        id.includes(q) ||
        title.includes(q) ||
        (desc ? desc.includes(q) : false) ||
        (cat ? cat.includes(q) : false) ||
        (type ? type.includes(q) : false)
      );
    };

    const matchCategory = (p: any) =>
      filterState.selectedCategory === "all" ||
      String(p?.category || "") === filterState.selectedCategory;

    const matchStatus = (p: any) => {
      const f = filterState.statusFilter;
      const exists = Boolean(p?.exists);
      const isGen = Boolean(p?.isGenerating);
      const hasErr = Boolean(p?.error);

      if (f === "all") return true;
      if (f === "generated") return exists === true;
      if (f === "missing") return !exists && !hasErr && !isGen;
      if (f === "error") return hasErr;
      if (f === "generating") return isGen;
      return true;
    };

    return safe
      .filter((p) => matchSearch(p) && matchCategory(p) && matchStatus(p))
      .sort((a: any, b: any) => {
        const order = filterState.sortOrder === "asc" ? 1 : -1;

        switch (filterState.sortBy) {
          case "title":
            return order * String(a?.title || "").localeCompare(String(b?.title || ""));
          case "category":
            return order * String(a?.category || "").localeCompare(String(b?.category || ""));
          case "date": {
            const da = new Date(a?.lastGenerated || a?.updatedAt || a?.createdAt || 0).getTime();
            const db = new Date(b?.lastGenerated || b?.updatedAt || b?.createdAt || 0).getTime();
            return order * (da - db);
          }
          case "size": {
            const sa = parseFileSize(a?.fileSize);
            const sb = parseFileSize(b?.fileSize);
            return order * (sa - sb);
          }
          default:
            return 0;
        }
      });
  }, [pdfs, filterState]);

  const selectedPDF = useMemo(() => {
    if (!selectedPDFId) return null;
    const safe = Array.isArray(pdfs) ? pdfs : [];
    return safe.find((p: any) => String(p?.id || "") === selectedPDFId) || null;
  }, [pdfs, selectedPDFId]);

  const stats = useMemo<DashboardStats>(() => {
    const safe = Array.isArray(pdfs) ? pdfs : [];
    const generated = safe.filter((p: any) => Boolean(p?.exists)).length;
    const errors = safe.filter((p: any) => Boolean(p?.error)).length;
    const generating = safe.filter((p: any) => Boolean(p?.isGenerating)).length;
    const missingPDFs = safe.filter((p: any) => !p?.exists && !p?.error).length;

    return {
      totalPDFs: safe.length,
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

  const searchPDFs = useCallback((query: string) => updateFilter({ searchQuery: query }), [updateFilter]);

  const sortPDFs = useCallback((sortBy: string) => {
    setFilterState((prev) => {
      const same = prev.sortBy === (sortBy as FilterState["sortBy"]);
      const nextOrder: FilterState["sortOrder"] = same && prev.sortOrder === "asc" ? "desc" : "asc";
      return { ...prev, sortBy: sortBy as FilterState["sortBy"], sortOrder: nextOrder };
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

      if (!idToGenerate) return { success: false, error: "No PDF selected for generation" };

      const safe = Array.isArray(pdfs) ? pdfs : [];
      const pdf = safe.find((p: any) => String(p?.id || "") === idToGenerate);
      if (!pdf) return { success: false, error: `PDF with ID ${idToGenerate} not found` };

      try {
        setIsGenerating(true);
        setGenerationStatus({ type: "info", message: "Generating PDF…", progress: 0 });

        setPdfs((prev) =>
          (Array.isArray(prev) ? prev : []).map((p: any) =>
            String(p?.id || "") === idToGenerate ? { ...p, isGenerating: true, error: undefined } : p
          )
        );

        const result = await PDFService.generatePDF(idToGenerate, options);

        setPdfs((prev) =>
          (Array.isArray(prev) ? prev : []).map((p: any) => {
            if (String(p?.id || "") !== idToGenerate) return p;

            const next: any = {
              ...p,
              isGenerating: false,
              exists: true,
              lastGenerated: result.generatedAt || safeIsoNow(),
            };

            if (result.fileUrl) next.fileUrl = result.fileUrl;
            if (result.fileSize !== undefined) next.fileSize = result.fileSize;

            if (next.error) delete next.error;
            return next;
          })
        );

        setGenerationStatus({
          type: "success",
          message: `Successfully generated "${(pdf as any).title || idToGenerate}"`,
          progress: 100,
        });

        return {
          success: true,
          pdfId: idToGenerate,
          filename: (pdf as any).title || idToGenerate,
          fileUrl: result.fileUrl,
          fileSize: result.fileSize,
          generatedAt: result.generatedAt,
        };
      } catch (err) {
        const e = err instanceof Error ? err : new Error("Failed to generate PDF");

        setPdfs((prev) =>
          (Array.isArray(prev) ? prev : []).map((p: any) =>
            String(p?.id || "") === idToGenerate ? { ...p, isGenerating: false, error: e.message } : p
          )
        );

        setGenerationStatus({
          type: "error",
          message: `Failed to generate PDF: ${e.message}`,
          details: e.stack,
          actionLabel: "Retry",
          onAction: () => void generatePDF(idToGenerate, options),
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

      const safe = Array.isArray(pdfs) ? pdfs : [];
      const missing = safe.filter((p: any) => !p?.exists && !p?.error);

      if (missing.length === 0) {
        return { success: true, message: "All PDFs are already generated", count: 0, generatedAt: safeIsoNow() };
      }

      setGenerationStatus({ type: "info", message: `Generating ${missing.length} PDFs…`, progress: 0 });

      const result = await PDFService.generateAllPDFs();

      // Refresh list after batch (source of truth)
      await loadPDFs();

      setGenerationStatus({ type: "success", message: result.message || "Batch generation completed", progress: 100 });

      return {
        success: Boolean(result.success),
        count: result.count ?? missing.length,
        message: result.message,
        generatedAt: result.generatedAt || safeIsoNow(),
        error: result.error,
      };
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Failed to generate PDFs");
      setGenerationStatus({ type: "error", message: "Failed to generate PDFs", details: e.message });
      return { success: false, error: e.message };
    } finally {
      setIsGenerating(false);
    }
  }, [pdfs, loadPDFs]);

  const deletePDF = useCallback(async (pdfId: string): Promise<void> => {
    await PDFService.deletePDF(pdfId);
    setPdfs((prev) => (Array.isArray(prev) ? prev : []).filter((p: any) => String(p?.id || "") !== pdfId));
    setSelectedPDFId((prev) => (prev === pdfId ? null : prev));
  }, []);

  const duplicatePDF = useCallback(async (pdfId: string): Promise<PDFItem> => {
    const dup = await PDFService.duplicatePDF(pdfId);
    setPdfs((prev) => [...(Array.isArray(prev) ? prev : []), dup]);
    return dup;
  }, []);

  const renamePDF = useCallback(async (pdfId: string, newTitle: string): Promise<void> => {
    await PDFService.renamePDF(pdfId, newTitle);
    setPdfs((prev) =>
      (Array.isArray(prev) ? prev : []).map((p: any) =>
        String(p?.id || "") === pdfId ? { ...p, title: newTitle, updatedAt: safeIsoNow() } : p
      )
    );
  }, []);

  const updatePDFMetadata = useCallback(async (pdfId: string, metadata: Partial<PDFItem>): Promise<void> => {
    await PDFService.updateMetadata(pdfId, metadata);
    setPdfs((prev) =>
      (Array.isArray(prev) ? prev : []).map((p: any) =>
        String(p?.id || "") === pdfId ? { ...p, ...metadata, updatedAt: safeIsoNow() } : p
      )
    );
  }, []);

  return {
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