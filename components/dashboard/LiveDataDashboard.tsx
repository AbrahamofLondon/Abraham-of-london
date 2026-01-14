// components/dashboard/LiveDataDashboard.tsx - COMPLETE FIXED VERSION
import { useState, useEffect, useCallback, useMemo } from 'react';
import { StockPriceCard } from './StockPriceCard';
import { StockPrice, StockDataUpdate, LiveDataDashboardProps } from './types';

// Constants
const DEFAULT_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META'];

// Mock data
const MOCK_STOCKS: Record<string, StockPrice> = {
  AAPL: { symbol: 'AAPL', price: 175.34, change: 2.15, changePercent: 1.24, lastUpdated: new Date().toISOString(), volume: 58392000, marketCap: 2.7e12 },
  GOOGL: { symbol: 'GOOGL', price: 142.56, change: -0.45, changePercent: -0.31, lastUpdated: new Date().toISOString(), volume: 28456000, marketCap: 1.8e12 },
  MSFT: { symbol: 'MSFT', price: 332.89, change: 5.67, changePercent: 1.73, lastUpdated: new Date().toISOString(), volume: 39285000, marketCap: 2.5e12 },
  AMZN: { symbol: 'AMZN', price: 156.78, change: 1.23, changePercent: 0.79, lastUpdated: new Date().toISOString(), volume: 47239000, marketCap: 1.6e12 },
  TSLA: { symbol: 'TSLA', price: 245.12, change: -3.45, changePercent: -1.39, lastUpdated: new Date().toISOString(), volume: 89234000, marketCap: 780e9 },
  META: { symbol: 'META', price: 312.45, change: 7.89, changePercent: 2.59, lastUpdated: new Date().toISOString(), volume: 28374000, marketCap: 800e9 },
};

// Mock hooks
const useMockWebSocket = () => {
  const [isConnected] = useState(true);
  const [lastMessage] = useState<string | null>(null);
  
  return {
    isConnected,
    lastMessage,
    error: null,
    reconnect: () => {},
    connectionId: 'mock-123',
  };
};

const useMockStockData = () => {
  const [data] = useState<StockPrice[]>(Object.values(MOCK_STOCKS));
  const [isLoading] = useState(false);
  
  return {
    data,
    isLoading,
    error: null,
  };
};

