"use client";

// components/research/FoundryModuleGrid.tsx
// Filterable, searchable grid of Intelligence Foundry hub modules.
// Receives module + registry data as props so the parent stays a server component.

import * as React from "react";
import Link from "next/link";
import { ModuleStatusBadge } from "@/components/research/ModuleStatusBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HubModule = {
  id: string;
  label: string;
  href: string;
  desc: string;
  category: string;
};

export type ModuleStatus = "WIRED" | "PARTIAL" | "DEMO" | "PLANNED";

export type HubModuleWithStatus = HubModule & {
  status: ModuleStatus;
};

// ─── Category colours ─────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { dot: string; label: string }> = {
  Simulation:   { dot: "bg-purple-400/60",  label: "Simulation"   },
  "Red Team":   { dot: "bg-red-400/60",     label: "Red Team"     },
  Benchmarking: { dot: "bg-amber-400/60",   label: "Benchmarking" },
  Governance:   { dot: "bg-violet-400/60",  label: "Governance"   },
  Production:   { dot: "bg-emerald-400/60", label: "Production"   },
  Lab:          { dot: "bg-sky-400/60",     label: "Lab"          },
};

const ALL_CATEGORIES = ["All", ...Object.keys(CATEGORY_STYLES)] as const;
const ALL_STATUSES: Array<ModuleStatus | "ALL"> = ["ALL", "WIRED", "PARTIAL", "DEMO", "PLANNED"];

// ─── Component ────────────────────────────────────────────────────────────────

export function FoundryModuleGrid({ modules }: { modules: HubModuleWithStatus[] }) {
  const [query,          setQuery]          = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string>("All");
  const [activeStatus,   setActiveStatus]   = React.useState<ModuleStatus | "ALL">("ALL");
  const [showBlockers,   setShowBlockers]   = React.useState(false);

  // Derive unique categories present in the list
  const presentCategories = React.useMemo(
    () => ["All", ...Array.from(new Set(modules.map((m) => m.category))).sort()],
    [modules],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return modules.filter((m) => {
      if (q && !m.label.toLowerCase().includes(q) && !m.desc.toLowerCase().includes(q)) {
        return false;
      }
      if (activeCategory !== "All" && m.category !== activeCategory) return false;
      if (activeStatus !== "ALL" && m.status !== activeStatus) return false;
      // "Release blockers only" — surface DEMO + PLANNED when gate is blocked
      if (showBlockers && (m.status === "WIRED" || m.status === "PARTIAL")) return false;
      return true;
    });
  }, [modules, query, activeCategory, activeStatus, showBlockers]);

  const wiredCount   = modules.filter((m) => m.status === "WIRED").length;
  const partialCount = modules.filter((m) => m.status === "PARTIAL").length;
  const demoCount    = modules.filter((m) => m.status === "DEMO").length;
  const plannedCount = modules.filter((m) => m.status === "PLANNED").length;

  return (
    <div className="space-y-4">
      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Search */}
        <input
          type="search"
          placeholder="Search modules…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded border border-white/12 bg-[#0a0a0a] px-3 py-2 text-xs text-white/65 placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors"
        />

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {presentCategories.map((cat) => {
            const style = CATEGORY_STYLES[cat];
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono transition-colors ${
                  active
                    ? "border-white/25 bg-white/8 text-white/70"
                    : "border-white/8 bg-white/2 text-white/30 hover:border-white/15 hover:text-white/50"
                }`}
              >
                {style && (
                  <span className={`h-1.5 w-1.5 rounded-full ${style.dot} ${active ? "opacity-100" : "opacity-50"}`} />
                )}
                {cat}
              </button>
            );
          })}
        </div>

        {/* Status + release-blocker toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded border border-white/8 bg-white/2 p-0.5">
            {ALL_STATUSES.map((st) => {
              const active = activeStatus === st;
              const count =
                st === "ALL"     ? modules.length :
                st === "WIRED"   ? wiredCount :
                st === "PARTIAL" ? partialCount :
                st === "DEMO"    ? demoCount :
                                   plannedCount;
              return (
                <button
                  key={st}
                  onClick={() => setActiveStatus(st)}
                  className={`rounded px-2 py-0.5 text-[10px] font-mono transition-colors ${
                    active
                      ? "bg-white/10 text-white/70"
                      : "text-white/25 hover:text-white/45"
                  }`}
                >
                  {st === "ALL" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()} {count > 0 ? `(${count})` : ""}
                </button>
              );
            })}
          </div>

          {/* Release-blockers toggle */}
          <button
            onClick={() => setShowBlockers((v) => !v)}
            className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-[10px] font-mono transition-colors ${
              showBlockers
                ? "border-amber-500/30 bg-amber-500/8 text-amber-400/80"
                : "border-white/8 bg-white/2 text-white/30 hover:border-white/15 hover:text-white/50"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${showBlockers ? "bg-amber-400" : "bg-white/20"}`} />
            Incomplete only
          </button>
        </div>
      </div>

      {/* ── Result count ────────────────────────────────────────────────── */}
      <p className="text-[10px] font-mono text-white/20">
        {filtered.length} of {modules.length} module{modules.length !== 1 ? "s" : ""}
        {query && ` matching "${query}"`}
      </p>

      {/* ── Module grid ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/6 bg-white/[0.01] p-8 text-center">
          <p className="text-xs text-white/25">No modules match the current filters.</p>
          <button
            onClick={() => { setQuery(""); setActiveCategory("All"); setActiveStatus("ALL"); setShowBlockers(false); }}
            className="mt-3 text-[10px] font-mono text-white/30 hover:text-white/50 transition-colors underline underline-offset-2"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((mod) => {
            const categoryStyle = CATEGORY_STYLES[mod.category];
            return (
              <Link
                key={mod.id}
                href={mod.href}
                className="group rounded-xl border border-white/8 bg-white/2 p-4 transition-all hover:border-white/15 hover:bg-white/4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-medium text-white/70 group-hover:text-white/85 transition-colors">
                      {mod.label}
                    </h2>
                    {categoryStyle && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`h-1 w-1 rounded-full ${categoryStyle.dot}`} />
                        <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                          {categoryStyle.label}
                        </span>
                      </div>
                    )}
                  </div>
                  <ModuleStatusBadge status={mod.status} />
                </div>
                <p className="text-xs text-white/35">{mod.desc}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
