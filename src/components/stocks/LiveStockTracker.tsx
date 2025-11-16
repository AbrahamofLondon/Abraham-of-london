// components/stocks/LiveStockTracker.tsx
"use client";

import * as React from "react";
import { useWebSocket } from "@/hooks";

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: string;
}

interface LiveStockTrackerProps {
  symbols?: string[];
  showConnectionStatus?: boolean;
  maxStocks?: number;
  autoConnect?: boolean;
}

export default function LiveStockTracker({
  symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"],
  showConnectionStatus = true,
  maxStocks = 10,
  autoConnect = true,
}: LiveStockTrackerProps): JSX.Element {
  const [stocks, setStocks] = React.useState<Map<string, StockData>>(new Map());
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);
  const [subscribedSymbols, setSubscribedSymbols] = React.useState<Set<string>>(
    new Set(symbols),
  );

  const {
    isConnected,
    error,
    sendMessage,
    connect,
    disconnect,
  } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || "wss://websocket.example.com/stocks",
    {
      debug: process.env.NODE_ENV === "development",
      autoConnect,
      onMessage: (message) => {
        if (message.type === "price_update" && message.data) {
          const stockData = message.data as StockData;
          setStocks((prev) => {
            const updated = new Map(prev);
            updated.set(stockData.symbol, {
              ...stockData,
              lastUpdated:
                stockData.lastUpdated || new Date().toISOString(),
            });
            return updated;
          });
          setLastUpdate(new Date());
        }
      },
    },
  );

  // Subscribe to stock symbols when connected
  React.useEffect(() => {
    if (isConnected && subscribedSymbols.size > 0) {
      sendMessage({
        type: "message", // Changed from "subscribe" to "message"
        data: {
          symbols: Array.from(subscribedSymbols),
          action: "subscribe", // Keep the action in the data
        },
      });
    }
  }, [isConnected, subscribedSymbols, sendMessage]);

  // Add new stock symbol
  const addStock = React.useCallback(
    (symbol: string) => {
      const upperSymbol = symbol.toUpperCase().trim();
      if (!upperSymbol) return;

      if (subscribedSymbols.size >= maxStocks) {
        alert(`Maximum ${maxStocks} stocks allowed`);
        return;
      }

      if (subscribedSymbols.has(upperSymbol)) {
        alert(`${upperSymbol} is already being tracked`);
        return;
      }

      setSubscribedSymbols((prev) => {
        const updated = new Set(prev);
        updated.add(upperSymbol);
        return updated;
      });

      // Subscribe to the new symbol
      if (isConnected) {
        sendMessage({
          type: "message", // Changed from "subscribe" to "message"
          data: {
            symbols: [upperSymbol],
            action: "subscribe", // Keep the action in the data
          },
        });
      }
    },
    [subscribedSymbols, maxStocks, isConnected, sendMessage],
  );

  // Remove stock symbol
  const removeStock = React.useCallback(
    (symbol: string) => {
      setSubscribedSymbols((prev) => {
        const updated = new Set(prev);
        updated.delete(symbol);
        return updated;
      });

      setStocks((prev) => {
        const updated = new Map(prev);
        updated.delete(symbol);
        return updated;
      });

      // Unsubscribe from WebSocket
      if (isConnected) {
        sendMessage({
          type: "message", // Changed from "subscribe" to "message"
          data: {
            symbols: [symbol],
            action: "unsubscribe", // Keep the action in the data
          },
        });
      }
    },
    [isConnected, sendMessage],
  );

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number): string => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  // Get change color
  const getChangeColor = (change: number): string => {
    if (change > 0) return "text-green-600 bg-green-50";
    if (change < 0) return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  };

  // Sort stocks by symbol
  const sortedStocks = React.useMemo(() => {
    return Array.from(stocks.values()).sort((a, b) =>
      a.symbol.localeCompare(b.symbol),
    );
  }, [stocks]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const symbol = formData.get("symbol") as string;
    if (symbol) {
      addStock(symbol);
      e.currentTarget.reset();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Live Stock Tracker
          </h2>
          <p className="text-gray-600">
            Real-time stock prices and updates
          </p>
          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Connection Status */}
        {showConnectionStatus && (
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-3 px-4 py-2 rounded-full border ${
                isConnected
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="font-medium">
                {isConnected ? "Live Connected" : "Disconnected"}
              </span>
            </div>

            <div className="flex gap-2">
              {!isConnected ? (
                <button
                  onClick={connect}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Connect
                </button>
              ) : (
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Connection Error</span>
          </div>
          <p className="text-red-700 text-sm mt-1">
            Failed to connect to stock data service. Please try reconnecting.
          </p>
        </div>
      )}

      {/* Add Stock Form */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              name="symbol"
              type="text"
              placeholder="Enter stock symbol (e.g., AAPL, TSLA, GOOGL)"
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
              pattern="[A-Za-z]{1,5}"
              title="Enter 1-5 letter stock symbol"
              required
            />
          </div>
          <button
            type="submit"
            disabled={subscribedSymbols.size >= maxStocks}
            className="px-8 py-3 bg-blue-500 text-white text-lg font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/25"
          >
            Add Stock
          </button>
        </form>
        <div className="flex justify-between items-center mt-3">
          <p className="text-sm text-gray-600">
            {subscribedSymbols.size} of {maxStocks} stocks tracked
          </p>
          <p className="text-sm text-gray-500">
            Examples: AAPL, TSLA, MSFT, GOOGL, AMZN
          </p>
        </div>
      </div>

      {/* Stocks Grid */}
      {sortedStocks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedStocks.map((stock) => (
            <div
              key={stock.symbol}
              className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stock.symbol}
                  </h3>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">
                    {stock.symbol === "AAPL"
                      ? "Apple Inc."
                      : stock.symbol === "TSLA"
                      ? "Tesla Inc."
                      : stock.symbol === "GOOGL"
                      ? "Alphabet Inc."
                      : stock.symbol === "MSFT"
                      ? "Microsoft Corp."
                      : stock.symbol === "AMZN"
                      ? "Amazon.com Inc."
                      : "Stock"}
                  </p>
                </div>
                <button
                  onClick={() => removeStock(stock.symbol)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Remove stock"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(stock.price)}
                </div>

                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getChangeColor(
                    stock.change,
                  )}`}
                >
                  <svg
                    className={`w-4 h-4 mr-1 ${
                      stock.change >= 0 ? "rotate-0" : "rotate-180"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {formatCurrency(Math.abs(stock.change))}
                  <span className="ml-2">
                    ({formatPercent(stock.changePercent)})
                  </span>
                </div>

                {stock.volume > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2z"
                      />
                    </svg>
                    Volume: {stock.volume.toLocaleString()}
                  </div>
                )}

                <div className="flex items-center text-xs text-gray-500">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Updated:{" "}
                  {new Date(stock.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <div className="text-gray-300 text-8xl mb-6">📈</div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">
            {isConnected
              ? "No stocks being tracked"
              : "Connect to start tracking"}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            {isConnected
              ? "Add stock symbols above to start tracking live prices and market movements in real-time."
              : "Click the connect button to establish a live connection to stock market data."}
          </p>
          {!isConnected && (
            <button
              onClick={connect}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25"
            >
              Connect to Live Data
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {!isConnected && sortedStocks.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            Connecting to live market data...
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>Real-time WebSocket connection</span>
            <span className="hidden md:block">•</span>
            <span>{sortedStocks.length} stocks displayed</span>
          </div>
          <div className="mt-2 md:mt-0">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              Live updates every 1–2 seconds
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}