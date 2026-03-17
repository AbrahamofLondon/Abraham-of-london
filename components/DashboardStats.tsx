// components/DashboardStats.tsx

import * as React from "react";
import type { DashboardStats as CanonicalDashboardStats } from "@/types/pdf-dashboard";

type LegacyDashboardStats = {
  total: number;
  available: number;
  missing: number;
  generated?: number;
  errors?: number;
  generating?: number;
};

type DashboardStatsInput = CanonicalDashboardStats | LegacyDashboardStats;

export interface DashboardStatsProps {
  stats: DashboardStatsInput;
  selectedCount?: number;
  className?: string;
}

type NormalizedStats = {
  total: number;
  available: number;
  missing: number;
  generated: number;
  errors: number;
  generating: number;
  categoriesCount: number;
  lastUpdated: string;
};

function isCanonicalStats(stats: DashboardStatsInput): stats is CanonicalDashboardStats {
  return "totalPDFs" in stats;
}

function normalizeStats(stats: DashboardStatsInput): NormalizedStats {
  if (isCanonicalStats(stats)) {
    return {
      total: Number(stats.totalPDFs || 0),
      available: Number(stats.availablePDFs || 0),
      missing: Number(stats.missingPDFs || 0),
      generated: Number(stats.generated || 0),
      errors: Number(stats.errors || 0),
      generating: Number(stats.generating || 0),
      categoriesCount: Array.isArray(stats.categories) ? stats.categories.length : 0,
      lastUpdated: String(stats.lastUpdated || ""),
    };
  }

  return {
    total: Number(stats.total || 0),
    available: Number(stats.available || 0),
    missing: Number(stats.missing || 0),
    generated: Number(stats.generated || 0),
    errors: Number(stats.errors || 0),
    generating: Number(stats.generating || 0),
    categoriesCount: 0,
    lastUpdated: "",
  };
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "good" | "warn" | "danger";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-300"
      : tone === "warn"
      ? "text-amber-300"
      : tone === "danger"
      ? "text-red-300"
      : "text-white";

  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </p>
      <p className={`text-2xl font-semibold tracking-tight ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

export default function DashboardStats({
  stats,
  selectedCount = 0,
  className = "",
}: DashboardStatsProps) {
  const normalized = normalizeStats(stats);

  const lastUpdatedLabel = normalized.lastUpdated
    ? new Date(normalized.lastUpdated).toLocaleString()
    : "—";

  return (
    <div className={className}>
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
          Registry Metrics
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total" value={normalized.total} />
        <StatCard label="Available" value={normalized.available} tone="good" />
        <StatCard label="Missing" value={normalized.missing} tone="warn" />
        <StatCard label="Selected" value={selectedCount} />
        <StatCard label="Generated" value={normalized.generated} tone="good" />
        <StatCard label="Errors" value={normalized.errors} tone="danger" />
        <StatCard label="Generating" value={normalized.generating} tone="warn" />
        <StatCard label="Categories" value={normalized.categoriesCount} />
      </div>

      <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
          Last Updated
        </p>
        <p className="text-sm text-zinc-300">{lastUpdatedLabel}</p>
      </div>
    </div>
  );
}