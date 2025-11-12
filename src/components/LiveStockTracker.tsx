/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-anonymous-default-export */

"use client";

import React, { useState, useEffect } from "react";
import { WebSocketService } from '...';

interface StockData {
  symbol: string;
  price: number;
  changeAmount: number;
  changePercent: number;
  timestamp: string;
  volume?: number;
  previousClose?: number;
  high?: number;
  low?: number;
  open?: number;
  source?: string;
}

interface LiveStockTrackerProps {
  initialStocks: (StockData | null)[];
}

export default function LiveStockTracker({
  initialStocks,
}: LiveStockTrackerProps) {
  const [stocks, setStocks] = useState<StockData[]>(
    initialStocks.filter((stock): stock is StockData => stock !== null),
  );
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedStock, setSelectedStock] = useState<string>(
    initialStocks[0]?.symbol || "",
  );
  const [connectionStatus, setConnectionStatus] = useState<{
    [symbol: string]: boolean;
  }>({});

  useEffect(() => {
    const wsServices: { ws: WebSocketService; unsubscribe: () => void }[] = [];

    stocks.forEach((stock) => {
      // Create WebSocket service for each stock
      const ws = new WebSocketService(`/api/stocks/${stock.symbol}`, {
        debug: process.env.NODE_ENV === "development",
        autoConnect: true,
      });

      // ✅ FIXED: Use the correct onMessage method
      const unsubscribeMessage = ws.onMessage((message: unknown) => {
        if (message.data && message.type === "price_update") {
          setStocks((prev) =>
            prev.map((s) =>
              s.symbol === stock.symbol ? { ...s, ...message.data } : s,
            ),
          );
          setLastUpdate(new Date());
        }
      });

      // ✅ FIXED: Listen for connection events
      const unsubscribeConnected = ws.on("connected", (status) => {
        setIsConnected(true);
        setConnectionStatus((prev) => ({ ...prev, [stock.symbol]: true }));
      });

      const unsubscribeDisconnected = ws.on("disconnected", (status) => {
        setConnectionStatus((prev) => ({ ...prev, [stock.symbol]: false }));
        // If all connections are disconnected, update global status
        const allDisconnected = stocks.every(
          (s) => connectionStatus[s.symbol] === false,
        );
        if (allDisconnected) {
          setIsConnected(false);
        }
      });

      const unsubscribeError = ws.on("error", (error) => {
        console.error(`WebSocket error for ${stock.symbol}:`, error);
      });

      wsServices.push({
        ws,
        unsubscribe: () => {
          unsubscribeMessage();
          unsubscribeConnected();
          unsubscribeDisconnected();
          unsubscribeError();
        },
      });
    });

    return () => {
      wsServices.forEach(({ ws, unsubscribe }) => {
        unsubscribe();
        ws.disconnect();
      });
      setIsConnected(false);
      setConnectionStatus({});
    };
  }, [stocks.map((s) => s.symbol).join(",")]); // Re-run when stocks change

  const addStock = async (symbol: string) => {
    const trimmedSymbol = symbol.trim().toUpperCase();
    if (!trimmedSymbol) return;

    // Check if stock already exists
    if (stocks.some((stock) => stock.symbol === trimmedSymbol)) {
      alert(`${trimmedSymbol} is already being tracked.`);
      return;
    }

    try {
      const response = await fetch(`/api/stocks/${trimmedSymbol}`);
      if (response.ok) {
        const newStock = await response.json();
        setStocks((prev) => [...prev, newStock]);
        setSelectedStock(trimmedSymbol);
      } else {
        console.error("Failed to fetch stock:", response.status);
        alert(
          `Failed to add stock: ${trimmedSymbol}. Please check the symbol.`,
        );
      }
    } catch (error) {
      console.error("Failed to add stock:", error);
      alert(`Error adding stock: ${trimmedSymbol}. Please try again.`);
    }
  };

  const removeStock = (symbol: string) => {
    setStocks((prev) => prev.filter((stock) => stock.symbol !== symbol));
    if (selectedStock === symbol) {
      setSelectedStock(stocks[0]?.symbol || "");
    }
  };

  const totalChange = stocks.reduce(
    (sum, stock) => sum + stock.changePercent,
    0,
  );
  const avgChange = stocks.length > 0 ? totalChange / stocks.length : 0;

  // Calculate connection status for display
  const connectedStocks =
    Object.values(connectionStatus).filter(Boolean).length;
  const totalStocks = stocks.length;
  const connectionText =
    totalStocks > 0
      ? `${connectedStocks}/${totalStocks} connected`
      : "No stocks";

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Live Stock Tracker
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <div
              className={`flex items-center gap-1 ${
                isConnected && connectedStocks > 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected && connectedStocks > 0
                    ? "bg-green-500"
                    : "bg-red-500"
                } animate-pulse`}
              />
              {isConnected && connectedStocks > 0 ? "Live" : "Connecting..."}
            </div>
            <span className="text-sm text-gray-500">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
            <span className="text-sm text-gray-500">{connectionText}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {stocks.length > 0 && (
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                avgChange >= 0
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              Avg: {(avgChange * 100).toFixed(2)}%
            </div>
          )}
          <AddStockForm onAdd={addStock} />
        </div>
      </div>

      {/* Stocks Grid */}
      {stocks.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {stocks.map((stock) => (
              <StockCard
                key={stock.symbol}
                stock={stock}
                onRemove={removeStock}
                isSelected={selectedStock === stock.symbol}
                onSelect={() => setSelectedStock(stock.symbol)}
                isConnected={connectionStatus[stock.symbol] ?? false}
              />
            ))}
          </div>

          {/* Selected Stock Details */}
          {selectedStock && (
            <StockDetails
              stock={stocks.find((s) => s.symbol === selectedStock)}
              symbol={selectedStock}
            />
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">No stocks being tracked</p>
          <p className="text-sm">Add a stock symbol above to get started</p>
        </div>
      )}
    </div>
  );
}