export const LiveDataDashboard: React.FC<LiveDataDashboardProps> = ({
  initialSymbols = DEFAULT_SYMBOLS,
  refreshInterval = 5000,
  showConnectionStatus = true,
  maxStocksDisplay = 12,
  onStockSelect,
  theme = 'light',
}) => {
  // Use mock hooks
  const {
    isConnected,
    lastMessage,
    error: wsError,
    reconnect,
    connectionId,
  } = useMockWebSocket();
  
  const { data: initialStockData, isLoading, error: apiError } = useMockStockData();

  const [stocks, setStocks] = useState<Record<string, StockPrice>>(MOCK_STOCKS);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'volume'>('symbol');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'gainers' | 'losers'>('all');
  const [isPaused, setIsPaused] = useState(false);

  // Process WebSocket messages (mock)
  useEffect(() => {
    if (!lastMessage || isPaused) return;

    try {
      const update = JSON.parse(lastMessage) as StockDataUpdate;
      
      switch (update.type) {
        case 'price_update':
          const stock = update.data as StockPrice;
          setStocks(prev => ({
            ...prev,
            [stock.symbol]: {
              ...stock,
              isFavorite: favorites.has(stock.symbol),
              lastUpdated: new Date().toISOString(),
            },
          }));
          break;

        case 'batch_update':
          const batchData = update.data as StockPrice[];
          const updatedStocks: Record<string, StockPrice> = {};
          batchData.forEach(stock => {
            updatedStocks[stock.symbol] = {
              ...stock,
              isFavorite: favorites.has(stock.symbol),
              lastUpdated: new Date().toISOString(),
            };
          });
          setStocks(prev => ({ ...prev, ...updatedStocks }));
          break;
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }, [lastMessage, isPaused, favorites]);

  // Initialize with mock data
  useEffect(() => {
    if (!isConnected && initialStockData && !isLoading) {
      const initialStocks: Record<string, StockPrice> = {};
      initialStockData.forEach(stock => {
        initialStocks[stock.symbol] = {
          ...stock,
          isFavorite: favorites.has(stock.symbol),
        };
      });
      setStocks(initialStocks);
    }
  }, [isConnected, initialStockData, isLoading, favorites]);

  // Favorite management
  const toggleFavorite = useCallback((symbol: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      
      localStorage.setItem('stock-favorites', JSON.stringify(Array.from(newFavorites)));
      
      setStocks(prevStocks => ({
        ...prevStocks,
        [symbol]: {
          ...prevStocks[symbol],
          isFavorite: newFavorites.has(symbol),
        },
      }));
      
      return newFavorites;
    });
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('stock-favorites');
      if (savedFavorites) {
        const favoritesArray = JSON.parse(savedFavorites) as string[];
        setFavorites(new Set(favoritesArray));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, []);

  // Sorting and filtering
  const filteredAndSortedStocks = useMemo(() => {
    let filtered = Object.values(stocks);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(stock => 
        stock.symbol.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(stock => 
        selectedCategory === 'gainers' ? stock.changePercent >= 0 : stock.changePercent < 0
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number = a[sortBy];
      let bValue: string | number = b[sortBy];

      // Handle undefined values
      if (aValue === undefined) aValue = sortBy === 'symbol' ? '' : 0;
      if (bValue === undefined) bValue = sortBy === 'symbol' ? '' : 0;

      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc'
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }
    });

    // Limit display
    return filtered.slice(0, maxStocksDisplay);
  }, [stocks, searchQuery, selectedCategory, sortBy, sortDirection, maxStocksDisplay]);

  // Formatting utilities
  const formatCurrency = useCallback((value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  const formatPercent = useCallback((value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }, []);

  const formatLargeNumber = useCallback((value?: number): string => {
    if (!value) return 'N/A';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return formatCurrency(value);
  }, [formatCurrency]);

  // Error handling
  const error = wsError || apiError;
  const isInitialLoading = isLoading && Object.keys(stocks).length === 0;

  // Dashboard statistics
  const dashboardStats = useMemo(() => {
    const stockArray = Object.values(stocks);
    const totalStocks = stockArray.length;
    const gainers = stockArray.filter(s => s.changePercent > 0).length;
    const losers = stockArray.filter(s => s.changePercent < 0).length;
    const avgChange = totalStocks > 0 
      ? stockArray.reduce((sum, s) => sum + s.changePercent, 0) / totalStocks 
      : 0;

    return { totalStocks, gainers, losers, avgChange };
  }, [stocks]);

  // Handle stock click
  const handleStockClick = useCallback((symbol: string) => {
    if (onStockSelect) {
      onStockSelect(symbol);
    }
  }, [onStockSelect]);

  // Simple ConnectionStatus component (since we don't have the real one)
  const ConnectionStatus = ({ isConnected, theme }: { isConnected: boolean; theme: 'light' | 'dark' }) => (
    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
      isConnected
        ? (theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800')
        : (theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800')
    }`}>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );

  // Simple LoadingSkeleton component
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

  // Simple ErrorBoundary fallback
  const DashboardError = ({ onRetry }: { onRetry: () => void }) => (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
      <div className="text-red-800 font-bold mb-2">Dashboard Error</div>
      <div className="text-red-600 mb-4">Failed to load stock data</div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );

  // Render
  return (
    <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Live Market Dashboard</h2>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Real-time stock prices and market data
          </p>
        </div>

        {showConnectionStatus && (
          <div className="flex items-center gap-4">
            <ConnectionStatus isConnected={isConnected} theme={theme} />
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
            {!isConnected && (
              <button
                onClick={reconnect}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Reconnect
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="text-sm opacity-75">Total Stocks</div>
          <div className="text-xl font-bold">{dashboardStats.totalStocks}</div>
        </div>
        <div className="text-center">
          <div className="text-sm opacity-75">Gainers</div>
          <div className="text-xl font-bold text-green-600">{dashboardStats.gainers}</div>
        </div>
        <div className="text-center">
          <div className="text-sm opacity-75">Losers</div>
          <div className="text-xl font-bold text-red-600">{dashboardStats.losers}</div>
        </div>
        <div className="text-center">
          <div className="text-sm opacity-75">Avg Change</div>
          <div className={`text-xl font-bold ${
            dashboardStats.avgChange >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatPercent(dashboardStats.avgChange)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search symbols..."
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
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className={`px-4 py-2 rounded-lg border ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300'
            }`}
          >
            <option value="all">All Stocks</option>
            <option value="gainers">Gainers</option>
            <option value="losers">Losers</option>
          </select>
          
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => {
              const [sort, direction] = e.target.value.split('-');
              setSortBy(sort as any);
              setSortDirection(direction as any);
            }}
            className={`px-4 py-2 rounded-lg border ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300'
            }`}
          >
            <option value="symbol-asc">Symbol A-Z</option>
            <option value="symbol-desc">Symbol Z-A</option>
            <option value="price-desc">Price High-Low</option>
            <option value="price-asc">Price Low-High</option>
            <option value="change-desc">Change High-Low</option>
            <option value="change-asc">Change Low-High</option>
            <option value="volume-desc">Volume High-Low</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isInitialLoading && <LoadingSkeleton count={6} theme={theme} />}

      {/* Error State */}
      {error && !isInitialLoading && (
        <div className={`p-6 rounded-lg text-center ${
          theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
        }`}>
          <div className="text-red-600 font-medium mb-2">Connection Error</div>
          <div className="text-sm opacity-75 mb-4">{error?.message || 'Unknown error'}</div>
          <button
            onClick={reconnect}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Stocks Grid */}
      {!isInitialLoading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedStocks.map((stock) => (
              <StockPriceCard
                key={stock.symbol}
                stock={stock}
                isFavorite={stock.isFavorite || false}
                onToggleFavorite={toggleFavorite}
                onClick={() => handleStockClick(stock.symbol)}
                formatCurrency={formatCurrency}
                formatPercent={formatPercent}
                formatLargeNumber={formatLargeNumber}
                theme={theme}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredAndSortedStocks.length === 0 && (
            <div className={`text-center py-12 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className={`text-lg font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                No stocks found
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {searchQuery ? 'Try a different search term' : 'Waiting for live data...'}
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
            Showing {filteredAndSortedStocks.length} of {Object.keys(stocks).length} stocks
            {isPaused && ' (Updates paused)'}
          </div>
          <div>
            Data updates: Demo mode
          </div>
        </div>
      </div>
    </div>
  );
};