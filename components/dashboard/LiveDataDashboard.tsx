// components/dashboard/LiveDataDashboard.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePDFDashboardContext } from "@/contexts/PDFDashboardContext";
import type { PDFItem } from "@/types/pdf-dashboard";

// -----------------------------
// Local UI Stats Model
// exactOptionalPropertyTypes: true friendly:
// - Optional fields MUST be omitted if unknown.
// - Never write: { foo: undefined }.
// -----------------------------
interface PDFDashboardStats {
  symbol: string; // pdf.id
  price: number; // file size MB
  change: number; // arbitrary score/progress
  changePercent: number; // arbitrary score/progress
  lastUpdated: string;

  volume?: number; // pageCount
  marketCap?: number; // importance
  high24h?: number; // fake metric for UI continuity
  low24h?: number;

  isFavorite?: boolean;
  status?: "generated" | "pending" | "error" | "generating";
  category?: string;
  type?: string;
  exists?: boolean;
}

interface LiveDataDashboardProps {
  showConnectionStatus?: boolean;
  maxPDFsDisplay?: number;
  onPDFSelect?: (pdfId: string) => void;
  theme?: "light" | "dark";
}

// -----------------------------
// Utilities
// -----------------------------
function safeISOString(input?: string): string {
  return input && input.trim() ? input : new Date().toISOString();
}

function toMB(fileSize?: string): number {
  if (!fileSize) return 0;
  const n = Number(fileSize);
  if (!Number.isFinite(n)) return 0;

  // If your fileSize is already bytes-as-string, convert to MB.
  // If it's already MB, your UI will still be consistent (just a smaller number).
  return n / (1024 * 1024);
}

/**
 * Create PDFDashboardStats with optional keys omitted when undefined.
 */
function makeStats(data: Partial<PDFDashboardStats>): PDFDashboardStats {
  const base: PDFDashboardStats = {
    symbol: data.symbol ?? "",
    price: data.price ?? 0,
    change: data.change ?? 0,
    changePercent: data.changePercent ?? 0,
    lastUpdated: data.lastUpdated ?? new Date().toISOString(),
  };

  if (data.volume !== undefined) base.volume = data.volume;
  if (data.marketCap !== undefined) base.marketCap = data.marketCap;
  if (data.high24h !== undefined) base.high24h = data.high24h;
  if (data.low24h !== undefined) base.low24h = data.low24h;

  if (data.isFavorite !== undefined) base.isFavorite = data.isFavorite;
  if (data.status !== undefined) base.status = data.status;
  if (data.category !== undefined) base.category = data.category;
  if (data.type !== undefined) base.type = data.type;
  if (data.exists !== undefined) base.exists = data.exists;

  return base;
}

/**
 * Update stats without ever writing undefined into optional fields.
 * Strategy:
 * - Always keep required fields.
 * - Optional fields only change if updates provides a defined value.
 * - Otherwise, preserve current optional fields if present.
 */
function mergeStats(current: PDFDashboardStats, updates: Partial<PDFDashboardStats>): PDFDashboardStats {
  const merged: Partial<PDFDashboardStats> = {
    symbol: updates.symbol ?? current.symbol,
    price: updates.price ?? current.price,
    change: updates.change ?? current.change,
    changePercent: updates.changePercent ?? current.changePercent,
    lastUpdated: updates.lastUpdated ?? current.lastUpdated,
  };

  // Optional carry-forward or update
  if (updates.volume !== undefined) merged.volume = updates.volume;
  else if (current.volume !== undefined) merged.volume = current.volume;

  if (updates.marketCap !== undefined) merged.marketCap = updates.marketCap;
  else if (current.marketCap !== undefined) merged.marketCap = current.marketCap;

  if (updates.high24h !== undefined) merged.high24h = updates.high24h;
  else if (current.high24h !== undefined) merged.high24h = current.high24h;

  if (updates.low24h !== undefined) merged.low24h = updates.low24h;
  else if (current.low24h !== undefined) merged.low24h = current.low24h;

  if (updates.isFavorite !== undefined) merged.isFavorite = updates.isFavorite;
  else if (current.isFavorite !== undefined) merged.isFavorite = current.isFavorite;

  if (updates.status !== undefined) merged.status = updates.status;
  else if (current.status !== undefined) merged.status = current.status;

  if (updates.category !== undefined) merged.category = updates.category;
  else if (current.category !== undefined) merged.category = current.category;

  if (updates.type !== undefined) merged.type = updates.type;
  else if (current.type !== undefined) merged.type = current.type;

  if (updates.exists !== undefined) merged.exists = updates.exists;
  else if (current.exists !== undefined) merged.exists = current.exists;

  return makeStats(merged);
}