function StockCard({
  stock,
  onRemove,
  isSelected,
  onSelect,
  isConnected,
}: {
  stock: StockData;
  onRemove: (symbol: string) => void;
  isSelected: boolean;
  onSelect: () => void;
  isConnected: boolean;
}) {
  const isPositive = stock.changePercent >= 0;

  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      } ${!isConnected ? "opacity-70" : ""}`}
      onClick={onSelect}
    >
      {/* Connection indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-xs text-gray-500">
          {isConnected ? "Live" : "Offline"}
        </span>
      </div>

      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{stock.symbol}</h3>
          <p className="text-sm text-gray-500">NASDAQ</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Remove ${stock.symbol} from tracker?`)) {
              onRemove(stock.symbol);
            }
          }}
          className="text-gray-400 hover:text-red-500 transition-colors text-lg font-bold"
          title={`Remove ${stock.symbol}`}
        >
          ×
        </button>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            ${stock.price.toFixed(2)}
          </p>
          <p
            className={`text-sm font-medium ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? "+" : ""}
            {stock.changeAmount.toFixed(2)} ({isPositive ? "+" : ""}
            {(stock.changePercent * 100).toFixed(2)}%)
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>Vol: {stock.volume?.toLocaleString() || "N/A"}</div>
          <div>Prev: ${stock.previousClose?.toFixed(2) || "N/A"}</div>
        </div>
      </div>
    </div>
  );
}

function AddStockForm({ onAdd }: { onAdd: (symbol: string) => void }) {
  const [symbol, setSymbol] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSymbol = symbol.trim();
    if (!trimmedSymbol) return;

    setIsLoading(true);
    try {
      await onAdd(trimmedSymbol);
      setSymbol("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        placeholder="Add symbol (e.g., TSLA)"
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
        maxLength={5}
        pattern="[A-Za-z]{1,5}"
        title="Stock symbol (1-5 letters)"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !symbol.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? "..." : "Add"}
      </button>
    </form>
  );
}

function StockDetails({
  stock,
  symbol,
}: {
  stock?: StockData;
  symbol: string;
}) {
  if (!stock) {
    return (
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {symbol} - Details
        </h3>
        <p className="text-gray-500">No data available for {symbol}</p>
      </div>
    );
  }

  const isPositive = stock.changePercent >= 0;

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {symbol} - Detailed View
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <DetailItem
          label="Current Price"
          value={`$${stock.price.toFixed(2)}`}
        />
        <DetailItem
          label="Change"
          value={
            <span className={isPositive ? "text-green-600" : "text-red-600"}>
              {isPositive ? "+" : ""}
              {stock.changeAmount.toFixed(2)}
            </span>
          }
        />
        <DetailItem
          label="Change %"
          value={
            <span className={isPositive ? "text-green-600" : "text-red-600"}>
              {isPositive ? "+" : ""}
              {(stock.changePercent * 100).toFixed(2)}%
            </span>
          }
        />
        <DetailItem
          label="Previous Close"
          value={`$${stock.previousClose?.toFixed(2) || "N/A"}`}
        />
        <DetailItem
          label="Open"
          value={`$${stock.open?.toFixed(2) || "N/A"}`}
        />
        <DetailItem
          label="High"
          value={`$${stock.high?.toFixed(2) || "N/A"}`}
        />
        <DetailItem label="Low" value={`$${stock.low?.toFixed(2) || "N/A"}`} />
        <DetailItem
          label="Volume"
          value={stock.volume?.toLocaleString() || "N/A"}
        />
        <DetailItem
          label="Last Updated"
          value={new Date(stock.timestamp).toLocaleTimeString()}
        />
        <DetailItem label="Data Source" value={stock.source || "Simulated"} />
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div>
      <p className="text-gray-500 text-xs uppercase tracking-wide">{label}</p>
      <p className="font-mono text-gray-900 text-sm mt-1">{value}</p>
    </div>
  );
}
