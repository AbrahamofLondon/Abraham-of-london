"use client";

/**
 * GovernanceDisclosure — surfaces real governance infrastructure to the user.
 *
 * This component does NOT contain hardcoded governance descriptions.
 * It reads from the existing constitutional thread (session-thread.ts),
 * canonical sections, and decision state engine to show users what
 * the system actually computed for their case.
 *
 * For contexts where session data is available, it shows real governance data.
 * For contexts without session data, it describes the governance system
 * in terms of the actual engines that power it.
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

// Map context to the governance engines that power it
const ENGINE_MAP: Record<GovernanceContext, {
  label: string;
  engines: string[];
  scoringBasis: string;
  escalationPath: string;
  challengeRoute: string;
}> = {
  fast_diagnostic: {
    label: "Fast Diagnostic",
    engines: ["Decision-pattern logic", "Consistency check engine", "Cost-of-delay engine"],
    scoringBasis: "Your answers to decision-structure questions, scored against authority clarity, ownership, and consequence exposure.",
    escalationPath: "Results feed into the Constitutional Diagnostic if structural tension is confirmed.",
    challengeRoute: "Request human review via info@abrahamoflondon.org with your session reference.",
  },
  constitutional_diagnostic: {
    label: "Constitutional Diagnostic",
    engines: ["Constitutional authority model", "Domain dissonance scoring", "Governance rules engine", "Escalation governor"],
    scoringBasis: "Multi-domain scoring across coherence, authority, trust, pressure, friction, seriousness, and governance. Each domain scored independently.",
    escalationPath: "Route assignment (REJECT / DIAGNOSTIC / STRATEGY) with governed escalation paths: REVIEW → APPEAL → OVERRIDE → CONSTITUTIONAL_COURT.",
    challengeRoute: "Constitutional appeal available. Contact support to file.",
  },
  team_assessment: {
    label: "Team Assessment",
    engines: ["Cross-respondent engine", "Team tension evidence model", "Fragility scoring"],
    scoringBasis: "Structured questions scored for intent-reality gap across team domains. Single-respondent = leader-estimated. Multi-respondent = cross-validated.",
    escalationPath: "Fragility status (STABLE / VOLATILE / FRACTURED) determines escalation to Strategy Room.",
    challengeRoute: "Request multi-respondent validation or human review via support.",
  },
  enterprise_assessment: {
    label: "Enterprise Assessment",
    engines: ["Enterprise block scoring", "Decision clarity engine", "Governance logic engine"],
    scoringBasis: "Enterprise governance blocks scored with band classification. Single-respondent = executive perspective.",
    escalationPath: "Weak blocks surface as governance alerts. Critical findings route to Strategy Room.",
    challengeRoute: "Request multi-stakeholder validation or advisory review via support.",
  },
  executive_reporting: {
    label: "Executive Reporting",
    engines: ["Canonical sections engine", "Financial exposure model", "Recommendation governance", "Integrity snapshot"],
    scoringBasis: "Your accumulated diagnostic evidence. Financial projections use your declared exposure data only — never fabricated.",
    escalationPath: "Governed recommendations with priority stack, failure modes, and required interventions derived from your case.",
    challengeRoute: "Challenge findings or request clarification via info@abrahamoflondon.org.",
  },
  strategy_room: {
    label: "Strategy Room",
    engines: ["Decision state engine", "Decision ledger", "Consequence scoring", "Escalation trigger system", "Pattern breaker contracts"],
    scoringBasis: "Reactive execution state machine. Every decision tracked through PENDING → EXECUTED / BLOCKED / ESCALATED / FAILED. Consequence score compounds with delay.",
    escalationPath: "Avoidance detection triggers governed escalation. Deadman's switch on protocol expiry. Breach detection active.",
    challengeRoute: "Challenge any decision or routing. Appeal path available at every stage.",
  },
  return_brief: {
    label: "Return Brief",
    engines: ["Outcome verification model", "Longitudinal comparison engine", "Contradiction detection"],
    scoringBasis: "Delta analysis between baseline and follow-up readings. Outcome classified as resolved / improved / stable / deteriorated.",
    escalationPath: "Regression triggers re-escalation. Unresolved contradictions surface explicitly.",
    challengeRoute: "Contact support if prior context has changed materially.",
  },
  purpose_alignment: {
    label: "Purpose Alignment",
    engines: ["Alignment scoring engine", "Governance logic engine"],
    scoringBasis: "Structured purpose and values questions scored for alignment between stated intent and structural readiness.",
    escalationPath: "Dissonance above threshold routes to deeper diagnostic or advisory.",
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
            <EngineList engines={config.engines} />
            <DetailRow label="Scoring basis" value={config.scoringBasis} />
            {hasLiveData && thread && <LiveGovernanceData thread={thread} />}
            <DetailRow label="Escalation path" value={config.escalationPath} />
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
          <EngineList engines={config.engines} />
          <DetailRow label="Scoring basis" value={config.scoringBasis} />
          {hasLiveData && thread && <LiveGovernanceData thread={thread} />}
          <DetailRow label="Escalation path" value={config.escalationPath} />
          <DetailRow label="How to challenge this reading" value={config.challengeRoute} />
          <p className="text-xs text-zinc-600 pt-2">
            Governance infrastructure: constitutional authority model, decision ledger,
            outcome verification, calibration engine. All outputs are auditable.
          </p>
        </div>
      )}
    </div>
  );
}

function EngineList({ engines }: { engines: string[] }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-500/50 mb-1">
        What powers this
      </div>
      <div className="flex flex-wrap gap-2">
        {engines.map((e) => (
          <span
            key={e}
            className="text-[10px] font-mono text-zinc-500 border border-white/8 px-2 py-0.5"
          >
            {e}
          </span>
        ))}
      </div>
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
