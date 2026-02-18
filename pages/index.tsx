// pages/index.tsx — INSTITUTIONAL HOMEPAGE (10/10)
// Pages Router primary. Hybrid supported but homepage must remain in /pages.
//
// Upgrades shipped:
// ✅ Prime MiniBook placement (spine) — NOW IMMEDIATELY AFTER HERO
// ✅ WhoIWorkWith component — strategic positioning after MiniBook
// ✅ Lazy-load below-the-fold sections (Next dynamic)
// ✅ Skeleton loading states
// ✅ Subtle parallax background layers (client-side, zero-dependency)
// ✅ Micro-interactions on cards (depth, hover, focus)
// ✅ Accessibility: focus-visible rings, ARIA labels, contrast discipline
// ✅ HARDENED getStaticProps: avoids 0/0/0 counts unless truly empty
// ✅ text-balance + text-pretty utilities
// ✅ animate-aolFadeUp institutional motion
// ✅ Narrative bridges between sections
// ✅ Glow aura behind MiniBook
// ✅ Optimized whitespace rhythm (24/28/32)

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import Image from "next/image";
import Layout from "@/components/Layout";

import fs from "fs";
import path from "path";

import {
  HeroSection,
  TrustSignals,
  StatsBar,
  CanonInstitutionalIntro,
  OperatorBriefing,
} from "@/components/homepage";

import type { CanonPrelude } from "@/components/homepage/CanonInstitutionalIntro";
import { joinHref, normalizeSlug, sanitizeData } from "@/lib/content/shared";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  ShieldCheck,
  Vault,
  ChevronRight,
  Target,
  Sparkles,
} from "lucide-react";

// ✅ IMPORT THE NEW COMPONENT
import WhoIWorkWith from "@/components/WhoIWorkWith";

/* ============================================================================
   LAZY-LOADED BELOW-THE-FOLD SECTIONS (performance)
============================================================================ */
const StrategicFunnelStrip = dynamic(() => import("@/components/homepage/StrategicFunnelStrip"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading funnel…" />,
});

const VaultTeaserRail = dynamic(() => import("@/components/homepage/VaultTeaserRail"), {
  ssr: false,
  loading: () => <RailSkeleton label="Loading Vault rail…" />,
});

const EventsSection = dynamic(() => import("@/components/homepage/EventsSection"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading events…" />,
});

const ContentShowcase = dynamic(() => import("@/components/homepage/ContentShowcase"), {
  ssr: false,
  loading: () => <ContentShowcaseSkeleton />,
});

const VenturesSection = dynamic(() => import("@/components/homepage/VenturesSection"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading ventures…" />,
});

const InstitutionalClose = dynamic(() => import("@/components/homepage/InstitutionalClose"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading close…" />,
});

/* ============================================================================
   Types
============================================================================ */
type FeaturedItem = {
  title: string;
  slug: string;
  href: string;
  excerpt?: string | null;
  dateISO?: string | null;
  theme?: string | null;
  kind?: string | null;
};

export type EventItem = {
  slug: string;
  title: string;
  date: string;
  location: string;
  mode: "online" | "in-person" | "hybrid";
  excerpt?: string | null;
  capacity?: number | null;
  duration?: string | null;
  status?: "open" | "limited" | "full" | "past" | null;
};

type HomePageProps = {
  featuredShorts: FeaturedItem[];
  featuredBriefing: FeaturedItem | null;
  events: EventItem[];
  canonPrelude: CanonPrelude;
  counts: {
    shorts: number;
    canon: number;
    briefs: number;
    downloads: number;
    library: number;
  };
};

/* ============================================================================
   Utilities (pure + defensive)
============================================================================ */
function pickBooleanFlag(d: any): boolean {
  return Boolean(
    d?.featured === true ||
      d?.isFeatured === true ||
      d?.home === true ||
      d?.showOnHome === true ||
      d?.homepage === true
  );
}

