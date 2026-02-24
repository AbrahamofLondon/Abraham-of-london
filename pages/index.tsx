// pages/index.tsx — INSTITUTIONAL HOMEPAGE (MOBILE-OPTIMIZED, DESKTOP UNCHANGED)
// Pages Router primary. Homepage must remain in /pages.
//
// Goal of this revision (refined):
// - Flagship lobby feel: hierarchy, rhythm, restraint.
// - “Scanner-first” navigation with zero begging.
// - Strong editorial headings + narrative bridges that feel expensive.
// - No new dependencies. No SSR traps. Data logic unchanged.
// - Removes Trailer bloat; consolidates value per pixel.
//
// Notes:
// - This file assumes /vault is a valid route (redirect or page). If canonical is /downloads/vault, keep /vault as alias.
// - HeroSection expects counts: { shorts, canon, briefs, library }. We map explicitly (no `as any`).

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
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

import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  ShieldCheck,
  Vault,
  ChevronRight,
  Target,
  Sparkles,
  ChevronDown,
} from "lucide-react";

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
   Section System — refined whitespace (luxury rhythm) - 🔧 MODIFIED FOR MOBILE
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
  // 🔧 MODIFIED: Mobile padding reduced, desktop untouched
  const py = tight 
    ? "py-10 sm:py-14 md:py-20 lg:py-24"  // mobile: 2.5rem, tablet: 3.5rem, desktop: 5rem
    : "py-12 sm:py-16 md:py-24 lg:py-28 xl:py-32"; // mobile: 3rem, tablet: 4rem, desktop: 6-8rem
  
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
   Anchor Offset Helper — prevents sticky header collisions (no JS)
============================================================================ */
function AnchorOffset({ id }: { id: string }) {
  return <span id={id} className="block scroll-mt-28" aria-hidden />;
}

/* ============================================================================
   Parallax Backdrop — subtle, restrained, performance-safe
============================================================================ */
function ParallaxBackdrop(): React.ReactElement {
  const [y, setY] = React.useState(0);

  React.useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setY(window.scrollY || 0));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll as any);
    };
  }, []);

  const t1 = `translateY(${Math.round(y * 0.04)}px)`;
  const t2 = `translateY(${Math.round(y * 0.025)}px)`;
  const t3 = `translateY(${Math.round(y * 0.015)}px)`;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-44 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-amber-500/7 blur-[130px]"
        style={{ transform: `translateX(-50%) ${t1}` as any }}
      />
      <div
        className="absolute top-24 right-[6%] h-[520px] w-[520px] rounded-full bg-white/[0.03] blur-[150px]"
        style={{ transform: t2 }}
      />
      <div
        className="absolute -bottom-56 left-[8%] h-[620px] w-[620px] rounded-full bg-amber-500/5 blur-[160px]"
        style={{ transform: t3 }}
      />
    </div>
  );
}

