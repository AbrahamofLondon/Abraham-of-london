// components/dashboard/LiveDataDashboard.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { usePDFDashboardContext } from "@/contexts/PDFDashboardContext";
import { PDFItem } from "@/types/pdf-dashboard";

// =====================
// Types (exactOptionalPropertyTypes-safe OUTPUT)
// =====================
interface PDFDashboardStats {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;

  // Optional means: if present => must NOT be undefined
  volume?: number;
  marketCap?: number;
  high24h?: number;
  low24h?: number;
  isFavorite?: boolean;
  status?: "generated" | "pending" | "error" | "generating";
  category?: string;
  type?: string;
  exists?: boolean;
}

/**
 * INPUT type: allows undefined for optional fields
 * because upstream sources often produce `number | undefined`
 * and updates sometimes intentionally "clear" values.
 */
type PDFDashboardStatsInput = {
  [K in keyof PDFDashboardStats]?: PDFDashboardStats[K] | undefined;
};

interface LiveDataDashboardProps {
  showConnectionStatus?: boolean;
  maxPDFsDisplay?: number;
  onPDFSelect?: (pdfId: string) => void;
  theme?: "light" | "dark";
}

// =====================
// Helpers: omit optional fields when undefined
// =====================
function opt<K extends string, V>(
  key: K,
  value: V | undefined
): Partial<Record<K, V>> {
  return value === undefined ? {} : ({ [key]: value } as Record<K, V>);
}

const createPDFDashboardStats = (data: PDFDashboardStatsInput): PDFDashboardStats => {
  const base: PDFDashboardStats = {
    symbol: data.symbol ?? "",
    price: data.price ?? 0,
    change: data.change ?? 0,
    changePercent: data.changePercent ?? 0,
    lastUpdated: data.lastUpdated ?? new Date().toISOString(),
  };

  return {
    ...base,
    ...opt("volume", data.volume),
    ...opt("marketCap", data.marketCap),
    ...opt("high24h", data.high24h),
    ...opt("low24h", data.low24h),
    ...opt("isFavorite", data.isFavorite),
    ...opt("status", data.status),
    ...opt("category", data.category),
    ...opt("type", data.type),
    ...opt("exists", data.exists),
  };
};

const updatePDFDashboardStats = (
  current: PDFDashboardStats,
  updates: PDFDashboardStatsInput
): PDFDashboardStats => createPDFDashboardStats({ ...current, ...updates });

// Convert PDFItem to stats
const convertPDFToStats = (pdf: PDFItem): PDFDashboardStats => {
  const fileSizeMB = pdf.fileSize ? parseFloat(pdf.fileSize) / (1024 * 1024) : 0;

  const statusValue = pdf.exists ? 100 : pdf.isGenerating ? 50 : pdf.error ? 0 : 25;
  const changePercent = pdf.exists ? 100 : pdf.isGenerating ? 50 : pdf.error ? -100 : 0;

  return createPDFDashboardStats({
    symbol: pdf.id,
    price: fileSizeMB,
    change: statusValue,
    changePercent,
    lastUpdated: pdf.lastGenerated || pdf.updatedAt || pdf.createdAt,

    volume: pdf.metadata?.pageCount,
    marketCap: pdf.metadata?.importance,
    high24h: fileSizeMB * 1.5,
    low24h: fileSizeMB * 0.5,
    isFavorite: pdf.metadata?.isFavorite,

    status: pdf.exists
      ? "generated"
      : pdf.isGenerating
      ? "generating"
      : pdf.error
      ? "error"
      : "pending",

    category: pdf.category,
    type: pdf.type,
    exists: pdf.exists,
  });
};