function convertPDFToStats(pdf: PDFItem): PDFDashboardStats {
  const fileSizeMB = pdf.fileSize ? toMB(pdf.fileSize) : 0;

  const status: PDFDashboardStats["status"] =
    pdf.exists ? "generated" : pdf.isGenerating ? "generating" : pdf.error ? "error" : "pending";

  const change = pdf.exists ? 100 : pdf.isGenerating ? 50 : pdf.error ? 0 : 25;
  const changePercent = pdf.exists ? 100 : pdf.isGenerating ? 50 : pdf.error ? -100 : 0;

  const partial: Partial<PDFDashboardStats> = {
    symbol: pdf.id,
    price: fileSizeMB,
    change,
    changePercent,
    lastUpdated: safeISOString(pdf.lastGenerated || pdf.updatedAt || pdf.createdAt),
    status,
    category: pdf.category,
    type: pdf.type,
    exists: pdf.exists,
    high24h: fileSizeMB * 1.5,
    low24h: fileSizeMB * 0.5,
  };

  if (pdf.metadata?.pageCount !== undefined) partial.volume = pdf.metadata.pageCount;
  if (pdf.metadata?.importance !== undefined) partial.marketCap = pdf.metadata.importance;
  if (pdf.metadata?.isFavorite !== undefined) partial.isFavorite = pdf.metadata.isFavorite;

  return makeStats(partial);
}

/**
 * Your context's `stats` type ("DashboardStats") clearly differs across files.
 * So we normalize defensively without breaking strict mode.
 */
function normalizeContextStats(input: unknown): {
  totalPDFs: number;
  generated: number;
  pending: number;
  errors: number;
  generating: number;
  completionRate: number;
} {
  const obj = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;

  const totalPDFs = typeof obj.totalPDFs === "number" ? obj.totalPDFs : 0;
  const generated = typeof obj.generated === "number" ? obj.generated : 0;

  // Try a few likely names. If none exist, compute pending.
  const pendingRaw =
    typeof obj.pending === "number"
      ? obj.pending
      : typeof obj.missing === "number"
      ? obj.missing
      : typeof obj.remaining === "number"
      ? obj.remaining
      : undefined;

  const errors = typeof obj.errors === "number" ? obj.errors : 0;
  const generating = typeof obj.generating === "number" ? obj.generating : 0;

  const pending = pendingRaw !== undefined ? pendingRaw : Math.max(0, totalPDFs - generated - errors);

  const completionRate = totalPDFs > 0 ? (generated / totalPDFs) * 100 : 0;

  return { totalPDFs, generated, pending, errors, generating, completionRate };
}

