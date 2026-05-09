/* components/Intelligence/KnowledgeGraph.tsx
 * ADMIN_ONLY: do not import into public or authenticated user-facing routes.
 */
"use client";

import * as React from "react";
import {
  Network,
  Layers3,
  Flame,
  ShieldCheck,
  Target,
  Briefcase,
  Landmark,
} from "lucide-react";

type FrameworkNode = {
  id: string;
  label: string;
  kind?: string;
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
  severityScore: number;
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

type KnowledgeGraphProps = {
  frameworks?: FrameworkNode[];
  efficacyRows?: EfficacyRow[];
  overlayMode?: "none" | "canonical";
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function heatClass(rate: number) {
  if (rate >= 0.35) return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
  if (rate >= 0.18) return "border-amber-500/25 bg-amber-500/10 text-amber-300";
  return "border-red-500/25 bg-red-500/10 text-red-300";
}

function routeClass(route: string) {
  const r = String(route || "").toUpperCase();
  if (r === "STRATEGY") return "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#E7D8A5]";
  if (r === "DIAGNOSTIC") return "border-blue-500/25 bg-blue-500/10 text-blue-300";
  return "border-zinc-500/25 bg-zinc-500/10 text-zinc-300";
}

function MicroPill({
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

function DomainRail({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-white/6 bg-black/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-zinc-400" />
        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
          {title}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.length ? (
          items.map((item) => (
            <MicroPill key={item} className={tone}>
              {item}
            </MicroPill>
          ))
        ) : (
          <span className="text-sm text-zinc-500">No signals mapped.</span>
        )}
      </div>
    </div>
  );
}

function ClusterNodeCard({ row }: { row: EfficacyRow }) {
  return (
    <div className="rounded-[28px] border border-white/6 bg-zinc-900/25 p-5">
      <div className="flex flex-wrap gap-2">
        <MicroPill className={routeClass(row.context.route)}>{row.context.route}</MicroPill>
        <MicroPill className="border-white/10 bg-white/[0.04] text-zinc-300">
          {row.context.readinessTier}
        </MicroPill>
        <MicroPill className={heatClass(row.contextualConversionRate)}>
          {(row.contextualConversionRate * 100).toFixed(1)}% heat
        </MicroPill>
      </div>

      <div className="mt-4">
        <div className="text-lg font-medium text-white">{row.context.orgState}</div>
        <div className="mt-1 text-[11px] font-mono uppercase tracking-[0.12em] text-zinc-500">
          {row.context.authorityType} · {row.context.revenueBand} · {row.context.marketRiskBand}
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <DomainRail
          icon={Layers3}
          title="Dominant Domains"
          items={(row.context.dominantDomains || []).slice(0, 6)}
          tone="border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#E7D8A5]"
        />
        <DomainRail
          icon={Flame}
          title="Failure Modes"
          items={(row.context.failureModes || []).slice(0, 6)}
          tone="border-red-500/20 bg-red-500/10 text-red-300"
        />
        <DomainRail
          icon={Target}
          title="Required Interventions"
          items={(row.context.requiredInterventions || []).slice(0, 6)}
          tone="border-blue-500/20 bg-blue-500/10 text-blue-300"
        />
        <DomainRail
          icon={Briefcase}
          title="Sponsor Types"
          items={(row.context.sponsorTypes || []).slice(0, 6)}
          tone="border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/6 bg-black/20 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Landmark className="h-4 w-4 text-zinc-400" />
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
            Worldview Anchors
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(row.context.worldviewAnchors || []).length ? (
            row.context.worldviewAnchors.slice(0, 8).map((item) => (
              <MicroPill
                key={item}
                className="border-white/10 bg-white/[0.04] text-zinc-300"
              >
                {item}
              </MicroPill>
            ))
          ) : (
            <span className="text-sm text-zinc-500">No worldview anchors recorded.</span>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["Clarity", row.context.clarityScore],
          ["Authority", row.context.authorityScore],
          ["Governance", row.context.governanceScore],
          ["Severity", row.context.severityScore],
          ["Revenue", row.context.revenueScore],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3"
          >
            <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-500">
              {label}
            </div>
            <div className="mt-2 text-xl font-light text-white">{String(value)}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
          <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-500">
            Sessions
          </div>
          <div className="mt-2 text-xl font-light text-white">{row.totalSessions}</div>
        </div>
        <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
          <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-500">
            Impressions
          </div>
          <div className="mt-2 text-xl font-light text-white">{row.impressionCount}</div>
        </div>
        <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
          <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-500">
            Conversions
          </div>
          <div className="mt-2 text-xl font-light text-white">{row.conversionCount}</div>
        </div>
        <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
          <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-500">
            Efficacy Heat
          </div>
          <div className="mt-2 text-xl font-light text-white">
            {(row.contextualConversionRate * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/6 bg-black/20 p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-zinc-400" />
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
            Ranked Recommendation Logic
          </span>
        </div>
        <div className="space-y-3">
          {(row.rankedAssets || []).slice(0, 4).map((asset) => (
            <div
              key={asset.assetId}
              className="rounded-2xl border border-white/6 bg-white/[0.03] p-3"
            >
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white">{asset.title}</div>
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-500">
                    {asset.kind} · lift {asset.contextualLift}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <MicroPill className={heatClass(asset.conversionRate)}>
                    {(asset.conversionRate * 100).toFixed(1)}%
                  </MicroPill>
                  <MicroPill className="border-white/10 bg-white/[0.04] text-zinc-300">
                    rank {asset.avgRank?.toFixed(2) ?? "—"}
                  </MicroPill>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(asset.reasons || []).slice(0, 5).map((reason) => (
                  <MicroPill
                    key={`${asset.assetId}-${reason}`}
                    className="border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#E7D8A5]"
                  >
                    {reason}
                  </MicroPill>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function KnowledgeGraph({
  frameworks = [],
  efficacyRows = [],
  overlayMode = "canonical",
}: KnowledgeGraphProps) {
  const topRows = React.useMemo(
    () =>
      [...efficacyRows]
        .sort((a, b) => (b.contextualConversionRate || 0) - (a.contextualConversionRate || 0))
        .slice(0, 4),
    [efficacyRows]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-white/6 bg-zinc-900/30 p-6">
        <div className="mb-5 flex items-center gap-2">
          <Network className="h-4 w-4 text-amber-400" />
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400">
            Strategic Topology
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-2xl border border-white/6 bg-black/20 p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
              Framework Nodes
            </div>
            <div className="mt-3 text-3xl font-light text-white">{frameworks.length}</div>
            <div className="mt-2 text-sm text-zinc-500">Static architecture registered</div>
          </div>

          <div className="rounded-2xl border border-white/6 bg-black/20 p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
              Canonical Clusters
            </div>
            <div className="mt-3 text-3xl font-light text-white">{efficacyRows.length}</div>
            <div className="mt-2 text-sm text-zinc-500">Decision contexts in motion</div>
          </div>

          <div className="rounded-2xl border border-white/6 bg-black/20 p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
              Hot Clusters
            </div>
            <div className="mt-3 text-3xl font-light text-white">
              {topRows.filter((row) => row.contextualConversionRate >= 0.18).length}
            </div>
            <div className="mt-2 text-sm text-zinc-500">High-efficacy concentration</div>
          </div>

          <div className="rounded-2xl border border-white/6 bg-black/20 p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
              Total Sessions
            </div>
            <div className="mt-3 text-3xl font-light text-white">
              {efficacyRows.reduce((sum, row) => sum + (row.totalSessions || 0), 0)}
            </div>
            <div className="mt-2 text-sm text-zinc-500">Tracked across canonical contexts</div>
          </div>

          <div className="rounded-2xl border border-white/6 bg-black/20 p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
              Total Conversions
            </div>
            <div className="mt-3 text-3xl font-light text-white">
              {efficacyRows.reduce((sum, row) => sum + (row.conversionCount || 0), 0)}
            </div>
            <div className="mt-2 text-sm text-zinc-500">Decision path outcomes</div>
          </div>
        </div>
      </div>

      {overlayMode === "canonical" ? (
        <div className="space-y-6">
          <div className="rounded-[30px] border border-white/6 bg-zinc-900/30 p-6">
            <div className="mb-5 flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400">
                Canonical Decision Cluster Overlay
              </span>
            </div>

            {topRows.length ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {topRows.map((row) => (
                  <ClusterNodeCard key={row.joinKey} row={row} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/6 bg-black/20 p-4 text-sm text-zinc-500">
                No canonical efficacy rows available to overlay.
              </div>
            )}
          </div>

          <div className="rounded-[30px] border border-white/6 bg-zinc-900/30 p-6">
            <div className="mb-5 flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400">
                Adjacency Interpretation
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/6 bg-black/20 p-5">
                <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
                  Structural Layer
                </div>
                <p className="text-sm leading-7 text-zinc-300">
                  The topology now shows which governance states, authority types, and
                  readiness tiers are actually producing conversion rather than merely
                  existing as abstract categories.
                </p>
              </div>

              <div className="rounded-2xl border border-white/6 bg-black/20 p-5">
                <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
                  Failure Layer
                </div>
                <p className="text-sm leading-7 text-zinc-300">
                  Failure modes and interventions now sit adjacent to efficacy heat, so
                  the graph stops pretending performance is disconnected from the
                  decision logic that produced it.
                </p>
              </div>

              <div className="rounded-2xl border border-white/6 bg-black/20 p-5">
                <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
                  Recommendation Layer
                </div>
                <p className="text-sm leading-7 text-zinc-300">
                  Ranked asset rationale is part of the same surface, which means the
                  estate can now inspect not just what converted, but why it was
                  surfaced in the first place.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
