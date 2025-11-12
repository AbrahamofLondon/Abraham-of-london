/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Server payload contract */
type WsEventType = "connected" | "disconnected" | "error" | "message" | "price_update";

interface WsEnvelope<T = unknown> {
  type: WsEventType;
  data?: T;
}

/** Core stock type used across the UI */
export interface StockData {
  symbol: string;
  price: number;
  changeAmount: number;   // absolute change
  changePercent: number;  // 0.0123 means +1.23%
  timestamp: string;      // ISO string
  volume?: number;
  previousClose?: number;
  high?: number;
  low?: number;
  open?: number;
  source?: string;
}

/** Props */
export interface LiveStockTrackerProps {
  /** Provide seed items; nulls are ignored */
  initialStocks: (StockData | null)[];
}

/** Helper: safe number formatting */
function fmt(n: number | undefined, dp = 2): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "N/A";
  return n.toFixed(dp);
}

/** Build a ws:// or wss:// URL for a given relative API path */
function makeWsUrl(relativePath: string): string {
  // relativePath expected like `/api/stocks/TSLA`
  const loc = window.location;
  const protocol = loc.protocol === "https:" ? "wss:" : "ws:";
  const host = loc.host;
  // Normalise: strip any leading slashes duplication
  const clean = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${protocol}//${host}${clean}`;
}

/** WebSocket manager per-symbol, encapsulated to avoid external deps */
class SymbolSocket {
  private ws: WebSocket | null = null;
  private alive = false;
  private url: string;
  private onMessageCb: ((msg: WsEnvelope) => void) | null = null;
  private onStatusCb: ((type: "connected" | "disconnected" | "error") => void) | null = null;

  constructor(symbol: string) {
    this.url = makeWsUrl(`/api/stocks/${encodeURIComponent(symbol)}`);
  }

  connect() {
    if (this.alive) return;
    this.ws = new WebSocket(this.url);

    this.ws.addEventListener("open", () => {
      this.alive = true;
      this.emitStatus("connected");
    });

    this.ws.addEventListener("close", () => {
      this.alive = false;
      this.emitStatus("disconnected");
    });

    this.ws.addEventListener("error", () => {
      this.emitStatus("error");
    });

    this.ws.addEventListener("message", (ev: MessageEvent) => {
      let parsed: WsEnvelope | null = null;
      try {
        parsed = JSON.parse(String(ev.data)) as WsEnvelope;
      } catch {
        // non-JSON message – surface as generic message
        parsed = { type: "message", data: { raw: ev.data } };
      }
      this.onMessageCb?.(parsed);
    });
  }

  onMessage(cb: (msg: WsEnvelope) => void) {
    this.onMessageCb = cb;
    return () => {
      if (this.onMessageCb === cb) this.onMessageCb = null;
    };
  }

  onStatus(cb: (type: "connected" | "disconnected" | "error") => void) {
    this.onStatusCb = cb;
    return () => {
      if (this.onStatusCb === cb) this.onStatusCb = null;
    };
  }

  private emitStatus(type: "connected" | "disconnected" | "error") {
    this.onStatusCb?.(type);
  }

  disconnect() {
    try {
      this.ws?.close();
    } catch {
      /* no-op */
    } finally {
      this.ws = null;
      this.alive = false;
    }
  }
}

