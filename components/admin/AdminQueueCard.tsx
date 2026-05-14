// components/admin/AdminQueueCard.tsx
// Shared queue count card for admin surfaces.

import Link from "next/link";

export type AdminQueueCardProps = {
  title: string;
  count?: number | null;
  unavailable?: boolean;
  description?: string;
  href?: string;
  actionLabel?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

const PRIORITY_BORDER: Record<NonNullable<AdminQueueCardProps["priority"]>, string> = {
  LOW:      "border-white/10",
  MEDIUM:   "border-amber-500/20",
  HIGH:     "border-amber-500/30",
  CRITICAL: "border-rose-500/25",
};

const PRIORITY_VALUE_COLOR: Record<NonNullable<AdminQueueCardProps["priority"]>, string> = {
  LOW:      "text-white",
  MEDIUM:   "text-amber-300",
  HIGH:     "text-amber-300",
  CRITICAL: "text-rose-300",
};

export function AdminQueueCard({
  title,
  count,
  unavailable,
  description,
  href,
  actionLabel = "Open surface",
  priority = "LOW",
}: AdminQueueCardProps) {
  const displayCount =
    unavailable || count == null ? "Unavailable" : String(count);

  return (
    <div className={`border ${PRIORITY_BORDER[priority]} bg-zinc-950/70 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[8px] font-mono uppercase tracking-[0.24em] text-white/35">
            {title}
          </p>
          <p
            className={`mt-2 text-2xl font-light ${
              unavailable || count == null
                ? "text-white/30"
                : PRIORITY_VALUE_COLOR[priority]
            }`}
          >
            {displayCount}
          </p>
          {description && (
            <p className="mt-1 text-xs text-white/40">{description}</p>
          )}
        </div>
      </div>
      {href && (
        <div className="mt-4 border-t border-white/5 pt-3">
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-white/45 transition-colors hover:text-amber-200"
          >
            {actionLabel} →
          </Link>
        </div>
      )}
    </div>
  );
}
