// pages/index.tsx — EDELMAN HOMEPAGE (SLEEK / BUILD-PROOF / PAGES ROUTER / NETLIFY-SAFE)
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";

import {
  BookOpen,
  Layers,
  ChevronRight,
  Shield,
  Activity,
  Zap,
  ArrowRight,
  Lock,
  Globe,
  Sparkles,
} from "lucide-react";

import Layout from "@/components/Layout";
import {
  HeroSection,
  StrategicFunnelStrip,
  OperatorBriefing,
  VaultTeaserRail,
  ContentShowcase,
  EventsSection,
  ExecutiveIntelligenceStrip,
  SectionDivider,
} from "@/components/homepage";

import { joinHref, normalizeSlug, isDraftContent } from "@/lib/content/shared";

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */
type FeaturedShort = {
  title: string;
  slug: string;
  href: string;
  excerpt?: string | null;
  dateISO?: string | null;
  theme?: string;
};

type HomePageProps = {
  featuredShorts: FeaturedShort[];
};

/* -----------------------------------------------------------------------------
  LOCAL HELPERS (KEEP BUILD SAFE)
----------------------------------------------------------------------------- */
function safeText(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (v == null) return fallback;
  try {
    return String(v);
  } catch {
    return fallback;
  }
}

function safeISODate(dateLike: unknown): string | null {
  const s = safeText(dateLike, "").trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function isShortDoc(d: any): boolean {
  const type = safeText(d?.type, "").toLowerCase();
  const kind = safeText(d?.docKind, "").toLowerCase();
  const flattened = safeText(d?._raw?.flattenedPath, "").toLowerCase();
  const slug = safeText(d?.slug, "").toLowerCase();
  if (type === "short") return true;
  if (kind === "short") return true;
  if (flattened.startsWith("shorts/")) return true;
  if (slug.includes("/shorts/") || slug.startsWith("shorts/")) return true;
  return false;
}

function normalizeShortSlug(raw: unknown): string {
  const base = normalizeSlug(safeText(raw, ""));
  const cleaned = base.replace(/^\/+/, "").replace(/\/+$/, "");
  return cleaned.replace(/^shorts\//i, "");
}

/* -----------------------------------------------------------------------------
  MOTION PRESETS (SUBTLE, EXECUTIVE)
----------------------------------------------------------------------------- */
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

const glowIn = {
  hidden: { opacity: 0, scale: 0.98 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function Pill({
  icon: Icon,
  label,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
      <Icon className="h-4 w-4 text-amber-500/80" />
      <div className="leading-tight">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">{label}</div>
        <div className="text-[11px] text-white/35">{hint}</div>
      </div>
    </div>
  );
}

function PremiumCard({
  icon: Icon,
  eyebrow,
  title,
  body,
  href,
  cta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-amber-500/35 hover:bg-white/[0.03]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-500/10 blur-[70px]" />
      </div>

      <div className="relative">
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-2xl border border-white/10 bg-amber-500/10 p-3 text-amber-500">
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-500/60">
            {eyebrow}
          </div>
        </div>

        <div className="font-serif text-2xl leading-tight text-white/90 group-hover:text-white">
          {title}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/35">{body}</p>

        <div className="mt-8 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/60 group-hover:text-amber-500">
          {cta}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

/* -----------------------------------------------------------------------------
  PAGE
----------------------------------------------------------------------------- */
const HomePage: NextPage<HomePageProps> = ({ featuredShorts }) => {
  return (
    <Layout
      title="Abraham of London | Strategic Architecture"
      description="Canon-rooted strategy, frameworks, and deployable assets for high-stakes execution."
      ogImage="https://www.abrahamoflondon.org/api/og/short?title=Strategic%20Architecture&category=SYSTEM"
      canonicalUrl="/"
    >
      <Head>
        <meta property="og:type" content="website" />
      </Head>

      {/* HERO WRAP (KEEP YOUR EXISTING HERO, ADD EXECUTIVE BACKDROP) */}
      <div className="relative overflow-hidden bg-black">
        {/* Aurora glow */}
        <div className="pointer-events-none absolute left-1/2 top-[-240px] h-[680px] w-[980px] -translate-x-1/2 rounded-full bg-amber-500/12 blur-[150px]" />
        <div className="pointer-events-none absolute left-[12%] top-[180px] h-[360px] w-[360px] rounded-full bg-white/5 blur-[120px]" />

        {/* Technical grid mask */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.14]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.14),transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:54px_54px]" />
        </div>

        <div className="relative">
          <HeroSection />
        </div>

        {/* PROOF BAR (EDELMAN SIGNAL: CREDIBILITY WITHOUT BRAGGING) */}
        <div className="relative border-t border-white/5 bg-black/80 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={glowIn}
              className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.45)]" />
                <div className="text-[10px] font-black uppercase tracking-[0.34em] text-white/75">
                  Institutional doctrine · Canon + Vault + Deployables
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Pill icon={Shield} label="Governance" hint="Cadence · Failure modes" />
                <Pill icon={Layers} label="Frameworks" hint="Decision systems" />
                <Pill icon={Lock} label="Inner Circle" hint="Gated assets" />
                <Pill icon={Globe} label="Execution" hint="Board-level clarity" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* SYSTEM PRIMER (REPLACES “MEH OVERVIEW” WITH A REAL BRAND NARRATIVE) */}
      <section className="relative bg-black py-28 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.16]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(245,158,11,0.16),transparent_52%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.08),transparent_55%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-12 lg:items-start">
            {/* LEFT */}
            <div className="lg:col-span-7">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                className="max-w-2xl"
              >
                <motion.div custom={0} variants={fadeUp} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500/90" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/70">
                    Operational Doctrine v2.026
                  </span>
                </motion.div>

                <motion.h2
                  custom={1}
                  variants={fadeUp}
                  className="mt-8 font-serif text-4xl md:text-6xl leading-tight text-white font-bold"
                >
                  Strategy that reads like a memo — <br />
                  <span className="text-amber-500 italic">and deploys like a system.</span>
                </motion.h2>

                <motion.p
                  custom={2}
                  variants={fadeUp}
                  className="mt-8 text-lg md:text-xl leading-relaxed text-white/40"
                >
                  This is not content marketing. It’s architecture. The{" "}
                  <span className="text-white/80 font-medium">Canon</span> defines the operating model. The{" "}
                  <span className="text-white/80 font-medium">Vault</span> ships artifacts. The{" "}
                  <span className="text-white/80 font-medium">Shorts</span> deliver field intel.
                </motion.p>

                <motion.div custom={3} variants={fadeUp} className="mt-10 flex flex-wrap gap-3">
                  <Link
                    href="/canon/the-architecture-of-human-purpose"
                    className="inline-flex items-center gap-3 rounded-full bg-amber-500 px-7 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-black hover:bg-amber-400 transition"
                  >
                    Start with the Canon <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/resources"
                    className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/5 px-7 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white hover:bg-white/10 hover:border-white/25 transition"
                  >
                    Evaluate the Vault <ChevronRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </motion.div>

              <div className="mt-14 grid gap-6 sm:grid-cols-2">
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-90px" }}
                  variants={glowIn}
                  className="rounded-3xl border border-white/8 bg-white/[0.02] p-8"
                >
                  <Shield className="h-6 w-6 text-amber-500/70" />
                  <div className="mt-6 text-[11px] font-black uppercase tracking-[0.24em] text-white/80">
                    Governance by design
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/35">
                    Review cadence, decision gates, failure-mode analysis, and measurable operating discipline.
                  </p>
                </motion.div>

                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-90px" }}
                  variants={glowIn}
                  className="rounded-3xl border border-white/8 bg-white/[0.02] p-8"
                >
                  <Activity className="h-6 w-6 text-amber-500/70" />
                  <div className="mt-6 text-[11px] font-black uppercase tracking-[0.24em] text-white/80">
                    Deployable artifacts
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/35">
                    Templates, matrices, and “ready-to-run” assets designed for pressure environments.
                  </p>
                </motion.div>
              </div>
            </div>

            {/* RIGHT: EXECUTIVE RAIL */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-6">
                <PremiumCard
                  icon={BookOpen}
                  eyebrow="Canon"
                  title="The Architecture of Human Purpose"
                  body="Your strategic doctrine: meaning, governance, operating cadence, and decision logic."
                  href="/canon/the-architecture-of-human-purpose"
                  cta="Open the Mini-Book"
                />
                <PremiumCard
                  icon={Layers}
                  eyebrow="Frameworks"
                  title="Strategic Frameworks"
                  body="Models, matrices, and practical operating systems — built for clarity and control."
                  href="/strategy"
                  cta="Browse the System"
                />
                <PremiumCard
                  icon={Zap}
                  eyebrow="Vault"
                  title="The Vault of Deployables"
                  body="Artifacts you can actually deploy — and a reason the Inner Circle exists."
                  href="/resources"
                  cta="Enter the Vault"
                />

                {/* Inner Circle soft-pull (not salesy, but inevitable) */}
                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-500">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.26em] text-amber-500/80">
                        Inner Circle
                      </div>
                      <div className="mt-2 font-serif text-xl text-white/90">
                        Public view is a preview.
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-white/40">
                        The same doctrine, deeper tooling: gated assets, operator packs, and private briefs.
                      </p>
                      <div className="mt-5">
                        <Link
                          href="/vault"
                          className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-amber-500 hover:text-amber-400"
                        >
                          See the Vault index <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KEEP YOUR EXISTING SECTIONS (THEY’RE YOUR CONTENT ENGINE) */}
      <SectionDivider tight />
      <OperatorBriefing />

      <SectionDivider tight />
      <StrategicFunnelStrip />

      <SectionDivider tight />
      <VaultTeaserRail />

      <SectionDivider />
      <ContentShowcase items={featuredShorts as any} />

      <SectionDivider />
      <ExecutiveIntelligenceStrip shorts={featuredShorts as any} />

      <SectionDivider />
      <EventsSection />

      {/* FINAL CTA (MORE PREMIUM, LESS “GENERIC CTA”) */}
      <section className="relative bg-black py-44 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.22]">
          <div className="absolute left-1/2 top-0 h-[620px] w-[920px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[150px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={glowIn}
            className="rounded-[32px] border border-white/10 bg-white/[0.02] p-10 md:p-16"
          >
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <div className="text-[10px] font-black uppercase tracking-[0.34em] text-white/70">
                    Entry protocol
                  </div>
                </div>

                <h2 className="mt-6 font-serif text-4xl md:text-5xl text-white font-bold leading-tight">
                  Read the doctrine. <span className="text-amber-500 italic">Deploy the artifacts.</span>
                </h2>

                <p className="mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-white/40">
                  Start with the Canon to understand the architecture. Then enter the Vault to evaluate the assets.
                  If you need the full operator toolkit, the Inner Circle exists for a reason.
                </p>
              </div>

              <div className="lg:col-span-4">
                <div className="flex flex-col gap-4">
                  <Link
                    href="/canon/the-architecture-of-human-purpose"
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-amber-500 px-8 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-black hover:bg-amber-400 transition shadow-[0_0_36px_rgba(245,158,11,0.18)]"
                  >
                    Open the Canon <BookOpen className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/resources"
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-white/14 bg-white/5 px-8 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-white hover:bg-white/10 hover:border-white/28 transition"
                  >
                    Enter the Vault <Zap className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-[2px] h-4 w-4 text-amber-500/75" />
                    <p className="text-xs leading-relaxed text-white/40">
                      <span className="text-white/75 font-semibold">Inner Circle note:</span> Public pages are the front door.
                      The deployable operator packs live deeper.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  DATA FETCHING (KEEP YOUR HARDENED STRATEGY)
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const featuredShorts: FeaturedShort[] = [];

  try {
    const mod: any = await import("@/lib/contentlayer-helper");
    const getAll = mod?.getAllContentlayerDocs;

    if (typeof getAll !== "function") {
      console.warn("[Home/getStaticProps] getAllContentlayerDocs not found; returning empty homepage feed.");
      return { props: { featuredShorts }, revalidate: 3600 };
    }

    const docs = getAll();

    const shorts = (Array.isArray(docs) ? docs : [])
      .filter((d: any) => isShortDoc(d) && !isDraftContent(d))
      .sort((a: any, b: any) => {
        const aT = new Date(safeText(a?.date, 0) as any).getTime() || 0;
        const bT = new Date(safeText(b?.date, 0) as any).getTime() || 0;
        return bT - aT;
      })
      .slice(0, 8);

    for (const s of shorts) {
      const rawSlug = s?.slug || s?._raw?.flattenedPath || "";
      const bareSlug = normalizeShortSlug(rawSlug);

      const title = safeText(s?.title, "Untitled Briefing").trim() || "Untitled Briefing";
      const excerptRaw = s?.excerpt ?? s?.description ?? null;
      const excerpt = excerptRaw == null ? null : safeText(excerptRaw).trim() || null;

      featuredShorts.push({
        title,
        slug: bareSlug,
        excerpt,
        href: joinHref("shorts", bareSlug),
        dateISO: safeISODate(s?.date),
        theme: safeText(s?.theme, "Intel") || "Intel",
      });
    }
  } catch (err) {
    console.error("[Home/getStaticProps] Content feed error (non-fatal):", err);
  }

  return {
    props: {
      featuredShorts: JSON.parse(JSON.stringify(featuredShorts)),
    },
    revalidate: 3600,
  };
};

export default HomePage;