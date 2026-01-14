// components/dashboard/LiveDataDashboard.tsx - FIXED VERSION
import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePDFDashboardContext } from '@/contexts/PDFDashboardContext';
import { PDFItem } from '@/types/pdf-dashboard';

// Types for PDF Dashboard
interface PDFDashboardStats {
  symbol: string; // PDF ID or title
  price: number; // File size in MB
  change: number; // Generation status change
  changePercent: number; // Percentage complete
  lastUpdated: string;
  volume?: number; // Page count or hits
  marketCap?: number; // Total value/importance
  high24h?: number; // Max size
  low24h?: number; // Min size
  isFavorite?: boolean;
  status?: 'generated' | 'pending' | 'error' | 'generating';
  category?: string;
  type?: string;
  exists?: boolean;
}

interface PDFDataUpdate {
  type: 'pdf_update' | 'batch_update' | 'generation_status' | 'error';
  data: PDFDashboardStats | PDFDashboardStats[] | string;
  timestamp?: string;
}

interface LiveDataDashboardProps {
  showConnectionStatus?: boolean;
  maxPDFsDisplay?: number;
  onPDFSelect?: (pdfId: string) => void;
  theme?: 'light' | 'dark';
}

// Convert PDFItem to DashboardStats format
const convertPDFToStats = (pdf: PDFItem): PDFDashboardStats => {
  const fileSizeMB = pdf.fileSize ? parseFloat(pdf.fileSize) / (1024 * 1024) : 0;
  const statusValue = pdf.exists ? 100 : pdf.isGenerating ? 50 : pdf.error ? 0 : 25;
  const changePercent = pdf.exists ? 100 : pdf.isGenerating ? 50 : pdf.error ? -100 : 0;
  
  return {
    symbol: pdf.id,
    price: fileSizeMB,
    change: statusValue,
    changePercent: changePercent,
    lastUpdated: pdf.lastGenerated || pdf.updatedAt || pdf.createdAt,
    volume: pdf.metadata?.pageCount || 0,
    marketCap: pdf.metadata?.importance || 1000,
    high24h: fileSizeMB * 1.5, // Simulated max
    low24h: fileSizeMB * 0.5,  // Simulated min
    isFavorite: pdf.metadata?.isFavorite || false,
    status: pdf.exists ? 'generated' : pdf.isGenerating ? 'generating' : pdf.error ? 'error' : 'pending',
    category: pdf.category,
    type: pdf.type,
    exists: pdf.exists,
  };
};

