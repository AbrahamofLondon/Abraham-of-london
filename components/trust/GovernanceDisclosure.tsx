"use client";

/**
 * GovernanceDisclosure — user-safe explanation of evidence posture and challenge path.
 */

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import {
  CONSTITUTIONAL_THREAD_KEY,
  type ConstitutionalThread,
} from "@/lib/diagnostics/session-thread";

export type GovernanceContext =
  | "fast_diagnostic"
  | "constitutional_diagnostic"
  | "team_assessment"
  | "enterprise_assessment"
  | "executive_reporting"
  | "strategy_room"
  | "return_brief"
  | "purpose_alignment";

type Props = {
  context: GovernanceContext;
  compact?: boolean;
  className?: string;
};

const ENGINE_MAP: Record<GovernanceContext, {
  label: string;
  evidenceBasis: string;
  movementRule: string;
  challengeRoute: string;
}> = {
  fast_diagnostic: {
    label: "Fast Diagnostic",
    evidenceBasis: "Based on your stated decision, owner, and consequence.",
    movementRule: "The next governed response adds evidence and can change how the case is treated.",
    challengeRoute: "Request human review via support@abrahamoflondon.org with your session reference.",
  },
  constitutional_diagnostic: {
    label: "Constitutional Diagnostic",
    evidenceBasis: "Based on your recorded answers and the constitutional evidence captured in this assessment.",
    movementRule: "Route decisions become stronger when additional governed evidence is added.",
    challengeRoute: "Constitutional appeal available. Contact support to file.",
  },
  team_assessment: {
    label: "Team Assessment",
    evidenceBasis: "Based on the responses recorded in this team assessment.",
    movementRule: "Additional respondents strengthen the evidence posture and can change the reading.",
    challengeRoute: "Request multi-respondent validation or human review via support.",
  },
  enterprise_assessment: {
    label: "Enterprise Assessment",
    evidenceBasis: "Based on the institutional signals recorded in this enterprise intake.",
    movementRule: "Further evidence can change the route, the urgency, or the required intervention.",
    challengeRoute: "Request multi-stakeholder validation or operator review via support.",
  },
  executive_reporting: {
    label: "Executive Reporting",
    evidenceBasis: "Based on your accumulated diagnostic evidence and recorded exposure context.",
    movementRule: "The report can change when new evidence, checkpoints, or execution signals are recorded.",
    challengeRoute: "Challenge findings or request clarification via support@abrahamoflondon.org.",
  },
  strategy_room: {
    label: "Strategy Room",
    evidenceBasis: "Based on your recorded directives, checkpoint history, and execution responses.",
    movementRule: "Checkpoint responses and execution evidence determine whether the route is holding.",
    challengeRoute: "Challenge any decision or routing. Appeal path available at every stage.",
  },
  return_brief: {
    label: "Return Brief",
    evidenceBasis: "Based on your prior checkpoint history and the evidence recorded since the earlier decision.",
    movementRule: "A return brief becomes more precise when a later checkpoint or outcome record is added.",
    challengeRoute: "Contact support if prior context has changed materially.",
  },
  purpose_alignment: {
    label: "Purpose Alignment",
    evidenceBasis: "Based on your recorded purpose, pressure, and obligation answers.",
    movementRule: "Later diagnostics can confirm whether the issue is personal, structural, or both.",
    challengeRoute: "Contact support to discuss findings.",
  },
};

export default function GovernanceDisclosure({ context, compact = false, className = "" }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [thread, setThread] = useState<ConstitutionalThread | null>(null);

  const config = ENGINE_MAP[context];
  if (!config) return null;

  // Attempt to read constitutional thread for live governance data
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CONSTITUTIONAL_THREAD_KEY);
      if (raw) setThread(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const hasLiveData = thread && (context === "constitutional_diagnostic" || context === "executive_reporting" || context === "strategy_room");

  if (compact) {
    return (
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full text-left ${className}`}
        type="button"
      >
        <div className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
          <ShieldCheck size={12} className="text-amber-500/60" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
            How this is governed
          </span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
        {expanded && (
          <div className="mt-3 space-y-3 border-t border-white/10 pt-3" onClick={(e) => e.stopPropagation()}>
            <DetailRow label="Evidence basis" value={config.evidenceBasis} />
            {hasLiveData && thread && <LiveGovernanceData thread={thread} />}
            <DetailRow label="Movement rule" value={config.movementRule} />
            <DetailRow label="How to challenge" value={config.challengeRoute} />
          </div>
        )}
      </button>
    );
  }

  return (
    <div className={`border border-white/10 bg-white/[0.02] ${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
        type="button"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-amber-500/70" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            How this {config.label} is governed
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-zinc-500" />
        ) : (
          <ChevronDown size={14} className="text-zinc-500" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
          <DetailRow label="Evidence basis" value={config.evidenceBasis} />
          {hasLiveData && thread && <LiveGovernanceData thread={thread} />}
          <DetailRow label="Movement rule" value={config.movementRule} />
          <DetailRow label="How to challenge this reading" value={config.challengeRoute} />
          <p className="text-xs text-zinc-600 pt-2">
            The visible result shows consequence and evidence posture, not internal machinery.
          </p>
        </div>
      )}
    </div>
  );
}

function LiveGovernanceData({ thread }: { thread: ConstitutionalThread }) {
  return (
    <div className="border border-white/8 bg-white/[0.01] p-3 space-y-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-500/50">
        Your governance state
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
        <div>Route: <span className="text-zinc-300">{thread.route}</span></div>
        <div>Readiness: <span className="text-zinc-300">{thread.readinessTier}</span></div>
        <div>Authority: <span className="text-zinc-300">{thread.authorityType}</span></div>
        <div>Confidence: <span className="text-zinc-300">{Math.round(thread.confidence * 100)}%</span></div>
      </div>
      {thread.failureModes.length > 0 && (
        <div className="text-xs text-zinc-500">
          Active failure modes: {thread.failureModes.slice(0, 2).join(", ")}
          {thread.failureModes.length > 2 && ` (+${thread.failureModes.length - 2} more)`}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-500/50 mb-1">
        {label}
      </div>
      <p className="text-sm leading-6 text-zinc-400">{value}</p>
    </div>
  );
}
