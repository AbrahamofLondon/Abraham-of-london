// components/StatusMessage.tsx

import * as React from "react";
import type { GenerationStatus } from "@/types/pdf-dashboard";

interface StatusMessageProps {
  status: GenerationStatus;
  onDismiss?: () => void;
}

function toneClasses(type: GenerationStatus["type"]): {
  shell: string;
  badge: string;
  title: string;
  details: string;
  progress: string;
  button: string;
} {
  switch (type) {
    case "success":
      return {
        shell:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
        badge:
          "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        title: "text-emerald-200",
        details: "text-emerald-100/80",
        progress: "bg-emerald-400",
        button:
          "border-emerald-400/20 text-emerald-200 hover:bg-emerald-400/10",
      };

    case "error":
      return {
        shell: "border-red-500/20 bg-red-500/10 text-red-100",
        badge: "border-red-400/20 bg-red-400/10 text-red-300",
        title: "text-red-200",
        details: "text-red-100/80",
        progress: "bg-red-400",
        button: "border-red-400/20 text-red-200 hover:bg-red-400/10",
      };

    case "warning":
      return {
        shell:
          "border-amber-500/20 bg-amber-500/10 text-amber-100",
        badge:
          "border-amber-400/20 bg-amber-400/10 text-amber-300",
        title: "text-amber-200",
        details: "text-amber-100/80",
        progress: "bg-amber-400",
        button:
          "border-amber-400/20 text-amber-200 hover:bg-amber-400/10",
      };

    case "info":
    default:
      return {
        shell: "border-sky-500/20 bg-sky-500/10 text-sky-100",
        badge: "border-sky-400/20 bg-sky-400/10 text-sky-300",
        title: "text-sky-200",
        details: "text-sky-100/80",
        progress: "bg-sky-400",
        button: "border-sky-400/20 text-sky-200 hover:bg-sky-400/10",
      };
  }
}

export default function StatusMessage({
  status,
  onDismiss,
}: StatusMessageProps) {
  const ui = toneClasses(status.type);
  const progress =
    typeof status.progress === "number" && Number.isFinite(status.progress)
      ? Math.max(0, Math.min(100, Math.round(status.progress)))
      : null;

  return (
    <div
      className={`mb-8 rounded-2xl border px-5 py-4 backdrop-blur-sm ${ui.shell}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-3">
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${ui.badge}`}
            >
              {status.type}
            </span>

            <p className={`truncate text-sm font-semibold ${ui.title}`}>
              {status.message}
            </p>
          </div>

          {status.details ? (
            <p className={`text-sm leading-relaxed ${ui.details}`}>
              {status.details}
            </p>
          ) : null}

          {progress !== null ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/60">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${ui.progress}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {status.actionLabel && status.onAction ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={status.onAction}
                className={`rounded-xl border px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] transition-all ${ui.button}`}
              >
                {status.actionLabel}
              </button>
            </div>
          ) : null}
        </div>

        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss status message"
            className="rounded-xl border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/70 transition-all hover:bg-white/5 hover:text-white"
          >
            Close
          </button>
        ) : null}
      </div>
    </div>
  );
}