/** Main component */
export default function LiveStockTracker({ initialStocks }: LiveStockTrackerProps) {
  // Seed state: filter out nulls and dedupe by symbol
  const seeded = useMemo(() => {
    const map = new Map<string, StockData>();
    for (const s of initialStocks) {
      if (s && s.symbol) map.set(s.symbol.toUpperCase(), s);
    }
    return Array.from(map.values());
  }, [initialStocks]);

  const [stocks, setStocks] = useState<StockData[]>(seeded);
  const [selected, setSelected] = useState<string>(seeded[0]?.symbol ?? "");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [connection, setConnection] = useState<Record<string, boolean>>({}); // symbol -> connected?

  // WebSocket managers per symbol (lives across renders)
  const socketsRef = useRef<Map<string, SymbolSocket>>(new Map());

  /** Ensure a socket exists and is connected for a symbol */
  const ensureSocket = useCallback(
    (symbol: string) => {
      const sym = symbol.toUpperCase();
      let sock = socketsRef.current.get(sym);
      if (!sock) {
        sock = new SymbolSocket(sym);
        socketsRef.current.set(sym, sock);

        // Status subscription
        sock.onStatus((st) => {
          setConnection((prev) => ({ ...prev, [sym]: st === "connected" }));
        });

        // Message subscription
        sock.onMessage((msg) => {
          if (msg.type === "price_update" && msg.data && typeof (msg.data as any).symbol === "string") {
            const patch = msg.data as Partial<StockData> & { symbol: string };
            setStocks((prev) =>
              prev.map((s) => (s.symbol.toUpperCase() === patch.symbol.toUpperCase() ? { ...s, ...patch } : s)),
            );
            setLastUpdate(new Date());
          }
        });

        sock.connect();
      }
      return sock;
    },
    [],
  );

  /** Connect sockets for current list and tear down removed ones */
  useEffect(() => {
    const symbols = new Set(stocks.map((s) => s.symbol.toUpperCase()));
    // Start/ensure current
    for (const sym of symbols) ensureSocket(sym);

    // Disconnect sockets for removed symbols
    for (const [sym, sock] of socketsRef.current.entries()) {
      if (!symbols.has(sym)) {
        sock.disconnect();
        socketsRef.current.delete(sym);
        setConnection((prev) => {
          const { [sym]: _drop, ...rest } = prev;
          return rest;
        });
      }
    }

    return () => {
      // Component unmount: full cleanup
      for (const [, sock] of socketsRef.current.entries()) sock.disconnect();
      socketsRef.current.clear();
    };
  }, [stocks, ensureSocket]);

  /** Add a new stock symbol (fetch initial, then attach ws) */
  const addStock = useCallback(async (rawSymbol: string) => {
    const symbol = rawSymbol.trim().toUpperCase();
    if (!symbol) return;

    // Dedup
    if (stocks.some((s) => s.symbol.toUpperCase() === symbol)) return;

    try {
      const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const payload = (await res.json()) as Partial<StockData>;
      const base: StockData = {
        symbol,
        price: Number(payload.price) || 0,
        changeAmount: Number(payload.changeAmount) || 0,
        changePercent: Number(payload.changePercent) || 0,
        timestamp: typeof payload.timestamp === "string" ? payload.timestamp : new Date().toISOString(),
        volume: typeof payload.volume === "number" ? payload.volume : undefined,
        previousClose: typeof payload.previousClose === "number" ? payload.previousClose : undefined,
        high: typeof payload.high === "number" ? payload.high : undefined,
        low: typeof payload.low === "number" ? payload.low : undefined,
        open: typeof payload.open === "number" ? payload.open : undefined,
        source: typeof payload.source === "string" ? payload.source : "API",
      };
      setStocks((prev) => [...prev, base]);
      setSelected(symbol);
      // socket will be created by effect
    } catch (err) {
      // Keep silent in prod UI; log for debug
      // eslint-disable-next-line no-console
      console.error("Add stock failed:", err);
    }
  }, [stocks]);

  /** Remove a stock and close its socket */
  const removeStock = useCallback((symbol: string) => {
    const sym = symbol.toUpperCase();
    setStocks((prev) => prev.filter((s) => s.symbol.toUpperCase() !== sym));
    if (selected.toUpperCase() === sym) {
      const next = stocks.find((s) => s.symbol.toUpperCase() !== sym)?.symbol ?? "";
      setSelected(next);
    }
    const sock = socketsRef.current.get(sym);
    if (sock) {
      sock.disconnect();
      socketsRef.current.delete(sym);
    }
    setConnection((prev) => {
      const { [sym]: _drop, ...rest } = prev;
      return rest;
    });
  }, [selected, stocks]);

  const totalChange = useMemo(
    () => stocks.reduce((sum, s) => sum + (typeof s.changePercent === "number" ? s.changePercent : 0), 0),
    [stocks],
  );
  const avgChange = useMemo(() => (stocks.length ? totalChange / stocks.length : 0), [stocks, totalChange]);

  const connectedCount = useMemo(
    () => Object.values(connection).filter(Boolean).length,
    [connection],
  );

  const isAnyConnected = connectedCount > 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-black/30">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live Stock Tracker</h2>
          <div className="mt-2 flex items-center gap-3">
            <div className={`flex items-center gap-1 ${isAnyConnected ? "text-green-600" : "text-red-600"}`}>
              <span
                className={`h-2 w-2 rounded-full ${isAnyConnected ? "bg-green-500" : "bg-red-500"} animate-pulse`}
              />
              {isAnyConnected ? "Live" : "Connecting..."}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {connectedCount}/{stocks.length} connected
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {stocks.length > 0 && (
            <div
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                avgChange >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
              title="Average % change across tracked symbols"
            >
              Avg: {(avgChange * 100).toFixed(2)}%
            </div>
          )}
          <AddStockForm onAdd={addStock} />
        </div>
      </div>

      {/* Grid */}
      {stocks.length > 0 ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stocks.map((s) => {
              const sym = s.symbol.toUpperCase();
              const isConnected = !!connection[sym];
              return (
                <StockCard
                  key={sym}
                  stock={s}
                  isSelected={selected.toUpperCase() === sym}
                  isConnected={isConnected}
                  onSelect={() => setSelected(sym)}
                  onRemove={() => removeStock(sym)}
                />
              );
            })}
          </div>

          {selected && (
            <StockDetails
              symbol={selected}
              stock={stocks.find((s) => s.symbol.toUpperCase() === selected.toUpperCase())}
            />
          )}
        </>
      ) : (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          <p className="mb-2 text-lg">No stocks being tracked</p>
          <p className="text-sm">Add a stock symbol above to get started</p>
        </div>
      )}
    </div>
  );
}