export const LiveDataDashboard: React.FC<LiveDataDashboardProps> = ({
  showConnectionStatus = true,
  maxPDFsDisplay = 12,
  onPDFSelect,
  theme = "light",
}) => {
  const {
    pdfs,
    isGenerating,
    stats: pdfStats,
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

  // Convert PDFs to stats
  useEffect(() => {
    const stats: Record<string, PDFDashboardStats> = {};
    for (const pdf of pdfs) {
      stats[pdf.id] = convertPDFToStats(pdf);
    }
    setPdfStatsData(stats);
  }, [pdfs]);

  // Simulate live updates (strict safe narrowing)
  useEffect(() => {
    if (isPaused || !isGenerating) return;

    const interval = setInterval(() => {
      setPdfStatsData((prev) => {
        let hasChanges = false;
        const updated: Record<string, PDFDashboardStats> = { ...prev };

        for (const pdf of pdfs) {
          if (!pdf.isGenerating) continue;

          const currentStat = updated[pdf.id];
          if (!currentStat) continue;

          updated[pdf.id] = updatePDFDashboardStats(currentStat, {
            change: Math.min(currentStat.change + 10, 90),
            changePercent: Math.min(currentStat.changePercent + 10, 90),
            lastUpdated: new Date().toISOString(),
          });

          hasChanges = true;
        }

        return hasChanges ? updated : prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isPaused, isGenerating, pdfs]);

  // Update connection status
  useEffect(() => {
    if (isGenerating) setConnectionStatus("syncing");
    else if (pdfs.length > 0) setConnectionStatus("connected");
    else setConnectionStatus("disconnected");
  }, [isGenerating, pdfs.length]);

  // Favorite management (NO undefined passed)
  const toggleFavorite = useCallback((pdfId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(pdfId)) next.delete(pdfId);
      else next.add(pdfId);

      try {
        localStorage.setItem("pdf-favorites", JSON.stringify(Array.from(next)));
      } catch (error) {
        console.error("Error saving favorites:", error);
      }

      setPdfStatsData((prevStats) => {
        const current = prevStats[pdfId];
        if (!current) return prevStats;

        const isFav = next.has(pdfId);
        const favUpdate: PDFDashboardStatsInput = isFav ? { isFavorite: true } : {};

        return {
          ...prevStats,
          [pdfId]: updatePDFDashboardStats(current, favUpdate),
        };
      });

      return next;
    });
  }, []);

  // Load favorites
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pdf-favorites");
      if (!saved) return;

      const favoritesArray: string[] = JSON.parse(saved);
      const newFavorites = new Set(favoritesArray);
      setFavorites(newFavorites);

      setPdfStatsData((prev) => {
        const updated: Record<string, PDFDashboardStats> = { ...prev };

        for (const pdfId of favoritesArray) {
          const current = updated[pdfId];
          if (!current) continue;
          updated[pdfId] = updatePDFDashboardStats(current, { isFavorite: true });
        }

        return updated;
      });
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  }, []);

  // Sorting & filtering
  const filteredAndSortedPDFs = useMemo(() => {
    let filtered = Object.values(pdfStatsData);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((stat) => {
        const item = pdfs.find((p) => p.id === stat.symbol);
        return (
          stat.symbol.toLowerCase().includes(query) ||
          item?.title?.toLowerCase().includes(query) ||
          item?.description?.toLowerCase().includes(query) ||
          (stat.category && stat.category.toLowerCase().includes(query)) ||
          (stat.type && stat.type.toLowerCase().includes(query))
        );
      });
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((stat) => {
        const item = pdfs.find((p) => p.id === stat.symbol);
        if (!item) return false;

        switch (selectedCategory) {
          case "generated":
            return item.exists === true;
          case "pending":
            return !item.exists && !item.error;
          case "error":
            return !!item.error;
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      let aValue: string | number | undefined;
      let bValue: string | number | undefined;

      switch (sortBy) {
        case "symbol": {
          const pdfA = pdfs.find((p) => p.id === a.symbol);
          const pdfB = pdfs.find((p) => p.id === b.symbol);
          aValue = pdfA?.title || a.symbol;
          bValue = pdfB?.title || b.symbol;
          break;
        }
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "change":
          aValue = a.changePercent;
          bValue = b.changePercent;
          break;
        case "volume":
          aValue = a.volume;
          bValue = b.volume;
          break;
      }

      const aFinal = aValue === undefined ? (sortBy === "symbol" ? "" : -Infinity) : aValue;
      const bFinal = bValue === undefined ? (sortBy === "symbol" ? "" : -Infinity) : bValue;

      if (typeof aFinal === "string" && typeof bFinal === "string") {
        return sortDirection === "asc" ? aFinal.localeCompare(bFinal) : bFinal.localeCompare(aFinal);
      }

      const aNum = Number(aFinal);
      const bNum = Number(bFinal);
      return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
    });

    return filtered.slice(0, maxPDFsDisplay);
  }, [pdfStatsData, pdfs, searchQuery, selectedCategory, sortBy, sortDirection, maxPDFsDisplay]);

  // Formatting
  const formatCurrency = useCallback((value: number) => `${value.toFixed(2)} MB`, []);
  const formatPercent = useCallback((value: number) => {
    if (value >= 0) return `${value >= 100 ? "✓ " : ""}${value.toFixed(1)}%`;
    return `${value.toFixed(1)}%`;
  }, []);
  const formatLargeNumber = useCallback((value?: number) => {
    if (value === undefined) return "N/A";
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toFixed(0);
  }, []);

  // Dashboard stats
  const dashboardStats = useMemo(() => {
    const totalPDFs = pdfStats.totalPDFs || 0;
    const generated = pdfStats.generated || 0;
    const pending = pdfStats.missing || 0;
    const errors = pdfStats.errors || 0;
    const generating = pdfStats.generating || 0;
    const completionRate = totalPDFs > 0 ? (generated / totalPDFs) * 100 : 0;

    return { totalPDFs, generated, pending, errors, generating, completionRate };
  }, [pdfStats]);

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
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    },
    [generatePDF]
  );

  // UI components
  const ConnectionStatus = ({ status, theme }: { status: "connected" | "disconnected" | "syncing"; theme: "light" | "dark" }) => {
    const config =
      status === "connected"
        ? { text: "Connected", color: theme === "dark" ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-800" }
        : status === "syncing"
        ? { text: "Syncing...", color: theme === "dark" ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-800" }
        : { text: "Disconnected", color: theme === "dark" ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-800" };

    return (
      <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${config.color}`}>
        <div
          className={`h-2 w-2 rounded-full ${
            status === "connected" ? "bg-green-400" : status === "syncing" ? "bg-amber-400 animate-pulse" : "bg-red-400"
          }`}
        />
        {config.text}
      </div>
    );
  };

  const LoadingSkeleton = ({ count, theme }: { count: number; theme: "light" | "dark" }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`p-4 rounded-lg border animate-pulse ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"}`}>
          <div className={`h-4 rounded mb-2 ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`} />
          <div className={`h-6 rounded mb-3 ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`} />
          <div className={`h-3 rounded mb-1 ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`} />
          <div className={`h-3 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`} />
        </div>
      ))}
    </div>
  );

  // Card
  const PDFStatsCard: React.FC<{
    pdfStat: PDFDashboardStats;
    isFavorite: boolean;
    onToggleFavorite: (pdfId: string) => void;
    onClick: () => void;
    onGenerate?: () => void;
    theme?: "light" | "dark";
  }> = ({ pdfStat, isFavorite, onToggleFavorite, onClick, onGenerate, theme = "light" }) => {
    const pdfItem = pdfs.find((p) => p.id === pdfStat.symbol);

    const getStatusColor = () => {
      switch (pdfStat.status) {
        case "generated":
          return "bg-green-500/20 text-green-400";
        case "generating":
          return "bg-amber-500/20 text-amber-400";
        case "error":
          return "bg-red-500/20 text-red-400";
        case "pending":
          return "bg-blue-500/20 text-blue-400";
        default:
          return "bg-gray-500/20 text-gray-400";
      }
    };

    const getPercentColor = () => {
      const percent = pdfStat.changePercent;
      if (percent >= 100) return "text-green-600";
      if (percent >= 50) return "text-amber-600";
      if (percent >= 0) return "text-blue-600";
      return "text-red-600";
    };

    return (
      <div
        onClick={onClick}
        className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
          theme === "dark" ? "bg-gray-800 border-gray-700 hover:border-gray-500" : "bg-white border-gray-200 hover:border-gray-400"
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold truncate">{pdfItem?.title || pdfStat.symbol}</h3>
              {pdfStat.status && (
                <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${getStatusColor()}`}>{pdfStat.status}</span>
              )}
            </div>
            <p className={`text-sm truncate ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              {pdfItem?.description || "PDF Document"}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(pdfStat.symbol);
            }}
            className={`p-1 rounded-full hover:scale-110 transition-transform ${
              isFavorite
                ? "text-red-500 hover:text-red-400"
                : theme === "dark"
                ? "text-gray-400 hover:text-gray-300"
                : "text-gray-300 hover:text-gray-400"
            }`}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Size</div>
            <div className="font-bold">{formatCurrency(pdfStat.price)}</div>
          </div>
          <div>
            <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Status</div>
            <div className={`font-bold ${getPercentColor()}`}>{formatPercent(pdfStat.changePercent)}</div>
          </div>
          <div>
            <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Pages</div>
            <div className="font-bold">{formatLargeNumber(pdfStat.volume)}</div>
          </div>
          <div>
            <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Last Updated</div>
            <div className="font-bold text-xs">{new Date(pdfStat.lastUpdated).toLocaleDateString()}</div>
          </div>
        </div>

        {pdfStat.status !== "generated" && onGenerate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerate();
            }}
            disabled={pdfStat.status === "generating"}
            className={`w-full py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              pdfStat.status === "generating"
                ? "bg-gray-500"
                : theme === "dark"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            {pdfStat.status === "generating" ? "Generating..." : "Generate PDF"}
          </button>
        )}
      </div>
    );
  };

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
            <ConnectionStatus status={connectionStatus} theme={theme} />
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === "dark" ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={refreshPDFList}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
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
            placeholder="Search PDFs by title or ID..."
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
              const [sort, direction] = e.target.value.split("-");
              setSortBy(sort as "symbol" | "price" | "change" | "volume");
              setSortDirection(direction as "asc" | "desc");
            }}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            }`}
          >
            <option value="symbol-asc">Name A-Z</option>
            <option value="symbol-desc">Name Z-A</option>
            <option value="price-desc">Size Large-Small</option>
            <option value="price-asc">Size Small-Large</option>
            <option value="change-desc">Status Complete-First</option>
            <option value="change-asc">Status First-Complete</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {pdfs.length === 0 && <LoadingSkeleton count={6} theme={theme} />}

      {pdfs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedPDFs.map((pdfStat) => (
            <PDFStatsCard
              key={pdfStat.symbol}
              pdfStat={pdfStat}
              isFavorite={favorites.has(pdfStat.symbol)}
              onToggleFavorite={toggleFavorite}
              onClick={() => handlePDFClick(pdfStat.symbol)}
              onGenerate={() => handleGenerateClick(pdfStat.symbol)}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveDataDashboard;