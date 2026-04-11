/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/index.tsx — HOMEPAGE
// Design direction: Institutional Monumentalism
// Typography: Cormorant Garamond (serif) + JetBrains Mono (mono)
// Palette: #060609 base · #C9A96E softGold · white at precision opacity steps
// Philosophy: Authority through restraint. Every element earns its place.
// Audience: BlackRock analysts, McKinsey partners, sovereign fund allocators,
//           serious founders — people who distrust anything that tries too hard.

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, CalendarDays, ShieldCheck, Layers, Sparkles,
  ChevronRight, Compass, AlertTriangle, BookOpen, ScrollText,
  LibraryBig, Activity, ScanSearch, Crown, Scale, Briefcase,
  FileText, Eye, Archive, Workflow, Download, TrendingUp,
  Landmark, Building2, Lock, Globe, Users,
} from "lucide-react";

import Layout from "@/components/Layout";
import EngagementLanes from "@/components/homepage/EngagementLanes";
import WhoIWorkWith from "@/components/WhoIWorkWith";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";
import VaultTeaserRail from "@/components/homepage/VaultTeaserRail";
import EventsSection from "@/components/homepage/EventsSection";
import ContentShowcase from "@/components/homepage/ContentShowcase";
import VenturesSection from "@/components/homepage/VenturesSection";
import ExecutiveBuyerFitSection from "@/components/diagnostics/ExecutiveBuyerFitSection";
import StrategyRoomIntegration from "@/components/consulting/StrategyRoomIntegration";
import { CanonInstitutionalIntro, OperatorBriefing } from "@/components/homepage";
import type { CanonPrelude } from "@/components/homepage/CanonInstitutionalIntro";

import { joinHref, normalizeSlug } from "@/lib/content/shared";
import { sanitizeData } from "@/lib/content/server";
import { getPublicationCatalogue, getPublicationBySlug } from "@/lib/editorial/catalogue";
import type { PublicationRecord } from "@/lib/editorial/types";
import type { PublicationItem } from "@/lib/editorial/server-readers";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type FeaturedItem = {
  title: string; slug: string; href: string;
  excerpt?: string | null; dateISO?: string | null;
  theme?: string | null; kind?: string | null;
};

export type EventItem = {
  slug: string; title: string; date: string; location: string;
  mode: "online" | "in-person" | "hybrid";
  excerpt?: string | null; capacity?: number | null;
  duration?: string | null; status?: "open" | "limited" | "full" | "past" | null;
};

type PlaybookItem = {
  slug: string; title: string; description?: string | null;
  difficulty?: string | null; playbookType?: string | null;
  estimatedTime?: string | null; href: string;
};

type QuarterlyReport = {
  id: string; title: string; slug: string; description: string;
  publishedAt: string; quarter: string; year: number; readingTime: number;
  pdfUrl?: string | null; keyFindings?: string[];
};

type HomePageProps = {
  featuredShorts: FeaturedItem[];
  featuredBriefing: FeaturedItem | null;
  flagshipPublication: PublicationItem | null;
  featuredPublications: PublicationItem[];
  featuredPlaybooks: PlaybookItem[];
  events: EventItem[];
  canonPrelude: CanonPrelude;
  latestReport: QuarterlyReport | null;
  counts: {
    shorts: number; canon: number; briefs: number; downloads: number;
    library: number; publications: number; playbooks: number;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS (inline — consumed locally)
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "#060609";
const VOID = "#030305";

// ─────────────────────────────────────────────────────────────────────────────
// MOTION PRESETS
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.75, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.65 } },
};

const stagger = (d = 0.09) => ({
  hidden: {},
  show: { transition: { staggerChildren: d } },
});

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Grain overlay — shared texture
const GRAIN_STYLE: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

/** The gold thread — horizontal rule */
function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div className={cn("h-px w-full", soft
      ? "bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      : "bg-gradient-to-r from-transparent via-[#C9A96E]/30 to-transparent"
    )} />
  );
}

/** Mono eyebrow with gold tick */
function Eyebrow({ children, align = "left", dim = false }: {
  children: React.ReactNode;
  align?: "left" | "center";
  dim?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", align === "center" && "justify-center")}>
      <span className="h-5 w-px" style={{ background: `${GOLD}55` }} />
      <span className={cn(
        "font-['JetBrains_Mono',ui-monospace,monospace] text-[8.5px] uppercase tracking-[0.40em]",
        dim ? "text-white/22" : `text-[${GOLD}]/75`,
      )} style={dim ? {} : { color: `${GOLD}BF` }}>
        {children}
      </span>
    </div>
  );
}

/** Scroll anchor */
const Anchor = ({ id }: { id: string }) => <span id={id} className="block scroll-mt-28" aria-hidden />;

/** Institutional glass panel */
function Panel({ children, className = "", gold = false }: {
  children: React.ReactNode; className?: string; gold?: boolean;
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-[2px]",
      "border bg-black/55 backdrop-blur-sm",
      gold
        ? "border-[#C9A96E]/18 shadow-[0_0_90px_-35px_rgba(201,169,110,0.18)]"
        : "border-white/[0.065] shadow-[0_32px_100px_-50px_rgba(0,0,0,0.98)]",
      className,
    )}>
      <div className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-px",
        gold
          ? "bg-gradient-to-r from-transparent via-[#C9A96E]/25 to-transparent"
          : "bg-gradient-to-r from-transparent via-white/[0.08] to-transparent",
      )} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.016),transparent_55%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** Page section with atmospheric background */
