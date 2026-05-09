/* components/Intelligence/DiscoveryOverlay.tsx
 * ADMIN_ONLY: do not import into public or authenticated user-facing routes.
 */
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  X,
  FileText,
  ShieldCheck,
  Layers3,
  Flame,
  ArrowRight,
  Activity,
  Compass,
} from "lucide-react";

type DiscoveryAssetResult = {
  type: "asset";
  id: string;
  title: string;
  href?: string | null;
  kind: string;
  summary?: string | null;
  tags?: string[];
  reasons?: string[];
};

type DiscoveryAuditResult = {
  type: "audit";
  id: string;
  action: string;
  actorEmail?: string | null;
  resourceName?: string | null;
  severity?: string | null;
  createdAt?: string | null;
};

type DiscoveryContextResult = {
  type: "context";
  id: string;
  joinKey: string;
  route: string;
  readinessTier: string;
  authorityType: string;
  revenueBand: string;
  marketRiskBand: string;
  orgState: string;
  dominantDomains: string[];
  requiredInterventions: string[];
  failureModes: string[];
  narrativeSummary?: string | null;
  efficacyRate?: number;
  sessionCount?: number;
};

type DiscoveryRecommendationClusterResult = {
  type: "cluster";
  id: string;
  joinKey: string;
  route: string;
  readinessTier: string;
  authorityType: string;
  topRecommendations: Array<{
    assetId: string;
    title: string;
    kind: string;
    conversionRate: number;
    reasons: string[];
  }>;
  contextualConversionRate: number;
};

type DiscoveryResult =
  | DiscoveryAssetResult
  | DiscoveryAuditResult
  | DiscoveryContextResult
  | DiscoveryRecommendationClusterResult;

type DiscoveryResponse = {
  ok: boolean;
  results: DiscoveryResult[];
  error?: string;
};

type DiscoveryOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function routeTone(route: string) {
  const value = String(route || "").toUpperCase();
  if (value === "STRATEGY") {
    return "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#E7D8A5]";
  }
  if (value === "DIAGNOSTIC") {
    return "border-blue-500/25 bg-blue-500/10 text-blue-300";
  }
  return "border-zinc-500/25 bg-zinc-500/10 text-zinc-300";
}

