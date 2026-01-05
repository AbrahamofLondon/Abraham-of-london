// app/board/pdfs/PDFDashboardClient.tsx
"use client";

import React from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import DashboardHeader from "@/components/DashboardHeader";
import PDFListPanel from "@/components/PDFListPanel";
import PDFViewerPanel from "@/components/PDFViewerPanel";
import StatusMessage from "@/components/StatusMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import PDFFilters from "@/components/PDFFilters";
import DashboardStats from "@/components/DashboardStats";

type PDFTier = "free" | "member" | "architect" | "inner-circle";
type PDFType =
  | "editorial"
  | "framework"
  | "academic"
  | "strategic"
  | "tool"
  | "canvas"
  | "worksheet"
  | "assessment"
  | "journal"
  | "tracker"
  | "bundle"
  | "other";

type PDFFormat = "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";
type PaperFormat = "A4" | "Letter" | "A3" | "bundle";

export type PDFItem = {
  id: string;
  title: string;
  description: string;
  excerpt?: string | null;

  outputPath: string;
  fileUrl: string;

  type: PDFType;
  format: PDFFormat;

  isInteractive: boolean;
  isFillable: boolean;

  category: string;
  tier: PDFTier;
  formats: PaperFormat[];

  fileSize: string;
  lastModified: string;
  exists: boolean;

  tags: string[];
  requiresAuth: boolean;

  version: string;
  priority?: number;
  preload?: boolean;

  md5?: string;
  placeholder?: string;

  error?: string;
  isGenerating?: boolean;
  downloadCount?: number;
  rating?: number;
};

type ApiOk<T> = { success: true } & T;
type ApiErr = { success: false; error: string; code?: string };
type ApiResp<T> = ApiOk<T> | ApiErr;

type StatusType = "info" | "success" | "error" | "warning";
type UIStatus = { message: string; type: StatusType };

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

function parseHumanBytes(input: string): number {
  const s = String(input || "").trim();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)$/i);
  if (!m) return 0;

  const n = Number(m[1]);
  if (!Number.isFinite(n)) return 0;

  const unit = m[2].toUpperCase();
  const mult: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
  };

  return Math.round(n * (mult[unit] ?? 1));
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<ApiResp<T>> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // non-json
  }

  if (!res.ok) {
    const msg =
      (isRecord(data) && typeof data.error === "string" && data.error) ||
      `Request failed (${res.status})`;
    return { success: false, error: msg, code: `HTTP_${res.status}` };
  }

  if (!isRecord(data) || typeof data.success !== "boolean") {
    return { success: false, error: "Malformed API response" };
  }

  return data as ApiResp<T>;
}

function normalizePdfItem(x: unknown): PDFItem | null {
  if (!isRecord(x)) return null;

  const id = typeof x.id === "string" ? x.id : "";
  const title = typeof x.title === "string" ? x.title : "";
  const description = typeof x.description === "string" ? x.description : "";
  const outputPath = typeof x.outputPath === "string" ? x.outputPath : "";
  const fileUrl = typeof x.fileUrl === "string" ? x.fileUrl : outputPath;

  if (!id || !title || !description || !outputPath) return null;

  const item: PDFItem = {
    id,
    title,
    description,
    excerpt: typeof x.excerpt === "string" ? x.excerpt : null,

    outputPath,
    fileUrl,

    type: (typeof x.type === "string" ? x.type : "other") as PDFType,
    format: (typeof x.format === "string" ? x.format : "PDF") as PDFFormat,

    isInteractive: Boolean(x.isInteractive),
    isFillable: Boolean(x.isFillable),

    category: typeof x.category === "string" ? x.category : "uncategorized",
    tier: (typeof x.tier === "string" ? x.tier : "free") as PDFTier,
    formats: Array.isArray(x.formats) ? (x.formats as PaperFormat[]) : ["A4"],

    fileSize: typeof x.fileSize === "string" ? x.fileSize : "0 B",
    lastModified: typeof x.lastModified === "string" ? x.lastModified : new Date().toISOString(),
    exists: Boolean(x.exists),

    tags: Array.isArray(x.tags) ? (x.tags as string[]).filter((t) => typeof t === "string") : [],
    requiresAuth: Boolean(x.requiresAuth),

    version: typeof x.version === "string" ? x.version : "0.0.0",
    priority: typeof x.priority === "number" ? x.priority : undefined,
    preload: typeof x.preload === "boolean" ? x.preload : undefined,

    md5: typeof x.md5 === "string" ? x.md5 : undefined,
    placeholder: typeof x.placeholder === "string" ? x.placeholder : undefined,

    error: typeof x.error === "string" ? x.error : undefined,
    isGenerating: typeof x.isGenerating === "boolean" ? x.isGenerating : undefined,
    downloadCount: typeof x.downloadCount === "number" ? x.downloadCount : undefined,
    rating: typeof x.rating === "number" ? x.rating : undefined,
  };

  return item;
}