function safeString(v: any, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function safeDateISO(v: any): string | null {
  const s = typeof v === "string" ? v : null;
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

function kindLower(d: any): string {
  return String(d?.kind || d?.type || d?.docKind || "").toLowerCase();
}

function flattenedPath(d: any): string {
  return String(d?._raw?.flattenedPath || "").toLowerCase();
}

function computedSlug(d: any): string {
  return String(d?.slugComputed || d?.slug || d?._raw?.flattenedPath || "");
}

function toItem(d: any): FeaturedItem | null {
  const k = kindLower(d);
  const fp = flattenedPath(d);

  const isShort = k === "short" || fp.startsWith("shorts/");
  const isBrief = k === "brief" || fp.startsWith("briefs/");
  const isPost = k === "post" || fp.startsWith("blog/") || fp.startsWith("posts/");

  const collection = isShort ? "shorts" : isBrief ? "briefs" : isPost ? "blog" : null;
  if (!collection) return null;

  const rawSlug = computedSlug(d);
  const bare = normalizeSlug(String(rawSlug))
    .replace(/^shorts\//, "")
    .replace(/^briefs\//, "")
    .replace(/^blog\//, "")
    .replace(/^posts\//, "");

  const href = joinHref(collection, bare);

  return {
    title: safeString(d?.title, "Untitled"),
    slug: bare,
    href,
    excerpt: (d?.excerpt || d?.description || null) as string | null,
    dateISO: safeDateISO(d?.date),
    theme: (d?.theme || d?.category || "Intel") as string | null,
    kind: isShort ? "short" : isBrief ? "brief" : "post",
  };
}

function deriveEventMode(d: any): EventItem["mode"] {
  const raw = String(d?.mode || d?.format || d?.delivery || "in-person").toLowerCase();
  if (raw.includes("hybrid")) return "hybrid";
  if (raw.includes("online") || raw.includes("virtual")) return "online";
  return "in-person";
}

function deriveEventStatus(date: string, explicit?: any): EventItem["status"] {
  const explicitRaw = String(explicit || "").toLowerCase();
  if (explicitRaw === "open" || explicitRaw === "limited" || explicitRaw === "full" || explicitRaw === "past") {
    return explicitRaw as any;
  }

  const t = Date.parse(date);
  if (!Number.isFinite(t)) return "open";

  const now = new Date();
  const eventDay = new Date(t);
  const endOfEventDay = new Date(eventDay.getFullYear(), eventDay.getMonth(), eventDay.getDate(), 23, 59, 59, 999);

  return endOfEventDay.getTime() < now.getTime() ? "past" : "open";
}

function toEvent(d: any): EventItem | null {
  const k = kindLower(d);
  const fp = flattenedPath(d);
  const isEvent = k === "event" || fp.startsWith("events/");
  if (!isEvent) return null;

  const rawSlug = computedSlug(d);
  const bare = normalizeSlug(String(rawSlug)).replace(/^events\//, "");

  const date =
    d?.eventDate ||
    d?.date ||
    d?.startDate ||
    d?.datetime ||
    d?.start ||
    d?.startsAt ||
    null;

  if (!date) return null;

  const mode = deriveEventMode(d);
  const location = safeString(d?.location, mode === "online" ? "Online" : "London");
  const status = deriveEventStatus(String(date), d?.status);

  const capacity = typeof d?.capacity === "number" ? d.capacity : null;
  const duration = typeof d?.duration === "string" ? d.duration : null;

  return {
    slug: bare,
    title: safeString(d?.title, "Untitled Event"),
    date: String(date),
    location,
    mode,
    excerpt: (d?.excerpt || d?.description || null) as string | null,
    capacity,
    duration,
    status,
  };
}

/* ============================================================================
   Section System — refined whitespace (luxury rhythm)
============================================================================ */
type SectionProps = {
  id?: string;
  children: React.ReactNode;
  tight?: boolean;
  border?: boolean;
  surface?: boolean;
  className?: string;
  containerClassName?: string;
};

const Section = ({
  id,
  children,
  tight = false,
  border = true,
  surface = false,
  className = "",
  containerClassName = "",
}: SectionProps) => {
  // 10/10 whitespace rhythm
  const py = tight ? "py-20 md:py-24" : "py-24 md:py-28 lg:py-32";
  const bg = surface
    ? "bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.05),transparent_55%),radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.03),transparent_55%)]"
    : "bg-black";
  const topBorder = border ? "border-t border-white/5" : "";

  return (
    <section id={id} className={["relative", bg, topBorder, py, className].join(" ")}>
      <div className={["mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", containerClassName].join(" ")}>
        {children}
      </div>
    </section>
  );
};

const Hairline = () => (
  <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/15 to-transparent" />
);

/* ============================================================================
   Parallax Backdrop — subtle, restrained, performance-safe
============================================================================ */
function ParallaxBackdrop(): React.ReactElement {
  const [y, setY] = React.useState(0);

  React.useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setY(window.scrollY || 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll as any);
    };
  }, []);

  // Super subtle: move background layers by tiny deltas
  const t1 = `translateY(${Math.round(y * 0.04)}px)`;
  const t2 = `translateY(${Math.round(y * 0.025)}px)`;
  const t3 = `translateY(${Math.round(y * 0.015)}px)`;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-amber-500/7 blur-[120px]"
        style={{ transform: `translateX(-50%) ${t1}` as any }}
      />
      <div
        className="absolute top-24 right-[8%] h-[420px] w-[420px] rounded-full bg-white/[0.03] blur-[130px]"
        style={{ transform: t2 }}
      />
      <div
        className="absolute -bottom-40 left-[10%] h-[520px] w-[520px] rounded-full bg-amber-500/5 blur-[140px]"
        style={{ transform: t3 }}
      />
    </div>
  );
}

/* ============================================================================
   Narrative Bridge — improves flow (critique #7)
============================================================================ */
function NarrativeBridge({ text }: { text: string }) {
  return (
    <div className="relative bg-black py-12 md:py-16">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent" />
      <p className="relative text-center text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
        {text}
      </p>
    </div>
  );
}

/* ============================================================================
   Start Here Rail — A11y + tactile interactions
============================================================================ */
function StartHereRail(): React.ReactElement {
  const items = [
    {
      title: "Start with the MiniBook",
      body: "Begin with the spine: doctrine, purpose, governance — compressed into one clean artifact.",
      href: "#prelude",
      Icon: BookOpen,
      badge: "Start Here",
      aria: "Jump to the Prelude MiniBook section",
    },
    {
      title: "Open the Vault",
      body: "Deployables: templates, packs, and operating assets designed for execution.",
      href: "/downloads/vault",
      Icon: Vault,
      badge: "Deploy",
      aria: "Open the Vault downloads page",
    },
    {
      title: "Strategy Room",
      body: "For founders and leadership teams under pressure: architecture, cadence, decision rights.",
      href: "/consulting/strategy-room",
      Icon: BriefcaseBusiness,
      badge: "Engage",
      aria: "Book a Strategy Room session",
    },
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((x, index) => (
        <Link
          key={x.title}
          href={x.href}
          aria-label={x.aria}
          className={[
            "group rounded-3xl border border-white/10 bg-white/[0.02] p-7",
            "transition-all duration-300 will-change-transform",
            "hover:bg-white/[0.04] hover:border-amber-500/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            "motion-safe:animate-aolFadeUp",
          ].join(" ")}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
              <x.Icon className="h-5 w-5 text-amber-300" />
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.28em] text-white/70">
              {x.badge}
            </span>
          </div>

          <h3 className="mt-5 font-serif text-2xl font-medium text-white group-hover:text-amber-50 transition-colors text-balance">
            {x.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-white/60 group-hover:text-white/75 transition-colors">
            {x.body}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-500/85">
            Open
            <ArrowRight className="h-4 w-4 text-white/20 transition-all group-hover:text-amber-400 group-hover:translate-x-0.5" />
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ============================================================================
   Proof Stack — micro-interactions + A11y
============================================================================ */
function ProofStack({ counts }: { counts: HomePageProps["counts"] }): React.ReactElement {
  const proofs = [
    {
      title: "Doctrine-backed",
      body: "Not vibes. A coherent worldview, moral frame, and decision logic built to survive scrutiny.",
      Icon: ShieldCheck,
    },
    {
      title: "Systems-first",
      body: "Strategy as operating logic: cadence, controls, incentives, accountability loops.",
      Icon: Target,
    },
    {
      title: "Indexed library",
      body: `A living archive: ${counts.library} registry items plus Canon, briefs, and deployables.`,
      Icon: Sparkles,
    },
  ] as const;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10 backdrop-blur-sm">
      {/* Depth layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(212,175,55,0.6),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_72%,rgba(255,255,255,0.14),transparent_60%)]" />
      </div>

      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500/70" />
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-500/70">
              Credibility Layer
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-white/15" />
            <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/40">
              proof-stack
            </span>
          </div>

          <h2 className="mt-6 font-serif text-3xl md:text-4xl font-medium text-white tracking-tight text-balance">
            Why this holds under pressure.
          </h2>
          <p className="mt-3 text-sm md:text-base text-white/55 leading-relaxed max-w-2xl">
            If it can’t survive hostile cross-examination, it isn’t strategy — it’s theatre. These standards sit behind
            every artifact and engagement.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/canon"
            aria-label="Browse the Canon"
            className={[
              "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3",
              "text-[10px] font-black uppercase tracking-[0.28em] text-white/85",
              "transition-all hover:bg-white/10 hover:text-white hover:-translate-y-0.5",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            ].join(" ")}
          >
            Browse Canon
            <ArrowRight className="h-4 w-4 text-white/20" />
          </Link>

          <Link
            href="/downloads/vault"
            aria-label="Open the Vault"
            className={[
              "inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/7 px-6 py-3",
              "text-[10px] font-black uppercase tracking-[0.28em] text-amber-100",
              "transition-all hover:bg-amber-500/12 hover:border-amber-500/45 hover:-translate-y-0.5",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            ].join(" ")}
          >
            Open Vault
            <ArrowRight className="h-4 w-4 text-white/20" />
          </Link>
        </div>
      </div>

      {/* Cards with tactile depth + micro-interactions */}
      <div className="relative mt-10 grid gap-4 md:grid-cols-3">
        {proofs.map((p, index) => (
          <div
            key={p.title}
            className={[
              "group rounded-3xl border border-white/10 bg-black/40 p-7",
              "transition-all duration-300 will-change-transform",
              "hover:bg-white/[0.03] hover:border-amber-500/18 hover:-translate-y-1 hover:scale-[1.02]",
              "hover:shadow-2xl hover:shadow-black/50",
              "motion-safe:animate-aolFadeUp",
            ].join(" ")}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <p.Icon className="h-5 w-5 text-amber-300" />
              <div
                aria-hidden
                className="h-8 w-8 rounded-full bg-amber-500/8 opacity-0 blur-xl transition-opacity group-hover:opacity-100"
              />
            </div>
            <h3 className="mt-5 font-serif text-2xl font-medium text-white text-balance">{p.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/60 group-hover:text-white/75 transition-colors">
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   Skeletons (loading states) — refined with amber accents
============================================================================ */
function SkeletonLine({ w = "w-3/4", amber = false }: { w?: string; amber?: boolean }) {
  return <div className={["h-3 rounded", amber ? "bg-amber-500/10" : "bg-white/5", w].join(" ")} />;
}

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-10 rounded-2xl bg-white/5" />
        <div className="h-6 w-28 rounded-full bg-white/5" />
      </div>
      <div className="mt-6 h-7 w-64 rounded bg-white/5" />
      <div className="mt-4 space-y-2">
        <SkeletonLine w="w-5/6" />
        <SkeletonLine w="w-2/3" />
        <SkeletonLine w="w-1/2" />
      </div>
      <div className="mt-8 text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">{label}</div>
    </div>
  );
}

function RailSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10 animate-pulse">
      <div className="h-7 w-52 rounded bg-white/5" />
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="h-10 w-10 rounded-2xl bg-white/5" />
            <div className="mt-5 h-5 w-2/3 rounded bg-white/5" />
            <div className="mt-3 space-y-2">
              <SkeletonLine w="w-5/6" />
              <SkeletonLine w="w-2/3" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">{label}</div>
    </div>
  );
}

function ContentShowcaseSkeleton() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="h-5 w-28 rounded bg-white/5 animate-pulse" />
          <div className="mt-4 h-8 w-56 rounded bg-white/5 animate-pulse" />
          <div className="mt-3 h-4 w-96 max-w-full rounded bg-white/5 animate-pulse" />
        </div>
        <div className="hidden md:block h-10 w-28 rounded-full bg-white/5 animate-pulse" />
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-3xl border border-white/10 bg-black/40 p-7 animate-pulse">
            <div className="h-3 w-40 rounded bg-white/5" />
            <div className="mt-5 h-6 w-5/6 rounded bg-white/5" />
            <div className="mt-3 space-y-2">
              <SkeletonLine w="w-5/6" />
              <SkeletonLine w="w-2/3" />
            </div>
            <div className="mt-6 h-3 w-20 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   HomePage Component
============================================================================ */
const HomePage: NextPage<HomePageProps> = ({
  featuredShorts,
  featuredBriefing,
  events,
  counts,
  canonPrelude,
}) => {
  const hasShorts = featuredShorts.length > 0;

  return (
    <Layout
      title="Abraham of London"
      description="Institutional doctrine, disciplined strategy, and practical resources for builders."
      canonicalUrl="/"
      fullWidth
    >
      <Head>
        <meta property="og:type" content="website" />
      </Head>

      {/* HERO STACK */}
      <section className="relative bg-black overflow-hidden">
        <ParallaxBackdrop />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 motion-safe:animate-aolFadeUp">
          <HeroSection counts={counts as any} />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 md:mt-14">
          <Hairline />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <TrustSignals />
        </div>

        <StatsBar />
      </section>

      {/* MINI-BOOK (SPINE) — IMMEDIATELY AFTER HERO */}
      <Section id="prelude" tight border>
        {/* Compatibility anchor for existing #canon links */}
        <div id="canon" className="sr-only" aria-hidden />

        {/* Visual weight + glow pyramid */}
        <div className="mx-auto max-w-6xl relative">
          <div aria-hidden className="pointer-events-none absolute -inset-10 bg-amber-500/5 blur-[120px] rounded-full" />
          <div className="relative">
            <CanonInstitutionalIntro prelude={canonPrelude} />
          </div>
        </div>
      </Section>

      {/* WHO I WORK WITH — STRATEGIC POSITIONING AFTER MINIBOOK */}
      <Section id="fit" tight={false} border={false} surface={false}>
        <div className="max-w-5xl mx-auto">
          <WhoIWorkWith variant="dark" />
        </div>
      </Section>

      {/* NARRATIVE BRIDGE */}
      <NarrativeBridge text="From doctrine → to deployment" />

      {/* PROOF STACK */}
      <Section id="proof" tight border surface>
        <ProofStack counts={counts} />
      </Section>

      <NarrativeBridge text="From standards → to operating systems" />

      {/* OPERATIONAL FUNNEL (lazy) */}
      <Section id="strategy" tight border surface>
        <StrategicFunnelStrip />
      </Section>

      <NarrativeBridge text="From design → to assets" />

      {/* VAULT (lazy) */}
      <Section id="vault" tight border>
        <VaultTeaserRail />
      </Section>

      {/* START HERE RAIL — NOW POSITIONED AFTER VAULT */}
      <Section id="pathways" tight border>
        <StartHereRail />
      </Section>

      {/* FEATURED BRIEFING */}
      {featuredBriefing && (
        <Section id="briefing" tight border surface>
          <OperatorBriefing featured={featuredBriefing as any} />
        </Section>
      )}

      {/* EVENTS (lazy) */}
      {events.length > 0 ? (
        <Section id="events" tight border>
          <EventsSection events={events as any} />
        </Section>
      ) : (
        <Section id="events" tight border>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 sm:p-12 md:p-16 backdrop-blur-sm">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-amber-500/60 bg-amber-500/5 px-3 py-1.5 rounded-full border border-amber-500/12">
                Events Registry
              </span>
              <h2 className="mt-7 font-serif text-3xl md:text-4xl text-white/90 text-balance">
                The calendar is being indexed.
              </h2>
              <p className="mt-4 text-sm md:text-base text-white/60 leading-relaxed max-w-2xl mx-auto">
                When sessions go live, they appear here first—quietly, clearly, and with enough context to decide.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/events"
                  aria-label="View events"
                  className={[
                    "group px-8 py-3.5 rounded-full border border-white/12 bg-white/[0.02]",
                    "text-[10px] font-mono uppercase tracking-[0.3em] text-white/80",
                    "hover:text-white hover:border-amber-500/30 hover:bg-amber-500/5 transition-all",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                  ].join(" ")}
                >
                  <span className="group-hover:tracking-[0.35em] transition-all">View Events</span>
                </a>
                <a
                  href="/contact"
                  aria-label="Request a session"
                  className={[
                    "px-8 py-3.5 rounded-full bg-amber-600",
                    "text-[10px] font-mono uppercase tracking-[0.3em] text-white",
                    "hover:bg-amber-700 hover:tracking-[0.35em] transition-all shadow-lg shadow-amber-900/20",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                  ].join(" ")}
                >
                  Request a Session
                </a>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* VENTURES (lazy) */}
      <Section id="ventures" tight border surface>
        <VenturesSection />
      </Section>

      {/* DISPATCHES (lazy) */}
      {hasShorts && (
        <Section id="dispatches" tight border>
          <ContentShowcase
            items={featuredShorts as any}
            title="Dispatches"
            description="Short, sharp intelligence notes engineered for retrieval and reuse."
            className=""
          />
        </Section>
      )}

      {/* CLOSE (lazy) */}
      <Section border surface>
        <div className="mx-auto max-w-5xl">
          <InstitutionalClose />
        </div>
      </Section>

      <div className="bg-black">
        <Hairline />
      </div>
    </Layout>
  );
};

/* ============================================================================
   getStaticProps — HARDENED (prevents 0/0/0 unless truly empty)
============================================================================ */
function readLibraryCount(): number {
  try {
    const jsonPath = path.join(process.cwd(), "public", "pdfs", "registry.json");
    if (!fs.existsSync(jsonPath)) return 0;

    const raw = fs.readFileSync(jsonPath, "utf8");
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed?.items) ? parsed.items : Array.isArray(parsed) ? parsed : [];
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Draft filter: only exclude when explicitly draft OR explicitly published false.
 * Undefined should NOT exclude.
 */
function isDraftLocal(d: any): boolean {
  return d?.draft === true || d?.published === false;
}

function collectAnyDocs(data: any): any[] {
  const buckets = [
    data?.allDocuments,
    data?.allPosts,
    data?.allShorts,
    data?.allBriefs,
    data?.allCanon,
    data?.allDownloads,
    data?.documents,
  ];

  const flat: any[] = [];
  for (const b of buckets) {
    if (Array.isArray(b)) flat.push(...b);
  }

  const seen = new Set<string>();
  const out: any[] = [];
  for (const d of flat) {
    const key =
      String(d?._id || "") ||
      String(d?._raw?.flattenedPath || "") ||
      String(d?.slug || "") ||
      JSON.stringify(d);

    if (!seen.has(key)) {
      seen.add(key);
      out.push(d);
    }
  }

  return out;
}

function shouldForceFallback(
  counts: { canon: number; briefs: number; shorts: number; downloads: number },
  docsLen: number
): boolean {
  const sum = counts.canon + counts.briefs + counts.shorts + counts.downloads;
  return sum === 0 || docsLen < 5;
}

const PRELUDE_SOURCE_FP = "books/the-architecture-of-human-purpose";

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  let featuredShorts: FeaturedItem[] = [];
  let featuredBriefing: FeaturedItem | null = null;
  let events: EventItem[] = [];

  const counts = { shorts: 0, canon: 0, briefs: 0, downloads: 0, library: 0 };
  counts.library = readLibraryCount();

  // Fallback (never breaks)
  let canonPrelude: CanonPrelude = {
    title: "The Architecture of Human Purpose",
    subtitle: "Prelude MiniBook - Limited Release Edition",
    description:
      "A distilled, high-level preview of the forthcoming multi-volume Canon on purpose, civilisation, governance, spiritual alignment, and human destiny.",
    excerpt:
      "Human flourishing is not accidental. It is architectural. This Prelude introduces the foundational patterns that govern purpose, identity, civilisation and destiny.",
    coverImage: "/assets/images/books/the-architecture-of-human-purpose.jpg",
    href: "/books/the-architecture-of-human-purpose-landing",
    canonHref: "/canon",
    ctaLabel: "Open the Prelude MiniBook",
  };

  const computeFromDocs = (docsIn: any[], dataForBooks?: any) => {
    const stableDocs = (docsIn || []).filter((d) => !isDraftLocal(d));

    const shortsDocs = stableDocs.filter((d) => kindLower(d) === "short" || flattenedPath(d).startsWith("shorts/"));
    const canonDocs = stableDocs.filter((d) => kindLower(d) === "canon" || flattenedPath(d).startsWith("canon/"));
    const briefsDocs = stableDocs.filter((d) => kindLower(d) === "brief" || flattenedPath(d).startsWith("briefs/"));
    const downloadsDocs = stableDocs.filter(
      (d) => kindLower(d) === "download" || flattenedPath(d).startsWith("downloads/")
    );

    counts.shorts = shortsDocs.length;
    counts.canon = canonDocs.length;
    counts.briefs = briefsDocs.length;
    counts.downloads = downloadsDocs.length;

    // Prelude resolve
    const books = Array.isArray(dataForBooks?.allBooks) ? dataForBooks.allBooks : [];
    const preludeBook = books.find((b: any) => {
      const fp = String(b?._raw?.flattenedPath || "");
      const slug = String(b?.slug || "");
      return fp === PRELUDE_SOURCE_FP || slug === "/books/the-architecture-of-human-purpose";
    });

    if (preludeBook) {
      canonPrelude = {
        title: safeString(preludeBook?.title, canonPrelude.title),
        subtitle: safeString(preludeBook?.subtitle, canonPrelude.subtitle),
        description: safeString(preludeBook?.description, canonPrelude.description),
        excerpt: safeString(preludeBook?.excerpt || preludeBook?.description, canonPrelude.excerpt),
        coverImage: safeString(preludeBook?.coverImage, canonPrelude.coverImage),
        href: "/books/the-architecture-of-human-purpose-landing",
        canonHref: "/canon",
        ctaLabel: "Open the Prelude MiniBook",
      };
    }

    // Events (if present)
    const rawEvents = stableDocs.filter((d) => kindLower(d) === "event" || flattenedPath(d).startsWith("events/"));
    events = rawEvents.map(toEvent).filter(Boolean) as EventItem[];
    events = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 6);

    // Featured items
    const candidates = stableDocs.map(toItem).filter(Boolean) as FeaturedItem[];
    const featured = candidates.filter((x) => {
      const origin = stableDocs.find((dd: any) => toItem(dd)?.href === x.href);
      return origin ? pickBooleanFlag(origin) : false;
    });

    featuredBriefing =
      featured.find((x) => x.kind === "brief") ||
      featured.find((x) => x.kind === "short") ||
      null;

    const featuredShortOnly = featured
      .filter((x) => x.kind === "short")
      .sort((a, b) => Date.parse(b.dateISO || "") - Date.parse(a.dateISO || ""))
      .slice(0, 8);

    featuredShorts =
      featuredShortOnly.length > 0
        ? featuredShortOnly
        : (shortsDocs
            .sort((a: any, b: any) => (Date.parse(b?.date || "") || 0) - (Date.parse(a?.date || "") || 0))
            .slice(0, 8)
            .map(toItem)
            .filter(Boolean) as FeaturedItem[]);
  };

  try {
    // Attempt 1: SSOT server loader
    const mod: any = await import("@/lib/content/server");
    const getContentlayerData = mod?.getContentlayerData;
    if (typeof getContentlayerData !== "function") {
      throw new Error("getContentlayerData() not available from '@/lib/content/server'");
    }

    const data = getContentlayerData();
    const docs = collectAnyDocs(data);

    computeFromDocs(docs, data);

    if (shouldForceFallback(counts, docs.length)) {
  console.warn(
    `[Home/getStaticProps] SSOT low/empty docs (docs=${docs.length}, sum=${counts.canon + counts.briefs + counts.shorts + counts.downloads}) — forcing generated fallback`
  );
  
  // Force fallback path without noisy error
  throw new Error("FORCE_FALLBACK_TO_GENERATED");
}
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.warn("[Home/getStaticProps] SSOT non-fatal:", errorMessage);

    // ✅ Always try generated fallback (safety net)
    try {
      const gen: any = await import("contentlayer/generated");
      const docs = collectAnyDocs(gen);

      computeFromDocs(docs, gen);

      if (shouldForceFallback(counts, docs.length)) {
        console.warn("[Home/getStaticProps] Generated fallback also appears empty:", { 
          docs: docs.length, 
          counts 
        });
        // Still return counts (even if zero) rather than throwing
      }
    } catch (fallbackErr) {
      console.error("[Home/getStaticProps] fallback failed:", fallbackErr);
      // Continue with whatever counts we have (even if zero)
    }
  }

  return {
    props: sanitizeData({ featuredShorts, featuredBriefing, events, counts, canonPrelude }),
    revalidate: 3600,
  };
};

export default HomePage;