// components/dashboard/StockPriceCard.tsx
import React from "react";
import type { StockPrice } from "./types";

interface StockPriceCardProps {
  stock: StockPrice;
  theme?: "light" | "dark";
  onClick?: (symbol: string) => void;
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(value);
}

function safeTime(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString();
}

export const StockPriceCard: React.FC<StockPriceCardProps> = ({
  stock,
  theme = "light",
  onClick,
}) => {
  const isDark = theme === "dark";

  // ✅ These may not exist depending on your StockPrice model.
  // We defensively read them as unknown and narrow safely.
  const changePercent =
    typeof (stock as any).changePercent === "number" ? (stock as any).changePercent : 0;

  const change =
    typeof (stock as any).change === "number" ? (stock as any).change : 0;

  const lastUpdated = safeTime((stock as any).lastUpdated);

  // name is NOT in StockPrice, so treat as unknown
  const name =
    typeof (stock as any).name === "string" && (stock as any).name.trim()
      ? (stock as any).name
      : "—";

  const cardCls = isDark
    ? "bg-gray-900 border-gray-800 text-white"
    : "bg-white border-gray-200 text-gray-900";

  const mutedCls = isDark ? "text-gray-400" : "text-gray-600";

  const priceColor =
    changePercent >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div
      className={`p-4 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${cardCls}`}
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(stock.symbol)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(stock.symbol);
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{stock.symbol}</div>
          <div className={`text-xs ${mutedCls} truncate`}>{name}</div>
        </div>

        <div className="text-right shrink-0">
          <div className={`text-xl font-bold ${priceColor}`}>
            {formatCurrency(stock.price)}
          </div>
          <div className={`text-xs ${mutedCls}`}>
            {changePercent >= 0 ? "+" : ""}
            {formatNumber(changePercent)}%
          </div>
        </div>
      </div>

      <div className={`mt-4 grid grid-cols-3 gap-3 text-xs ${mutedCls}`}>
        <div>
          <div className="opacity-70">Change</div>
          <div className="font-semibold">
            {change >= 0 ? "+" : ""}
            {formatNumber(change)}
          </div>
        </div>

        <div>
          <div className="opacity-70">Volume</div>
          <div className="font-semibold">
            {"volume" in (stock as any) && typeof (stock as any).volume === "number"
              ? formatNumber((stock as any).volume)
              : "—"}
          </div>
        </div>

        <div className="text-right">
          <div className="opacity-70">Updated</div>
          <div className="font-semibold">{lastUpdated}</div>
        </div>
      </div>
    </div>
  );
};