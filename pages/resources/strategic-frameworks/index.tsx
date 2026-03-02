/* pages/resources/strategic-frameworks/index.tsx — SSOT ALIGNED (WITH FEATURED BRANCHES) */
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  ScrollText,
  Search,
  Sparkles,
  Shield,
  Activity,
  Download,
  BookOpen,
} from "lucide-react";

import Layout from "@/components/Layout";
import { TIER_DIRECTIVES } from "@/lib/resources/tier-metadata";

// Canonical tier labeling + normalization (SSOT)
import tiers from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

// ✅ SSOT static registry (ONLY exports that actually exist)
import {
  LIBRARY_HREF as LIBRARY_HREF_SSOT,
  getAllFrameworks,
  type Framework,
} from "@/lib/resources/strategic-frameworks.static";

interface PageProps {
  frameworks: Framework[];
  categories: string[];
  isFallbackData: boolean;
}

const LIBRARY_HREF = LIBRARY_HREF_SSOT || "/resources/strategic-frameworks";

type AccentKey = "gold" | "emerald" | "blue" | "rose" | "indigo";

const ACCENTS: Record<AccentKey, { border: string; chip: string; link: string; glow: string }> = {
  gold: {
    border: "border-amber-400/20 hover:border-amber-400/35",
    chip: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    link: "text-amber-200 hover:text-amber-100",
    glow: "hover:shadow-2xl hover:shadow-amber-900/15",
  },
  emerald: {
    border: "border-emerald-400/20 hover:border-emerald-400/35",
    chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    link: "text-emerald-200 hover:text-emerald-100",
    glow: "hover:shadow-2xl hover:shadow-emerald-900/15",
  },
  blue: {
    border: "border-sky-400/20 hover:border-sky-400/35",
    chip: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    link: "text-sky-200 hover:text-sky-100",
    glow: "hover:shadow-2xl hover:shadow-sky-900/15",
  },
  rose: {
    border: "border-rose-400/20 hover:border-rose-400/35",
    chip: "border-rose-400/25 bg-rose-400/10 text-rose-200",
    link: "text-rose-200 hover:text-rose-100",
    glow: "hover:shadow-2xl hover:shadow-rose-900/15",
  },
  indigo: {
    border: "border-indigo-400/20 hover:border-indigo-400/35",
    chip: "border-indigo-400/25 bg-indigo-400/10 text-indigo-200",
    link: "text-indigo-200 hover:text-indigo-100",
    glow: "hover:shadow-2xl hover:shadow-indigo-900/15",
  },
};

function normalizeAccent(x: unknown): AccentKey {
  const s = String(x || "").trim().toLowerCase();
  if (s === "gold" || s === "emerald" || s === "blue" || s === "rose" || s === "indigo") return s;
  return "gold";
}

function joinTierLabels(tier: Framework["tier"]): string {
  const t = Array.isArray(tier) ? tier : [String(tier)];
  return t.map((x) => String(x).trim()).filter(Boolean).join(" • ");
}

/**
 * ✅ Deterministic access policy (SSG-safe)
 * Strategic Frameworks are “above” Surrender.
 * Brand-language labels in framework.tier are mapped to enforcement tiers.
 */
function requiredTierFromFramework(fw: Framework): AccessTier {
  const labels = (Array.isArray(fw?.tier) ? fw.tier : [String(fw?.tier ?? "")])
    .map((x) => String(x).toLowerCase().trim());

  const set = new Set(labels);

  // strongest wins
  if (set.has("owner")) return "owner";
  if (set.has("architect") || set.has("founder") || set.has("board")) return "architect";
  if (set.has("legacy")) return "legacy";
  if (set.has("client")) return "client";
  if (set.has("inner-circle") || set.has("inner circle")) return "inner-circle";
  if (set.has("member")) return "member";
  return "public";
}

/* -----------------------------------------------------------------------------
   Featured Branches (Institutional Sub-Hubs)
----------------------------------------------------------------------------- */
function FeaturedBranches(): React.ReactElement {
  const branches = [
    {
      title: "Surrender Framework",
      badge: "Featured Branch",
      body:
        "Worksheets, assessments, and tools that operationalise surrender as a discipline — clarity over impulse, obedience over outcomes.",
      href: "/resources/surrender-framework",
      metaLeft: "Worksheets · Tools · Diagnostics",
      metaRight: "Public + Tier-Gated Assets",
      Icon: Shield,
      accent: "gold" as const,
    },
    {
      title: "Download Vault Index",
      badge: "Asset Registry",
      body:
        "If you want deployables, skip the browsing: go straight to the indexed vault entry point and pull what you need.",
      href: "/vault",
      metaLeft: "Templates · Packs · Artifacts",
      metaRight: "Indexed · Reusable",
      Icon: Download,
      accent: "emerald" as const,
    },
    {
      title: "Canon Methodology",
      badge: "Spine",
      body: "Strategic frameworks are downstream of the Canon. If you need the logic behind the tools, start here.",
      href: "/canon",
      metaLeft: "Doctrine · Purpose · Governance",
      metaRight: "Multi-Volume System",
      Icon: BookOpen,
      accent: "blue" as const,
    },
  ];

  return (
    <section className="pt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <Sparkles className="h-4 w-4 text-white/70" />
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70">
                Featured Entrances
              </span>
            </div>
            <h2 className="mt-4 font-serif text-2xl md:text-3xl font-bold text-white tracking-tight">
              Branches that deserve a front door.
            </h2>
            <p className="mt-2 max-w-3xl text-sm md:text-base text-white/60 leading-relaxed">
              Controlled pathways into sub-systems. No clutter. No wandering. Pick the lane and move.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-white/35">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            curated · indexed · maintained
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {branches.map((b) => {
            const A = ACCENTS[b.accent] || ACCENTS.gold;
            return (
              <Link key={b.href} href={b.href} className="group block">
                <div
                  className={[
                    "rounded-2xl border bg-gradient-to-br from-white/5 to-white/0 p-6 transition-all duration-300",
                    "hover:bg-white/10 hover:-translate-y-0.5",
                    A.border,
                    A.glow,
                  ].join(" ")}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]",
                        A.chip,
                      ].join(" ")}
                    >
                      {b.badge}
                    </span>
                    <div className="flex items-center gap-2 text-white/30">
                      <b.Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="font-serif text-xl font-semibold text-white">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{b.body}</p>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                      {b.metaLeft}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                      {b.metaRight}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-2 text-sm font-semibold ${A.link}`}>
                      Enter <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/25">
                      institutional route
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const StrategicFrameworksLibraryPage: NextPage<PageProps> = ({ frameworks, categories, isFallbackData }) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  const filteredFrameworks = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return frameworks.filter((f) => {
      const title = (f.title || "").toLowerCase();
      const one = (f.oneLiner || "").toLowerCase();
      const matchesSearch = !q || title.includes(q) || one.includes(q);

      const tierList = Array.isArray(f.tier) ? f.tier : [String(f.tier)];
      const matchesCategory =
        selectedCategory === "all" || tierList.map((x) => String(x)).includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [frameworks, searchQuery, selectedCategory]);

  const activeDirective = React.useMemo(() => {
    return TIER_DIRECTIVES[selectedCategory] || null;
  }, [selectedCategory]);

  return (
    <Layout title="Strategic Frameworks | Abraham of London" className="bg-black min-h-screen">
      {isFallbackData && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-amber-500/30 bg-amber-500/15 px-4 py-2 text-amber-200 text-xs font-semibold backdrop-blur-sm">
          Data mode: static (build-safe)
        </div>
      )}

      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[#06060b]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(245,158,11,0.10),transparent_55%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-22">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2">
              <ScrollText className="h-4 w-4 text-amber-200" />
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-200">
                Canon Offshoot · Deployable Systems
              </span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <Sparkles className="h-4 w-4 text-white/70" />
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70">
                curated · indexed · maintained
              </span>
            </span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Strategic Frameworks
          </h1>

          <p className="mt-6 max-w-3xl text-lg text-white/80 leading-relaxed font-sans">
            A disciplined library of deployable frameworks — built from Canon methodology, packaged as operator-ready tools
            for founders, institutions, and households.
          </p>

          <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{frameworks.length} frameworks active</span>
              </div>
              <div className="hidden md:block h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase">
                <Activity size={12} /> Live Intelligence Sync
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/canon"
                className="inline-flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-gray-200 hover:bg-white/[0.06] transition-all"
              >
                Enter the Canon <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED BRANCHES */}
      <FeaturedBranches />

      {/* FILTER BAR */}
      <section className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search frameworks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder:text-white/35 outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            >
              <option value="all">All Audiences</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* DIRECTIVE */}
      <section className="pt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {activeDirective && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all duration-700 animate-in fade-in slide-in-from-top-4">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">
                  <Shield size={12} /> Institutional_Directive:{" "}
                  {activeDirective.displayTier || activeDirective.tier}
                </span>
                <h2 className="text-2xl font-serif font-bold text-white uppercase tracking-tight">
                  {activeDirective.mandate}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activeDirective.focusNodes.map((node: string) => (
                  <span
                    key={node}
                    className="text-[9px] border border-zinc-800 px-3 py-1.5 rounded-md text-zinc-400 bg-black font-mono uppercase"
                  >
                    {node}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* GRID */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredFrameworks.map((framework) => {
              const accent = normalizeAccent(framework.accent);
              const A = ACCENTS[accent] || ACCENTS.gold;

              const audienceLabel = joinTierLabels(framework.tier) || "Institutional";

              const req: AccessTier = tiers.normalizeRequired(requiredTierFromFramework(framework));
              const requiredLabel = tiers.getLabel(req);

              const href = `${LIBRARY_HREF}/${encodeURIComponent(framework.slug)}`;

              return (
                <Link key={framework.slug} href={href} className="group block">
                  <div
                    className={[
                      "rounded-2xl border bg-gradient-to-br from-white/5 to-white/0 p-6 transition-all duration-300",
                      "hover:bg-white/10 hover:-translate-y-0.5",
                      A.border,
                      A.glow,
                    ].join(" ")}
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]",
                          A.chip,
                        ].join(" ")}
                      >
                        {framework.tag || "Protocol"}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono uppercase tracking-wider text-white/30 border border-white/10 px-2 py-1 rounded-full">
                          Audience: {audienceLabel}
                        </span>
                        <span className="text-[8px] font-mono uppercase tracking-wider text-amber-200/80 border border-amber-500/20 bg-amber-500/10 px-2 py-1 rounded-full">
                          Required: {requiredLabel}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-serif text-xl font-semibold text-white">{framework.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/70 font-sans">{framework.oneLiner}</p>

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                      <span className={`inline-flex items-center gap-2 text-sm font-semibold ${A.link}`}>
                        Access Dossier{" "}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-white/25">
                        {framework.canonRoot ? "canon-linked" : "indexed"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Footer rail */}
          <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <BookOpen className="h-4 w-4 text-white/60" />
                  <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70">Next Move</span>
                </div>
                <h3 className="mt-4 font-serif text-2xl font-bold text-white">Want the underlying logic?</h3>
                <p className="mt-2 text-white/60 max-w-2xl">
                  Frameworks are deployables. The Canon is the architecture behind them. If you want the why, not just the
                  what — start there.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/canon"
                  className="inline-flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-gray-200 hover:bg-white/[0.06] transition-all"
                >
                  Enter Canon <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/resources/surrender-framework"
                  className="inline-flex items-center gap-3 rounded-xl border border-amber-400/25 bg-amber-400/10 px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-amber-200 hover:bg-amber-400/15 transition-all"
                >
                  Surrender Framework <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  // Always available build-safe base
  const staticFrameworks = getAllFrameworks();

  // Optional: server enrichment (if your server module merges DB)
  let frameworks: Framework[] = staticFrameworks;
  let isFallbackData = true;

  try {
    const mod = await import("@/lib/resources/strategic-frameworks.server");
    if (typeof (mod as any).getServerAllFrameworks === "function") {
      const serverFrameworks = await (mod as any).getServerAllFrameworks();
      if (Array.isArray(serverFrameworks) && serverFrameworks.length > 0) {
        frameworks = serverFrameworks as Framework[];
        isFallbackData = serverFrameworks.length === staticFrameworks.length;
      }
    }
  } catch {
    isFallbackData = true;
  }

  // Categories are derived from brand-language labels (Founder/Board/etc)
  const categories = Array.from(
    new Set(
      frameworks
        .flatMap((f) => (Array.isArray(f.tier) ? f.tier : [String(f.tier)]))
        .filter(Boolean)
        .map((x) => String(x))
    )
  );

  return {
    props: {
      frameworks: JSON.parse(JSON.stringify(frameworks)),
      categories,
      isFallbackData,
    },
    revalidate: 3600,
  };
};

export default StrategicFrameworksLibraryPage;