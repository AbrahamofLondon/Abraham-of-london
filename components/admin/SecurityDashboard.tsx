/* components/admin/SecurityDashboard.tsx */
"use client";

import * as React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Layers3,
  Flame,
  Lock,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type AuditLog = {
  id: string;
  action?: string;
  actorEmail?: string | null;
  resourceName?: string | null;
  severity?: string;
  createdAt?: string;
  metadata?: unknown;
};

type CanonicalContext = {
  route: string;
  readinessTier: string;
  authorityType: string;
  revenueBand: string;
  marketRiskBand: string;
  orgState: string;
  dominantDomains: string[];
  failureModes: string[];
  requiredInterventions: string[];
  sponsorTypes: string[];
  worldviewAnchors: string[];
  clarityScore: number;
  authorityScore: number;
  governanceScore: number;
  severityIndex?: number;
  revenueScore: number;
};

type EfficacyRow = {
  id: string;
  joinKey: string;
  context: CanonicalContext;
  totalSessions: number;
  impressionCount: number;
  conversionCount: number;
  contextualConversionRate: number;
  rankedAssets: Array<{
    assetId: string;
    title: string;
    kind: string;
    href?: string | null;
    impressions: number;
    conversions: number;
    conversionRate: number;
    avgRank?: number;
    avgMatchScore?: number;
    contextualLift: number;
    reasons: string[];
  }>;
};

type SecurityDashboardProps = {
  logs?: AuditLog[];
  efficacyRows?: EfficacyRow[];
  overlayMode?: "none" | "canonical";
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function severityTone(value: string | undefined) {
  const v = String(value || "").toLowerCase();
  if (v === "critical") return "text-red-400 border-red-500/25 bg-red-500/10";
  if (v === "high") return "text-orange-400 border-orange-500/25 bg-orange-500/10";
  if (v === "medium") return "text-amber-400 border-amber-500/25 bg-amber-500/10";
  return "text-emerald-400 border-emerald-500/25 bg-emerald-500/10";
}

function routeTone(route: string) {
  const r = String(route || "").toUpperCase();
  if (r === "STRATEGY") return "text-[#D4AF37] border-[#D4AF37]/25 bg-[#D4AF37]/10";
  if (r === "DIAGNOSTIC") return "text-blue-400 border-blue-500/25 bg-blue-500/10";
  return "text-zinc-400 border-zinc-500/25 bg-zinc-500/10";
}

function heatTone(rate: number) {
  if (rate >= 0.35) return "text-emerald-300 border-emerald-500/25 bg-emerald-500/10";
  if (rate >= 0.18) return "text-amber-300 border-amber-500/25 bg-amber-500/10";
  return "text-red-300 border-red-500/25 bg-red-500/10";
}

function MiniPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex rounded-full border px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.12em]",
        className
      )}
    >
      {children}
    </span>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  subtext,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: "neutral" | "danger" | "success" | "warning" | "gold";
  subtext?: string;
}) {
  const toneClass = {
    neutral: "border-white/6 bg-zinc-900/30",
    danger: "border-red-500/20 bg-red-500/[0.06]",
    success: "border-emerald-500/20 bg-emerald-500/[0.05]",
    warning: "border-amber-500/20 bg-amber-500/[0.05]",
    gold: "border-[#D4AF37]/20 bg-[#D4AF37]/[0.05]",
  } as const;

  return (
    <div className={cx("rounded-2xl border p-5", toneClass[tone])}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </div>
        <Icon className="h-4 w-4 text-zinc-500" />
      </div>
      <div className="mt-3 text-2xl font-light tracking-tight text-white">{value}</div>
      {subtext ? <div className="mt-2 text-[11px] text-zinc-500">{subtext}</div> : null}
    </div>
  );
}

