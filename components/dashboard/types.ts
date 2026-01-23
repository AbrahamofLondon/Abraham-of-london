// components/dashboard/types.ts

export type ConnectionState = "connecting" | "open" | "closed" | "error";

export interface StockPrice {
  symbol: string;
  price: number;
  currency?: string;
  change?: number;
  changePercent?: number;
  asOf: string; // ISO
  source?: string;
}

export interface StockDataUpdate {
  type: "tick" | "snapshot" | "status";
  symbol?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  currency?: string;
  asOf?: string;
  source?: string;
  state?: ConnectionState;
  message?: string;
}

export interface LiveDataDashboardProps {
  /** Symbols to show, e.g. ["AAPL","MSFT"]. */
  symbols?: string[];
  /** Optional WebSocket URL; if omitted, component uses fetch polling. */
  wsUrl?: string;
  /** REST endpoint used for polling when wsUrl is not provided. */
  snapshotEndpoint?: string;
  /** Polling interval in ms. Default 10s. */
  pollIntervalMs?: number;
}

export interface PDFDownloadSummaryRow {
  slug: string;
  title?: string;
  tier?: string;
  downloads: number;
  uniqueUsers?: number;
  lastDownloadedAt?: string; // ISO
}

export interface PDFSummaryResponse {
  success: boolean;
  rows: PDFDownloadSummaryRow[];
  generatedAt: string; // ISO
  error?: string;
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function safeNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export function toIsoNow(): string {
  return new Date().toISOString();
}