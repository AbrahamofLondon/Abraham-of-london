// components/PDFDashboard/StatusMessage.tsx
import React from "react";

export type StatusType = "success" | "error" | "info" | "warning";

export interface StatusMessageProps {
  message: string;
  type: StatusType;
  details?: string;
  progress?: number;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  dismissAfter?: number;
}

function tone(type: StatusType) {
  switch (type) {
    case "success":
      return "border-green-700/40 bg-green-900/20 text-green-100";
    case "error":
      return "border-red-700/40 bg-red-900/20 text-red-100";
    case "warning":
      return "border-yellow-700/40 bg-yellow-900/20 text-yellow-100";
    case "info":
    default:
      return "border-blue-700/40 bg-blue-900/20 text-blue-100";
  }
}

export const StatusMessage: React.FC<StatusMessageProps> = ({
  message,
  type,
  details,
  progress,
  actionLabel,
  onAction,
  onDismiss,
  autoDismiss = false,
  dismissAfter = 5000,
}) => {
  React.useEffect(() => {
    if (!autoDismiss || !onDismiss) return;
    const t = setTimeout(onDismiss, dismissAfter);
    return () => clearTimeout(t);
  }, [autoDismiss, dismissAfter, onDismiss]);

  return (
    <div className={`mt-4 rounded-xl border p-4 ${tone(type)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{message}</div>
          {details ? <div className="mt-1 text-xs opacity-80 whitespace-pre-wrap">{details}</div> : null}
          {typeof progress === "number" ? (
            <div className="mt-3">
              <div className="h-2 w-full rounded bg-black/20 overflow-hidden">
                <div className="h-2 rounded bg-white/40" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
              </div>
              <div className="mt-1 text-xs opacity-70">{progress}%</div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition"
            >
              {actionLabel}
            </button>
          ) : null}
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition"
            >
              Dismiss
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

StatusMessage.displayName = "StatusMessage";