function CanonicalClusterCard({
  row,
  expanded,
  onToggle,
}: {
  row: EfficacyRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const rate = Number(row.contextualConversionRate || 0);

  return (
    <div className="rounded-3xl border border-white/6 bg-zinc-900/25 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <MiniPill className={routeTone(row.context.route)}>{row.context.route}</MiniPill>
            <MiniPill className="border-white/10 bg-white/[0.04] text-zinc-300">
              {row.context.readinessTier}
            </MiniPill>
            <MiniPill className="border-white/10 bg-white/[0.04] text-zinc-300">
              {row.context.orgState}
            </MiniPill>
            <MiniPill className={heatTone(rate)}>
              {(rate * 100).toFixed(1)}% efficacy
            </MiniPill>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-500">
                Authority
              </div>
              <div className="mt-1 text-sm text-white">{row.context.authorityType}</div>
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-500">
                Revenue Band
              </div>
              <div className="mt-1 text-sm text-white">{row.context.revenueBand}</div>
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-500">
                Risk Band
              </div>
              <div className="mt-1 text-sm text-white">{row.context.marketRiskBand}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(row.context.dominantDomains || []).slice(0, expanded ? 12 : 4).map((item) => (
              <MiniPill
                key={item}
                className="border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#E7D8A5]"
              >
                {item}
              </MiniPill>
            ))}
            {(row.context.requiredInterventions || [])
              .slice(0, expanded ? 8 : 3)
              .map((item) => (
                <MiniPill
                  key={item}
                  className="border-blue-500/20 bg-blue-500/10 text-blue-300"
                >
                  {item}
                </MiniPill>
              ))}
            {(row.context.failureModes || []).slice(0, expanded ? 8 : 3).map((item) => (
              <MiniPill
                key={item}
                className="border-red-500/20 bg-red-500/10 text-red-300"
              >
                {item}
              </MiniPill>
            ))}
          </div>
        </div>

        <div className="grid min-w-[240px] grid-cols-2 gap-3">
          <MetricCard
            label="Sessions"
            value={String(row.totalSessions)}
            icon={Layers3}
            subtext="Tracked in this cluster"
          />
          <MetricCard
            label="Conversions"
            value={String(row.conversionCount)}
            icon={CheckCircle2}
            tone={rate >= 0.2 ? "success" : "warning"}
            subtext={`${(rate * 100).toFixed(1)}% conversion`}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/6 pt-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
          Join Key · {row.joinKey.slice(0, 18)}...
        </div>
        <button
          onClick={onToggle}
          className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-300 transition hover:bg-white/[0.06]"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "Collapse" : "Inspect"}
        </button>
      </div>

      {expanded ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/6 bg-black/20 p-4">
            <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
              Sponsor Types
            </div>
            <div className="flex flex-wrap gap-2">
              {(row.context.sponsorTypes || []).length ? (
                row.context.sponsorTypes.map((item) => (
                  <MiniPill
                    key={item}
                    className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  >
                    {item}
                  </MiniPill>
                ))
              ) : (
                <span className="text-sm text-zinc-500">No sponsor types recorded.</span>
              )}
            </div>

            <div className="mt-5 mb-3 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
              Worldview Anchors
            </div>
            <div className="flex flex-wrap gap-2">
              {(row.context.worldviewAnchors || []).length ? (
                row.context.worldviewAnchors.map((item) => (
                  <MiniPill
                    key={item}
                    className="border-white/10 bg-white/[0.04] text-zinc-300"
                  >
                    {item}
                  </MiniPill>
                ))
              ) : (
                <span className="text-sm text-zinc-500">No worldview anchors recorded.</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/6 bg-black/20 p-4">
            <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
              Ranked Asset Rationale Preview
            </div>
            <div className="space-y-3">
              {(row.rankedAssets || []).slice(0, 3).map((asset) => (
                <div
                  key={asset.assetId}
                  className="rounded-2xl border border-white/6 bg-white/[0.03] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white">{asset.title}</div>
                      <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-500">
                        {asset.kind} · lift {asset.contextualLift}
                      </div>
                    </div>
                    <MiniPill className={heatTone(asset.conversionRate)}>
                      {(asset.conversionRate * 100).toFixed(1)}%
                    </MiniPill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(asset.reasons || []).slice(0, 4).map((reason) => (
                      <MiniPill
                        key={`${asset.assetId}-${reason}`}
                        className="border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#E7D8A5]"
                      >
                        {reason}
                      </MiniPill>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SecurityDashboard({
  logs = [],
  efficacyRows = [],
  overlayMode = "canonical",
}: SecurityDashboardProps) {
  const [expandedJoinKey, setExpandedJoinKey] = React.useState<string | null>(null);

  const criticalCount = logs.filter(
    (log) => String(log.severity || "").toLowerCase() === "critical"
  ).length;
  const highCount = logs.filter(
    (log) => String(log.severity || "").toLowerCase() === "high"
  ).length;
  const lastSeen = logs[0]?.createdAt
    ? new Date(logs[0].createdAt).toLocaleString()
    : "No recent events";

  const hotContexts = [...efficacyRows]
    .sort((a, b) => (b.contextualConversionRate || 0) - (a.contextualConversionRate || 0))
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          label="Critical Events"
          value={String(criticalCount)}
          icon={AlertTriangle}
          tone={criticalCount > 0 ? "danger" : "success"}
          subtext="Immediate oversight required"
        />
        <MetricCard
          label="High Severity"
          value={String(highCount)}
          icon={Lock}
          tone={highCount > 0 ? "warning" : "neutral"}
          subtext="Elevated audit conditions"
        />
        <MetricCard
          label="Canonical Clusters"
          value={String(efficacyRows.length)}
          icon={Layers3}
          tone="gold"
          subtext="Tracked efficacy contexts"
        />
        <MetricCard
          label="Last Event"
          value={lastSeen === "No recent events" ? "—" : "Live"}
          icon={Clock3}
          tone="neutral"
          subtext={lastSeen}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[30px] border border-white/6 bg-zinc-900/30 p-6">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400">
              Security Audit Stream
            </span>
          </div>

          <div className="space-y-2">
            {logs.length ? (
              logs.slice(0, 24).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-2xl border border-white/6 bg-black/20 px-4 py-3"
                >
                  <div className="min-w-0 pr-4">
                    <div className="text-sm text-white">
                      {log.actorEmail || "Unknown actor"}{" "}
                      <span className="text-zinc-500">—</span>{" "}
                      {log.resourceName || log.action || "Unknown action"}
                    </div>
                    <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-500">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Unknown time"}
                    </div>
                  </div>
                  <MiniPill className={severityTone(log.severity)}>
                    {log.severity || "nominal"}
                  </MiniPill>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/6 bg-black/20 p-4 text-sm text-zinc-500">
                No audit logs available.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/6 bg-zinc-900/30 p-6">
          <div className="mb-5 flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400">
              Efficacy Heat Overlay
            </span>
          </div>

          {overlayMode === "canonical" && hotContexts.length ? (
            <div className="space-y-3">
              {hotContexts.map((row) => (
                <div
                  key={row.joinKey}
                  className="rounded-2xl border border-white/6 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <MiniPill className={routeTone(row.context.route)}>
                          {row.context.route}
                        </MiniPill>
                        <MiniPill className={heatTone(row.contextualConversionRate)}>
                          {(row.contextualConversionRate * 100).toFixed(1)}%
                        </MiniPill>
                      </div>
                      <div className="mt-3 text-sm text-white">
                        {row.context.orgState} · {row.context.authorityType}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(row.context.dominantDomains || []).slice(0, 3).map((item) => (
                          <MiniPill
                            key={item}
                            className="border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#E7D8A5]"
                          >
                            {item}
                          </MiniPill>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedJoinKey((prev) => (prev === row.joinKey ? null : row.joinKey))
                      }
                      className="rounded-full border border-white/8 bg-white/[0.03] p-2 text-zinc-300 transition hover:bg-white/[0.06]"
                    >
                      {expandedJoinKey === row.joinKey ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {expandedJoinKey === row.joinKey ? (
                    <div className="mt-4 border-t border-white/6 pt-4">
                      <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
                        Required Interventions
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(row.context.requiredInterventions || []).length ? (
                          row.context.requiredInterventions.map((item) => (
                            <MiniPill
                              key={item}
                              className="border-blue-500/20 bg-blue-500/10 text-blue-300"
                            >
                              {item}
                            </MiniPill>
                          ))
                        ) : (
                          <span className="text-sm text-zinc-500">
                            No interventions recorded.
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/6 bg-black/20 p-4 text-sm text-zinc-500">
              Canonical overlay disabled or no efficacy rows available.
            </div>
          )}
        </div>
      </div>

      {overlayMode === "canonical" && hotContexts.length ? (
        <div className="rounded-[30px] border border-white/6 bg-zinc-900/30 p-6">
          <div className="mb-5 flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400">
              Canonical Security-Decision Adjacency
            </span>
          </div>

          <div className="space-y-4">
            {hotContexts.map((row) => (
              <CanonicalClusterCard
                key={row.joinKey}
                row={row}
                expanded={expandedJoinKey === row.joinKey}
                onToggle={() =>
                  setExpandedJoinKey((prev) => (prev === row.joinKey ? null : row.joinKey))
                }
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