function Section({ id, children, variant = "base", cap, className = "" }: {
  id?: string; children: React.ReactNode;
  variant?: "base" | "surface" | "void"; cap?: string; className?: string;
}) {
  const bg =
    variant === "surface"
      ? `bg-[radial-gradient(ellipse_70%_50%_at_20%_0%,rgba(201,169,110,0.05)_0%,transparent_60%),radial-gradient(ellipse_60%_40%_at_80%_30%,rgba(255,255,255,0.02)_0%,transparent_55%)]`
      : variant === "void"
        ? `bg-[${VOID}]`
        : `bg-[${BASE}]`;

  return (
    <section
      id={id}
      className={cn("relative", className)}
      style={{ backgroundColor: variant === "void" ? VOID : BASE }}
    >
      {/* Atmospheric gradient */}
      {variant === "surface" && (
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 50% at 20% 0%, rgba(201,169,110,0.05) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 30%, rgba(255,255,255,0.02) 0%, transparent 55%)" }}
        />
      )}
      {/* Grain */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.032]" style={GRAIN_STYLE} />
      {/* Top/bottom rules */}
      <div className="absolute inset-x-0 top-0 pointer-events-none"><GoldRule soft /></div>
      <div className="absolute inset-x-0 bottom-0 pointer-events-none"><GoldRule soft /></div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        {cap && (
          <div className="mb-14 flex items-center gap-6">
            <div className="flex-1"><GoldRule soft /></div>
            <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7.5px] uppercase tracking-[0.46em] text-white/20">{cap}</span>
            <div className="flex-1"><GoldRule soft /></div>
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/** Typographic section header */
function SectionHeader({ eyebrow, title, description, align = "left", large = false }: {
  eyebrow: string; title: React.ReactNode; description?: string;
  align?: "left" | "center"; large?: boolean;
}) {
  const center = align === "center";
  return (
    <motion.div
      variants={fadeUp} initial="hidden"
      whileInView="show" viewport={{ once: true, margin: "-60px" }}
      className={cn("max-w-4xl", center && "mx-auto text-center")}
    >
      <Eyebrow align={align}>{eyebrow}</Eyebrow>
      <h2 className={cn(
        "mt-5 font-['Cormorant_Garamond',Georgia,serif] font-light leading-[0.93] tracking-[-0.028em] text-white",
        large ? "text-4xl md:text-5xl lg:text-[3.6rem]" : "text-3xl md:text-4xl lg:text-5xl",
      )}>
        {title}
      </h2>
      {description && (
        <p className={cn("mt-5 text-[15px] leading-[1.8] text-white/42", center && "mx-auto max-w-2xl")}>
          {description}
        </p>
      )}
      <div className={cn("mt-8 w-10", center && "mx-auto")}><GoldRule /></div>
    </motion.div>
  );
}

/** Thin labelled bridge between sections */
function Bridge({ text }: { text: string }) {
  return (
    <div style={{ backgroundColor: BASE }}>
      <div className="mx-auto max-w-7xl px-6 py-7 sm:px-8 lg:px-12">
        <div className="flex items-center gap-8">
          <div className="flex-1"><GoldRule soft /></div>
          <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.50em] text-white/18">{text}</span>
          <div className="flex-1"><GoldRule soft /></div>
        </div>
      </div>
    </div>
  );
}

/** Module error boundary */
class ModuleBoundary extends React.Component<
  { label: string; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: any) { console.error(`[Homepage/${this.props.label}]`, err); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-[2px] border border-white/[0.05] bg-white/[0.01] p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-white/20" />
            <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[8px] uppercase tracking-[0.28em] text-white/25">
              {this.props.label} unavailable
            </span>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────────────────────────────────────

function HeroSection({
  counts, onScroll,
}: {
  counts: { canon: number; library: number; briefs: number; shorts: number };
  onScroll?: () => void;
}) {
  const { scrollY } = useScroll();
  const imgOpacity = useTransform(scrollY, [0, 700], [1, 0.25]);
  const imgScale = useTransform(scrollY, [0, 700], [1, 1.10]);
  const contentY = useTransform(scrollY, [0, 500], [0, -50]);

  const stats = [
    { value: counts.canon, label: "Canon entries", href: "/canon" },
    { value: counts.library, label: "Library works", href: "/library" },
    { value: counts.briefs, label: "Strategic briefs", href: "/vault/briefs" },
    { value: counts.shorts, label: "Dispatches", href: "/shorts" },
  ];

  return (
    <section
      className="relative isolate h-screen max-h-[1120px] min-h-[760px] w-full overflow-hidden"
      style={{ backgroundColor: VOID }}
    >
      {/* ── Parallax backdrop ── */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ opacity: imgOpacity, scale: imgScale }}
      >
        <Image
          src="/assets/images/abraham-of-london-banner@2560.webp"
          alt="" fill priority sizes="100vw" quality={90}
          className="object-cover object-[30%_center]"
        />
        {/* Cinematic depth overlays */}
        <div className="absolute inset-0" style={{
          background: `linear-gradient(to right, ${VOID}EE 0%, ${VOID}AA 40%, ${VOID}70 100%)`
        }} />
        <div className="absolute inset-0" style={{
          background: `linear-gradient(to top, ${VOID} 0%, transparent 35%, ${VOID}38 100%)`
        }} />
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse 55% 70% at 15% 30%, rgba(201,169,110,0.07) 0%, transparent 60%)`
        }} />
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.042]" style={GRAIN_STYLE} />
      </motion.div>

      {/* Top precision rule */}
      <div className="absolute inset-x-0 top-0 z-20" style={{ height: 1, background: `linear-gradient(to right, transparent, ${GOLD}22, transparent)` }} />

      {/* ── Main content ── */}
      <motion.div className="relative z-10 flex h-full items-center" style={{ y: contentY }}>
        <div className="mx-auto w-full max-w-7xl px-8 pb-24 pt-36 lg:px-16 lg:pt-44">
          <div className="max-w-[56rem]">

            {/* Institution badge */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, delay: 0.12 }}>
              <div className="inline-flex items-center gap-3 border border-white/[0.07] bg-black/38 px-4 py-2 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
                <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[8px] uppercase tracking-[0.38em] text-white/48">
                  Strategic clarity for serious operators
                </span>
              </div>
            </motion.div>

            {/* The wordmark — monumental scale */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.05, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9"
            >
              <div
                className="font-['Cormorant_Garamond',Georgia,serif] font-light leading-[0.86] tracking-[-0.045em]"
                style={{ fontFeatureSettings: '"liga" 1, "kern" 1' }}
              >
                <div className="flex flex-wrap items-baseline" style={{ gap: "0 1.2rem" }}>
                  <span className="text-white" style={{ fontSize: "clamp(4rem, 10vw, 9.5rem)" }}>
                    Abraham
                  </span>
                  <span className="italic text-white/28" style={{ fontSize: "clamp(3.2rem, 8vw, 7.8rem)" }}>
                    of
                  </span>
                </div>
                <div className="italic" style={{ fontSize: "clamp(4rem, 10vw, 9.5rem)", color: GOLD }}>
                  London
                </div>
              </div>
              <div className="mt-7 h-px w-24" style={{ background: `${GOLD}50` }} />
            </motion.div>

            {/* Positioning */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.48 }}
              className="mt-9 font-['Cormorant_Garamond',Georgia,serif] font-light leading-relaxed text-white/52"
              style={{ fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)" }}
            >
              Doctrine, strategy, and execution
              <span className="block text-white/28">organised into one platform.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.62 }}
              className="mt-11 flex flex-wrap gap-3"
            >
              <button
                type="button" onClick={onScroll}
                className="group inline-flex items-center gap-3 border border-white/[0.08] bg-white/[0.03] px-7 py-4 font-['JetBrains_Mono',ui-monospace,monospace] text-[9px] uppercase tracking-[0.32em] text-white/62 backdrop-blur-sm transition hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
              >
                <Compass className="h-3.5 w-3.5" style={{ color: `${GOLD}CC` }} />
                Access the canon
                <ArrowRight className="h-3.5 w-3.5 opacity-45 transition-transform group-hover:translate-x-0.5 group-hover:opacity-80" />
              </button>

              <Link
                href="/diagnostics/executive-reporting"
                className="group inline-flex items-center gap-3 border px-7 py-4 font-['JetBrains_Mono',ui-monospace,monospace] text-[9px] uppercase tracking-[0.32em] backdrop-blur-sm transition"
                style={{
                  borderColor: `${GOLD}44`, backgroundColor: `${GOLD}11`,
                  color: GOLD
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = `${GOLD}66`;
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = `${GOLD}1A`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = `${GOLD}44`;
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = `${GOLD}11`;
                }}
              >
                <ScrollText className="h-3.5 w-3.5" />
                Flagship product
                <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/consulting/strategy-room"
                className="group inline-flex items-center gap-3 border border-white/[0.06] px-7 py-4 font-['JetBrains_Mono',ui-monospace,monospace] text-[9px] uppercase tracking-[0.32em] text-white/38 backdrop-blur-sm transition hover:border-white/[0.12] hover:bg-white/[0.03] hover:text-white/62"
              >
                <Crown className="h-3.5 w-3.5" style={{ color: `${GOLD}90` }} />
                Strategy Room
              </Link>
            </motion.div>

          </div>
        </div>
      </motion.div>

      {/* ── Stats strip — bottom ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 1.1, delay: 0.9 }}
        className="absolute inset-x-0 bottom-0 z-10"
      >
        <div className="border-t border-white/[0.055] bg-black/72 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-8 lg:px-16">
            <div className="grid grid-cols-2 divide-x divide-white/[0.055] lg:grid-cols-4">
              {stats.map((item) => (
                <Link
                  key={item.label} href={item.href}
                  className="group px-6 py-5 transition hover:bg-white/[0.022]"
                >
                  <div className="font-['Cormorant_Garamond',Georgia,serif] text-[2rem] font-light text-white/72 transition-colors group-hover:text-white">
                    {item.value}
                  </div>
                  <div className="mt-1 font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.30em] text-white/24 transition-colors group-hover:text-white/42">
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM STATEMENT
// ─────────────────────────────────────────────────────────────────────────────

function PlatformStatement({ counts }: { counts: HomePageProps["counts"] }) {
  return (
    <Section variant="void" id="platform" cap="platform · architecture · portfolio logic">
      <Anchor id="platform" />
      <div className="grid gap-16 lg:grid-cols-[1.1fr_0.55fr] lg:items-start">

        {/* Left — the statement */}
        <motion.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="space-y-10">
          <motion.div variants={fadeUp}>
            <Eyebrow>What this is</Eyebrow>
            <h2 className="mt-6 font-['Cormorant_Garamond',Georgia,serif] font-light leading-[0.90] tracking-[-0.035em] text-white"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)" }}
            >
              Not a consultancy.
              <br /><span className="text-white/28">Not a publisher.</span>
              <br /><em className="not-italic" style={{ color: GOLD }}>An institution.</em>
            </h2>
          </motion.div>

          <motion.p variants={fadeUp} className="max-w-2xl text-[15px] leading-[1.85] text-white/42">
            Abraham of London is a governed platform for leaders, operators, and
            institutions under consequence. Doctrine establishes the worldview.
            Structured products create usable intellectual capital. Private mandate
            work is reserved for situations where casual engagement would be an insult
            to the problem.
          </motion.p>

          {/* Three pillars */}
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.055)" }}>
            {[
              { n: "01", title: "Thought and doctrine", body: "Canon, editorials, and publications establish the worldview, language, and authority structure.", icon: Compass },
              { n: "02", title: "Structured products", body: "Diagnostics, Executive Reporting, Market Intelligence, playbooks, and vault assets turn authority into usable capital.", icon: Archive },
              { n: "03", title: "Selective intervention", body: "Consulting and Strategy Room exist for situations where consequence is already material and judgment cannot be casual.", icon: Crown },
            ].map((item) => (
              <motion.div key={item.n} variants={fadeUp} className="flex gap-6 py-7">
                <div className="shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center border border-white/[0.06] bg-white/[0.02]">
                    <item.icon className="h-3.5 w-3.5 text-white/25" style={{}} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.34em] text-white/20">{item.n}</span>
                    <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[8.5px] uppercase tracking-[0.22em] text-white/48">{item.title}</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/32">{item.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right — registry + nav */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.18 }} className="space-y-3 lg:sticky lg:top-28"
        >
          {/* Registry numbers */}
          <Panel>
            <div className="p-5">
              <div className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.40em] text-white/18 mb-5">
                Platform registry
              </div>
              <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                {[
                  { label: "Library", value: counts.library, icon: LibraryBig },
                  { label: "Publications", value: counts.publications, icon: ScrollText },
                  { label: "Playbooks", value: counts.playbooks, icon: Workflow },
                  { label: "Products", value: counts.downloads + counts.briefs, icon: Archive },
                ].map((item) => (
                  <div key={item.label} className="p-5" style={{ backgroundColor: BASE }}>
                    <item.icon className="h-3.5 w-3.5 text-white/14" />
                    <div className="mt-4 font-['Cormorant_Garamond',Georgia,serif] text-[2.4rem] font-light leading-none text-white/78">
                      {item.value}
                    </div>
                    <div className="mt-1.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[6.5px] uppercase tracking-[0.30em] text-white/22">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* Navigation rail */}
          <Panel>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.048)" }}>
              {[
                { href: "/canon", eyebrow: "Doctrine", title: "Canon", icon: Compass },
                { href: "/artifacts", eyebrow: "Products", title: "Artifacts", icon: Archive },
                { href: "/editorials", eyebrow: "Publications", title: "Editorials", icon: ScrollText },
                { href: "/diagnostics", eyebrow: "Gateway", title: "Diagnostics", icon: ScanSearch },
                { href: "/consulting", eyebrow: "Advisory", title: "Consulting", icon: Briefcase },
              ].map((dest) => (
                <Link key={dest.href} href={dest.href}
                  className="group flex items-center justify-between px-5 py-3.5 transition hover:bg-white/[0.022]"
                >
                  <div className="flex items-center gap-3">
                    <dest.icon className="h-3.5 w-3.5 text-white/20 transition-colors group-hover:text-white/42" style={{ color: undefined }} />
                    <div>
                      <div className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.26em] text-white/24 transition-colors group-hover:text-white/48">
                        {dest.eyebrow}
                      </div>
                      <div className="font-['Cormorant_Garamond',Georgia,serif] text-[1rem] text-white/60 transition-colors group-hover:text-white/85">
                        {dest.title}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-white/12 transition-all group-hover:translate-x-0.5" style={{ color: undefined }} />
                </Link>
              ))}
            </div>
          </Panel>
        </motion.div>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLAGSHIP INTELLIGENCE
// ─────────────────────────────────────────────────────────────────────────────

function FlagshipIntelligence({ report }: { report: QuarterlyReport | null }) {
  const title = report?.title ?? "Global Market Intelligence Report Q1 2026";
  const description = report?.description ?? "A disciplined reading of global market conditions, policy pressure, and strategic positioning for serious operators.";
  const period = report ? `${report.quarter} ${report.year}` : "Current Edition";
  const findings = report?.keyFindings?.slice(0, 3) ?? [
    "Markets are pricing resilience, policy credibility, and strategic positioning.",
    "Trade friction and policy instability are reshaping capital allocation patterns.",
    "Serious boards now require structured macro interpretation.",
  ];

  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      <Panel gold>
        <div className="p-8 md:p-11 lg:p-13">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Eyebrow>Flagship intelligence product</Eyebrow>
            <div className="rounded-[1px] border px-3 py-1.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[7.5px] uppercase tracking-[0.26em]"
              style={{ borderColor: `${GOLD}30`, color: `${GOLD}AA`, backgroundColor: `${GOLD}0C` }}>
              {period}
            </div>
          </div>

          <div className="mt-9 grid gap-9 lg:grid-cols-[1.35fr_0.65fr]">
            <div>
              <h3 className="font-['Cormorant_Garamond',Georgia,serif] text-3xl font-light leading-[1.0] text-white md:text-[2.3rem]">
                {title}
              </h3>
              <p className="mt-4 text-[13.5px] leading-relaxed text-white/42">{description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Public orientation", "Institutional edition", "Boardroom PDF"].map(tag => (
                  <span key={tag} className="border border-white/[0.055] bg-white/[0.018] px-3 py-1 font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.22em] text-white/28">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/intelligence/global-market-intelligence-q1-2026"
                  className="group inline-flex items-center gap-2 border px-5 py-3 font-['JetBrains_Mono',ui-monospace,monospace] text-[8.5px] uppercase tracking-[0.28em] transition"
                  style={{ borderColor: `${GOLD}44`, color: GOLD, backgroundColor: `${GOLD}10` }}
                >
                  Open intelligence surface
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="/artifacts/global-market-intelligence-report-q1-2026"
                  className="group inline-flex items-center gap-2 border border-white/[0.07] bg-white/[0.018] px-5 py-3 font-['JetBrains_Mono',ui-monospace,monospace] text-[8.5px] uppercase tracking-[0.28em] text-white/42 transition hover:border-white/[0.12] hover:text-white/62"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Institutional edition
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.36em] text-white/18 mb-4">
                Key signals
              </div>
              {findings.map((f, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}
                  className="flex items-start gap-3 border border-white/[0.055] bg-white/[0.018] p-4"
                >
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: `${GOLD}90` }} />
                  <span className="text-[12px] leading-relaxed text-white/48">{f}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLAGSHIP ADVISORY
// ─────────────────────────────────────────────────────────────────────────────

function FlagshipAdvisory() {
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      <Panel>
        <div className="p-8 md:p-11 lg:p-13">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Eyebrow>Flagship advisory product</Eyebrow>
            <div className="border border-white/[0.055] bg-white/[0.018] px-3 py-1.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[7.5px] uppercase tracking-[0.26em] text-white/28">
              Premium interpretation layer
            </div>
          </div>

          <div className="mt-9 grid gap-9 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h3 className="font-['Cormorant_Garamond',Georgia,serif] text-3xl font-light leading-[1.0] text-white md:text-[2.3rem]">
                Executive Reporting
              </h3>
              <p className="mt-4 text-[13.5px] leading-relaxed text-white/40">
                The governed middle layer between raw diagnostic signal and private
                mandate work. Built for founders, boards, and leadership teams who
                need disciplined interpretation before escalation.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/diagnostics/executive-reporting"
                  className="group inline-flex items-center gap-2 border px-5 py-3 font-['JetBrains_Mono',ui-monospace,monospace] text-[8.5px] uppercase tracking-[0.28em] transition"
                  style={{ borderColor: `${GOLD}44`, color: GOLD, backgroundColor: `${GOLD}10` }}
                >
                  Open flagship product
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="/diagnostics"
                  className="group inline-flex items-center gap-2 border border-white/[0.07] bg-white/[0.018] px-5 py-3 font-['JetBrains_Mono',ui-monospace,monospace] text-[8.5px] uppercase tracking-[0.28em] text-white/38 transition hover:border-white/[0.12] hover:text-white/58"
                >
                  <ScanSearch className="h-3.5 w-3.5" />
                  Enter diagnostics
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.36em] text-white/18 mb-4">
                Product logic
              </div>
              {[
                "Structured interpretation before intervention",
                "Bridges free signal and private mandate",
                "Filters weak cases before advisory escalation",
                "Produces decision-facing outputs, not commentary",
              ].map((line, i) => (
                <div key={i} className="flex items-start gap-3 border border-white/[0.048] bg-white/[0.014] p-3.5">
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0" style={{ color: `${GOLD}75` }} />
                  <span className="text-[12px] leading-relaxed text-white/42">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLAGSHIP PUBLICATION
// ─────────────────────────────────────────────────────────────────────────────

function FlagshipPublication({ item }: { item: PublicationItem }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      <Panel>
        <div className="p-8 md:p-11 lg:p-13">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Eyebrow>Flagship editorial</Eyebrow>
            {item.documentId && (
              <span className="border border-white/[0.055] bg-white/[0.018] px-3 py-1.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[7.5px] uppercase tracking-[0.26em] text-white/28">
                {item.documentId}
              </span>
            )}
          </div>
          <div className="mt-9 grid gap-9 lg:grid-cols-[1.35fr_0.65fr]">
            <div>
              <h3 className="font-['Cormorant_Garamond',Georgia,serif] text-3xl font-light leading-[1.0] text-white md:text-[2.3rem]">
                {item.title}
              </h3>
              {item.subtitle && <p className="mt-4 text-[13.5px] leading-relaxed text-white/40">{item.subtitle}</p>}
              {item.description && <p className="mt-3 text-[12.5px] leading-relaxed text-white/32">{item.description}</p>}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={item.href}
                  className="group inline-flex items-center gap-2 border px-5 py-3 font-['JetBrains_Mono',ui-monospace,monospace] text-[8.5px] uppercase tracking-[0.28em] transition"
                  style={{ borderColor: `${GOLD}44`, color: GOLD, backgroundColor: `${GOLD}10` }}
                >
                  Read editorial <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                {item.previewHref && (
                  <a href={item.previewHref} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-white/[0.07] bg-white/[0.018] px-5 py-3 font-['JetBrains_Mono',ui-monospace,monospace] text-[8.5px] uppercase tracking-[0.28em] text-white/38 transition hover:border-white/[0.12] hover:text-white/58"
                  >
                    Preview <Eye className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.36em] text-white/18 mb-4">Publication assets</div>
              {item.pdfHref && (
                <a href={item.pdfHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between border border-white/[0.048] bg-white/[0.014] p-4 transition hover:bg-white/[0.03]">
                  <span className="flex items-center gap-3 text-[12px] text-white/45"><Download className="h-3.5 w-3.5" style={{ color: `${GOLD}90` }} />Premium PDF</span>
                  <ArrowRight className="h-3.5 w-3.5 text-white/20" />
                </a>
              )}
              {item.epubHref && (
                <a href={item.epubHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between border border-white/[0.048] bg-white/[0.014] p-4 transition hover:bg-white/[0.03]">
                  <span className="flex items-center gap-3 text-[12px] text-white/45"><BookOpen className="h-3.5 w-3.5" style={{ color: `${GOLD}90` }} />EPUB edition</span>
                  <ArrowRight className="h-3.5 w-3.5 text-white/20" />
                </a>
              )}
              <a href={item.citationHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between border border-white/[0.048] bg-white/[0.014] p-4 transition hover:bg-white/[0.03]">
                <span className="flex items-center gap-3 text-[12px] text-white/45"><FileText className="h-3.5 w-3.5" style={{ color: `${GOLD}90` }} />Citation record</span>
                <ArrowRight className="h-3.5 w-3.5 text-white/20" />
              </a>
            </div>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLICATION + PLAYBOOK CARDS
// ─────────────────────────────────────────────────────────────────────────────

function PubCard({ item }: { item: PublicationItem }) {
  return (
    <Panel>
      <div className="p-6 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>{item.category || "Editorial"}</Eyebrow>
          <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.26em] text-white/20">{item.tier}</span>
        </div>
        <h3 className="mt-5 font-['Cormorant_Garamond',Georgia,serif] text-2xl font-light leading-snug text-white">{item.title}</h3>
        {item.description && <p className="mt-3 text-[12.5px] leading-relaxed text-white/38">{item.description}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={item.href} className="group inline-flex items-center gap-2 border border-white/[0.07] bg-white/[0.018] px-4 py-2.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[8px] uppercase tracking-[0.26em] text-white/45 transition hover:border-white/[0.12] hover:text-white/70">
            Open <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          {item.pdfHref && (
            <a href={item.pdfHref} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border px-4 py-2.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[8px] uppercase tracking-[0.26em] transition"
              style={{ borderColor: `${GOLD}30`, color: `${GOLD}BB`, backgroundColor: `${GOLD}0A` }}
            >
              PDF <ArrowRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </Panel>
  );
}

function PlaybookCard({ item }: { item: PlaybookItem }) {
  return (
    <Panel>
      <div className="p-6 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>{item.playbookType || "Playbook"}</Eyebrow>
          <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.26em] text-white/20">{item.difficulty || "Advanced"}</span>
        </div>
        <h3 className="mt-5 font-['Cormorant_Garamond',Georgia,serif] text-2xl font-light leading-snug text-white">{item.title}</h3>
        {item.description && <p className="mt-3 text-[12.5px] leading-relaxed text-white/38">{item.description}</p>}
        <div className="mt-5">
          <Link href={item.href} className="group inline-flex items-center gap-2 border border-white/[0.07] bg-white/[0.018] px-4 py-2.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[8px] uppercase tracking-[0.26em] text-white/45 transition hover:border-white/[0.12] hover:text-white/70">
            Open playbook <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT LADDER
// ─────────────────────────────────────────────────────────────────────────────

function ProductLadder() {
  const products = [
    { n: "01", title: "Market Intelligence", tag: "Product", href: "/intelligence/global-market-intelligence-q1-2026", body: "A discoverable intelligence line with public, institutional, and boardroom layers for serious operators.", icon: TrendingUp },
    { n: "02", title: "Executive Reporting", tag: "Flagship", href: "/diagnostics/executive-reporting", body: "The flagship interpretation product. Diagnostic signal converted into decision-grade executive output.", icon: FileText },
    { n: "03", title: "Diagnostics", tag: "Gateway", href: "/diagnostics", body: "The gateway layer. Establish signal, pressure, and fit before forcing a solution.", icon: ScanSearch },
  ];

  return (
    <motion.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
      className="grid gap-4 lg:grid-cols-3"
    >
      {products.map((p) => (
        <motion.div key={p.n} variants={fadeUp}>
          <Link href={p.href} className="group block h-full">
            <Panel className="h-full transition-all duration-300">
              <div className="p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="font-['Cormorant_Garamond',Georgia,serif] text-[3.5rem] font-light leading-none text-white/[0.055] transition-colors group-hover:text-white/[0.09]">
                    {p.n}
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center border border-white/[0.055] bg-white/[0.018] transition group-hover:border-white/[0.10]">
                    <p.icon className="h-4 w-4 text-white/25 transition-colors group-hover:text-white/55" />
                  </div>
                </div>
                <div className="mt-5">
                  <div className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.32em] text-white/20">{p.tag}</div>
                  <h3 className="mt-2 font-['Cormorant_Garamond',Georgia,serif] text-[1.5rem] font-light text-white/85 transition-colors group-hover:text-white">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-white/35 transition-colors group-hover:text-white/50">
                    {p.body}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 font-['JetBrains_Mono',ui-monospace,monospace] text-[8px] uppercase tracking-[0.26em] text-white/20 transition-all group-hover:gap-3" style={{ color: undefined }}>
                  <span className="transition-colors group-hover:text-white/45">Enter</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-colors group-hover:text-white/45" />
                </div>
              </div>
            </Panel>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREDIBILITY PILLARS
// ─────────────────────────────────────────────────────────────────────────────

function CredibilityPillars() {
  const pillars = [
    { n: "01", title: "Doctrine-backed", body: "A coherent worldview, moral frame, and decision logic designed to hold under pressure." },
    { n: "02", title: "Commercially structured", body: "Public signal builds authority. Products create utility. Advisory remains selective and consequence-aware." },
    { n: "03", title: "System-first", body: "A living architecture: doctrine, products, diagnostics, editorial property, playbooks, and controlled engagement paths." },
  ];

  return (
    <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      <Panel>
        <div className="grid divide-x" style={{ borderColor: "rgba(255,255,255,0.048)", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {pillars.map((p) => (
            <motion.div key={p.n} variants={fadeUp} className="p-8 md:p-10">
              <div className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7.5px] uppercase tracking-[0.38em]" style={{ color: `${GOLD}80` }}>
                {p.n}
              </div>
              <h3 className="mt-4 font-['Cormorant_Garamond',Georgia,serif] text-xl font-light text-white/88">{p.title}</h3>
              <p className="mt-3 text-[12.5px] leading-relaxed text-white/35">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </Panel>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATHWAYS
// ─────────────────────────────────────────────────────────────────────────────

function Pathways() {
  const actions = [
    { href: "/artifacts", title: "Browse strategic products", description: "Market intelligence, artifacts, frameworks, and premium assets.", tag: "Products", cta: "Browse" },
    { href: "/diagnostics", title: "Begin with diagnostics", description: "Establish signal, pressure, and fit before escalation.", tag: "Gateway", cta: "Enter" },
    { href: "/consulting/strategy-room", title: "Enter Strategy Room", description: "Private chamber for situations where consequence is already material.", tag: "Selective", cta: "Apply" },
  ];

  return (
    <motion.div variants={stagger(0.12)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
      className="grid gap-4 md:grid-cols-3"
    >
      {actions.map((a) => (
        <motion.div key={a.href} variants={fadeUp}>
          <Link href={a.href} className="group block">
            <Panel className="h-full transition-all duration-300">
              <div className="p-7 md:p-8">
                <div className="font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.34em]" style={{ color: `${GOLD}88` }}>
                  {a.tag}
                </div>
                <h3 className="mt-4 font-['Cormorant_Garamond',Georgia,serif] text-2xl font-light text-white/85 transition-colors group-hover:text-white">
                  {a.title}
                </h3>
                <p className="mt-3 text-[12.5px] leading-relaxed text-white/35 transition-colors group-hover:text-white/52">
                  {a.description}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 border border-white/[0.06] px-4 py-2 font-['JetBrains_Mono',ui-monospace,monospace] text-[8px] uppercase tracking-[0.28em] text-white/28 transition-all group-hover:border-white/[0.10] group-hover:text-white/48">
                  {a.cta}
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Panel>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTITUTIONAL SEAL (close)
// ─────────────────────────────────────────────────────────────────────────────

function InstitutionalSeal() {
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      <Panel gold>
        <div className="px-8 py-14 md:px-16 md:py-18 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            {/* Crown mark */}
            <div className="mx-auto mb-9 flex h-14 w-14 items-center justify-center border" style={{ borderColor: `${GOLD}28`, backgroundColor: `${GOLD}0A` }}>
              <Crown className="h-6 w-6" style={{ color: `${GOLD}AA` }} />
            </div>

            <Eyebrow align="center">Institutional seal</Eyebrow>

            <h2 className="mt-7 font-['Cormorant_Garamond',Georgia,serif] font-light leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)" }}
            >
              Don't browse.
              <span className="block text-white/35">Deploy.</span>
            </h2>

            <p className="mx-auto mt-6 max-w-lg text-[14.5px] leading-[1.85] text-white/38">
              Pick an entry point and put the material to work. Doctrine, products,
              diagnostics, or private mandate — each route is designed for a different
              level of consequence.
            </p>

            <div className="mt-11 flex flex-wrap justify-center gap-3">
              <Link href="/diagnostics"
                className="group inline-flex items-center gap-3 border px-7 py-4 font-['JetBrains_Mono',ui-monospace,monospace] text-[9px] uppercase tracking-[0.32em] transition"
                style={{ borderColor: `${GOLD}44`, color: GOLD, backgroundColor: `${GOLD}0F` }}
              >
                Begin diagnostics <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/canon"
                className="inline-flex items-center gap-3 border border-white/[0.07] bg-white/[0.018] px-7 py-4 font-['JetBrains_Mono',ui-monospace,monospace] text-[9px] uppercase tracking-[0.32em] text-white/40 transition hover:border-white/[0.12] hover:text-white/62"
              >
                <Compass className="h-3.5 w-3.5" />
                Enter the canon
              </Link>
              <Link href="/consulting/strategy-room"
                className="inline-flex items-center gap-3 border border-white/[0.055] px-7 py-4 font-['JetBrains_Mono',ui-monospace,monospace] text-[9px] uppercase tracking-[0.32em] text-white/30 transition hover:border-white/[0.10] hover:text-white/48"
              >
                <Lock className="h-3.5 w-3.5" />
                Strategy Room
              </Link>
            </div>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOMEPAGE
// ─────────────────────────────────────────────────────────────────────────────

const HomePage: NextPage<HomePageProps> = ({
  featuredShorts = [],
  featuredBriefing = null,
  flagshipPublication = null,
  featuredPublications = [],
  featuredPlaybooks = [],
  events = [],
  counts = { shorts: 0, canon: 0, briefs: 0, downloads: 0, library: 0, publications: 0, playbooks: 0 },
  canonPrelude,
  latestReport,
}) => {
  const heroCounts = { shorts: counts.shorts, canon: counts.canon, briefs: counts.briefs, library: counts.library };

  return (
    <Layout
      title="Abraham of London"
      description="Institutional doctrine, strategic products, diagnostics, disciplined strategy, editorial canon, playbooks, and selective mandate work for serious operators."
      canonicalUrl="/"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/assets/images/social/og-image.jpg" />
      </Head>

      {/* HERO */}
      <HeroSection
        counts={heroCounts}
        onScroll={() => document.getElementById("platform")?.scrollIntoView({ behavior: "smooth" })}
      />

      {/* PLATFORM STATEMENT */}
      <PlatformStatement counts={counts} />

      <Bridge text="platform logic → flagship surfaces" />

      {/* FLAGSHIPS */}
      <Section id="flagships" variant="surface" cap="flagships · product · interpretation · editorial">
        <Anchor id="flagships" />
        <SectionHeader
          eyebrow="Flagships"
          title={<>The front of the platform carries<br /><span className="text-white/35">what best represents the business.</span></>}
          description="One flagship intelligence product. One flagship advisory product. One flagship editorial."
          large
        />
        <div className="mt-14 space-y-5">
          <FlagshipIntelligence report={latestReport} />
          <FlagshipAdvisory />
          {flagshipPublication && <FlagshipPublication item={flagshipPublication} />}
        </div>
      </Section>

      <Bridge text="flagships → credibility" />

      {/* CREDIBILITY */}
      <Section id="credibility" variant="void" cap="credibility · withstands scrutiny">
        <Anchor id="credibility" />
        <SectionHeader
          eyebrow="Credibility"
          title={<>This system is designed to<br /><em className="not-italic" style={{ color: GOLD }}>survive hostile scrutiny.</em></>}
          description="If it cannot survive cross-examination, pressure, and consequence, it is not strategy. It is theatre."
        />
        <div className="mt-12">
          <CredibilityPillars />
        </div>
        {featuredBriefing && (
          <div className="mt-6 max-w-2xl">
            <Panel>
              <div className="p-7">
                <Eyebrow>Operator spotlight</Eyebrow>
                <h3 className="mt-5 font-['Cormorant_Garamond',Georgia,serif] text-2xl font-light text-white">{featuredBriefing.title}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-white/38">
                  {featuredBriefing.excerpt || "Operator-grade intelligence engineered for decisions."}
                </p>
                <div className="mt-6">
                  <Link href={featuredBriefing.href}
                    className="group inline-flex items-center gap-2 border px-5 py-3 font-['JetBrains_Mono',ui-monospace,monospace] text-[8.5px] uppercase tracking-[0.28em] transition"
                    style={{ borderColor: `${GOLD}38`, color: `${GOLD}CC`, backgroundColor: `${GOLD}0D` }}
                  >
                    Open briefing <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </Panel>
          </div>
        )}
      </Section>

      <Bridge text="credibility → products and diagnostics" />

      {/* PRODUCTS */}
      <Section id="products" variant="surface" cap="products · clarity before intervention">
        <Anchor id="products" />
        <SectionHeader
          eyebrow="Products"
          title={<>Structured products create trust<br /><span className="text-white/35">before private mandate work.</span></>}
          description="Strategic products give serious buyers a disciplined way to engage, interpret, and decide."
          large
        />
        <div className="mt-12">
          <ProductLadder />
        </div>
      </Section>

      <Bridge text="products → private escalation" />

      {/* STRATEGY ROOM */}
      <Section id="strategy-room" variant="void" cap="escalation · when product becomes mandate">
        <Anchor id="strategy-room" />
        <ModuleBoundary label="StrategyRoomIntegration">
          <StrategyRoomIntegration />
        </ModuleBoundary>
      </Section>

      <Bridge text="products → buyer fit" />

      {/* BUYER FIT */}
      <Section id="buyer-fit" variant="surface" cap="buyer fit · who this is for">
        <Anchor id="buyer-fit" />
        <ModuleBoundary label="ExecutiveBuyerFitSection">
          <ExecutiveBuyerFitSection />
        </ModuleBoundary>
      </Section>

      {/* PUBLICATIONS + PLAYBOOKS */}
      {(featuredPublications.length > 0 || featuredPlaybooks.length > 0) && (
        <>
          <Bridge text="products → editorial and execution property" />
          <Section id="publications" variant="surface" cap="publications · doctrine and execution">
            <Anchor id="publications" />
            <SectionHeader
              eyebrow="Publications & Playbooks"
              title={<>Ideas that can be read.<br /><span className="text-white/35">Frameworks that can be used.</span></>}
            />
            {featuredPublications.length > 0 && (
              <div className="mt-12">
                <div className="mb-5 font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.40em] text-white/18">Supporting publications</div>
                <div className="grid gap-4 lg:grid-cols-3">
                  {featuredPublications.slice(0, 3).map((item) => <PubCard key={item.slug} item={item} />)}
                </div>
              </div>
            )}
            {featuredPlaybooks.length > 0 && (
              <div className="mt-10">
                <div className="mb-5 font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.40em] text-white/18">Execution playbooks</div>
                <div className="grid gap-4 lg:grid-cols-3">
                  {featuredPlaybooks.slice(0, 3).map((item) => <PlaybookCard key={item.slug} item={item} />)}
                </div>
              </div>
            )}
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/editorials" className="group inline-flex items-center gap-2 border border-white/[0.07] bg-white/[0.018] px-5 py-3 font-['JetBrains_Mono',ui-monospace,monospace] text-[8.5px] uppercase tracking-[0.26em] text-white/38 transition hover:border-white/[0.12] hover:text-white/58">
                Browse publications <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/playbooks"
                className="group inline-flex items-center gap-2 border px-5 py-3 font-['JetBrains_Mono',ui-monospace,monospace] text-[8.5px] uppercase tracking-[0.26em] transition"
                style={{ borderColor: `${GOLD}30`, color: `${GOLD}BB`, backgroundColor: `${GOLD}0A` }}
              >
                Browse playbooks <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Section>
        </>
      )}

      <Bridge text="execution property → operators" />

      {/* WHO */}
      <Section id="who" variant="void" cap="operators · target audience">
        <Anchor id="who" />
        <SectionHeader
          eyebrow="Operators"
          title={<>Built for people carrying<br /><em className="not-italic" style={{ color: GOLD }}>responsibility.</em></>}
          description="Founders, boards, leadership teams, and builders who prefer standards over slogans."
        />
        <div className="mt-12">
          <Panel>
            <div className="p-5 md:p-7">
              <ModuleBoundary label="WhoIWorkWith">
                <WhoIWorkWith />
              </ModuleBoundary>
            </div>
          </Panel>
        </div>
      </Section>

      <Bridge text="operators → engagement lanes" />

      {/* LANES */}
      <Section id="lanes" variant="surface" cap="engagement · clean commercial boundaries">
        <Anchor id="lanes" />
        <SectionHeader
          eyebrow="Engagement"
          title={<>Public signal.<br /><span className="text-white/35">Structured products. Private mandate.</span></>}
          description="Clean boundaries protect trust, pricing, and seriousness."
        />
        <div className="mt-12">
          <Panel>
            <div className="p-5 md:p-7">
              <ModuleBoundary label="EngagementLanes">
                <EngagementLanes />
              </ModuleBoundary>
            </div>
          </Panel>
        </div>
      </Section>

      <Bridge text="lanes → next actions" />

      {/* PATHWAYS */}
      <Section id="pathways" variant="void" cap="pathways · three clear moves">
        <Anchor id="pathways" />
        <SectionHeader
          eyebrow="Pathways"
          title={<>Three clear moves.<br /><span className="text-white/28">No wandering.</span></>}
        />
        <div className="mt-12"><Pathways /></div>
      </Section>

      <Bridge text="actions → live rooms and deployables" />

      {/* EVENTS */}
      <Section id="events" variant="surface" cap="events · live rooms">
        <Anchor id="events" />
        <SectionHeader eyebrow="Events" title="Salons, briefings, and live rooms." description="Where doctrine meets operators and ideas are tested in live environments." />
        <div className="mt-12">
          <Panel>
            <div className="p-6 md:p-8">
              <ModuleBoundary label="EventsSection">
                <EventsSection events={events as any} />
              </ModuleBoundary>
            </div>
          </Panel>
        </div>
      </Section>

      {/* VAULT */}
      <Section id="vault" variant="void" cap="vault · deployables">
        <Anchor id="vault" />
        <SectionHeader eyebrow="Vault" title="Deployables for actual execution." description="Templates, packs, frameworks, and operating assets engineered for reuse." />
        <div className="mt-12">
          <Panel>
            <div className="p-6 md:p-8">
              <ModuleBoundary label="VaultTeaserRail">
                <VaultTeaserRail />
              </ModuleBoundary>
            </div>
          </Panel>
        </div>
      </Section>

      {/* BRIEFING */}
      {featuredBriefing && (
        <>
          <Bridge text="deployables → intelligence feed" />
          <Section id="briefing" variant="surface" cap="briefing · operator intelligence">
            <Anchor id="briefing" />
            <SectionHeader eyebrow="Briefing" title="Operator-grade intelligence." description="Focused transmission: clarity that survives hostile scrutiny." />
            <div className="mt-12">
              <Panel>
                <div className="p-6 md:p-8">
                  <ModuleBoundary label="OperatorBriefing">
                    <OperatorBriefing featured={featuredBriefing as any} />
                  </ModuleBoundary>
                </div>
              </Panel>
            </div>
          </Section>
        </>
      )}

      {/* DISPATCHES */}
      {featuredShorts.length > 0 && (
        <>
          <Bridge text="intelligence → dispatches" />
          <Section id="dispatches" variant="void" cap="dispatches · rapid intel">
            <Anchor id="dispatches" />
            <SectionHeader eyebrow="Dispatches" title="Short, sharp intelligence notes." description="Engineered for retrieval and reuse — fast, crisp, disciplined." />
            <div className="mt-12">
              <Panel>
                <div className="p-6 md:p-8">
                  <ModuleBoundary label="ContentShowcase">
                    <ContentShowcase items={featuredShorts as any} title="Dispatches" description="Short, sharp intelligence notes." />
                  </ModuleBoundary>
                </div>
              </Panel>
            </div>
          </Section>
        </>
      )}

      <Bridge text="content → ventures" />

      {/* VENTURES */}
      <Section id="ventures" variant="surface" cap="ventures · institutions in motion">
        <Anchor id="ventures" />
        <SectionHeader eyebrow="Ventures" title="Institutions do not remain ideas." description="The platform supports real ventures, systems, and infrastructure designed to move in the world." />
        <div className="mt-12">
          <Panel>
            <div className="p-6 md:p-8">
              <ModuleBoundary label="VenturesSection">
                <VenturesSection />
              </ModuleBoundary>
            </div>
          </Panel>
        </div>
      </Section>

      {/* CLOSE */}
      <Section id="close" variant="void" cap="close · institutional seal">
        <div className="mx-auto max-w-4xl">
          <InstitutionalSeal />
        </div>
      </Section>

    </Layout>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA HELPERS (unchanged from working version)
// ─────────────────────────────────────────────────────────────────────────────

function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}
function safeDateISO(v: any): string | null {
  const s = typeof v === "string" ? v : null;
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}
function kindLower(d: any): string { return String(d?.kind || d?.type || d?.docKind || "").toLowerCase(); }
function flattenedPath(d: any): string { return String(d?._raw?.flattenedPath || "").toLowerCase(); }
function computedSlug(d: any): string { return String(d?.slugComputed || d?.slug || d?._raw?.flattenedPath || ""); }
function pickBooleanFlag(d: any): boolean {
  return Boolean(d?.featured === true || d?.isFeatured === true || d?.home === true || d?.showOnHome === true || d?.homepage === true);
}
function publicationToItem(item: PublicationRecord): PublicationItem {
  const editorialHref = `/editorials/${encodeURIComponent(item.slug)}`;
  const previewHref = item.previewEnabled ? item.previewPath || `/api/editorials/preview/${encodeURIComponent(item.slug)}` : null;
  const pdfHref = item.pdfPath && item.pdfPath.trim() ? item.pdfPath.trim() : null;
  const epubHref = item.epubEnabled && item.epubPath && item.epubPath.trim() ? item.epubPath.trim() : null;
  return {
    slug: item.slug, title: item.title, subtitle: item.subtitle || null, description: item.description || null,
    author: item.author, date: item.date || null, tier: item.tier, category: item.category || null,
    readingTime: item.readingTime || null, documentId: item.contentId || null, href: editorialHref,
    pdfHref, previewHref, epubHref, citationHref: `/api/editorials/citation/${encodeURIComponent(item.slug)}`,
  };
}
function toItem(d: any): FeaturedItem | null {
  const k = kindLower(d); const fp = flattenedPath(d);
  const isShort = k === "short" || fp.startsWith("shorts/");
  const isBrief = k === "brief" || fp.startsWith("briefs/") || fp.startsWith("vault/briefs/");
  const isPost = k === "post" || fp.startsWith("blog/") || fp.startsWith("posts/");
  const collection = isShort ? "shorts" : isBrief ? "vault/briefs" : isPost ? "blog" : null;
  if (!collection) return null;
  const rawSlug = computedSlug(d);
  const bare = normalizeSlug(String(rawSlug)).replace(/^shorts\//, "").replace(/^briefs\//, "").replace(/^vault\/briefs\//, "").replace(/^blog\//, "").replace(/^posts\//, "");
  const href = collection === "vault/briefs" ? `/vault/briefs/${bare}` : joinHref(collection, bare);
  return { title: safeString(d?.title, "Untitled"), slug: bare, href, excerpt: (d?.excerpt || d?.description || null) as string | null, dateISO: safeDateISO(d?.date), theme: (d?.theme || d?.category || "Intel") as string | null, kind: isShort ? "short" : isBrief ? "brief" : "post" };
}
function deriveEventMode(d: any): EventItem["mode"] {
  const raw = String(d?.mode || d?.format || d?.delivery || "in-person").toLowerCase();
  if (raw.includes("hybrid")) return "hybrid";
  if (raw.includes("online") || raw.includes("virtual")) return "online";
  return "in-person";
}
function deriveEventStatus(date: string, explicit?: any): EventItem["status"] {
  const e = String(explicit || "").toLowerCase();
  if (["open", "limited", "full", "past"].includes(e)) return e as EventItem["status"];
  const t = Date.parse(date);
  if (!Number.isFinite(t)) return "open";
  const end = new Date(new Date(t).getFullYear(), new Date(t).getMonth(), new Date(t).getDate(), 23, 59, 59, 999);
  return end.getTime() < Date.now() ? "past" : "open";
}
function toEvent(d: any): EventItem | null {
  const k = kindLower(d); const fp = flattenedPath(d);
  if (!(k === "event" || fp.startsWith("events/"))) return null;
  const bare = normalizeSlug(String(computedSlug(d))).replace(/^events\//, "");
  const date = d?.eventDate || d?.date || d?.startDate || d?.datetime || d?.start || d?.startsAt || null;
  if (!date) return null;
  const mode = deriveEventMode(d);
  return { slug: bare, title: safeString(d?.title, "Untitled Event"), date: String(date), location: safeString(d?.location, mode === "online" ? "Online" : "London"), mode, excerpt: (d?.excerpt || d?.description || null) as string | null, capacity: typeof d?.capacity === "number" ? d.capacity : null, duration: typeof d?.duration === "string" ? d.duration : null, status: deriveEventStatus(String(date), d?.status) };
}
function isDraftLocal(d: any): boolean { return d?.draft === true || d?.published === false; }
function collectAnyDocs(data: any): any[] {
  const buckets = [data?.allDocuments, data?.allPosts, data?.allShorts, data?.allBriefs, data?.allCanon, data?.allDownloads, data?.allBooks, data?.allPlaybooks, data?.documents];
  const flat: any[] = []; for (const b of buckets) { if (Array.isArray(b)) flat.push(...b); }
  const seen = new Set<string>(); const out: any[] = [];
  for (const d of flat) {
    const key = String(d?._id || "") || String(d?._raw?.flattenedPath || "") || String(d?.slug || "") || JSON.stringify(d);
    if (!seen.has(key)) { seen.add(key); out.push(d); }
  }
  return out;
}
function shouldForceFallback(c: { canon: number; briefs: number; shorts: number; downloads: number }, n: number): boolean {
  return c.canon + c.briefs + c.shorts + c.downloads === 0 || n < 5;
}
const PRELUDE_SOURCE_FP = "books/the-architecture-of-human-purpose";
function readPlaybooksFromGenerated(gen: any): PlaybookItem[] {
  return (Array.isArray(gen?.allPlaybooks) ? gen.allPlaybooks : []).filter((p: any) => !p?.draft).map((p: any) => {
    const slug = safeString(p?.slug).replace(/^\/+|\/+$/g, "");
    return { slug, title: safeString(p?.title, "Untitled Playbook"), description: safeString(p?.description) || null, difficulty: safeString(p?.difficulty) || null, playbookType: safeString(p?.playbookType) || null, estimatedTime: safeString(p?.estimatedTime) || null, href: `/playbooks/${slug}` };
  }).filter((p: PlaybookItem) => !!p.slug);
}
function parseFrontmatter(content: string): Record<string, any> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result: Record<string, any> = {}; let currentArrayKey: string | null = null;
  for (const rawLine of match[1].split("\n")) {
    const line = rawLine.replace(/\r/g, ""); if (!line.trim()) continue;
    const arrayItemMatch = line.match(/^\s*-\s+(.*)$/);
    if (arrayItemMatch && currentArrayKey) { if (!Array.isArray(result[currentArrayKey])) result[currentArrayKey] = []; result[currentArrayKey].push(arrayItemMatch[1].trim().replace(/^['"]|['"]$/g, "")); continue; }
    const keyMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!keyMatch) { currentArrayKey = null; continue; }
    const [, key, rawValue] = keyMatch; const value = rawValue.trim();
    if (!value) { currentArrayKey = key; if (!(key in result)) result[key] = []; continue; }
    currentArrayKey = null;
    if (value.startsWith("[") && value.endsWith("]")) { result[key] = value.slice(1, -1).split(",").map((v) => v.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean); continue; }
    if (/^\d+$/.test(value)) { result[key] = Number(value); continue; }
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) { result[key] = value.slice(1, -1); continue; }
    result[key] = value;
  }
  return result;
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  let featuredShorts: FeaturedItem[] = [], featuredBriefing: FeaturedItem | null = null;
  let featuredPlaybooks: PlaybookItem[] = [], events: EventItem[] = [], latestReport: QuarterlyReport | null = null;
  const catalogue = getPublicationCatalogue();
  const flagshipPublicationRecord = getPublicationBySlug("ultimate-purpose-of-man") || catalogue[0] || null;
  const flagshipPublication = flagshipPublicationRecord ? publicationToItem(flagshipPublicationRecord) : null;
  const featuredPublications: PublicationItem[] = catalogue.filter((i) => i.slug !== flagshipPublication?.slug).slice(0, 3).map(publicationToItem);
  const counts = { shorts: 0, canon: 0, briefs: 0, downloads: 0, library: 0, publications: catalogue.length, playbooks: 0 };
  let canonPrelude: CanonPrelude = { title: "The Architecture of Human Purpose", subtitle: "Prelude MiniBook — Gateway to the Canon", description: "A strategic introduction to the forthcoming multi-volume Canon.", excerpt: "Human flourishing is not accidental. It is architectural.", coverImage: "/assets/images/books/the-architecture-of-human-purpose.jpg", href: "/books/the-architecture-of-human-purpose", canonHref: "/canon", ctaLabel: "Open the Prelude MiniBook" };

  try {
    const fs = await import("fs"); const path = await import("path");
    const dir = path.join(process.cwd(), "content/artifacts");
    if (fs.existsSync(dir)) {
      const reports: QuarterlyReport[] = [];
      for (const file of fs.readdirSync(dir).filter((f: string) => f.endsWith(".mdx") && !f.includes(".backup"))) {
        const fm = parseFrontmatter(fs.readFileSync(path.join(dir, file), "utf-8"));
        if (fm.type === "quarterly_report" || file.includes("global-market-intelligence")) {
          let q = fm.quarter || "Q1", y = fm.year || 2026;
          if (!fm.quarter) { if (file.includes("q1")) q = "Q1"; if (file.includes("q2")) q = "Q2"; if (file.includes("q3")) q = "Q3"; if (file.includes("q4")) q = "Q4"; }
          if (!fm.year && file.includes("2026")) y = 2026;
          reports.push({ id: file.replace(".mdx", ""), slug: file.replace(".mdx", ""), title: fm.title || "Global Market Intelligence Report", description: fm.description || "Executive analysis of market conditions.", publishedAt: fm.date || new Date().toISOString(), quarter: q, year: y, readingTime: fm.readingTime || 25, pdfUrl: fm.pdfUrl || null, keyFindings: fm.keyFindings || [] });
        }
      }
      const qo: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
      reports.sort((a, b) => a.year !== b.year ? b.year - a.year : (qo[b.quarter] || 0) - (qo[a.quarter] || 0));
      latestReport = reports[0] || null;
    }
  } catch { latestReport = null; }

  const computeFromDocs = (docsIn: any[], dataForBooks?: any, dataForPlaybooks?: any) => {
    const stableDocs = (docsIn || []).filter((d) => !isDraftLocal(d));
    counts.shorts = stableDocs.filter((d) => kindLower(d) === "short" || flattenedPath(d).startsWith("shorts/")).length;
    counts.canon = stableDocs.filter((d) => kindLower(d) === "canon" || flattenedPath(d).startsWith("canon/")).length;
    counts.briefs = stableDocs.filter((d) => kindLower(d) === "brief" || flattenedPath(d).startsWith("briefs/") || flattenedPath(d).startsWith("vault/briefs/")).length;
    counts.downloads = stableDocs.filter((d) => kindLower(d) === "download" || flattenedPath(d).startsWith("downloads/")).length;
    const books = Array.isArray((dataForBooks as any)?.allBooks) ? (dataForBooks as any).allBooks : [];
    const pb = books.find((b: any) => String(b?._raw?.flattenedPath || "") === PRELUDE_SOURCE_FP || String(b?.slug || "") === "/books/the-architecture-of-human-purpose");
    if (pb) { const slug = normalizeSlug(safeString(pb?.slug) || PRELUDE_SOURCE_FP).replace(/^books\//, "").replace(/^\/books\//, ""); canonPrelude = { title: safeString(pb?.title, canonPrelude.title), subtitle: safeString(pb?.subtitle, canonPrelude.subtitle), description: safeString(pb?.description, canonPrelude.description), excerpt: safeString(pb?.excerpt || pb?.description, canonPrelude.excerpt), coverImage: "/assets/images/books/the-architecture-of-human-purpose.jpg", href: `/books/${slug}`, canonHref: "/canon", ctaLabel: "Open the Prelude MiniBook" }; }
    const allPlaybooks = readPlaybooksFromGenerated(dataForPlaybooks); featuredPlaybooks = allPlaybooks.slice(0, 3); counts.playbooks = allPlaybooks.length;
    events = (stableDocs.filter((d) => kindLower(d) === "event" || flattenedPath(d).startsWith("events/")).map(toEvent).filter(Boolean) as EventItem[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 6);
    const candidates = stableDocs.map(toItem).filter(Boolean) as FeaturedItem[];
    const featured = candidates.filter((x) => { const o = stableDocs.find((dd: any) => toItem(dd)?.href === x.href); return o ? pickBooleanFlag(o) : false; });
    featuredBriefing = featured.find((x) => x.kind === "brief") || featured.find((x) => x.kind === "short") || null;
    const shortsDocs = stableDocs.filter((d) => kindLower(d) === "short" || flattenedPath(d).startsWith("shorts/"));
    const fs2 = featured.filter((x) => x.kind === "short").sort((a, b) => Date.parse(b.dateISO || "") - Date.parse(a.dateISO || "")).slice(0, 8);
    featuredShorts = fs2.length > 0 ? fs2 : (shortsDocs.sort((a: any, b: any) => (Date.parse(b?.date || "") || 0) - (Date.parse(a?.date || "") || 0)).slice(0, 8).map(toItem).filter(Boolean) as FeaturedItem[]);
  };

  try {
    const mod: any = await import("@/lib/content/server");
    const getContentlayerData = mod?.getContentlayerData;
    if (typeof getContentlayerData !== "function") throw new Error("missing");
    const data = getContentlayerData(); const docs = collectAnyDocs(data); computeFromDocs(docs, data, data);
    if (shouldForceFallback(counts, docs.length)) throw new Error("fallback");
  } catch {
    try { const gen: any = await import("contentlayer/generated"); computeFromDocs(collectAnyDocs(gen), gen, gen); } catch { /* defaults */ }
  }

  try {
    const fs = await import("fs"); const path = await import("path");
    const dir = path.join(process.cwd(), "content/artifacts");
    if (fs.existsSync(dir)) counts.library = (counts.library || 0) + fs.readdirSync(dir).filter((f: string) => f.endsWith(".mdx") && !f.includes(".backup")).length;
  } catch { /* keep */ }

  return { props: sanitizeData({ featuredShorts, featuredBriefing, flagshipPublication, featuredPublications, featuredPlaybooks, events, counts, canonPrelude, latestReport }), revalidate: 3600 };
};

export default HomePage;