"use client";
import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileDown,
  Loader2,
  Lock,
  Play,
  ShieldCheck,
  Target,
} from "lucide-react";

export type TelemetryLens =
  | "STRATEGIC"
  | "HUMAN_CAPITAL"
  | "FINANCIAL"
  | "OPERATIONAL"
  | "GOVERNANCE";

export type InterventionMetric = {
  label: string;
  intent?: number | null;
  reality?: number | null;
  burnoutIndex?: number | null;
};

export type ReportContext = {
  state: string;
  priorityStack: string[];
  failureModes: string[];
};

export type InterventionProposalExportPayload = {
  campaignId: string;
  lens: TelemetryLens;
  domain: string;
  title: string;
  description: string;
  urgency: "STANDARD" | "ELEVATED" | "HIGH" | "CRITICAL";
  effort: "low" | "medium" | "high" | "critical";
  projectedRecovery: number;
  reportContext?: ReportContext;
};

export interface InterventionProposalProps {
  metrics: InterventionMetric[];
  campaignId: string;
  lens?: TelemetryLens;
  reportContext?: ReportContext;
  canExport?: boolean;
  canDeploy?: boolean;
  onLensChange?: (lens: TelemetryLens) => void;
  onExport?: (payload: InterventionProposalExportPayload) => Promise<void> | void;
  onDeploy?: (payload: InterventionProposalExportPayload) => Promise<void> | void;
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function n(value: unknown, defaultValue = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return defaultValue;
}

function topIssue(metrics: InterventionMetric[], lens: TelemetryLens): InterventionMetric | null {
  if (!metrics.length) return null;
  const deltaOf = (metric: InterventionMetric) => {
    if (lens === "HUMAN_CAPITAL") return Math.max(0, n(metric.burnoutIndex, 0));
    return Math.max(0, n(metric.intent, 0) - n(metric.reality, 0));
  };
  return [...metrics].sort((a, b) => deltaOf(b) - deltaOf(a))[0] ?? null;
}

function buildProposal(
  metric: InterventionMetric,
  lens: TelemetryLens,
  reportContext?: ReportContext,
): InterventionProposalExportPayload {
  const domain = metric.label || "Unknown Domain";
  const rawDelta =
    lens === "HUMAN_CAPITAL"
      ? Math.max(0, n(metric.burnoutIndex, 0))
      : Math.max(0, n(metric.intent, 0) - n(metric.reality, 0));

  let urgency: InterventionProposalExportPayload["urgency"] = "STANDARD";
  let effort: InterventionProposalExportPayload["effort"] = "medium";

  if (rawDelta >= 35) { urgency = "CRITICAL"; effort = "critical"; }
  else if (rawDelta >= 25) { urgency = "HIGH"; effort = "high"; }
  else if (rawDelta >= 15) { urgency = "ELEVATED"; effort = "medium"; }

  if (reportContext?.state === "DISORDERED") {
    urgency = "CRITICAL"; effort = "critical";
  } else if (reportContext?.state === "MISALIGNED" && urgency === "STANDARD") {
    urgency = "ELEVATED";
  }

  const title = `${lens.replace(/_/g, " ")} intervention for ${domain}`;
  const description = [
    `The strongest correction candidate is ${domain}.`,
    `Observed delta indicates a ${urgency.toLowerCase()} intervention posture.`,
    reportContext?.failureModes?.[0] ? `Primary failure mode: ${reportContext.failureModes[0]}.` : "",
    reportContext?.priorityStack?.[0] ? `Priority alignment: ${reportContext.priorityStack[0]}.` : "",
  ].filter(Boolean).join(" ");

  return {
    campaignId: "",
    lens,
    domain,
    title,
    description,
    urgency,
    effort,
    projectedRecovery: Math.max(5, Math.min(95, Math.round(rawDelta * 0.85))),
    reportContext,
  };
}

const LENSES: TelemetryLens[] = ["STRATEGIC", "HUMAN_CAPITAL", "FINANCIAL", "OPERATIONAL", "GOVERNANCE"];

/**
 * ✅ NAMED EXPORT: Added to satisfy imports like:
 * import { InterventionProposal } from "@/components/admin/reporting/intervention-proposal";
 */
export function InterventionProposal({
  metrics,
  campaignId,
  lens = "STRATEGIC",
  reportContext,
  canExport = false,
  canDeploy = false,
  onLensChange,
  onExport,
  onDeploy,
}: InterventionProposalProps) {
  const [activeLens, setActiveLens] = React.useState<TelemetryLens>(lens);
  const [exporting, setExporting] = React.useState(false);
  const [deploying, setDeploying] = React.useState(false);

  React.useEffect(() => setActiveLens(lens), [lens]);

  const issue = React.useMemo(() => topIssue(metrics, activeLens), [metrics, activeLens]);
  
  if (!issue) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-white/60">
        No intervention candidate available.
      </div>
    );
  }

  const proposal = { ...buildProposal(issue, activeLens, reportContext), campaignId };

  const handleExport = async () => {
    if (!canExport || !onExport) return;
    setExporting(true);
    try { await onExport(proposal); } finally { setExporting(false); }
  };

  const handleDeploy = async () => {
    if (!canDeploy || !onDeploy) return;
    setDeploying(true);
    try { await onDeploy(proposal); } finally { setDeploying(false); }
  };

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#090B10] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
       <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/5 rounded-lg">
                <Target className="w-5 h-5 text-white/80" />
             </div>
             <div>
                <h3 className="text-sm font-medium tracking-tight">Intervention Proposal</h3>
                <p className="text-[10px] uppercase tracking-widest text-white/40">Sovereign Correction Engine</p>
             </div>
          </div>
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
             {LENSES.map(l => (
                <button
                   key={l}
                   onClick={() => { setActiveLens(l); onLensChange?.(l); }}
                   className={cn(
                      "px-3 py-1.5 text-[10px] font-medium transition-all rounded-lg",
                      activeLens === l ? "bg-white text-black" : "text-white/40 hover:text-white"
                   )}
                >
                   {l.replace("_", " ")}
                </button>
             ))}
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
             <div>
                <div className="flex items-center gap-2 mb-2">
                   <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold tracking-tighter",
                      proposal.urgency === "CRITICAL" ? "bg-red-500 text-white" : "bg-white/10 text-white/60"
                   )}>
                      {proposal.urgency}
                   </span>
                   <span className="text-white/20">/</span>
                   <span className="text-[10px] text-white/40 uppercase tracking-widest">Effort: {proposal.effort}</span>
                </div>
                <h2 className="text-xl font-semibold leading-tight mb-3">{proposal.title}</h2>
                <p className="text-sm text-white/60 leading-relaxed">{proposal.description}</p>
             </div>

             <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3 text-emerald-400 mb-2">
                   <ShieldCheck className="w-4 h-4" />
                   <span className="text-[11px] font-medium uppercase tracking-wider">Projected Outcome</span>
                </div>
                <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-bold">+{proposal.projectedRecovery}%</span>
                   <span className="text-xs text-white/40">Institutional Alignment</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col justify-end gap-3">
             <button
                onClick={handleExport}
                disabled={!canExport || exporting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded-2xl text-sm font-medium transition-all"
             >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                Export Briefing Document
             </button>
             <button
                onClick={handleDeploy}
                disabled={!canDeploy || deploying}
                className="w-full flex items-center justify-center gap-2 py-4 bg-white text-black hover:bg-white/90 disabled:opacity-30 rounded-2xl text-sm font-bold transition-all shadow-lg"
             >
                {deploying ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Play className="w-4 h-4 fill-current" />}
                Deploy Strategic Correction
             </button>
          </div>
       </div>
    </section>
  );
}

/**
 * ✅ DEFAULT EXPORT: Maintained for general imports
 */
export default InterventionProposal;
