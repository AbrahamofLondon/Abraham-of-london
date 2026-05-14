// components/admin/AdminStatusBadge.tsx
// Canonical badge primitive for admin status, severity, and queue-state indicators.

export type AdminBadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "critical"
  | "info"
  | "muted";

export type AdminStatusBadgeProps = {
  label: string;
  tone?: AdminBadgeTone;
  size?: "sm" | "md";
  pill?: boolean;
  title?: string;
};

const TONE_CLASSES: Record<AdminBadgeTone, string> = {
  neutral:  "border border-white/10 bg-white/5 text-white/50",
  success:  "border border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  warning:  "border border-amber-500/25 bg-amber-500/10 text-amber-400",
  danger:   "border border-rose-500/30 bg-rose-500/10 text-rose-400",
  critical: "border border-red-700/40 bg-red-950/60 text-red-400",
  info:     "border border-blue-500/20 bg-blue-500/10 text-blue-300",
  muted:    "border border-white/10 bg-white/[0.03] text-white/35",
};

const SIZE_CLASSES: Record<"sm" | "md", string> = {
  sm: "px-1.5 py-0.5 text-[8px]",
  md: "px-2 py-0.5 text-[9px]",
};

export function AdminStatusBadge({
  label,
  tone = "neutral",
  size = "sm",
  pill = false,
  title,
}: AdminStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-mono uppercase tracking-wider ${TONE_CLASSES[tone]} ${SIZE_CLASSES[size]} ${pill ? "rounded-full" : "rounded"}`}
      title={title}
    >
      {label}
    </span>
  );
}

// ─── Tone helpers ─────────────────────────────────────────────────────────────

export function toneForSeverity(severity: string): AdminBadgeTone {
  switch (severity.toUpperCase()) {
    case "CRITICAL": return "critical";
    case "HIGH":     return "danger";
    case "MEDIUM":   return "warning";
    case "LOW":      return "muted";
    default:         return "neutral";
  }
}

const STATUS_TONE_MAP: Record<string, AdminBadgeTone> = {
  // success
  PASS:                  "success",
  HEALTHY:               "success",
  ACTIVE:                "success",
  VERIFIED:              "success",
  ALIGNED:               "success",
  LIVE:                  "success",
  COMPLETED:             "success",
  REVIEW_COMPLETED:      "success",
  DEFENSIBLE:            "success",
  GENERAL_50K_READY:     "success",
  // warning
  WATCH:                 "warning",
  ATTENTION:             "warning",
  ROUGH:                 "warning",
  REVIEW_IN_PROGRESS:    "warning",
  DUE:                   "warning",
  DUE_SOON:              "warning",
  REVIEW_DUE:            "warning",
  SELECTIVELY_DEFENSIBLE: "warning",
  FOUNDATION_READY:      "warning",
  SCHEDULED:             "warning",
  SKIPPED:               "warning",
  // danger
  FAIL:                  "danger",
  RISK:                  "danger",
  ERROR:                 "danger",
  MISSING:               "danger",
  DISORDERED:            "danger",
  CADENCE_BROKEN:        "danger",
  // critical
  CRITICAL:              "critical",
  ESCALATED:             "critical",
  OVERDUE:               "critical",
  NOT_READY:             "critical",
  // info
  UPCOMING:              "info",
  INTERNAL:              "info",
  EXPERIMENTAL:          "info",
  // muted
  UNAVAILABLE:           "muted",
  UNKNOWN:               "muted",
  NOT_CONFIGURED:        "muted",
  DEPRECATED:            "muted",
};

export function toneForStatus(status: string): AdminBadgeTone {
  const key = status.toUpperCase().replace(/-/g, "_");
  return STATUS_TONE_MAP[key] ?? "neutral";
}

export function normaliseAdminStatusLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
