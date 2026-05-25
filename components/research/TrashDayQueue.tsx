"use client";

import { SeverityBadge } from "./SeverityBadge";
import { RunStatusBadge } from "./RunStatusBadge";
import type { ResearchRun } from "@/lib/research/foundry-contract";
import Link from "next/link";

type TrashDayItem = ResearchRun & { ageInDays: number; trashReason: string };

export function TrashDayQueue({
  items,
  onImplement,
  onDefer,
  onEscalate,
  onArchive,
}: {
  items: TrashDayItem[];
  onImplement?: (id: string) => void;
  onDefer?: (id: string) => void;
  onEscalate?: (id: string) => void;
  onArchive?: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/2 p-8 text-center">
        <p className="text-sm text-emerald-400/60">Trash Day is clear. No stale findings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-white/8 bg-white/2 p-4"
          data-testid={`trash-day-item-${item.id}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <SeverityBadge severity={item.severity} />
                <RunStatusBadge status={item.status} />
                <span className="text-[10px] font-mono text-white/25">{item.ageInDays}d old</span>
              </div>
              <Link
                href={`/admin/intelligence-foundry/runs/${item.id}`}
                className="text-sm font-medium text-white/70 hover:text-white/90 transition-colors"
              >
                {item.title}
              </Link>
              <p className="text-[11px] text-amber-400/60 mt-1">{item.trashReason}</p>
            </div>
            <div className="flex gap-1.5 shrink-0 flex-wrap">
              {onImplement && (
                <button onClick={() => onImplement(item.id)} className="rounded border border-emerald-500/25 px-2 py-1 text-[11px] text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                  Implement
                </button>
              )}
              {onDefer && (
                <button onClick={() => onDefer(item.id)} className="rounded border border-white/15 px-2 py-1 text-[11px] text-white/35 hover:text-white/55 transition-colors">
                  Defer
                </button>
              )}
              {onEscalate && (
                <button onClick={() => onEscalate(item.id)} className="rounded border border-orange-500/25 px-2 py-1 text-[11px] text-orange-400 hover:bg-orange-500/10 transition-colors">
                  Escalate
                </button>
              )}
              {onArchive && (
                <button onClick={() => onArchive(item.id)} className="rounded border border-white/8 px-2 py-1 text-[11px] text-white/20 hover:text-white/35 transition-colors">
                  Archive
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