function heatTone(rate: number) {
  if (rate >= 0.35) return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
  if (rate >= 0.18) return "border-amber-500/25 bg-amber-500/10 text-amber-300";
  return "border-red-500/25 bg-red-500/10 text-red-300";
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

function EmptyState({ query }: { query: string }) {
  return (
    <div className="rounded-3xl border border-white/6 bg-white/[0.02] p-8 text-center">
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
        No intelligence found
      </div>
      <p className="mt-3 text-sm text-zinc-400">
        {query
          ? `No assets, contexts, clusters, or audit events matched “${query}”.`
          : "Search the estate by asset, route, domain, intervention, authority, or actor."}
      </p>
    </div>
  );
}

function AssetCard({ item }: { item: DiscoveryAssetResult }) {
  return (
    <div className="rounded-3xl border border-white/6 bg-zinc-900/25 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#D4AF37]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
              Asset
            </span>
          </div>
          <h4 className="mt-3 text-base font-medium text-white">{item.title}</h4>
          {item.summary ? (
            <p className="mt-2 text-sm leading-7 text-zinc-400">{item.summary}</p>
          ) : null}
        </div>

        {item.href ? (
          <Link
            href={item.href}
            className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-white/[0.06]"
          >
            Open
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MiniPill className="border-white/10 bg-white/[0.04] text-zinc-300">
          {item.kind}
        </MiniPill>
        {(item.tags || []).slice(0, 5).map((tag) => (
          <MiniPill
            key={`${item.id}-${tag}`}
            className="border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#E7D8A5]"
          >
            {tag}
          </MiniPill>
        ))}
        {(item.reasons || []).slice(0, 4).map((reason) => (
          <MiniPill
            key={`${item.id}-reason-${reason}`}
            className="border-blue-500/20 bg-blue-500/10 text-blue-300"
          >
            {reason}
          </MiniPill>
        ))}
      </div>
    </div>
  );
}

function AuditCard({ item }: { item: DiscoveryAuditResult }) {
  return (
    <div className="rounded-3xl border border-white/6 bg-zinc-900/25 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
              Audit Event
            </span>
          </div>
          <div className="mt-3 text-sm text-white">
            {item.actorEmail || "Unknown actor"} — {item.resourceName || item.action}
          </div>
          {item.createdAt ? (
            <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-500">
              {new Date(item.createdAt).toLocaleString()}
            </div>
          ) : null}
        </div>

        <MiniPill
          className={
            String(item.severity || "").toLowerCase() === "critical"
              ? "border-red-500/25 bg-red-500/10 text-red-300"
              : String(item.severity || "").toLowerCase() === "high"
              ? "border-orange-500/25 bg-orange-500/10 text-orange-300"
              : "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
          }
        >
          {item.severity || "nominal"}
        </MiniPill>
      </div>
    </div>
  );
}

function ContextCard({ item }: { item: DiscoveryContextResult }) {
  const efficacy = Number(item.efficacyRate || 0);

  return (
    <div className="rounded-3xl border border-white/6 bg-zinc-900/25 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#D4AF37]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
              Canonical Context
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <MiniPill className={routeTone(item.route)}>{item.route}</MiniPill>
            <MiniPill className="border-white/10 bg-white/[0.04] text-zinc-300">
              {item.readinessTier}
            </MiniPill>
            <MiniPill className="border-white/10 bg-white/[0.04] text-zinc-300">
              {item.orgState}
            </MiniPill>
            <MiniPill className={heatTone(efficacy)}>
              {(efficacy * 100).toFixed(1)}% efficacy
            </MiniPill>
          </div>

          <div className="mt-4 text-sm text-white">
            {item.authorityType} · {item.revenueBand} · {item.marketRiskBand}
          </div>

          {item.narrativeSummary ? (
            <p className="mt-3 text-sm leading-7 text-zinc-400">
              {item.narrativeSummary}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {(item.dominantDomains || []).slice(0, 5).map((domain) => (
              <MiniPill
                key={`${item.id}-domain-${domain}`}
                className="border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#E7D8A5]"
              >
                {domain}
              </MiniPill>
            ))}
            {(item.requiredInterventions || []).slice(0, 4).map((intervention) => (
              <MiniPill
                key={`${item.id}-intervention-${intervention}`}
                className="border-blue-500/20 bg-blue-500/10 text-blue-300"
              >
                {intervention}
              </MiniPill>
            ))}
            {(item.failureModes || []).slice(0, 4).map((failure) => (
              <MiniPill
                key={`${item.id}-failure-${failure}`}
                className="border-red-500/20 bg-red-500/10 text-red-300"
              >
                {failure}
              </MiniPill>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3 text-right">
          <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-500">
            Sessions
          </div>
          <div className="mt-2 text-2xl font-light text-white">
            {item.sessionCount ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClusterCard({ item }: { item: DiscoveryRecommendationClusterResult }) {
  return (
    <div className="rounded-3xl border border-white/6 bg-zinc-900/25 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-[#D4AF37]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
              Recommendation Cluster
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <MiniPill className={routeTone(item.route)}>{item.route}</MiniPill>
            <MiniPill className="border-white/10 bg-white/[0.04] text-zinc-300">
              {item.readinessTier}
            </MiniPill>
            <MiniPill className="border-white/10 bg-white/[0.04] text-zinc-300">
              {item.authorityType}
            </MiniPill>
            <MiniPill className={heatTone(item.contextualConversionRate)}>
              {(item.contextualConversionRate * 100).toFixed(1)}% cluster heat
            </MiniPill>
          </div>

          <div className="mt-4 space-y-3">
            {(item.topRecommendations || []).slice(0, 3).map((rec) => (
              <div
                key={`${item.id}-${rec.assetId}`}
                className="rounded-2xl border border-white/6 bg-black/20 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-white">{rec.title}</div>
                    <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-500">
                      {rec.kind}
                    </div>
                  </div>
                  <MiniPill className={heatTone(rec.conversionRate)}>
                    {(rec.conversionRate * 100).toFixed(1)}%
                  </MiniPill>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(rec.reasons || []).slice(0, 4).map((reason) => (
                    <MiniPill
                      key={`${rec.assetId}-${reason}`}
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

        <Flame className="h-5 w-5 text-amber-400" />
      </div>
    </div>
  );
}

function ResultCard({ item }: { item: DiscoveryResult }) {
  switch (item.type) {
    case "asset":
      return <AssetCard item={item} />;
    case "audit":
      return <AuditCard item={item} />;
    case "context":
      return <ContextCard item={item} />;
    case "cluster":
      return <ClusterCard item={item} />;
    default:
      return null;
  }
}

export function DiscoveryOverlay({ isOpen, onClose }: DiscoveryOverlayProps) {
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<DiscoveryResult[]>([]);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
      }
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();

    async function runSearch() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());

        const response = await fetch(`/api/admin/discovery/search?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        const data: DiscoveryResponse = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Discovery search failed.");
        }

        setResults(Array.isArray(data.results) ? data.results : []);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Search failed.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    const timeout = window.setTimeout(runSearch, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [isOpen, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-8">
        <div className="rounded-[32px] border border-white/8 bg-[#09090B]/95 shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
          <div className="flex items-center gap-4 border-b border-white/6 px-5 py-4 md:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
              <Search className="h-4 w-4 text-[#D4AF37]" />
            </div>

            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assets, routes, domains, interventions, actors, or recommendation clusters..."
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            />

            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[78vh] overflow-y-auto p-5 md:p-6">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <MiniPill className="border-white/10 bg-white/[0.04] text-zinc-300">
                <FileText className="mr-1.5 h-3 w-3" />
                Assets
              </MiniPill>
              <MiniPill className="border-white/10 bg-white/[0.04] text-zinc-300">
                <Compass className="mr-1.5 h-3 w-3" />
                Contexts
              </MiniPill>
              <MiniPill className="border-white/10 bg-white/[0.04] text-zinc-300">
                <Layers3 className="mr-1.5 h-3 w-3" />
                Clusters
              </MiniPill>
              <MiniPill className="border-white/10 bg-white/[0.04] text-zinc-300">
                <Activity className="mr-1.5 h-3 w-3" />
                Audit
              </MiniPill>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-white/6 bg-white/[0.02] p-8 text-center">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                  Searching intelligence...
                </div>
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-red-300">
                  Discovery error
                </div>
                <p className="mt-3 text-sm text-red-200">{error}</p>
              </div>
            ) : results.length === 0 ? (
              <EmptyState query={query} />
            ) : (
              <div className="space-y-4">
                {results.map((item) => (
                  <ResultCard key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
