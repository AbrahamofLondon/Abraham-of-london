/**
 * components/admin/AdminNoticePanel.tsx
 *
 * Standardised notice/callout panel for admin surfaces.
 * Used for: credit-blocked alerts, scope-required notices,
 * config-pending banners, governance warnings, etc.
 */

import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

export type AdminNoticeTone = "info" | "warning" | "danger" | "success";

export type AdminNoticePanelProps = {
  tone?: AdminNoticeTone;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  badge?: string;
};

const TONE_CONFIG: Record<
  AdminNoticeTone,
  { border: string; bg: string; titleCls: string; bodyCls: string; Icon: React.ElementType; dotCls: string }
> = {
  info: {
    border: "border-sky-400/20",
    bg: "bg-sky-950/20",
    titleCls: "text-sky-200/90",
    bodyCls: "text-sky-100/55",
    Icon: Info,
    dotCls: "bg-sky-400",
  },
  warning: {
    border: "border-amber-400/25",
    bg: "bg-amber-950/20",
    titleCls: "text-amber-200/90",
    bodyCls: "text-amber-100/60",
    Icon: AlertTriangle,
    dotCls: "bg-amber-400",
  },
  danger: {
    border: "border-rose-400/25",
    bg: "bg-rose-950/20",
    titleCls: "text-rose-200/90",
    bodyCls: "text-rose-100/60",
    Icon: XCircle,
    dotCls: "bg-rose-400",
  },
  success: {
    border: "border-emerald-400/20",
    bg: "bg-emerald-950/20",
    titleCls: "text-emerald-200/90",
    bodyCls: "text-emerald-100/55",
    Icon: CheckCircle2,
    dotCls: "bg-emerald-400",
  },
};

export function AdminNoticePanel({
  tone = "info",
  title,
  body,
  action,
  badge,
}: AdminNoticePanelProps) {
  const cfg = TONE_CONFIG[tone];
  return (
    <div className={`border ${cfg.border} ${cfg.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${cfg.dotCls}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${cfg.titleCls}`}>{title}</p>
          {body && (
            <div className={`mt-1.5 text-xs leading-5 ${cfg.bodyCls}`}>{body}</div>
          )}
          {action && <div className="mt-3">{action}</div>}
        </div>
        {badge && (
          <span className={`shrink-0 border ${cfg.border} px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${cfg.titleCls}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