/* ============================================================================
   Premium Hero Frame — flagship lobby module (tight + expensive) - 🔧 MODIFIED FOR MOBILE
============================================================================ */
function HeroFrame(): React.ReactElement {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-[2.25rem] border border-white/10 bg-white/[0.02] shadow-2xl shadow-black/60">
      {/* Cinematic backdrop image (subtle) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src="/assets/images/abraham-of-london-banner.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1200px"
          className="object-cover opacity-[0.16] scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/80 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_10%,rgba(245,158,11,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_10%_85%,rgba(255,255,255,0.07),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:96px_96px]" />
      </div>

      {/* Inner frame - 🔧 MODIFIED mobile padding */}
      <div className="relative px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-14">
        <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-md">
              <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.4em] sm:tracking-[0.45em] text-amber-200/70">
                Institutional Platform
              </span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.3em] sm:tracking-[0.35em] text-white/45">
                doctrine · strategy · assets
              </span>
            </div>

            <h2 className="mt-4 sm:mt-6 font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white/95 tracking-tight text-balance">
              This is the lobby.
              <span className="text-white/55"> Shorts are the corridor.</span>
            </h2>

            <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-white/55 leading-relaxed max-w-xl">
              For serious builders: worldview clarity, operating systems, and deployable infrastructure—presented with
              enough restraint to feel expensive.
            </p>

            <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3 text-[8px] sm:text-[10px] font-mono uppercase tracking-[0.25em] sm:tracking-[0.3em] text-white/35">
              <span className="inline-flex items-center gap-1 sm:gap-2">
                <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500/70" />
                audit-ready
              </span>
              <span className="text-amber-500/40">/</span>
              <span className="inline-flex items-center gap-1 sm:gap-2">
                <Target className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500/70" />
                operator-first
              </span>
              <span className="text-amber-500/40">/</span>
              <span className="inline-flex items-center gap-1 sm:gap-2">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500/70" />
                indexed assets
              </span>
            </div>
          </div>

          <div className="flex flex-col xs:flex-row sm:flex-row gap-2 sm:gap-3">
            <Link
              href="#prelude"
              aria-label="Jump to the Prelude MiniBook"
              className={[
                "inline-flex items-center justify-center gap-1 sm:gap-2 rounded-full px-5 sm:px-7 py-2.5 sm:py-3.5",
                "bg-amber-600 text-white",
                "text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.28em] sm:tracking-[0.32em]",
                "hover:bg-amber-700 hover:tracking-[0.32em] sm:hover:tracking-[0.36em] transition-all shadow-lg shadow-amber-900/25",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
              ].join(" ")}
            >
              Start Here <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/30" />
            </Link>

            <Link
              href="/vault"
              aria-label="Open the Vault"
              className={[
                "inline-flex items-center justify-center gap-1 sm:gap-2 rounded-full px-5 sm:px-7 py-2.5 sm:py-3.5",
                "border border-amber-500/25 bg-amber-500/8 text-amber-100",
                "text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.28em] sm:tracking-[0.32em]",
                "hover:border-amber-500/45 hover:bg-amber-500/12 hover:tracking-[0.32em] sm:hover:tracking-[0.36em] transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
              ].join(" ")}
            >
              Open Vault <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/25" />
            </Link>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 lg:mt-10">
          <Hairline />
        </div>

        {/* Tightened: TrustSignals inside the frame, but visually “quiet” */}
        <div className="mt-4 sm:mt-6 lg:mt-8">
          <TrustSignals />
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Section Heading — hierarchy (luxury editorial) - 🔧 MODIFIED FOR MOBILE
============================================================================ */
function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  const isCenter = align === "center";
  return (
    <div className={isCenter ? "text-center" : ""}>
      <div
        className={[
          "inline-flex items-center gap-1 sm:gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 sm:px-4 py-1.5 sm:py-2",
          isCenter ? "mx-auto" : "",
        ].join(" ")}
      >
        <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.4em] sm:tracking-[0.45em] text-amber-200/65">{eyebrow}</span>
        <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white/15" />
        <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.25em] sm:tracking-[0.3em] text-white/35">indexed</span>
      </div>

      <h2 className="mt-4 sm:mt-5 md:mt-7 font-serif text-2xl sm:text-3xl md:text-4xl text-white/95 tracking-tight text-balance">{title}</h2>

      {description ? (
        <p
          className={[
            "mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-white/55 leading-relaxed",
            isCenter ? "max-w-3xl mx-auto" : "max-w-2xl",
          ].join(" ")}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

/* ============================================================================
   Narrative Bridge — editorial pacing (compact, not theatrical) - 🔧 MODIFIED FOR MOBILE
============================================================================ */
function NarrativeBridge({ text }: { text: string }) {
  return (
    <div className="relative bg-black py-8 sm:py-10 md:py-12 lg:py-16 border-t border-white/5">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Hairline />
        <p className="mt-4 sm:mt-6 md:mt-8 text-center text-[8px] sm:text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] sm:tracking-[0.35em] md:tracking-[0.38em] text-white/35">{text}</p>
      </div>
    </div>
  );
}

/* ============================================================================
   Quick Nav — for scanners (desktop) - UNCHANGED (hidden on mobile)
============================================================================ */
function QuickNav(): React.ReactElement {
  const items = [
    { href: "#prelude", label: "Prelude" },
    { href: "#fit", label: "Fit" },
    { href: "#proof", label: "Proof" },
    { href: "#vault", label: "Vault" },
    { href: "#ventures", label: "Ventures" },
    { href: "#dispatches", label: "Shorts" },
  ];

  return (
    <div className="sticky top-16 z-30 hidden lg:block">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-md shadow-lg shadow-black/30">
          <span className="px-3 py-1 text-[9px] font-mono uppercase tracking-[0.35em] text-white/35">Jump</span>
          <div className="h-4 w-px bg-white/10" />
          {items.map((x) => (
            <Link
              key={x.href}
              href={x.href}
              className="rounded-full px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.28em] text-white/45 hover:text-amber-100 hover:bg-white/[0.03] transition-all"
            >
              {x.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Start Here Rail — A11y + tactile interactions - 🔧 MODIFIED FOR MOBILE
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
      href: "/vault",
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
    <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
      {items.map((x, index) => (
        <Link
          key={x.title}
          href={x.href}
          aria-label={x.aria}
          className={[
            "group rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 md:p-7",
            "transition-all duration-300 will-change-transform",
            "hover:bg-white/[0.04] hover:border-amber-500/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            "motion-safe:animate-aolFadeUp",
          ].join(" ")}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 items-center justify-center rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.02]">
              <x.Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-amber-300" />
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[9px] md:text-[10px] font-extrabold uppercase tracking-[0.22em] sm:tracking-[0.25em] md:tracking-[0.28em] text-white/70">
              {x.badge}
            </span>
          </div>

          <h3 className="mt-3 sm:mt-4 md:mt-5 font-serif text-lg sm:text-xl md:text-2xl font-medium text-white group-hover:text-amber-50 transition-colors text-balance">
            {x.title}
          </h3>
          <p className="mt-2 sm:mt-2.5 md:mt-3 text-xs sm:text-sm leading-relaxed text-white/60 group-hover:text-white/75 transition-colors">
            {x.body}
          </p>

          <div className="mt-4 sm:mt-5 md:mt-6 inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-wider sm:tracking-widest text-amber-500/85">
            Open
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-white/20 transition-all group-hover:text-amber-400 group-hover:translate-x-0.5" />
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ============================================================================
   Proof Stack — micro-interactions + A11y - 🔧 MODIFIED FOR MOBILE
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
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 md:p-8 lg:p-10 backdrop-blur-sm">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(212,175,55,0.6),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_72%,rgba(255,255,255,0.14),transparent_60%)]" />
      </div>

      <div className="relative flex flex-col gap-4 sm:gap-5 md:gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-1 sm:gap-2 rounded-md border border-white/10 bg-black/30 px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1">
            <ShieldCheck className="h-3 w-3 sm:h-3.25 sm:w-3.25 md:h-3.5 md:w-3.5 text-amber-500/70" />
            <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.32em] md:tracking-[0.35em] text-amber-500/70">
              Credibility Layer
            </span>
            <ChevronRight className="h-3 w-3 sm:h-3.25 sm:w-3.25 md:h-3.5 md:w-3.5 text-white/15" />
            <span className="text-[8px] sm:text-[9px] md:text-[10px] font-mono uppercase tracking-[0.22em] sm:tracking-[0.25em] md:tracking-[0.28em] text-white/40">proof-stack</span>
          </div>

          <h2 className="mt-3 sm:mt-4 md:mt-5 lg:mt-6 font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium text-white tracking-tight text-balance">
            Why this holds under pressure.
          </h2>
          <p className="mt-2 sm:mt-2.5 md:mt-3 text-xs sm:text-sm md:text-base text-white/55 leading-relaxed max-w-2xl">
            If it can’t survive hostile cross-examination, it isn’t strategy — it’s theatre. These standards sit behind
            every artifact and engagement.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-2.5 md:gap-3">
          <Link
            href="/canon"
            aria-label="Browse the Canon"
            className={[
              "inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 rounded-lg sm:rounded-xl border border-white/10 bg-white/5 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3",
              "text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.22em] sm:tracking-[0.25em] md:tracking-[0.28em] text-white/85",
              "transition-all hover:bg-white/10 hover:text-white hover:-translate-y-0.5",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            ].join(" ")}
          >
            Browse Canon
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-white/20" />
          </Link>

          <Link
            href="/vault"
            aria-label="Open the Vault"
            className={[
              "inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 rounded-lg sm:rounded-xl border border-amber-500/25 bg-amber-500/7 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3",
              "text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.22em] sm:tracking-[0.25em] md:tracking-[0.28em] text-amber-100",
              "transition-all hover:bg-amber-500/12 hover:border-amber-500/45 hover:-translate-y-0.5",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            ].join(" ")}
          >
            Open Vault
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-white/20" />
          </Link>
        </div>
      </div>

      <div className="relative mt-6 sm:mt-8 md:mt-10 grid gap-3 sm:gap-3.5 md:gap-4 md:grid-cols-3">
        {proofs.map((p, index) => (
          <div
            key={p.title}
            className={[
              "group rounded-2xl sm:rounded-3xl border border-white/10 bg-black/40 p-5 sm:p-6 md:p-7",
              "transition-all duration-300 will-change-transform",
              "hover:bg-white/[0.03] hover:border-amber-500/18 hover:-translate-y-1 hover:scale-[1.02]",
              "hover:shadow-2xl hover:shadow-black/50",
              "motion-safe:animate-aolFadeUp",
            ].join(" ")}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <p.Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-amber-300" />
              <div
                aria-hidden
                className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-full bg-amber-500/8 opacity-0 blur-xl transition-opacity group-hover:opacity-100"
              />
            </div>
            <h3 className="mt-3 sm:mt-4 md:mt-5 font-serif text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-white text-balance">{p.title}</h3>
            <p className="mt-2 sm:mt-2.5 md:mt-3 text-xs sm:text-sm leading-relaxed text-white/60 group-hover:text-white/75 transition-colors">
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   Skeletons (loading states) — refined with amber accents - 🔧 MODIFIED FOR MOBILE
============================================================================ */
function SkeletonLine({ w = "w-3/4", amber = false }: { w?: string; amber?: boolean }) {
  return <div className={["h-2 sm:h-2.5 md:h-3 rounded", amber ? "bg-amber-500/10" : "bg-white/5", w].join(" ")} />;
}

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 md:p-8 lg:p-10 animate-pulse">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-xl sm:rounded-2xl bg-white/5" />
        <div className="h-5 w-20 sm:h-5.5 sm:w-24 md:h-6 md:w-28 rounded-full bg-white/5" />
      </div>
      <div className="mt-4 sm:mt-5 md:mt-6 h-5 w-48 sm:h-5.5 sm:w-52 md:h-6 md:w-56 lg:h-7 lg:w-64 rounded bg-white/5" />
      <div className="mt-3 sm:mt-3.5 md:mt-4 space-y-1.5 sm:space-y-1.75 md:space-y-2">
        <SkeletonLine w="w-5/6" />
        <SkeletonLine w="w-2/3" />
        <SkeletonLine w="w-1/2" />
      </div>
      <div className="mt-5 sm:mt-6 md:mt-7 lg:mt-8 text-[8px] sm:text-[9px] md:text-[10px] font-mono uppercase tracking-[0.25em] sm:tracking-[0.28em] md:tracking-[0.3em] text-white/30">{label}</div>
    </div>
  );
}

function RailSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 md:p-8 lg:p-10 animate-pulse">
      <div className="h-5 w-40 sm:h-5.5 sm:w-44 md:h-6 md:w-48 lg:h-7 lg:w-52 rounded bg-white/5" />
      <div className="mt-3 sm:mt-3.5 md:mt-4 grid gap-3 sm:gap-3.5 md:gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl sm:rounded-3xl border border-white/10 bg-black/40 p-4 sm:p-5 md:p-6">
            <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-xl sm:rounded-2xl bg-white/5" />
            <div className="mt-3 sm:mt-4 md:mt-5 h-4 w-2/3 sm:h-4.5 md:h-5 rounded bg-white/5" />
            <div className="mt-2 sm:mt-2.5 md:mt-3 space-y-1.5 sm:space-y-1.75 md:space-y-2">
              <SkeletonLine w="w-5/6" />
              <SkeletonLine w="w-2/3" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 sm:mt-6 md:mt-7 lg:mt-8 text-[8px] sm:text-[9px] md:text-[10px] font-mono uppercase tracking-[0.25em] sm:tracking-[0.28em] md:tracking-[0.3em] text-white/30">{label}</div>
    </div>
  );
}

function ContentShowcaseSkeleton() {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 md:p-8 lg:p-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-5 md:gap-6">
        <div className="w-full sm:w-auto">
          <div className="h-4 w-20 sm:h-4.5 sm:w-24 md:h-5 md:w-28 rounded bg-white/5 animate-pulse" />
          <div className="mt-3 sm:mt-3.5 md:mt-4 h-5 w-40 sm:h-5.5 sm:w-44 md:h-6 md:w-48 lg:h-7 lg:w-56 rounded bg-white/5 animate-pulse" />
          <div className="mt-2 sm:mt-2.5 md:mt-3 h-3 w-full max-w-xs sm:h-3.5 md:h-4 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="hidden sm:block md:hidden lg:block h-8 w-20 sm:h-9 sm:w-24 md:h-10 md:w-28 rounded-full bg-white/5 animate-pulse" />
      </div>

      <div className="mt-6 sm:mt-7 md:mt-8 lg:mt-10 grid gap-3 sm:gap-3.5 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl sm:rounded-3xl border border-white/10 bg-black/40 p-4 sm:p-5 md:p-6 lg:p-7 animate-pulse">
            <div className="h-2 w-24 sm:h-2.5 sm:w-28 md:h-3 md:w-32 lg:w-40 rounded bg-white/5" />
            <div className="mt-3 sm:mt-4 md:mt-5 h-4 w-5/6 sm:h-4.5 md:h-5 lg:h-6 rounded bg-white/5" />
            <div className="mt-2 sm:mt-2.5 md:mt-3 space-y-1 sm:space-y-1.25 md:space-y-1.5">
              <SkeletonLine w="w-5/6" />
              <SkeletonLine w="w-2/3" />
            </div>
            <div className="mt-4 sm:mt-5 md:mt-6 h-2 w-12 sm:h-2.5 sm:w-14 md:h-3 md:w-16 lg:w-20 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   HomePage Component - 🔧 MODIFIED FOR MOBILE (hero section spacing)
============================================================================ */
const HomePage: NextPage<HomePageProps> = ({ featuredShorts, featuredBriefing, events, counts, canonPrelude }) => {
  const hasShorts = featuredShorts.length > 0;

  // HeroSection expects Counts: { shorts, canon, briefs, library }
  const heroCounts = {
    shorts: counts.shorts,
    canon: counts.canon,
    briefs: counts.briefs,
    library: counts.library,
  };

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

      {/* A11Y: skip link for keyboard scanners */}
      <a
        href="#prelude"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-black focus:px-4 focus:py-3 focus:text-[12px] focus:font-mono focus:uppercase focus:tracking-widest focus:text-amber-100 focus:ring-2 focus:ring-amber-500"
      >
        Skip to Prelude
      </a>

      {/* QUICK NAV (scanner control) */}
      <QuickNav />

      {/* HERO STACK — flagship + restraint */}
      <section className="relative bg-black overflow-hidden">
        <ParallaxBackdrop />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-18 md:pt-20 lg:pt-24 motion-safe:animate-aolFadeUp">
          <div className="relative">
            <HeroSection counts={heroCounts} />

            {/* subtle “scroll cue” for first-time landers */}
            <div className="mt-6 sm:mt-8 md:mt-10 flex items-center justify-center">
              <Link
                href="#prelude"
                aria-label="Scroll to Prelude"
                className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-[8px] sm:text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] sm:tracking-[0.32em] md:tracking-[0.35em] text-white/55 hover:text-amber-100 hover:border-amber-500/25 hover:bg-amber-500/5 transition-all"
              >
                Enter{" "}
                <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-white/25 group-hover:text-amber-300 transition-colors" />
              </Link>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 md:mt-12 lg:mt-14">
            <Hairline />
          </div>

          {/* Hero premium lobby frame */}
          <div className="mt-8 sm:mt-10 md:mt-12 lg:mt-14">
            <HeroFrame />
          </div>

          <div className="mt-8 sm:mt-10 md:mt-12 lg:mt-14">
            <Hairline />
          </div>
        </div>

        {/* Stats (kept) */}
        <StatsBar />
      </section>

      {/* MINI-BOOK (SPINE) — immediately after hero */}
      <Section id="prelude" tight border>
        <AnchorOffset id="prelude" />
        <div id="canon" className="sr-only" aria-hidden />

        <div className="mx-auto max-w-6xl relative">
          <SectionHeading
            eyebrow="Prelude"
            title="The spine of the entire system."
            description="The Canon begins as compressed doctrine. Everything else is downstream: operating systems, ventures, and deployable assets."
            align="center"
          />

          <div className="mt-8 sm:mt-10 md:mt-12 relative">
            <div aria-hidden className="pointer-events-none absolute -inset-6 sm:-inset-8 md:-inset-10 bg-amber-500/5 blur-[80px] sm:blur-[100px] md:blur-[130px] rounded-full" />
            <div className="relative">
              <CanonInstitutionalIntro prelude={canonPrelude} />
            </div>
          </div>
        </div>
      </Section>

      {/* WHO I WORK WITH */}
      <Section id="fit" tight={false} border={false} surface={false}>
        <AnchorOffset id="fit" />
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            eyebrow="Fit"
            title="Who this is built for."
            description="Builders, operators, founders, and leadership teams who want clarity, control, cadence—and outcomes."
            align="center"
          />
          <div className="mt-8 sm:mt-10 md:mt-12">
            <WhoIWorkWith variant="dark" />
          </div>
        </div>
      </Section>

      <NarrativeBridge text="From doctrine → to deployment" />

      {/* PROOF STACK */}
      <Section id="proof" tight border surface>
        <AnchorOffset id="proof" />
        <ProofStack counts={counts} />
      </Section>

      <NarrativeBridge text="From standards → to operating systems" />

      {/* OPERATIONAL FUNNEL (lazy) */}
      <Section id="strategy" tight border surface>
        <AnchorOffset id="strategy" />
        <SectionHeading
          eyebrow="Operating System"
          title="Strategy you can actually run."
          description="Not a deck. A mechanism: decision rights, cadence, accountability loops, and execution tooling."
        />
        <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12">
          <StrategicFunnelStrip />
        </div>
      </Section>

      <NarrativeBridge text="From design → to assets" />

      {/* VAULT (lazy) */}
      <Section id="vault" tight border>
        <AnchorOffset id="vault" />
        <SectionHeading
          eyebrow="Vault"
          title="Deployables for serious execution."
          description="Templates, packs, and operating assets engineered for reuse—not decoration."
        />
        <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12">
          <VaultTeaserRail />
        </div>
      </Section>

      {/* START HERE RAIL */}
      <Section id="pathways" tight border surface>
        <AnchorOffset id="pathways" />
        <SectionHeading
          eyebrow="Pathways"
          title="Three clean moves."
          description="If you’re new: don’t wander. Pick the lane and move."
          align="center"
        />
        <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12">
          <StartHereRail />
        </div>
      </Section>

      {/* FEATURED BRIEFING */}
      {featuredBriefing && (
        <Section id="briefing" tight border surface>
          <AnchorOffset id="briefing" />
          <SectionHeading
            eyebrow="Briefing"
            title="Operator-grade intelligence."
            description="A focused transmission: the kind of clarity that survives hostile scrutiny."
          />
          <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12">
            <OperatorBriefing featured={featuredBriefing as any} />
          </div>
        </Section>
      )}

      {/* EVENTS (lazy) */}
      {events.length > 0 ? (
        <Section id="events" tight border>
          <AnchorOffset id="events" />
          <SectionHeading
            eyebrow="Events"
            title="Sessions appear here first."
            description="Quietly. Clearly. With enough context to decide."
          />
          <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12">
            <EventsSection events={events as any} />
          </div>
        </Section>
      ) : (
        <Section id="events" tight border>
          <AnchorOffset id="events" />
          <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16 backdrop-blur-sm">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-mono uppercase tracking-[0.35em] sm:tracking-[0.38em] md:tracking-[0.4em] text-amber-500/60 bg-amber-500/5 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.25 md:py-1.5 rounded-full border border-amber-500/12">
                Events Registry
              </span>
              <h2 className="mt-4 sm:mt-5 md:mt-6 lg:mt-7 font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white/90 text-balance">
                The calendar is being indexed.
              </h2>
              <p className="mt-2 sm:mt-3 md:mt-4 text-xs sm:text-sm md:text-base text-white/60 leading-relaxed max-w-2xl mx-auto">
                When sessions go live, they appear here first—quietly, clearly, and with enough context to decide.
              </p>
              <div className="mt-5 sm:mt-6 md:mt-7 lg:mt-8 xl:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link
                  href="/events"
                  aria-label="View events"
                  className={[
                    "group px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 sm:py-3 md:py-3.5 rounded-full border border-white/12 bg-white/[0.02]",
                    "text-[8px] sm:text-[9px] md:text-[10px] font-mono uppercase tracking-[0.25em] sm:tracking-[0.28em] md:tracking-[0.3em] text-white/80",
                    "hover:text-white hover:border-amber-500/30 hover:bg-amber-500/5 transition-all",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                  ].join(" ")}
                >
                  <span className="group-hover:tracking-[0.3em] sm:group-hover:tracking-[0.32em] md:group-hover:tracking-[0.35em] transition-all">View Events</span>
                </Link>
                <Link
                  href="/contact"
                  aria-label="Request a session"
                  className={[
                    "px-5 sm:px-6 md:px-7 lg:px-8 py-2.5 sm:py-3 md:py-3.5 rounded-full bg-amber-600",
                    "text-[8px] sm:text-[9px] md:text-[10px] font-mono uppercase tracking-[0.25em] sm:tracking-[0.28em] md:tracking-[0.3em] text-white",
                    "hover:bg-amber-700 hover:tracking-[0.3em] sm:hover:tracking-[0.32em] md:hover:tracking-[0.35em] transition-all shadow-lg shadow-amber-900/20",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                  ].join(" ")}
                >
                  Request a Session
                </Link>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* VENTURES (lazy) */}
      <Section id="ventures" tight border surface>
        <AnchorOffset id="ventures" />
        <SectionHeading
          eyebrow="Ventures"
          title="Execution has a home."
          description="Where doctrine becomes institutions: ventures, platforms, and strategic infrastructure."
        />
        <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12">
          <VenturesSection />
        </div>
      </Section>

      {/* DISPATCHES (lazy) */}
      {hasShorts && (
        <Section id="dispatches" tight border>
          <AnchorOffset id="dispatches" />
          <SectionHeading
            eyebrow="Dispatches"
            title="Short, sharp intelligence notes."
            description="Engineered for retrieval and reuse. The corridor is clean—but the lobby stays superior."
          />
          <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12">
            <ContentShowcase
              items={featuredShorts as any}
              title="Dispatches"
              description="Short, sharp intelligence notes engineered for retrieval and reuse."
              className=""
            />
          </div>
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
   getStaticProps — HARDENED (unchanged logic)
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

    const rawEvents = stableDocs.filter((d) => kindLower(d) === "event" || flattenedPath(d).startsWith("events/"));
    events = rawEvents.map(toEvent).filter(Boolean) as EventItem[];
    events = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 6);

    const candidates = stableDocs.map(toItem).filter(Boolean) as FeaturedItem[];
    const featured = candidates.filter((x) => {
      const origin = stableDocs.find((dd: any) => toItem(dd)?.href === x.href);
      return origin ? pickBooleanFlag(origin) : false;
    });

    featuredBriefing = featured.find((x) => x.kind === "brief") || featured.find((x) => x.kind === "short") || null;

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
      throw new Error("FORCE_FALLBACK_TO_GENERATED");
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.warn("[Home/getStaticProps] SSOT non-fatal:", errorMessage);

    try {
      const gen: any = await import("contentlayer/generated");
      const docs = collectAnyDocs(gen);

      computeFromDocs(docs, gen);

      if (shouldForceFallback(counts, docs.length)) {
        console.warn("[Home/getStaticProps] Generated fallback also appears empty:", { docs: docs.length, counts });
      }
    } catch (fallbackErr) {
      console.error("[Home/getStaticProps] fallback failed:", fallbackErr);
    }
  }

  return {
    props: sanitizeData({ featuredShorts, featuredBriefing, events, counts, canonPrelude }),
    revalidate: 3600,
  };
};

export default HomePage;