/* ========================= Subcomponents ========================= */

function AddStockForm({ onAdd }: { onAdd: (symbol: string) => Promise<void> | void }) {
  const [symbol, setSymbol] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const cleaned = symbol.trim().toUpperCase();
      if (!cleaned) return;
      setBusy(true);
      try {
        await onAdd(cleaned);
        setSymbol("");
      } finally {
        setBusy(false);
      }
    },
    [onAdd, symbol],
  );

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        placeholder="Add symbol (e.g., TSLA)"
        className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        maxLength={8}
        pattern="[A-Za-z\.]{1,8}"
        title="Stock symbol (1–8 letters, dot allowed)"
        disabled={busy}
        inputMode="latin"
        autoCapitalize="characters"
      />
      <button
        type="submit"
        disabled={busy || !symbol.trim()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {busy ? "…" : "Add"}
      </button>
    </form>
  );
}

function StockCard({
  stock,
  isSelected,
  isConnected,
  onSelect,
  onRemove,
}: {
  stock: StockData;
  isSelected: boolean;
  isConnected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const isPositive = stock.changePercent >= 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative cursor-pointer rounded-xl border-2 p-4 text-left transition-all ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      } ${!isConnected ? "opacity-70" : ""}`}
    >
      {/* Connection indicator */}
      <div className="absolute right-2 top-2 flex items-center gap-1">
        <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
        <span className="text-xs text-gray-500">{isConnected ? "Live" : "Offline"}</span>
      </div>

      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{stock.symbol.toUpperCase()}</h3>
          <p className="text-xs text-gray-500">NASDAQ</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-lg font-bold text-gray-400 transition-colors hover:text-red-500"
          title={`Remove ${stock.symbol}`}
          aria-label={`Remove ${stock.symbol}`}
        >
          ×
        </button>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${fmt(stock.price)}</p>
          <p className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? "+" : ""}
            {fmt(stock.changeAmount)} ({isPositive ? "+" : ""}
            {(stock.changePercent * 100).toFixed(2)}%)
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>Vol: {typeof stock.volume === "number" ? stock.volume.toLocaleString() : "N/A"}</div>
          <div>Prev: ${fmt(stock.previousClose)}</div>
        </div>
      </div>
    </button>
  );
}

function StockDetails({ stock, symbol }: { stock?: StockData; symbol: string }) {
  if (!stock) {
    return (
      <div className="border-t pt-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{symbol} — Details</h3>
        <p className="text-gray-500 dark:text-gray-400">No data available for {symbol.toUpperCase()}</p>
      </div>
    );
  }

  const isPositive = stock.changePercent >= 0;

  return (
    <div className="border-t pt-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{symbol.toUpperCase()} — Details</h3>
      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <Detail label="Current Price" value={`$${fmt(stock.price)}`} />
        <Detail
          label="Change"
          value={
            <span className={isPositive ? "text-green-600" : "text-red-600"}>
              {isPositive ? "+" : ""}
              {fmt(stock.changeAmount)}
            </span>
          }
        />
        <Detail
          label="Change %"
          value={
            <span className={isPositive ? "text-green-600" : "text-red-600"}>
              {isPositive ? "+" : ""}
              {(stock.changePercent * 100).toFixed(2)}%
            </span>
          }
        />
        <Detail label="Previous Close" value={`$${fmt(stock.previousClose)}`} />
        <Detail label="Open" value={`$${fmt(stock.open)}`} />
        <Detail label="High" value={`$${fmt(stock.high)}`} />
        <Detail label="Low" value={`$${fmt(stock.low)}`} />
        <Detail label="Volume" value={typeof stock.volume === "number" ? stock.volume.toLocaleString() : "N/A"} />
        <Detail label="Last Updated" value={new Date(stock.timestamp).toLocaleTimeString()} />
        <Detail label="Data Source" value={stock.source ?? "Simulated"} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}