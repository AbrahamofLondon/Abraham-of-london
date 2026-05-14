import * as React from "react";
import { AlertCircle, CheckCircle2, GitCommitHorizontal, Link2, XCircle } from "lucide-react";

import type { ProvenanceChainTimelineNode } from "@/lib/admin/provenance-chain-ledger";

// ─── Status helpers ───────────────────────────────────────────────────────────

function nodeTone(status: ProvenanceChainTimelineNode["status"]): {
  border: string;
  bg: string;
  text: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case "FIRST":
      return {
        border: "border-amber-500/30",
        bg: "bg-amber-500/10",
        text: "text-amber-300",
        icon: <GitCommitHorizontal className="h-3 w-3" />,
      };
    case "LINKED":
      return {
        border: "border-emerald-500/25",
        bg: "bg-emerald-500/10",
        text: "text-emerald-300",
        icon: <CheckCircle2 className="h-3 w-3" />,
      };
    case "BROKEN":
      return {
        border: "border-rose-500/30",
        bg: "bg-rose-500/10",
        text: "text-rose-300",
        icon: <XCircle className="h-3 w-3" />,
      };
    case "UNKNOWN":
    default:
      return {
        border: "border-white/10",
        bg: "bg-white/5",
        text: "text-white/35",
        icon: <AlertCircle className="h-3 w-3" />,
      };
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// ─── TimelineNode ─────────────────────────────────────────────────────────────

function TimelineNode({
  node,
  isLast,
  onSelect,
}: {
  node: ProvenanceChainTimelineNode;
  isLast: boolean;
  onSelect: (anchorId: string) => void;
}) {
  const tone = nodeTone(node.status);

  return (
    <div className="flex items-start gap-0">
      <div className="flex flex-col items-center">
        {/* Node card */}
        <button
          type="button"
          onClick={() => onSelect(node.anchorId)}
          className={`w-44 shrink-0 border ${tone.border} ${tone.bg} p-3 text-left hover:brightness-110 focus:outline-none focus:ring-1 focus:ring-white/20`}
        >
          <div className={`flex items-center gap-1.5 ${tone.text}`}>
            {tone.icon}
            <span className="text-[8px] font-mono uppercase tracking-[0.16em]">
              {node.status}
            </span>
          </div>
          <p
            className="mt-1.5 font-mono text-[9px] text-white/55"
            title={node.merkleRoot}
          >
            {node.merkleRootShort}
          </p>
          {node.previousRoot && (
            <p
              className="mt-0.5 font-mono text-[8px] text-white/25"
              title={node.previousRoot}
            >
              ← {node.previousRootShort}
            </p>
          )}
          <p className="mt-1.5 text-[8px] text-white/30">{formatTime(node.computedAt)}</p>
          {node.failureReason && (
            <p className="mt-1.5 text-[8px] text-rose-200/60">{node.failureReason}</p>
          )}
        </button>

        {/* No connector below the last node */}
        {!isLast && (
          <div className="h-0 w-full" />
        )}
      </div>

      {/* Horizontal connector arrow between nodes */}
      {!isLast && (
        <div className="flex items-center self-stretch">
          <div className="h-px w-4 bg-white/15" />
          <svg
            width="6"
            height="8"
            viewBox="0 0 6 8"
            className="text-white/15"
            fill="currentColor"
          >
            <path d="M0 0L6 4L0 8V0Z" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── ProvenanceChainTimeline ──────────────────────────────────────────────────

type ProvenanceChainTimelineProps = {
  nodes: ProvenanceChainTimelineNode[];
  onNodeSelect: (anchorId: string) => void;
};

export function ProvenanceChainTimeline({
  nodes,
  onNodeSelect,
}: ProvenanceChainTimelineProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-white/30">
        <Link2 className="h-3 w-3" />
        No anchors in this chain group.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {nodes.map((node, index) => (
          <TimelineNode
            key={node.anchorId}
            node={node}
            isLast={index === nodes.length - 1}
            onSelect={onNodeSelect}
          />
        ))}
      </div>
      <p className="text-[9px] text-white/25">
        Click a node to open anchor details. Chain hash integrity is verified server-side;
        use the Verify button on each row for per-anchor confirmation.
      </p>
    </div>
  );
}

export type { ProvenanceChainTimelineNode };
