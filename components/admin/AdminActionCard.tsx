// components/admin/AdminActionCard.tsx
// Shared action/remediation card for admin surfaces.

import Link from "next/link";
import { AdminStatusBadge, type AdminBadgeTone } from "./AdminStatusBadge";

export type AdminActionCardProps = {
  title: string;
  description?: string;
  statusLabel?: string;
  statusTone?: AdminBadgeTone;
  metric?: string | number;
  meta?: string;
  href?: string;
  actionLabel?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

const PRIORITY_BORDER: Record<NonNullable<AdminActionCardProps["priority"]>, string> = {
  LOW:      "border-white/10",
  MEDIUM:   "border-amber-500/20",
  HIGH:     "border-amber-500/30",
  CRITICAL: "border-rose-500/25",
};

export function AdminActionCard({
  title,
  description,
  statusLabel,
  statusTone,
  metric,
  meta,
  href,
  actionLabel,
  priority = "LOW",
}: AdminActionCardProps) {
  return (
    <div className={`border ${PRIORITY_BORDER[priority]} bg-zinc-950/70 p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-white">{title}</p>
            {statusLabel && (
              <AdminStatusBadge label={statusLabel} tone={statusTone} size="md" />
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs leading-5 text-white/50">{description}</p>
          )}
          {meta && (
            <p className="mt-1 font-mono text-[10px] text-white/30">{meta}</p>
          )}
        </div>
        {metric !== undefined && (
          <div className="shrink-0 font-serif text-2xl font-light text-white">{metric}</div>
        )}
      </div>
      {href && actionLabel && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <Link
            href={href}
            className="text-[10px] font-mono uppercase tracking-widest text-white/50 transition-colors hover:text-white/80"
          >
            {actionLabel} →
          </Link>
        </div>
      )}
    </div>
  );
}