export const LiveDataDashboard: React.FC<LiveDataDashboardProps> = ({
  showConnectionStatus = true,
  maxPDFsDisplay = 12,
  onPDFSelect,
  theme = 'light',
}) => {
  // Use your actual PDF dashboard context
  const {
    pdfs,
    filteredPDFs,
    selectedPDF,
    isGenerating,
    stats: pdfStats,
    generationStatus,
    generatePDF,
    setSelectedPDFId,
    refreshPDFList,
  } = usePDFDashboardContext();

  const [pdfStatsData, setPdfStatsData] = useState<Record<string, PDFDashboardStats>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'volume'>('symbol');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'generated' | 'pending' | 'error'>('all');
  const [isPaused, setIsPaused] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'syncing'>('connected');

  // Convert PDFs to dashboard stats
  useEffect(() => {
    const stats: Record<string, PDFDashboardStats> = {};
    pdfs.forEach(pdf => {
      stats[pdf.id] = convertPDFToStats(pdf);
    });
    setPdfStatsData(stats);
  }, [pdfs]);

  // Simulate live updates based on PDF generation status - FIXED TYPE ERROR
  useEffect(() => {
    if (isPaused || !isGenerating) return;

    const interval = setInterval(() => {
      // Update generating PDFs with progress
      setPdfStatsData(prev => {
        const updated = { ...prev };
        pdfs.forEach(pdf => {
          if (pdf.isGenerating && updated[pdf.id]) {
            const currentStat = updated[pdf.id];
            updated[pdf.id] = {
              symbol: currentStat.symbol,
              price: currentStat.price,
              change: Math.min(currentStat.change + 10, 90), // Progress
              changePercent: Math.min(currentStat.changePercent + 10, 90),
              lastUpdated: new Date().toISOString(),
              volume: currentStat.volume,
              marketCap: currentStat.marketCap,
              high24h: currentStat.high24h,
              low24h: currentStat.low24h,
              isFavorite: currentStat.isFavorite,
              status: currentStat.status,
              category: currentStat.category,
              type: currentStat.type,
              exists: currentStat.exists,
            };
          }
        });
        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isPaused, isGenerating, pdfs]);

  // Update connection status based on generation
  useEffect(() => {
    if (isGenerating) {
      setConnectionStatus('syncing');
    } else if (pdfs.length > 0) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isGenerating, pdfs.length]);

  // Favorite management - FIXED TYPE ERROR
  const toggleFavorite = useCallback((pdfId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(pdfId)) {
        newFavorites.delete(pdfId);
      } else {
        newFavorites.add(pdfId);
      }
      
      localStorage.setItem('pdf-favorites', JSON.stringify(Array.from(newFavorites)));
      
      // Update stats with all required properties
      setPdfStatsData(prev => {
        const currentStat = prev[pdfId];
        if (!currentStat) return prev;
        
        return {
          ...prev,
          [pdfId]: {
            symbol: currentStat.symbol,
            price: currentStat.price,
            change: currentStat.change,
            changePercent: currentStat.changePercent,
            lastUpdated: currentStat.lastUpdated,
            volume: currentStat.volume,
            marketCap: currentStat.marketCap,
            high24h: currentStat.high24h,
            low24h: currentStat.low24h,
            status: currentStat.status,
            category: currentStat.category,
            type: currentStat.type,
            exists: currentStat.exists,
            isFavorite: newFavorites.has(pdfId),
          },
        };
      });
      
      return newFavorites;
    });
  }, []);

  // Load favorites
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('pdf-favorites');
      if (savedFavorites) {
        const favoritesArray = JSON.parse(savedFavorites) as string[];
        setFavorites(new Set(favoritesArray));
        
        // Update stats with favorite status
        setPdfStatsData(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(pdfId => {
            const currentStat = updated[pdfId];
            updated[pdfId] = {
              symbol: currentStat.symbol,
              price: currentStat.price,
              change: currentStat.change,
              changePercent: currentStat.changePercent,
              lastUpdated: currentStat.lastUpdated,
              volume: currentStat.volume,
              marketCap: currentStat.marketCap,
              high24h: currentStat.high24h,
              low24h: currentStat.low24h,
              status: currentStat.status,
              category: currentStat.category,
              type: currentStat.type,
              exists: currentStat.exists,
              isFavorite: favoritesArray.includes(pdfId),
            };
          });
          return updated;
        });
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, []);

  // Sorting and filtering
  const filteredAndSortedPDFs = useMemo(() => {
    let filtered = Object.values(pdfStatsData);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pdf => 
        pdf.symbol.toLowerCase().includes(query) ||
        pdfs.find(p => p.id === pdf.symbol)?.title?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(pdf => {
        const pdfItem = pdfs.find(p => p.id === pdf.symbol);
        if (!pdfItem) return false;
        
        switch (selectedCategory) {
          case 'generated': return pdfItem.exists;
          case 'pending': return !pdfItem.exists && !pdfItem.error;
          case 'error': return !!pdfItem.error;
          default: return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'symbol':
          const pdfA = pdfs.find(p => p.id === a.symbol);
          const pdfB = pdfs.find(p => p.id === b.symbol);
          aValue = pdfA?.title || a.symbol;
          bValue = pdfB?.title || b.symbol;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'change':
          aValue = a.changePercent;
          bValue = b.changePercent;
          break;
        case 'volume':
          aValue = a.volume || 0;
          bValue = b.volume || 0;
          break;
        default:
          aValue = a.symbol;
          bValue = b.symbol;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        const aNum = Number(aValue) || 0;
        const bNum = Number(bValue) || 0;
        return sortDirection === 'asc'
          ? aNum - bNum
          : bNum - aNum;
      }
    });

    // Limit display
    return filtered.slice(0, maxPDFsDisplay);
  }, [pdfStatsData, pdfs, searchQuery, selectedCategory, sortBy, sortDirection, maxPDFsDisplay]);

  // Formatting utilities
  const formatCurrency = useCallback((value: number): string => {
    return `${value.toFixed(2)} MB`;
  }, []);

  const formatPercent = useCallback((value: number): string => {
    if (value >= 0) {
      return `${value >= 100 ? '✓ ' : ''}${value.toFixed(1)}%`;
    }
    return `${value.toFixed(1)}%`;
  }, []);

  const formatLargeNumber = useCallback((value?: number): string => {
    if (value === undefined || value === null) return 'N/A';
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toFixed(0);
  }, []);

  // Dashboard statistics from actual PDF data
  const dashboardStats = useMemo(() => {
    const totalPDFs = pdfStats.totalPDFs || 0;
    const generated = pdfStats.generated || 0;
    const pending = pdfStats.missing || 0;
    const errors = pdfStats.errors || 0;
    const completionRate = totalPDFs > 0 ? (generated / totalPDFs) * 100 : 0;

    return { 
      totalPDFs, 
      generated, 
      pending, 
      errors, 
      completionRate,
      generating: pdfStats.generating || 0,
    };
  }, [pdfStats]);

  // Handle PDF click
  const handlePDFClick = useCallback((pdfId: string) => {
    setSelectedPDFId(pdfId);
    if (onPDFSelect) {
      onPDFSelect(pdfId);
    }
  }, [setSelectedPDFId, onPDFSelect]);

  // Generate PDF on click
  const handleGenerateClick = useCallback(async (pdfId: string) => {
    await generatePDF(pdfId);
  }, [generatePDF]);

  // ConnectionStatus component
  const ConnectionStatus = ({ status, theme }: { status: 'connected' | 'disconnected' | 'syncing'; theme: 'light' | 'dark' }) => {
    const getStatusConfig = () => {
      switch (status) {
        case 'connected':
          return { 
            text: 'Connected', 
            color: theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800' 
          };
        case 'syncing':
          return { 
            text: 'Syncing...', 
            color: theme === 'dark' ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-800' 
          };
        case 'disconnected':
          return { 
            text: 'Disconnected', 
            color: theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800' 
          };
      }
    };

    const config = getStatusConfig();
    
    return (
      <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${config.color}`}>
        <div className={`h-2 w-2 rounded-full ${
          status === 'connected' ? 'bg-green-400' :
          status === 'syncing' ? 'bg-amber-400 animate-pulse' :
          'bg-red-400'
        }`}></div>
        {config.text}
      </div>
    );
  };

  // StockPriceCard adapted for PDFs
  const PDFStatsCard: React.FC<{
    pdfStat: PDFDashboardStats;
    isFavorite: boolean;
    onToggleFavorite: (pdfId: string) => void;
    onClick: () => void;
    onGenerate?: () => void;
    formatCurrency: (value: number) => string;
    formatPercent: (value: number) => string;
    formatLargeNumber: (value?: number) => string;
    theme?: 'light' | 'dark';
  }> = ({ 
    pdfStat, 
    isFavorite, 
    onToggleFavorite, 
    onClick, 
    onGenerate,
    formatCurrency, 
    formatPercent, 
    formatLargeNumber,
    theme = 'light' 
  }) => {
    const pdfItem = pdfs.find(p => p.id === pdfStat.symbol);
    const isGenerated = pdfStat.status === 'generated';
    const isGenerating = pdfStat.status === 'generating';
    const hasError = pdfStat.status === 'error';

    return (
      <div 
        onClick={onClick}
        className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700 hover:border-gray-500' 
            : 'bg-white border-gray-200 hover:border-gray-400'
        }`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold truncate">{pdfItem?.title || pdfStat.symbol}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                isGenerated ? 'bg-green-500/20 text-green-400' :
                isGenerating ? 'bg-amber-500/20 text-amber-400' :
                hasError ? 'bg-red-500/20 text-red-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {pdfStat.status}
              </span>
            </div>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
              {pdfItem?.description || 'PDF Document'}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(pdfStat.symbol);
            }}
            className={`p-1 rounded-full ${isFavorite ? 'text-red-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-300'}`}
          >
            {isFavorite ? '♥' : '♡'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Size
            </div>
            <div className="font-bold">{formatCurrency(pdfStat.price)}</div>
          </div>
          <div>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Status
            </div>
            <div className={`font-bold ${
              pdfStat.changePercent >= 100 ? 'text-green-600' :
              pdfStat.changePercent >= 50 ? 'text-amber-600' :
              pdfStat.changePercent >= 0 ? 'text-blue-600' :
              'text-red-600'
            }`}>
              {formatPercent(pdfStat.changePercent)}
            </div>
          </div>
          <div>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Pages
            </div>
            <div className="font-bold">{formatLargeNumber(pdfStat.volume)}</div>
          </div>
          <div>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Last Updated
            </div>
            <div className="font-bold text-xs">
              {new Date(pdfStat.lastUpdated).toLocaleDateString()}
            </div>
          </div>
        </div>

        {!isGenerated && onGenerate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerate();
            }}
            disabled={isGenerating}
            className={`w-full py-2 rounded-lg font-medium transition-colors ${
              isGenerating 
                ? 'bg-gray-500 cursor-not-allowed' 
                : theme === 'dark' 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            {isGenerating ? 'Generating...' : 'Generate PDF'}
          </button>
        )}
      </div>
    );
  };

  // LoadingSkeleton component
  const LoadingSkeleton = ({ count, theme }: { count: number; theme: 'light' | 'dark' }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`p-4 rounded-lg border animate-pulse ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
        }`}>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-6 bg-gray-300 rounded mb-3"></div>
          <div className="h-3 bg-gray-300 rounded mb-1"></div>
          <div className="h-3 bg-gray-300 rounded"></div>
        </div>
      ))}
    </div>
  );

  // Render
  return (
    <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">PDF Intelligence Dashboard</h2>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Real-time PDF generation and management
          </p>
        </div>

        {showConnectionStatus && (
          <div className="flex items-center gap-4">
            <ConnectionStatus status={connectionStatus} theme={theme} />
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-4 py-2 rounded-lg font-medium ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={refreshPDFList}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
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
          <div className="text-xl font-bold text-blue-600">
            {dashboardStats.completionRate.toFixed(1)}%
          </div>
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
            className={`w-full px-4 py-2 rounded-lg border ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300'
            }`}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as 'all' | 'generated' | 'pending' | 'error')}
            className={`px-4 py-2 rounded-lg border ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300'
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
              const [sort, direction] = e.target.value.split('-');
              setSortBy(sort as 'symbol' | 'price' | 'change' | 'volume');
              setSortDirection(direction as 'asc' | 'desc');
            }}
            className={`px-4 py-2 rounded-lg border ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300'
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

      {/* Loading State */}
      {pdfs.length === 0 && <LoadingSkeleton count={6} theme={theme} />}

      {/* Generation Status */}
      {generationStatus && (
        <div className={`mb-6 p-4 rounded-lg ${
          generationStatus.type === 'success' ? 'bg-green-500/10 border border-green-500/20' :
          generationStatus.type === 'error' ? 'bg-red-500/10 border border-red-500/20' :
          'bg-blue-500/10 border border-blue-500/20'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">
                {generationStatus.message}
              </div>
              {generationStatus.progress !== undefined && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${generationStatus.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs mt-1">{generationStatus.progress}% complete</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PDFs Grid */}
      {pdfs.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedPDFs.map((pdfStat) => (
              <PDFStatsCard
                key={pdfStat.symbol}
                pdfStat={pdfStat}
                isFavorite={pdfStat.isFavorite || false}
                onToggleFavorite={toggleFavorite}
                onClick={() => handlePDFClick(pdfStat.symbol)}
                onGenerate={() => handleGenerateClick(pdfStat.symbol)}
                formatCurrency={formatCurrency}
                formatPercent={formatPercent}
                formatLargeNumber={formatLargeNumber}
                theme={theme}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredAndSortedPDFs.length === 0 && (
            <div className={`text-center py-12 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className={`text-lg font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                No PDFs found
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {searchQuery ? 'Try a different search term' : 'No PDFs available'}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className={`mt-6 pt-6 border-t ${
        theme === 'dark' ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600'
      } text-sm`}>
        <div className="flex justify-between items-center">
          <div>
            Showing {filteredAndSortedPDFs.length} of {pdfs.length} PDFs
            {isPaused && ' (Updates paused)'}
            {isGenerating && ' • Generating PDFs...'}
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

// Export default
export default LiveDataDashboard;