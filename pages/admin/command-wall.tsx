/* pages/admin/command-wall.tsx — DIRECTORATE CONTROL SURFACE */
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";

import { KnowledgeGraph } from "@/components/Intelligence/KnowledgeGraph";
import { SecurityDashboard } from "@/components/admin/SecurityDashboard";
import { DiscoveryOverlay } from "@/components/Intelligence/DiscoveryOverlay";
import { adminFetch } from "@/lib/api/admin-client";
import { ContextualContextCard } from "@/components/admin/decision/ContextualContextCard";
import { RankedAssetTable } from "@/components/admin/decision/RankedAssetTable";

import {
  ShieldCheck,
  Search,
  FileText,
  Settings,
  Bell,
  Cpu,
  Loader2,
  Activity,
  Database,
  BarChart3,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const getServerSideProps: GetServerSideProps = async () => {
  console.log("[PAGE_DATA] pages/admin/command-wall.tsx getServerSideProps START");
  try {
  return { props: {} };

  } finally {
    console.log("[PAGE_DATA] pages/admin/command-wall.tsx getServerSideProps END");
  }
};

type CommandView = "TOPOLOGY" | "SECURITY" | "LIBRARY" | "DECISION";

type AuditLog = {
  id: string;
  severity?: string;
  createdAt?: string;
  actorEmail?: string | null;
  resourceName?: string | null;
  action?: string;
};

type RankedAsset = {
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
  rankedAssets: RankedAsset[];
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const CommandWallPage: NextPage = () => {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [activeView, setActiveView] = React.useState<CommandView>("TOPOLOGY");
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [efficacyRows, setEfficacyRows] = React.useState<EfficacyRow[]>([]);
  const [selectedJoinKey, setSelectedJoinKey] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [rebuilding, setRebuilding] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function syncCommandWall() {
      try {
        setLoading(true);
        setError(null);

        const [logsRes, efficacyRes] = await Promise.all([
          adminFetch("/api/admin/system/logs?limit=200"),
          adminFetch("/api/admin/decision/contextual-efficacy?limit=12"),
        ]);

        const logsData = await logsRes.json();
        const efficacyData = await efficacyRes.json();

        if (logsData?.ok) setLogs(logsData.logs || []);
        if (efficacyData?.ok) {
          const rows = efficacyData.rows || [];
          setEfficacyRows(rows);
          if (rows.length > 0) {
            setSelectedJoinKey((prev) => prev || rows[0].joinKey);
          }
        }
      } catch (err) {
        console.error("[COMMAND_WALL_SYNC_ERROR]", err);
        setError("Failed to synchronize command wall intelligence.");
      } finally {
        setLoading(false);
      }
    }

    void syncCommandWall();
  }, []);

  async function rebuildEfficacy() {
    try {
      setRebuilding(true);
      setError(null);

      const res = await adminFetch("/api/admin/decision/rebuild-contextual-efficacy", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to rebuild contextual efficacy.");
      }

      const refreshed = await adminFetch("/api/admin/decision/contextual-efficacy?limit=12");
      const refreshedData = await refreshed.json();

      if (refreshedData?.ok) {
        const rows = refreshedData.rows || [];
        setEfficacyRows(rows);
        if (rows.length > 0) {
          setSelectedJoinKey(rows[0].joinKey);
        }
      }
    } catch (err) {
      console.error("[COMMAND_WALL_REBUILD_ERROR]", err);
      setError(err instanceof Error ? err.message : "Failed to rebuild efficacy.");
    } finally {
      setRebuilding(false);
    }
  }

  const selectedRow = React.useMemo(() => {
    return efficacyRows.find((row) => row.joinKey === selectedJoinKey) || efficacyRows[0] || null;
  }, [efficacyRows, selectedJoinKey]);

  const threatElevated = logs.some((l) => String(l.severity || "").toLowerCase() === "critical");

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-amber-500/30">
      <DiscoveryOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <nav className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1680px] items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-500">
                <ShieldCheck className="text-black" size={20} />
              </div>
              <span className="text-xl font-black uppercase tracking-tighter">
                Directorate_OS
              </span>
            </div>

            <div className="hidden h-8 w-px bg-white/10 md:block" />

            <div className="hidden items-center gap-6 md:flex">
              <NavButton
                active={activeView === "TOPOLOGY"}
                onClick={() => setActiveView("TOPOLOGY")}
                label="Strategic Topology"
              />
              <NavButton
                active={activeView === "DECISION"}
                onClick={() => setActiveView("DECISION")}
                label="Decision Intelligence"
              />
              <NavButton
                active={activeView === "SECURITY"}
                onClick={() => setActiveView("SECURITY")}
                label="Oversight & Audit"
              />
              <NavButton
                active={activeView === "LIBRARY"}
                onClick={() => setActiveView("LIBRARY")}
                label="Dossier Library"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-zinc-400 transition-all hover:bg-white/10 md:flex"
            >
              <Search size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Search Intelligence
              </span>
            </button>

            <button
              onClick={() => void rebuildEfficacy()}
              className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-300 transition hover:bg-amber-500/15 disabled:opacity-50"
              disabled={rebuilding}
            >
              {rebuilding ? <Loader2 className="animate-spin" size={14} /> : <Database size={14} />}
              Rebuild
            </button>

            <div className="cursor-pointer p-2 text-zinc-500 transition-colors hover:text-white">
              <Bell size={20} />
            </div>
            <div className="cursor-pointer p-2 text-zinc-500 transition-colors hover:text-white">
              <Settings size={20} />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1680px] px-6 py-10 md:px-8">
        {loading ? (
          <div className="flex h-[60vh] items-center justify-center gap-4 font-mono text-xs uppercase tracking-[0.3em] text-amber-500/50">
            <Loader2 className="animate-spin" size={20} />
            Initialising Strategic Interface...
          </div>
        ) : (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
              <HeaderStat
                label="System Integrity"
                value="98.4%"
                trend="+0.2"
              />
              <HeaderStat
                label="Threat Level"
                value={threatElevated ? "ELEVATED" : "NOMINAL"}
                color={threatElevated ? "text-red-500" : "text-amber-500"}
              />
              <HeaderStat
                label="Decision Contexts"
                value={String(efficacyRows.length)}
                trend="Canonical"
                color="text-cyan-400"
              />
              <HeaderStat
                label="Live Sessions"
                value={String(
                  efficacyRows.reduce((sum, row) => sum + (row.totalSessions || 0), 0)
                )}
                trend="Tracked"
                color="text-emerald-400"
              />
            </div>

            {error ? (
              <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            {activeView === "TOPOLOGY" && (
              <>
                <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <PanelShell title="Strategic Topology" icon={Activity}>
                    <KnowledgeGraph
                    frameworks={[]}
                    efficacyRows={efficacyRows}
                    overlayMode="canonical"
                   />
                  </PanelShell>

                  <PanelShell title="Live Context Leaderboard" icon={BarChart3}>
                    {efficacyRows.length === 0 ? (
                      <EmptyPanelText text="No canonical efficacy rows available." />
                    ) : (
                      <div className="space-y-3">
                        {efficacyRows.slice(0, 6).map((row) => (
                          <button
                            key={row.joinKey}
                            onClick={() => {
                              setSelectedJoinKey(row.joinKey);
                              setActiveView("DECISION");
                            }}
                            className="w-full rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-left transition hover:border-amber-500/20 hover:bg-white/[0.05]"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500">
                                  {row.context.route} · {row.context.readinessTier}
                                </div>
                                <div className="mt-1 text-sm font-medium text-white">
                                  {row.context.orgState} · {row.context.authorityType}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {(row.context.dominantDomains || []).slice(0, 3).map((item) => (
                                    <MiniPill key={item}>{item}</MiniPill>
                                  ))}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-xs text-zinc-400">
                                  {(row.contextualConversionRate * 100).toFixed(1)}%
                                </div>
                                <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-600">
                                  conversion
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </PanelShell>
                </div>
              </>
            )}

            {activeView === "DECISION" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_1fr]">
                  <PanelShell title="Canonical Context Registry" icon={Sparkles}>
                    {efficacyRows.length === 0 ? (
                      <EmptyPanelText text="No rebuilt contextual efficacy rows found." />
                    ) : (
                      <div className="space-y-3">
                        {efficacyRows.map((row) => {
                          const selected = row.joinKey === selectedJoinKey;
                          return (
                            <button
                              key={row.joinKey}
                              onClick={() => setSelectedJoinKey(row.joinKey)}
                              className={cx(
                                "w-full rounded-2xl border p-4 text-left transition",
                                selected
                                  ? "border-amber-500/25 bg-amber-500/10"
                                  : "border-white/6 bg-white/[0.03] hover:border-white/12 hover:bg-white/[0.05]"
                              )}
                            >
                              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500">
                                {row.context.route} · {row.context.readinessTier}
                              </div>
                              <div className="mt-1 text-sm font-medium text-white">
                                {row.context.orgState}
                              </div>
                              <div className="mt-2 text-xs text-zinc-400">
                                {row.context.authorityType} · {row.context.revenueBand} ·{" "}
                                {row.context.marketRiskBand}
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-600">
                                  {row.totalSessions} sessions
                                </span>
                                <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-400">
                                  {(row.contextualConversionRate * 100).toFixed(1)}%
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </PanelShell>

                  <div className="space-y-6">
                    {selectedRow ? (
                      <>
                        <ContextualContextCard
                          context={selectedRow.context}
                          title="Live Canonical Context"
                        />
                        <RankedAssetTable
                          items={selectedRow.rankedAssets || []}
                          title="Ranked Asset Rationale"
                        />
                      </>
                    ) : (
                      <PanelShell title="Decision Intelligence" icon={ArrowRight}>
                        <EmptyPanelText text="Select a canonical context row to inspect governed recommendations." />
                      </PanelShell>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeView === "SECURITY" && (
             <SecurityDashboard
             logs={logs}
             efficacyRows={efficacyRows}
             overlayMode="canonical"
            />
            )}

            {activeView === "LIBRARY" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="group rounded-3xl border border-white/5 bg-zinc-900/40 p-8 transition-all hover:border-amber-500/50"
                  >
                    <FileText
                      className="mb-6 text-zinc-600 transition-colors group-hover:text-amber-500"
                      size={24}
                    />
                    <h4 className="mb-2 text-lg font-bold uppercase tracking-tight">
                      Institutional Succession 0{i + 1}
                    </h4>
                    <p className="mb-6 line-clamp-2 font-mono text-[10px] uppercase text-zinc-500">
                      Strategic_Verification_Dossier_PR_0{i + 1}
                    </p>
                    <button className="w-full rounded-xl border border-white/5 bg-white/5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-all hover:bg-white hover:text-black">
                      Access Intelligence
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="fixed bottom-0 z-50 flex w-full items-center justify-between border-t border-white/5 bg-black/80 px-6 py-3 backdrop-blur-md md:px-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div
              className={`h-1.5 w-1.5 rounded-full ${
                loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
              Neural_Engine_{loading ? "Syncing" : "Online"}
            </span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Cpu size={12} className="text-zinc-700" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
              Canonical_Context_Synchronized
            </span>
          </div>
        </div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-700">
          © 2026 Abraham of London // Level 4 Authorization Required
        </div>
      </footer>
    </div>
  );
};

export default withAdminAuth(CommandWallPage);

type NavButtonProps = { active: boolean; onClick: () => void; label: string };
const NavButton = ({ active, onClick, label }: NavButtonProps) => (
  <button
    onClick={onClick}
    className={`relative py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
      active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
    }`}
  >
    {label}
    {active && (
      <div className="animate-in fade-in zoom-in absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-500 duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
    )}
  </button>
);

type HeaderStatProps = {
  label: string;
  value: string;
  trend?: string;
  color?: string;
};

const HeaderStat = ({
  label,
  value,
  trend,
  color = "text-white",
}: HeaderStatProps) => (
  <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 shadow-sm transition-colors hover:border-white/10">
    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
      {label}
    </p>
    <div className="flex items-baseline gap-3">
      <h4 className={`font-mono text-2xl font-bold ${color}`}>{value}</h4>
      {trend ? (
        <span className="font-mono text-[10px] text-emerald-500">{trend}</span>
      ) : null}
    </div>
  </div>
);

function PanelShell({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-white/5 bg-zinc-900/30 p-6">
      <div className="mb-5 flex items-center gap-2">
        <Icon className="h-4 w-4 text-amber-500/80" />
        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-400">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function EmptyPanelText({ text }: { text: string }) {
  return <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4 text-sm text-zinc-500">{text}</div>;
}

function MiniPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.12em] text-zinc-300">
      {children}
    </span>
  );
}