// -----------------------------
// Component
// -----------------------------
export const LiveDataDashboard: React.FC<LiveDataDashboardProps> = ({
  showConnectionStatus = true,
  maxPDFsDisplay = 12,
  onPDFSelect,
  theme = "light",
}) => {
  const {
    pdfs,
    isGenerating,
    stats: contextStats,
    generationStatus,
    generatePDF,
    setSelectedPDFId,
    refreshPDFList,
  } = usePDFDashboardContext();

  const [pdfStatsData, setPdfStatsData] = useState<Record<string, PDFDashboardStats>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"symbol" | "price" | "change" | "volume">("symbol");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "generated" | "pending" | "error">("all");
  const [isPaused, setIsPaused] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "syncing">("connected");

  // Build UI stats map from pdfs
  useEffect(() => {
    const map: Record<string, PDFDashboardStats> = {};
    for (const pdf of pdfs) map[pdf.id] = convertPDFToStats(pdf);
    setPdfStatsData(map);
  }, [pdfs]);

  // Simulate live updates (safe narrowing)
  useEffect(() => {
    if (isPaused || !isGenerating) return;

    const interval = setInterval(() => {
      setPdfStatsData((prev) => {
        let changed = false;
        const next: Record<string, PDFDashboardStats> = { ...prev };

        for (const pdf of pdfs) {
          if (!pdf.isGenerating) continue;

          const current = next[pdf.id];
          if (!current) continue; // ✅ no undefined passed

          next[pdf.id] = mergeStats(current, {
            change: Math.min(current.change + 10, 90),
            changePercent: Math.min(current.changePercent + 10, 90),
            lastUpdated: new Date().toISOString(),
            status: "generating",
          });

          changed = true;
        }

        return changed ? next : prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isPaused, isGenerating, pdfs]);

  // Connection status UX
  useEffect(() => {
    if (isGenerating) setConnectionStatus("syncing");
    else if (pdfs.length > 0) setConnectionStatus("connected");
    else setConnectionStatus("disconnected");
  }, [isGenerating, pdfs.length]);

  // Load favorites once
  useEffect(() => {
    try {
      const raw = localStorage.getItem("pdf-favorites");
      if (!raw) return;

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const ids = parsed.filter((x): x is string => typeof x === "string");
      const set = new Set(ids);
      setFavorites(set);

      setPdfStatsData((prev) => {
        const next = { ...prev };
        for (const id of ids) {
          const current = next[id];
          if (!current) continue;
          next[id] = mergeStats(current, { isFavorite: true });
        }
        return next;
      });
    } catch {
      // ignore
    }
  }, []);

  // Toggle favorite (no undefined writes)
  const toggleFavorite = useCallback((pdfId: string) => {
    setFavorites((prevSet) => {
      const next = new Set(prevSet);
      const currentlyFav = next.has(pdfId);

      if (currentlyFav) next.delete(pdfId);
      else next.add(pdfId);

      try {
        localStorage.setItem("pdf-favorites", JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }

      setPdfStatsData((prev) => {
        const current = prev[pdfId];
        if (!current) return prev;

        const updated = mergeStats(current, { isFavorite: !currentlyFav });
        return { ...prev, [pdfId]: updated };
      });

      return next;
    });
  }, []);

  // Derived list
  const filteredAndSortedPDFs = useMemo(() => {
    let filtered = Object.values(pdfStatsData);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((stat) => {
        const item = pdfs.find((p) => p.id === stat.symbol);
        return (
          stat.symbol.toLowerCase().includes(q) ||
          (item?.title?.toLowerCase().includes(q) ?? false) ||
          (item?.description?.toLowerCase().includes(q) ?? false) ||
          (stat.category?.toLowerCase().includes(q) ?? false) ||
          (stat.type?.toLowerCase().includes(q) ?? false)
        );
      });
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((stat) => {
        const item = pdfs.find((p) => p.id === stat.symbol);
        if (!item) return false;

        if (selectedCategory === "generated") return item.exists === true;
        if (selectedCategory === "pending") return !item.exists && !item.error;
        if (selectedCategory === "error") return !!item.error;
        return true;
      });
    }

    filtered.sort((a, b) => {
      let av: string | number;
      let bv: string | number;

      switch (sortBy) {
        case "symbol": {
          const pa = pdfs.find((p) => p.id === a.symbol);
          const pb = pdfs.find((p) => p.id === b.symbol);
          av = pa?.title || a.symbol;
          bv = pb?.title || b.symbol;
          if (typeof av === "string" && typeof bv === "string") {
            return sortDirection === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
          }
          return 0;
        }
        case "price":
          av = a.price;
          bv = b.price;
          break;
        case "change":
          av = a.changePercent;
          bv = b.changePercent;
          break;
        case "volume":
          av = a.volume ?? -Infinity;
          bv = b.volume ?? -Infinity;
          break;
      }

      return sortDirection === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });

    return filtered.slice(0, maxPDFsDisplay);
  }, [pdfStatsData, pdfs, searchQuery, selectedCategory, sortBy, sortDirection, maxPDFsDisplay]);

  // Formatters
  const formatSize = useCallback((value: number): string => `${value.toFixed(2)} MB`, []);
  const formatPercent = useCallback((value: number): string => {
    if (value >= 0) return `${value >= 100 ? "✓ " : ""}${value.toFixed(1)}%`;
    return `${value.toFixed(1)}%`;
  }, []);
  const formatLargeNumber = useCallback((value?: number): string => {
    if (value === undefined) return "N/A";
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toFixed(0);
  }, []);

  const dashboardStats = useMemo(() => normalizeContextStats(contextStats), [contextStats]);

  // Actions
  const handlePDFClick = useCallback(
    (pdfId: string) => {
      setSelectedPDFId(pdfId);
      onPDFSelect?.(pdfId);
    },
    [setSelectedPDFId, onPDFSelect]
  );

  const handleGenerateClick = useCallback(
    async (pdfId: string) => {
      try {
        await generatePDF(pdfId);
      } catch (err) {
        console.error("Error generating PDF:", err);
      }
    },
    [generatePDF]
  );

  // -----------------------------
  // Inline UI components
  // -----------------------------
  const ConnectionPill = ({ status }: { status: "connected" | "disconnected" | "syncing" }) => {
    const cfg =
      status === "connected"
        ? { label: "Connected", cls: theme === "dark" ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-800", dot: "bg-green-400" }
        : status === "syncing"
        ? { label: "Syncing…", cls: theme === "dark" ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-800", dot: "bg-amber-400 animate-pulse" }
        : { label: "Disconnected", cls: theme === "dark" ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-800", dot: "bg-red-400" };

    return (
      <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${cfg.cls}`}>
        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </div>
    );
  };

  const LoadingSkeleton = ({ count }: { count: number }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`p-4 rounded-lg border animate-pulse ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"
          }`}
        >
          <div className={`h-4 rounded mb-2 ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`} />
          <div className={`h-6 rounded mb-3 ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`} />
          <div className={`h-3 rounded mb-1 ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`} />
          <div className={`h-3 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`} />
        </div>
      ))}
    </div>
  );

  const PDFCard: React.FC<{
    stat: PDFDashboardStats;
  }> = ({ stat }) => {
    const pdfItem = pdfs.find((p) => p.id === stat.symbol);
    const isFav = favorites.has(stat.symbol);

    const badge =
      stat.status === "generated"
        ? "bg-green-500/15 text-green-300"
        : stat.status === "generating"
        ? "bg-amber-500/15 text-amber-300"
        : stat.status === "error"
        ? "bg-red-500/15 text-red-300"
        : "bg-blue-500/15 text-blue-300";

    const percentColor =
      stat.changePercent >= 100 ? "text-green-500" : stat.changePercent >= 50 ? "text-amber-500" : stat.changePercent >= 0 ? "text-blue-500" : "text-red-500";

    return (
      <div
        className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
          theme === "dark" ? "bg-gray-800 border-gray-700 hover:border-gray-500" : "bg-white border-gray-200 hover:border-gray-400"
        }`}
        role="button"
        tabIndex={0}
        onClick={() => handlePDFClick(stat.symbol)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handlePDFClick(stat.symbol);
          }
        }}
      >
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold truncate">{pdfItem?.title || stat.symbol}</h3>
              {stat.status && <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${badge}`}>{stat.status}</span>}
            </div>
            <p className={`text-sm truncate ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              {pdfItem?.description || "PDF Document"}
            </p>
          </div>

          <button
            className={`p-1 rounded-full hover:scale-110 transition-transform ${
              isFav ? "text-red-500 hover:text-red-400" : theme === "dark" ? "text-gray-400 hover:text-gray-300" : "text-gray-300 hover:text-gray-400"
            }`}
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(stat.symbol);
            }}
          >
            {isFav ? "♥" : "♡"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Size</div>
            <div className="font-bold">{formatSize(stat.price)}</div>
          </div>

          <div>
            <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Completion</div>
            <div className={`font-bold ${percentColor}`}>{formatPercent(stat.changePercent)}</div>
          </div>

          <div>
            <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Pages</div>
            <div className="font-bold">{formatLargeNumber(stat.volume)}</div>
          </div>

          <div>
            <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Updated</div>
            <div className="font-bold text-xs">{new Date(stat.lastUpdated).toLocaleDateString()}</div>
          </div>
        </div>

        {stat.status !== "generated" && (
          <button
            className={`w-full py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              stat.status === "generating"
                ? "bg-gray-500"
                : theme === "dark"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
            disabled={stat.status === "generating"}
            onClick={(e) => {
              e.stopPropagation();
              handleGenerateClick(stat.symbol);
            }}
          >
            {stat.status === "generating" ? "Generating…" : "Generate PDF"}
          </button>
        )}
      </div>
    );
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className={`p-6 rounded-xl shadow-lg ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">PDF Intelligence Dashboard</h1>
          <p className={`mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Real-time PDF generation and management</p>
        </div>

        {showConnectionStatus && (
          <div className="flex items-center gap-4 flex-wrap">
            <ConnectionPill status={connectionStatus} />
            <button
              onClick={() => setIsPaused((p) => !p)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${theme === "dark" ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"}`}
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button onClick={refreshPDFList} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
        <div className="text-center">
          <div className="text-sm opacity-75">Total PDFs</div>
          <div className="text-xl font-bold">{dashboardStats.totalPDFs}</div>
        </div>
        <div className="text-center">
          <div className="text-sm opacity-75">Generated</div>
          <div className="text-xl font-bold text-green-600">{dashboardStats.generated}</div>
        </div>
        <div className="text-center">
          <div className="text-sm opacity-75">Pending</div>
          <div className="text-xl font-bold text-amber-600">{dashboardStats.pending}</div>
        </div>
        <div className="text-center">
          <div className="text-sm opacity-75">Errors</div>
          <div className="text-xl font-bold text-red-600">{dashboardStats.errors}</div>
        </div>
        <div className="text-center">
          <div className="text-sm opacity-75">Completion</div>
          <div className="text-xl font-bold text-blue-600">{dashboardStats.completionRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search PDFs by title or ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border transition-colors ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            }`}
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as "all" | "generated" | "pending" | "error")}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            }`}
          >
            <option value="all">All PDFs</option>
            <option value="generated">Generated</option>
            <option value="pending">Pending</option>
            <option value="error">Errors</option>
          </select>

          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => {
              const [s, d] = e.target.value.split("-");
              setSortBy(s as "symbol" | "price" | "change" | "volume");
              setSortDirection(d as "asc" | "desc");
            }}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            }`}
          >
            <option value="symbol-asc">Name A–Z</option>
            <option value="symbol-desc">Name Z–A</option>
            <option value="price-desc">Size Large–Small</option>
            <option value="price-asc">Size Small–Large</option>
            <option value="change-desc">Completion High–Low</option>
            <option value="change-asc">Completion Low–High</option>
            <option value="volume-desc">Pages High–Low</option>
            <option value="volume-asc">Pages Low–High</option>
          </select>
        </div>
      </div>

      {/* Generation Status */}
      {generationStatus && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            generationStatus.type === "success"
              ? "bg-green-500/10 border border-green-500/20"
              : generationStatus.type === "error"
              ? "bg-red-500/10 border border-red-500/20"
              : "bg-blue-500/10 border border-blue-500/20"
          }`}
        >
          <div className="font-medium">{generationStatus.message}</div>
          {generationStatus.progress !== undefined && (
            <div className="mt-2">
              <div className={`h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}>
                <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${generationStatus.progress}%` }} />
              </div>
              <div className="text-xs mt-1">{generationStatus.progress}% complete</div>
            </div>
          )}
        </div>
      )}

      {/* Grid / Empty states */}
      {pdfs.length === 0 ? (
        <LoadingSkeleton count={8} />
      ) : filteredAndSortedPDFs.length === 0 ? (
        <div className={`text-center py-12 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
          <div className={`text-lg font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>No PDFs found</div>
          <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{searchQuery ? "Try a different search term." : "No PDFs available."}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedPDFs.map((stat) => (
            <PDFCard key={stat.symbol} stat={stat} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className={`mt-6 pt-6 border-t ${theme === "dark" ? "border-gray-800 text-gray-400" : "border-gray-200 text-gray-600"} text-sm`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            Showing {filteredAndSortedPDFs.length} of {pdfs.length} PDFs
            {isPaused ? " (Updates paused)" : ""}
            {isGenerating ? " • Generating PDFs…" : ""}
          </div>
          <div className="flex gap-4">
            <div>Active: {dashboardStats.generating}</div>
            <div>Last sync: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDataDashboard;