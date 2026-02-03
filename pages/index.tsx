// pages/index.tsx — EDELMAN HOMEPAGE (SLEEK / BUILD-PROOF / PAGES ROUTER / NETLIFY-SAFE)
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import clsx from "clsx";

import {
  BookOpen,
  Layers,
  ChevronRight,
  Shield,
  Zap,
  ArrowRight,
  Lock,
  Globe,
  BadgeCheck,
  Building2,
  Newspaper,
  GraduationCap,
} from "lucide-react";

import Layout from "@/components/Layout";
import LogoWall from "@/components/branding/LogoWall";
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
  TRUST STRIP
  Your actual filesystem: public/assets/images/logos/*.svg
  So the public URLs MUST be /assets/images/logos/*.svg
----------------------------------------------------------------------------- */
function TrustStrip({ className }: { className?: string }) {
  const logos = [
    { src: "/assets/images/logos/media-logo.svg", alt: "Abraham of London — Media" },
    { src: "/assets/images/logos/institution-logo.svg", alt: "Abraham of London — Institutional" },
    { src: "/assets/images/logos/education-logo.svg", alt: "Abraham of London — Education" },
    { src: "/assets/images/logos/private-clients-logo.svg", alt: "Abraham of London — Private Clients" },
  ];

  const signals = [
    {
      icon: Building2,
      title: "Institutional-grade doctrine",
      desc: "Operating system, not opinions. Designed for governance cadence and decision velocity.",
    },
    {
      icon: GraduationCap,
      title: "Education + Research",
      desc: "Models, frames, and proofs you can teach, defend, and deploy.",
    },
    {
      icon: Newspaper,
      title: "Media-ready clarity",
      desc: "Shorts engineered as crisp briefings, built to travel across platforms.",
    },
    {
      icon: BadgeCheck,
      title: "Private-client standard",
      desc: "High-trust delivery: discreet, structured, outcome-oriented.",
    },
  ];

  return (
    <section
      className={clsx(
        "relative bg-black py-24 border-y border-white/[0.03] overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 bg-grid-technical mask-radial-fade opacity-15 pointer-events-none" />
      <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[720px] w-[980px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[160px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-500/70">
              TRUST SIGNALS
            </div>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl text-white font-bold leading-tight">
              Built to be taken seriously—at first glance.
            </h2>
            <p className="mt-4 text-white/40 leading-relaxed">
              This is not a blog. It’s an operating environment: doctrine, artifacts, and briefings
              for leaders who don’t have time for fluff.
            </p>
          </div>

          <Link
            href="/resources"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-white hover:border-amber-500/30 hover:bg-white/[0.06] transition-all"
          >
            Enter the Vault <ArrowRight className="h-4 w-4 opacity-70" />
          </Link>
        </div>

        <div className="mt-14 rounded-3xl border border-white/5 bg-white/[0.02] p-8 md:p-10">
          <LogoWall
            logos={logos}
            minSize={180}
            gapClass="gap-10"
            ariaLabel="Abraham of London divisions"
          />
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {signals.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-7"
            >
              <s.icon className="h-6 w-6 text-amber-500/70" />
              <div className="mt-5 text-xs font-black uppercase tracking-widest text-white/90">
                {s.title}
              </div>
              <p className="mt-3 text-sm text-white/35 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------------
  LOCAL HELPERS
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
  return (
    type === "short" ||
    kind === "short" ||
    flattened.startsWith("shorts/") ||
    slug.includes("/shorts/") ||
    slug.startsWith("shorts/")
  );
}

function normalizeShortSlug(raw: unknown): string {
  const base = normalizeSlug(safeText(raw, ""));
  return base.replace(/^\/+/, "").replace(/\/+$/, "").replace(/^shorts\//i, "");
}

/* -----------------------------------------------------------------------------
  MOTION
----------------------------------------------------------------------------- */
const easeOutQuint: any = [0.22, 1, 0.36, 1];

const glowIn = {
  hidden: { opacity: 0, scale: 0.985 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.65, ease: easeOutQuint } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.6, ease: easeOutQuint },
  }),
};

/* -----------------------------------------------------------------------------
  UI ATOMS
----------------------------------------------------------------------------- */
function Pill({
  icon: Icon,
  label,
  hint,
}: {
  icon: any;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
      <Icon className="h-4 w-4 text-amber-500/80" />
      <div className="leading-tight">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
          {label}
        </div>
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
  icon: any;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-all hover:border-amber-500/35 hover:bg-white/[0.03]"
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
          {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

/* -----------------------------------------------------------------------------
  MAIN PAGE
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

      {/* HERO STACK */}
      <div className="relative overflow-hidden bg-black">
        <div className="pointer-events-none absolute left-1/2 top-[-240px] h-[680px] w-[980px] -translate-x-1/2 rounded-full bg-amber-500/12 blur-[150px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.14]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.14),transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:54px_54px]" />
        </div>

        <div className="relative">
          <HeroSection />
        </div>

        <TrustStrip />

        {/* MICRO DOCTRINE BAR */}
        <div className="relative border-t border-white/5 bg-black/80 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
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

      {/* SYSTEM OVERVIEW */}
      <section className="relative bg-black py-28 overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-7">
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} className="max-w-2xl">
                <motion.div custom={0} variants={fadeUp} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500/90" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/70">
                    Operational Doctrine v2.026
                  </span>
                </motion.div>

                <motion.h2 custom={1} variants={fadeUp} className="mt-8 font-serif text-4xl md:text-6xl text-white font-bold">
                  Strategy that reads like a memo — <br />
                  <span className="text-amber-500 italic">and deploys like a system.</span>
                </motion.h2>

                <motion.p custom={2} variants={fadeUp} className="mt-8 text-lg md:text-xl text-white/40">
                  This is not content marketing. It’s architecture. The{" "}
                  <span className="text-white/80 font-medium">Canon</span> defines the operating model. The{" "}
                  <span className="text-white/80 font-medium">Vault</span> ships artifacts.
                </motion.p>

                <motion.div custom={3} variants={fadeUp} className="mt-10 flex flex-wrap gap-3">
                  <Link
                    href="/canon/the-architecture-of-human-purpose"
                    className="inline-flex items-center gap-3 rounded-full bg-amber-500 px-7 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-black"
                  >
                    Start with the Canon <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/resources"
                    className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white hover:bg-white/10 transition"
                  >
                    Evaluate the Vault <ChevronRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            <div className="lg:col-span-5 space-y-6">
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
            </div>
          </div>
        </div>
      </section>

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

      {/* FINAL CTA */}
      <section className="relative bg-black py-44 overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[720px] w-[980px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[170px]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={glowIn}
            className="rounded-[32px] border border-white/10 bg-white/[0.02] p-10 md:p-16 text-center lg:text-left"
          >
            <h2 className="font-serif text-4xl md:text-5xl text-white font-bold">
              Read the doctrine. <span className="text-amber-500 italic">Deploy the artifacts.</span>
            </h2>

            <div className="mt-10 flex flex-col lg:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/canon/the-architecture-of-human-purpose"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-amber-500 px-8 py-4 text-[11px] font-black uppercase tracking-[0.22em] text-black"
              >
                Open the Canon <BookOpen className="h-4 w-4" />
              </Link>

              <Link
                href="/resources"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-[11px] font-black uppercase tracking-[0.22em] text-white hover:bg-white/10 transition"
              >
                Enter the Vault <Zap className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  DATA FETCHING (BUILD-SAFE)
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const featuredShorts: FeaturedShort[] = [];

  try {
    const mod: any = await import("@/lib/contentlayer-helper");
    const docs = mod?.getAllContentlayerDocs?.() || [];

    const shorts = (Array.isArray(docs) ? docs : [])
      .filter((d: any) => isShortDoc(d) && !isDraftContent(d))
      .sort((a: any, b: any) => {
        const aT = new Date(safeText(a?.date, "0")).getTime() || 0;
        const bT = new Date(safeText(b?.date, "0")).getTime() || 0;
        return bT - aT;
      })
      .slice(0, 8);

    for (const s of shorts) {
      const raw = s?.slug || s?._raw?.flattenedPath || "";
      const bareSlug = normalizeShortSlug(raw);
      featuredShorts.push({
        title: safeText(s?.title, "Untitled Briefing"),
        slug: bareSlug,
        excerpt: s?.excerpt || s?.description || null,
        href: joinHref("shorts", bareSlug),
        dateISO: safeISODate(s?.date),
        theme: safeText(s?.theme, "Intel"),
      });
    }
  } catch (err) {
    console.error("[Home/getStaticProps] non-fatal:", err);
  }

  return {
    props: { featuredShorts: JSON.parse(JSON.stringify(featuredShorts)) },
    revalidate: 3600,
  };
};

export default HomePage;

  const signals = [
    {
      icon: Building2,
      title: "Institutional-grade doctrine",
      desc: "Operating system, not opinions. Designed for governance cadence and decision velocity.",
    },
    {
      icon: GraduationCap,
      title: "Education + Research",
      desc: "Models, frames, and proofs you can teach, defend, and deploy.",
    },
    {
      icon: Newspaper,
      title: "Media-ready clarity",
      desc: "Shorts engineered as crisp briefings, built to travel across platforms.",
    },
    {
      icon: BadgeCheck,
      title: "Private-client standard",
      desc: "High-trust delivery: discreet, structured, outcome-oriented.",
    },
  ];

  return (
    <section className={clsx("relative bg-black py-24 border-y border-white/[0.03]", className)}>
      <div className="absolute inset-0 bg-grid-technical mask-radial-fade opacity-15 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-500/70">
              TRUST SIGNALS
            </div>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl text-white font-bold leading-tight">
              Built to be taken seriously—at first glance.
            </h2>
            <p className="mt-4 text-white/40 leading-relaxed">
              This is not a blog. It’s an operating environment: doctrine, artifacts, and briefings
              for leaders who don’t have time for fluff.
            </p>
          </div>

          <Link
            href="/resources"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-white hover:border-amber-500/30 hover:bg-white/[0.06] transition-all"
          >
            Enter the Vault <ArrowRight className="h-4 w-4 opacity-70" />
          </Link>
        </div>

        <div className="mt-14 rounded-3xl border border-white/5 bg-white/[0.02] p-8 md:p-10">
          <LogoWall
            logos={logos}
            minSize={180}
            gapClass="gap-10"
            ariaLabel="Abraham of London divisions"
          />
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {signals.map((s) => (
            <div key={s.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-7">
              <s.icon className="h-6 w-6 text-amber-500/70" />
              <div className="mt-5 text-xs font-black uppercase tracking-widest text-white/90">
                {s.title}
              </div>
              <p className="mt-3 text-sm text-white/35 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------------
  LOCAL HELPERS (BUILD-SAFE)
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

// Strong “is this a Short?” gate that survives schema drift
function isShortDoc(d: any): boolean {
  const type = safeText(d?.type, "").toLowerCase();
  const kind = safeText(d?.docKind, "").toLowerCase();
  const flattened = safeText(d?._raw?.flattenedPath, "").toLowerCase();
  const slug = safeText(d?.slug, "").toLowerCase();

  return (
    type === "short" ||
    kind === "short" ||
    flattened.startsWith("shorts/") ||
    slug.startsWith("shorts/") ||
    slug.includes("/shorts/")
  );
}

function normalizeShortSlug(raw: unknown): string {
  const base = normalizeSlug(safeText(raw, ""));
  return base.replace(/^\/+/, "").replace(/\/+$/, "").replace(/^shorts\//i, "");
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.06 * i,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const glowIn = {
  hidden: { opacity: 0, scale: 0.985 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function Pill({
  icon: Icon,
  label,
  hint,
}: {
  icon: any;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
      <Icon className="h-4 w-4 text-amber-500/80" />
      <div className="leading-tight">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
          {label}
        </div>
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
  icon: any;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8",
        "transition-all hover:border-amber-500/35 hover:bg-white/[0.03]"
      )}
    >
      {/* glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-500/10 blur-[80px]" />
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
          {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

/* -----------------------------------------------------------------------------
  MAIN PAGE
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

      {/* HERO WRAP */}
      <div className="relative overflow-hidden bg-black">
        {/* bloom */}
        <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[720px] w-[980px] -translate-x-1/2 rounded-full bg-amber-500/12 blur-[160px]" />

        {/* grid + radial */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.14]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.14),transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:54px_54px]" />
        </div>

        <div className="relative">
          <HeroSection />
        </div>

        {/* TRUST */}
        <TrustStrip />

        {/* SIGNAL BAR */}
        <div className="relative border-t border-white/5 bg-black/80 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
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

      {/* SYSTEM OVERVIEW */}
      <section className="relative bg-black py-28 overflow-hidden">
        <div className="absolute inset-0 bg-grid-technical mask-radial-fade opacity-10 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-7">
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} className="max-w-2xl">
                <motion.div custom={0} variants={fadeUp} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500/90" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/70">
                    Operational Doctrine v2.026
                  </span>
                </motion.div>

                <motion.h2 custom={1} variants={fadeUp} className="mt-8 font-serif text-4xl md:text-6xl text-white font-bold">
                  Strategy that reads like a memo —
                  <br />
                  <span className="text-amber-500 italic">and deploys like a system.</span>
                </motion.h2>

                <motion.p custom={2} variants={fadeUp} className="mt-8 text-lg md:text-xl text-white/40 leading-relaxed">
                  This is not content marketing. It’s architecture. The{" "}
                  <span className="text-white/80 font-medium">Canon</span> defines the operating model. The{" "}
                  <span className="text-white/80 font-medium">Vault</span> ships artifacts.
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
                    className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/5 px-7 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white hover:border-white/25 hover:bg-white/10 transition"
                  >
                    Evaluate the Vault <ChevronRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            <div className="lg:col-span-5 space-y-6">
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
            </div>
          </div>
        </div>
      </section>

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

      {/* FINAL CTA */}
      <section className="relative bg-black py-44 overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[540px] w-[780px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-[140px]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={glowIn}
            className="rounded-[32px] border border-white/10 bg-white/[0.02] p-10 md:p-16 text-center lg:text-left"
          >
            <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="text-[10px] font-black uppercase tracking-[0.34em] text-amber-500/70">
                  ENTER THE SYSTEM
                </div>
                <h2 className="mt-6 font-serif text-4xl md:text-5xl text-white font-bold leading-tight">
                  Read the doctrine.{" "}
                  <span className="text-amber-500 italic">Deploy the artifacts.</span>
                </h2>
                <p className="mt-4 text-white/40 leading-relaxed">
                  The Canon defines the architecture. The Vault provides deployables. The Inner Circle exists for a reason.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
                <Link
                  href="/canon/the-architecture-of-human-purpose"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-amber-500 px-8 py-4 text-[11px] font-black uppercase tracking-[0.22em] text-black hover:bg-amber-400 transition"
                >
                  Open the Canon <BookOpen className="h-4 w-4" />
                </Link>
                <Link
                  href="/resources"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/14 bg-white/5 px-8 py-4 text-[11px] font-black uppercase tracking-[0.22em] text-white hover:border-white/25 hover:bg-white/10 transition"
                >
                  Enter the Vault <Zap className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  DATA FETCHING (BUILD-SAFE)
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const featuredShorts: FeaturedShort[] = [];

  try {
    // ✅ Server façade only (never import helper directly in pages/)
    const mod: any = await import("@/lib/content/server");
    const getAll = mod?.getAllContentlayerDocs;

    if (typeof getAll !== "function") {
      console.warn("[Home/getStaticProps] getAllContentlayerDocs not found; returning empty feed.");
      return { props: { featuredShorts }, revalidate: 3600 };
    }

    const docs = getAll() || [];

    const shorts = (Array.isArray(docs) ? docs : [])
      .filter((d: any) => {
        const kind = String(d?.kind || d?.type || "").toLowerCase();
        const fp = String(d?._raw?.flattenedPath || "").toLowerCase();
        return kind === "short" || fp.startsWith("shorts/");
      })
      .filter((d: any) => !isDraftContent(d))
      .sort((a: any, b: any) => (new Date(b?.date).getTime() || 0) - (new Date(a?.date).getTime() || 0))
      .slice(0, 8);

    for (const s of shorts) {
      const rawSlug = s?.slug || s?._raw?.flattenedPath || "";
      const bareSlug = normalizeShortSlug(rawSlug);

      featuredShorts.push({
        title: safeText(s?.title, "Untitled Briefing"),
        slug: bareSlug,
        excerpt: safeText(s?.excerpt ?? s?.description ?? "", "").trim() || null,
        href: joinHref("shorts", bareSlug),
        dateISO: safeISODate(s?.date),
        theme: safeText(s?.theme, "Intel"),
      });
    }
  } catch (err) {
    console.error("[Home/getStaticProps] Content feed error (non-fatal):", err);
  }

  return {
    props: { featuredShorts: JSON.parse(JSON.stringify(featuredShorts)) },
    revalidate: 3600,
  };
};

export default HomePage;