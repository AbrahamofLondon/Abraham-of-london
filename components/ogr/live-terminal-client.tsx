"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Menu,
  Search,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ContagionMap } from "@/components/admin/reporting/contagion-map";
import { TerminalConstitutionSurface } from "@/components/ogr/TerminalConstitutionSurface";
import type { CanonicalSections } from "@/lib/decision/canonical-sections";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "POSTURE" | "INTERVENTIONS" | "MARKET";
type LogLevel = "SYSTEM" | "AUTH" | "PROC" | "SUCCESS" | "ERROR" | "CONSTITUTION";
type LogLine = { level: LogLevel; message: string };

interface CampaignBrief {
  id: string;
  title: string;
  organisation: string;
  participantCount: number;
  status: string;
  friction: number;
  category: string;
  tags: string[];
  createdAt: string;
}

interface OGRLiveTerminalClientProps {
  initialCampaigns?: CampaignBrief[];
}

// ─── Canonical Contract Types ────────────────────────────────────────────────
// Following the canonical order:
// executiveSummary, constitutionalPosture, strategicDomainAnalysis,
// financialExposure, integritySnapshot, governedRecommendations,
// priorityStack, failureModes, requiredInterventions, dominantDomains,
// worldviewAnchors, sponsorTypes, rationale

interface CanonicalSection {
  executiveSummary?: {
    route: string;
    state: string;
    narrative: string;
  };
  constitutionalPosture?: {
    route: string;
    orgState: string;
    readinessTier: string;
    authorityType: string;
    priority: string;
    temperature: string;
    marketRiskBand: string;
    revenueBand: string;
    clarityScore?: number;
    authorityScore?: number;
    governanceScore?: number;
    severityScore?: number;
    revenueScore?: number;
    dominantDomains: string[];
    failureModes: string[];
    requiredInterventions: string[];
    sponsorTypes?: string[];
    worldviewAnchors?: string[];
    narrativeSummary: string;
    rationale?: string[];
  };
  strategicDomainAnalysis?: {
    temperature: string;
    domains: Array<{
      domain: string;
      intentScore: number;
      realityScore: number;
      dissonance: number;
    }>;
  };
  financialExposure?: {
    marketRiskBand: string;
    revenueBand: string;
    revenueScore: number;
  };
  integritySnapshot?: {
    clarityScore: number;
    authorityScore: number;
    governanceScore: number;
  };
  governedRecommendations?: {
    readinessTier: string;
    authorityType: string;
    summary: string;
    nextAction: string;
    recommendations: Array<{
      id: string;
      title: string;
      href?: string | null;
      kind: string;
      score: number;
      summary: string;
      reasons: string[];
    }>;
  };
  priorityStack?: Array<{
    priority: string;
    domain: string;
    urgency: number;
  }>;
  failureModes?: Array<{
    mode: string;
    severity: number;
    probability: number;
  }>;
  requiredInterventions?: string[];
  dominantDomains?: string[];
  worldviewAnchors?: string[];
  sponsorTypes?: string[];
  rationale?: string[];
}

interface CanonicalEnvelope {
  ok: boolean;
  sections: CanonicalSection;
}

// ─── Utilities & sub-components ───────────────────────────────────────────────

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function levelTone(level: LogLevel) {
  switch (level) {
    case "SUCCESS":
      return "text-emerald-300";
    case "ERROR":
      return "text-red-300";
    case "PROC":
      return "text-sky-300";
    case "CONSTITUTION":
      return "text-amber-300";
    default:
      return "text-white/72";
  }
}

function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-white/36">
      {children}
    </span>
  );
}

function TerminalPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "terminal-panel relative overflow-hidden rounded-[24px] border border-white/[0.08]",
        "bg-[linear-gradient(180deg,rgba(12,12,13,0.96)_0%,rgba(7,7,8,0.99)_100%)]",
        "shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,169,106,0.06),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OGRLiveTerminalClient({
  initialCampaigns = [],
}: OGRLiveTerminalClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("POSTURE");
  const [campaigns, setCampaigns] = useState<CampaignBrief[]>(initialCampaigns);
  const [isLoading, setIsLoading] = useState(!initialCampaigns.length);
  const [isRegistryOpen, setIsRegistryOpen] = useState(true);
  const [selectedBriefs, setSelectedBriefs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [canonical, setCanonical] = useState<CanonicalEnvelope | null>(null);

  const [log, setLog] = useState<LogLine[]>([
    { level: "SYSTEM", message: "OGR Core initialized" },
    { level: "AUTH", message: "Node LONDON_CANARY_WHARF active" },
    { level: "SYSTEM", message: "Awaiting campaign injection..." },
  ]);

  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ledger
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  // Initial campaign fetch
  useEffect(() => {
    if (initialCampaigns.length > 0) {
      setIsLoading(false);
      setLog((prev) => [
        ...prev,
        { level: "SUCCESS", message: `Loaded ${initialCampaigns.length} campaigns` },
      ]);
      return;
    }

    async function fetchCampaigns() {
      try {
        const response = await fetch("/api/admin/campaigns?status=active");
        if (!response.ok) throw new Error("Failed to fetch campaigns");
        const data = await response.json();
        setCampaigns(data.campaigns || []);
        setLog((prev) => [
          ...prev,
          {
            level: "SUCCESS",
            message: `Loaded ${data.campaigns?.length || 0} active campaigns`,
          },
        ]);
      } catch (error) {
        setLog((prev) => [
          ...prev,
          {
            level: "ERROR",
            message: `Failed to load campaigns: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchCampaigns();
  }, [initialCampaigns]);

  const filteredBriefs = useMemo(() => {
    return campaigns.filter((brief) => {
      const q = searchQuery.toLowerCase();
      return (
        brief.title.toLowerCase().includes(q) ||
        brief.id.toLowerCase().includes(q) ||
        brief.organisation.toLowerCase().includes(q)
      );
    });
  }, [campaigns, searchQuery]);

  function toggleBrief(id: string) {
    setSelectedBriefs((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  }

  async function runAudit() {
    if (selectedBriefs.length === 0) {
      toast.error("Registry injection required", {
        description: "Select campaigns to prime the constitutional terminal.",
      });
      setIsRegistryOpen(true);
      return;
    }

    setLog((prev) => [
      ...prev,
      { level: "PROC", message: `Injecting ${selectedBriefs.length} campaign contexts` },
    ]);

    try {
      const response = await fetch("/api/live/constitutional-posture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ campaignIds: selectedBriefs }),
      });
      
      if (!response.ok) throw new Error("Constitutional terminal unavailable");

      const data: CanonicalEnvelope = await response.json();
      setCanonical(data);

      // Extract route from canonical order: constitutionalPosture or executiveSummary
      const route = data.sections.constitutionalPosture?.route || 
                    data.sections.executiveSummary?.route || 
                    "IDLE";
      const readinessTier = data.sections.constitutionalPosture?.readinessTier || 
                           data.sections.governedRecommendations?.readinessTier || 
                           "UNKNOWN";
      const orgState = data.sections.constitutionalPosture?.orgState || 
                      data.sections.executiveSummary?.state || 
                      "IDLE";

      setLog((prev) => [
        ...prev,
        {
          level: "CONSTITUTION",
          message: `Posture issued: ${route} · ${readinessTier} · ${orgState}`,
        },
      ]);

      toast.success("Constitutional posture issued");
    } catch (error) {
      setLog((prev) => [
        ...prev,
        {
          level: "ERROR",
          message: `Audit interrupted: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
      ]);
      toast.error("Constitutional terminal error");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C9A96A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-xs uppercase tracking-wider">
            Loading constitutional terminal...
          </p>
        </div>
      </div>
    );
  }

  // Extract display values following canonical order
  const route = canonical?.sections.constitutionalPosture?.route || 
                canonical?.sections.executiveSummary?.route || 
                "IDLE";
  
  const summary = canonical?.sections.governedRecommendations?.summary ||
                  canonical?.sections.constitutionalPosture?.narrativeSummary ||
                  "Awaiting constitutional posture issuance.";
  
  const nextAction = canonical?.sections.governedRecommendations?.nextAction ||
                     "Select campaigns and issue constitutional posture.";

  const recommendations = canonical?.sections.governedRecommendations?.recommendations || [];
  const constitutionForSurface = canonical?.sections.constitutionalPosture || null;
  const dominantDomains = canonical?.sections.dominantDomains || 
                          canonical?.sections.constitutionalPosture?.dominantDomains || [];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-[1800px] overflow-hidden">

        {/* ── Sidebar: Campaign Index ──────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {isRegistryOpen && (
            <motion.aside
              initial={{ x: -360, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -360, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-[100] w-[340px] md:relative md:z-20"
            >
              <div className="flex h-full flex-col border-r border-white/[0.08] bg-[linear-gradient(180deg,rgba(9,9,10,0.98)_0%,rgba(5,5,6,1)_100%)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div className="border-b border-white/[0.07] px-5 py-5">
                  <div className="mb-3 flex items-center justify-between">
                    <MonoLabel>Campaign Index</MonoLabel>
                    <button
                      onClick={() => setIsRegistryOpen(false)}
                      className="rounded-md border border-white/[0.08] p-1.5 text-white/45 transition hover:bg-white/[0.05] hover:text-white/80"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/28" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search campaigns..."
                      className="w-full rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-9 py-3 text-[11px] text-white outline-none placeholder:text-white/24 focus:border-[#C9A96A]/28"
                    />
                  </div>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4">
                  <div className="space-y-2.5">
                    {filteredBriefs.map((brief) => (
                      <button
                        key={brief.id}
                        onClick={() => toggleBrief(brief.id)}
                        className={cx(
                          "group w-full rounded-[18px] border p-3 text-left transition-all duration-300",
                          selectedBriefs.includes(brief.id)
                            ? "border-[#C9A96A]/35 bg-[#C9A96A]/[0.06]"
                            : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.03]"
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/34">
                            {brief.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[13px] leading-5 text-white/82">
                          {brief.title}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/28">
                            {brief.organisation}
                          </span>
                          <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/34">
                            {brief.participantCount} participants
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/[0.07] px-4 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <MonoLabel>Selected Campaigns</MonoLabel>
                    <span className="font-mono text-[10px] text-white/72">
                      {selectedBriefs.length}
                    </span>
                  </div>

                  <button
                    onClick={runAudit}
                    className="w-full rounded-[14px] border border-[#C9A96A]/30 bg-[#C9A96A]/[0.12] px-4 py-3 font-mono text-[9px] uppercase tracking-[0.24em] text-[#E4CB98] transition hover:bg-[#C9A96A]/[0.16]"
                  >
                    Prime constitutional audit
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[rgba(8,8,9,0.88)] px-5 py-4 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {!isRegistryOpen && (
                  <button
                    onClick={() => setIsRegistryOpen(true)}
                    className="rounded-[12px] border border-white/[0.08] bg-white/[0.03] p-2 text-white/55 hover:bg-white/[0.05]"
                  >
                    <Menu size={15} />
                  </button>
                )}
                <div>
                  <div className="truncate text-[13px] font-medium text-white/92">
                    Sovereign Live Terminal
                  </div>
                  <div className="mt-1 font-mono text-[7px] uppercase tracking-[0.22em] text-white/30">
                    Protocol: Constitutional Intelligence / Node: Canary Wharf
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(["POSTURE", "INTERVENTIONS", "MARKET"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cx(
                      "rounded-[12px] border px-3 py-2 font-mono text-[8px] uppercase tracking-[0.20em] transition",
                      viewMode === mode
                        ? "border-[#C9A96A]/30 bg-[#C9A96A]/[0.12] text-[#E4CB98]"
                        : "border-white/[0.08] bg-white/[0.03] text-white/45 hover:text-white/72"
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <div className="flex-1 p-6">
            {/* Top status grid */}
            <div className="grid gap-6 lg:grid-cols-3 mb-6">
              <TerminalPanel className="p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#C9A96A]" />
                  <MonoLabel>Terminal Status</MonoLabel>
                </div>
                <div className="mt-5 text-3xl font-light tracking-tight text-white">
                  {route}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/58">
                  {summary}
                </p>
              </TerminalPanel>

              <TerminalPanel className="p-6">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#C9A96A]" />
                  <MonoLabel>Live Ledger</MonoLabel>
                </div>
                <div className="mt-4 space-y-1 font-mono text-[8px] text-white/60 max-h-96 overflow-y-auto custom-scrollbar">
                  {log.slice(-18).map((line, i) => (
                    <p key={i} className={levelTone(line.level)}>
                      [{line.level}] {line.message}
                    </p>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </TerminalPanel>

              <TerminalPanel className="p-6">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#C9A96A]" />
                  <MonoLabel>Action State</MonoLabel>
                </div>
                <div className="mt-5 text-sm leading-7 text-white/62">
                  {nextAction}
                </div>
              </TerminalPanel>
            </div>

            {/* Constitutional surface — using canonical contract */}
            {canonical ? (
              <TerminalConstitutionSurface
                sections={canonical.sections as unknown as CanonicalSections}
              />
            ) : null}

            {/* Market / contagion map — only when MARKET view is active */}
            {canonical && viewMode === "MARKET" ? (
              <div className="mt-6">
                <ContagionMap
                  data={dominantDomains.map((domain, index) => ({
                    source: domain,
                    target:
                      dominantDomains[
                        (index + 1) % dominantDomains.length
                      ] || domain,
                    impact: 40 + index * 10,
                    severity: "moderate",
                    confidence: 0.72,
                  }))}
                  isLoading={false}
                  onRecalculate={runAudit}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}