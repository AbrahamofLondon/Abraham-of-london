"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  FileText,
  ShieldCheck,
  Zap,
} from "lucide-react";

export type HistoryNodeType =
  | "BRIEF"
  | "MANDATE"
  | "LIQUIDATION"
  | "ALERT"
  | "DECISION";

export type HistoryNodeStatus = "STABLE" | "WARNING" | "CRITICAL";

export type HistoryNode = {
  id: string;
  type: HistoryNodeType;
  nodeRef: string;
  timestamp: string;
  label: string;
  status: HistoryNodeStatus;
  summary?: string;
  metadata?: Record<string, unknown>;
};

type GovernanceHistoryProps = {
  nodes: HistoryNode[];
  maxHeight?: string;
  onNodeSelect?: (node: HistoryNode) => void;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function toDateLabel(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown date";
  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getTypeIcon(type: HistoryNodeType) {
  switch (type) {
    case "MANDATE":
      return ShieldCheck;
    case "LIQUIDATION":
      return AlertCircle;
    case "ALERT":
      return Zap;
    case "DECISION":
      return Crown;
    case "BRIEF":
    default:
      return FileText;
  }
}

function getStatusClass(status: HistoryNodeStatus) {
  switch (status) {
    case "CRITICAL":
      return {
        text: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        dot: "bg-red-400",
        icon: AlertCircle,
      };
    case "WARNING":
      return {
        text: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        dot: "bg-amber-400",
        icon: Clock,
      };
    case "STABLE":
    default:
      return {
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        dot: "bg-emerald-400",
        icon: CheckCircle2,
      };
  }
}

export function GovernanceHistory({
  nodes,
  maxHeight = "360px",
  onNodeSelect,
}: GovernanceHistoryProps) {
  const safeNodes = React.useMemo(() => {
    if (!Array.isArray(nodes)) return [];
    return [...nodes].sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });
  }, [nodes]);

  if (safeNodes.length === 0) {
    return (
      <div className="border border-white/10 bg-black/30 p-8 text-center backdrop-blur-sm">
        <FileText className="mx-auto h-6 w-6 text-white/20" />
        <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.2em] text-white/30">
          Governance history empty
        </p>
        <p className="mt-2 text-sm text-white/30">
          No governance nodes have been recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className="overflow-y-auto rounded-lg border border-white/10 bg-black/30 backdrop-blur-sm"
      style={{ maxHeight }}
    >
      <div className="divide-y divide-white/5">
        {safeNodes.map((node, index) => {
          const TypeIcon = getTypeIcon(node.type);
          const status = getStatusClass(node.status);
          const StatusIcon = status.icon;
          const impact =
            typeof node.metadata?.impact === "number"
              ? Math.round(node.metadata.impact)
              : null;

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onNodeSelect?.(node)}
              className="group flex w-full items-start justify-between gap-4 px-5 py-5 text-left transition-all duration-300 hover:bg-white/5"
            >
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <TypeIcon className="h-4 w-4 text-amber-400/70" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[7px] uppercase tracking-[0.22em] text-white/25">
                      [{String(index + 1).padStart(2, "0")}]
                    </span>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.18em]",
                        status.bg,
                        status.border,
                        status.text,
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                      {node.status}
                    </span>

                    <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-white/25">
                      {node.type}
                    </span>
                  </div>

                  <h4 className="mt-2 truncate font-serif text-lg text-white/85 group-hover:text-white">
                    {node.label}
                  </h4>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-white/30">
                      {node.nodeRef}
                    </span>
                    <span className="h-px w-4 bg-white/10" />
                    <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-white/30">
                      {toDateLabel(node.timestamp)}
                    </span>
                    {impact !== null ? (
                      <>
                        <span className="h-px w-4 bg-white/10" />
                        <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-white/30">
                          Impact {impact}
                        </span>
                      </>
                    ) : null}
                  </div>

                  {node.summary ? (
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/45">
                      {node.summary}
                    </p>
                  ) : null}

                  <div className="mt-3 inline-flex items-center gap-1.5">
                    <StatusIcon className={cn("h-3 w-3", status.text)} />
                    <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-white/25">
                      Governance status recorded
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-1 shrink-0 border border-white/10 p-2 transition-all duration-300 group-hover:border-white/20">
                <ChevronRight className="h-3 w-3 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:text-white/50" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default GovernanceHistory;