type DashboardFilters = {
  searchQuery: string;
  selectedCategory: "all" | string;
  selectedTier: "all" | PDFTier;
  selectedType: "all" | PDFType;
  onlyMissing: boolean;
  onlyInteractive: boolean;
};

function usePDFDashboard() {
  const [pdfs, setPdfs] = React.useState<PDFItem[]>([]);
  const [selectedPDFId, setSelectedPDFId] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationStatus, setGenerationStatus] = React.useState<UIStatus | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const [filters, setFilters] = React.useState<DashboardFilters>({
    searchQuery: "",
    selectedCategory: "all",
    selectedTier: "all",
    selectedType: "all",
    onlyMissing: false,
    onlyInteractive: false,
  });

  const abortRef = React.useRef<AbortController | null>(null);

  const loadPDFs = React.useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsLoading(true);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const resp = await fetchJSON<{ pdfs: unknown[]; meta?: unknown }>("/api/pdfs/list", {
        method: "GET",
        signal: ac.signal,
      });

      if (!resp.success) {
        setGenerationStatus({ message: `❌ Unable to load PDFs: ${resp.error}`, type: "error" });
        setIsLoading(false);
        return;
      }

      const raw = Array.isArray(resp.pdfs) ? resp.pdfs : [];
      const normalized = raw.map(normalizePdfItem).filter(Boolean) as PDFItem[];

      const tierOrder: Record<PDFTier, number> = {
        architect: 0,
        "inner-circle": 1,
        member: 2,
        free: 3,
      };

      normalized.sort((a, b) => {
        const pa = a.priority ?? 999;
        const pb = b.priority ?? 999;
        if (pa !== pb) return pa - pb;

        const ta = tierOrder[a.tier] ?? 999;
        const tb = tierOrder[b.tier] ?? 999;
        if (ta !== tb) return ta - tb;

        return a.title.localeCompare(b.title);
      });

      setPdfs(normalized);

      setSelectedPDFId((prev) => {
        const stillThere = prev && normalized.some((p) => p.id === prev);
        if (stillThere) return prev;
        return normalized[0]?.id ?? null;
      });

      setIsLoading(false);
    } catch (err) {
      if ((err as any)?.name === "AbortError") return;
      setGenerationStatus({ message: `❌ Unable to load PDFs: ${safeErrorMessage(err)}`, type: "error" });
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPDFs();
    return () => abortRef.current?.abort();
  }, [loadPDFs]);

  React.useEffect(() => {
    if (!isGenerating) return;

    const t = setInterval(() => {
      loadPDFs({ silent: true });
    }, 2500);

    return () => clearInterval(t);
  }, [isGenerating, loadPDFs]);

  const categories = React.useMemo(() => {
    const cs = uniq(pdfs.map((p) => p.category).filter(Boolean));
    return ["all", ...cs.sort((a, b) => a.localeCompare(b))];
  }, [pdfs]);

  const tiers = React.useMemo(() => {
    const ts = uniq(pdfs.map((p) => p.tier).filter(Boolean));
    const order: Record<string, number> = { architect: 0, "inner-circle": 1, member: 2, free: 3 };
    return ["all", ...ts.sort((a, b) => (order[a] ?? 999) - (order[b] ?? 999))] as Array<"all" | PDFTier>;
  }, [pdfs]);

  const types = React.useMemo(() => {
    const ts = uniq(pdfs.map((p) => p.type).filter(Boolean));
    return ["all", ...ts.sort((a, b) => a.localeCompare(b))] as Array<"all" | PDFType>;
  }, [pdfs]);

  const filteredPDFs = React.useMemo(() => {
    const q = filters.searchQuery.trim().toLowerCase();

    return pdfs.filter((pdf) => {
      const matchesSearch =
        !q ||
        pdf.title.toLowerCase().includes(q) ||
        pdf.description.toLowerCase().includes(q) ||
        (pdf.excerpt || "").toLowerCase().includes(q) ||
        pdf.id.toLowerCase().includes(q) ||
        pdf.tags.some((t) => t.toLowerCase().includes(q));

      const matchesCategory = filters.selectedCategory === "all" || pdf.category === filters.selectedCategory;
      const matchesTier = filters.selectedTier === "all" || pdf.tier === filters.selectedTier;
      const matchesType = filters.selectedType === "all" || pdf.type === filters.selectedType;

      const matchesMissing = !filters.onlyMissing || !pdf.exists;
      const matchesInteractive = !filters.onlyInteractive || pdf.isInteractive;

      return matchesSearch && matchesCategory && matchesTier && matchesType && matchesMissing && matchesInteractive;
    });
  }, [pdfs, filters]);

  const stats = React.useMemo(() => {
    const total = pdfs.length;
    const available = pdfs.filter((p) => p.exists).length;

    const byCategory = pdfs.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});

    const byAccessLevel = pdfs.reduce<Record<string, number>>((acc, p) => {
      acc[p.tier] = (acc[p.tier] || 0) + 1;
      return acc;
    }, {});

    const totalBytes = pdfs.reduce((sum, p) => sum + parseHumanBytes(p.fileSize), 0);
    const avgBytes = total > 0 ? Math.round(totalBytes / total) : 0;

    return {
      totalPDFs: total,
      availablePDFs: available,
      missingPDFs: total - available,
      categories: categories.filter((c) => c !== "all"),
      totalFileSize: totalBytes,
      averageFileSize: avgBytes,
      byAccessLevel,
      byCategory,
    };
  }, [pdfs, categories]);

  const selectedPDF = React.useMemo(() => {
    if (!selectedPDFId) return null;
    return pdfs.find((p) => p.id === selectedPDFId) || null;
  }, [selectedPDFId, pdfs]);

  const refreshPDFList = React.useCallback(async () => {
    await loadPDFs({ silent: true });
    setGenerationStatus({ message: "📂 Registry refreshed", type: "info" });
    setTimeout(() => setGenerationStatus(null), 2500);
  }, [loadPDFs]);

  const generatePDF = React.useCallback(
    async (id: string) => {
      if (!id) return;

      setIsGenerating(true);
      setGenerationStatus({ message: `Generating: ${id}…`, type: "info" });

      try {
        const resp = await fetchJSON<{ filename?: string; generatedPath?: string }>("/api/pdfs/generate", {
          method: "POST",
          body: JSON.stringify({ id }),
        });

        if (!resp.success) {
          setGenerationStatus({ message: `❌ Generation failed: ${resp.error}`, type: "error" });
          setIsGenerating(false);
          return;
        }

        setGenerationStatus({ message: `✅ Generated: ${resp.filename || id}`, type: "success" });
        await loadPDFs({ silent: true });
      } catch (err) {
        setGenerationStatus({ message: `❌ Network error: ${safeErrorMessage(err)}`, type: "error" });
      } finally {
        setIsGenerating(false);
      }
    },
    [loadPDFs]
  );

  const generateAllPDFs = React.useCallback(async () => {
    setIsGenerating(true);
    setGenerationStatus({ message: "Generating all missing PDFs…", type: "info" });

    try {
      const resp = await fetchJSON<{ count: number; results?: unknown[] }>("/api/pdfs/generate-all", {
        method: "POST",
      });

      if (!resp.success) {
        setGenerationStatus({ message: `❌ Bulk generation failed: ${resp.error}`, type: "error" });
        setIsGenerating(false);
        return;
      }

      setGenerationStatus({ message: `✅ Generated ${resp.count} PDF(s)`, type: "success" });
      await loadPDFs({ silent: true });
    } catch (err) {
      setGenerationStatus({ message: `❌ Network error: ${safeErrorMessage(err)}`, type: "error" });
    } finally {
      setIsGenerating(false);
    }
  }, [loadPDFs]);

  const updateFilters = React.useCallback((updates: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearStatus = React.useCallback(() => setGenerationStatus(null), []);

  return {
    filteredPDFs,
    selectedPDF,
    isGenerating,
    generationStatus,
    filters,
    categories,
    tiers,
    types,
    stats,
    isLoading,
    setSelectedPDFId,
    generatePDF,
    generateAllPDFs,
    refreshPDFList,
    updateFilters,
    clearStatus,
  };
}

const PDFDashboard: React.FC = () => {
  const {
    filteredPDFs,
    selectedPDF,
    isGenerating,
    generationStatus,
    filters,
    categories,
    tiers,
    types,
    stats,
    isLoading,
    setSelectedPDFId,
    generatePDF,
    generateAllPDFs,
    refreshPDFList,
    updateFilters,
    clearStatus,
  } = usePDFDashboard();

  const handleSearchChange = React.useCallback((value: string) => {
    updateFilters({ searchQuery: value });
  }, [updateFilters]);

  const handleCategoryChange = React.useCallback((value: string) => {
    updateFilters({ selectedCategory: value });
  }, [updateFilters]);

  const handleTierChange = React.useCallback((value: string) => {
    updateFilters({ selectedTier: value as any });
  }, [updateFilters]);

  const handleTypeChange = React.useCallback((value: string) => {
    updateFilters({ selectedType: value as any });
  }, [updateFilters]);

  const handlePDFSelect = React.useCallback((id: string) => {
    setSelectedPDFId(id);
  }, [setSelectedPDFId]);

  const handleGenerateSinglePDF = React.useCallback(async (id: string) => {
    await generatePDF(id);
  }, [generatePDF]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <LoadingSpinner message="Initializing PDF Intelligence System…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <ErrorBoundary>
          <DashboardHeader
            title="PDF Intelligence"
            subtitle="Institutional Publishing • Dynamic Registry • Audit-Ready"
            stats={stats}
            onRefresh={refreshPDFList}
            onGenerateAll={generateAllPDFs}
            isGenerating={isGenerating}
          />

          {generationStatus && (
            <StatusMessage
              status={generationStatus}
              onDismiss={clearStatus}
              autoDismiss={generationStatus.type !== "error" ? 3000 : undefined}
            />
          )}

          <div className="mb-6 space-y-3">
            <PDFFilters
              searchQuery={filters.searchQuery}
              selectedCategory={filters.selectedCategory}
              categories={categories}
              onSearchChange={handleSearchChange}
              onCategoryChange={handleCategoryChange}
            />

            <div className="flex flex-col md:flex-row gap-3">
              <select
                value={filters.selectedTier}
                onChange={(e) => handleTierChange(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                {tiers.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "All Tiers" : t}
                  </option>
                ))}
              </select>

              <select
                value={filters.selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "All Types" : t}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <input
                  type="checkbox"
                  checked={filters.onlyMissing}
                  onChange={(e) => updateFilters({ onlyMissing: e.target.checked })}
                />
                Only missing
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <input
                  type="checkbox"
                  checked={filters.onlyInteractive}
                  onChange={(e) => updateFilters({ onlyInteractive: e.target.checked })}
                />
                Only interactive
              </label>
            </div>
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
                  selectedPDFId={selectedPDF?.id || null}
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