/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/index.tsx — HOMEPAGE
// Institutional Monumentalism — governed, editorial, severe where needed.
// The page is a threshold, not a pitch deck.

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { track } from "@/lib/analytics/track";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  BookOpen,
  Briefcase,
  ChevronRight,
  Compass,
  Crown,
  Download,
  Eye,
  FileText,
  LibraryBig,
  Lock,
  ScanSearch,
  ScrollText,
  TrendingUp,
  Workflow,
} from "lucide-react";

import Layout from "@/components/Layout";
import ShortsSignalRail from "@/components/shorts/ShortsSignalRail";
import { AccuracyMetricsBlock, ObservedOutcomesBlock } from "@/components/proof/PublicProofBlocks";

import { joinHref, normalizeSlug } from "@/lib/content/shared";
import { sanitizeData } from "@/lib/content/server";
import { getPublicationCatalogue, getPublicationBySlug } from "@/lib/editorial/catalogue";
import type { PublicationRecord } from "@/lib/editorial/types";
import type { PublicationItem as _PublicationItemBase } from "@/lib/editorial/server-readers";
import { HOMEPAGE_SHORT_SIGNALS } from "@/lib/shorts/homepage-signals";

// Extend the base type with optional fields used by publicationToItem
type PublicationItem = _PublicationItemBase & {
  previewHref?: string | null;
  epubHref?: string | null;
  citationHref?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type FeaturedItem = {
  title: string;
  slug: string;
  href: string;
  excerpt?: string | null;
  dateISO?: string | null;
  theme?: string | null;
  kind?: string | null;
};

type PlaybookItem = {
  slug: string;
  title: string;
  description?: string | null;
  difficulty?: string | null;
  playbookType?: string | null;
  estimatedTime?: string | null;
  href: string;
};

type QuarterlyReport = {
  id: string;
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  quarter: string;
  year: number;
  readingTime: number;
  pdfUrl?: string | null;
  keyFindings?: string[];
};

type CanonEntry = {
  title: string;
  excerpt: string | null;
  slug: string;
  href: string;
  category: string | null;
  readTime: string | null;
};

type BlogPostItem = {
  title: string;
  slug: string;
  href: string;
  excerpt: string | null;
  dateISO: string | null;
};

type HomePageProps = {
  featuredShorts: FeaturedItem[];
  featuredBriefing: FeaturedItem | null;
  flagshipPublication: PublicationItem | null;
  featuredPublications: PublicationItem[];
  featuredPlaybooks: PlaybookItem[];
  featuredCanon: CanonEntry[];
  featuredBlogPosts: BlogPostItem[];
  latestReport: QuarterlyReport | null;
  counts: {
    shorts: number;
    canon: number;
    briefs: number;
    downloads: number;
    library: number;
    publications: number;
    playbooks: number;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────

// Design system tokens
// All color references use --ds-* tokens from design-system.css

const GRAIN_STYLE: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

// ─────────────────────────────────────────────────────────────────────────────
// MOTION
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = (delay = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
});

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div
      className="h-px w-full"
      style={{
        background: soft
          ? "linear-gradient(to right, transparent, var(--ds-border), transparent)"
          : "linear-gradient(to right, transparent, var(--ds-accent-soft), transparent)",
      }}
    />
  );
}

function Eyebrow({
  children,
  align = "left",
  dim = false,
}: {
  children: React.ReactNode;
  align?: "left" | "center";
  dim?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", align === "center" && "justify-center")}>
      <span className="h-5 w-px" style={{ backgroundColor: "var(--ds-accent)", opacity: 0.55 }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8px",
          letterSpacing: "0.40em",
          textTransform: "uppercase",
          color: dim ? "var(--ds-text-subtle)" : "var(--ds-accent)",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function Anchor({ id }: { id: string }) {
  return <span id={id} className="block scroll-mt-28" aria-hidden />;
}

function Panel({
  children,
  className = "",
  gold = false,
  surface = "lift",
}: {
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
  surface?: "lift" | "card";
}) {
  return (
    <div
      className={cn("relative overflow-hidden border", className)}
      style={{
        borderColor: gold ? "var(--ds-accent-soft)" : "var(--ds-border)",
        backgroundColor: gold ? "var(--ds-accent-soft)" : "var(--ds-panel-alt)",
        boxShadow: gold
          ? "0 0 90px -35px var(--ds-accent-soft)"
          : "var(--ds-shadow-xl)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: gold
            ? "linear-gradient(to right, transparent, var(--ds-accent-soft), transparent)"
            : "linear-gradient(to right, transparent, var(--ds-border), transparent)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.016),transparent_55%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Section({
  children,
  id,
  variant = "base",
  cap,
  capDim = false,
  compact = false,
  className = "",
}: {
  children: React.ReactNode;
  id?: string;
  variant?: "base" | "surface" | "void";
  cap?: string;
  capDim?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn("relative", className)}
      style={{ 
        backgroundColor: id === "hero"
          ? "var(--ds-background)"
          : variant === "void"
            ? "var(--ds-background)"
            : "var(--ds-background-muted)",
        color: "var(--ds-text)"
      }}
    >
      {id ? <Anchor id={id} /> : null}

      {variant === "surface" && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: id === "hero"
              ? "radial-gradient(circle at 14% 12%, rgba(240, 185, 79, 0.045), transparent 38%)"
              : "var(--ds-hero-wash)",
          }}
        />
      )}

      {id === "hero" && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0.85))",
          }}
        />
      )}

      {id !== "hero" && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.022]" style={GRAIN_STYLE} />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0">
        <GoldRule soft />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <GoldRule soft />
      </div>

      <div
        className={cn(
          "relative z-10 mx-auto max-w-[1200px] px-6 sm:px-8",
          id === "hero"
            ? "pb-24 pt-28 lg:pb-28 lg:pt-32"
            : compact
              ? "py-16 lg:py-20"
              : "py-20 lg:py-24",
        )}
      >
        {cap && (
          <div className="mb-14 flex items-center gap-6">
            <div className="flex-1">
              <GoldRule soft />
            </div>
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.46em",
                textTransform: "uppercase",
                color: capDim ? "var(--ds-text-subtle)" : "var(--ds-text-muted)",
              }}
            >
              {cap}
            </span>
            <div className="flex-1">
              <GoldRule soft />
            </div>
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  large = false,
  eyebrowDim = false,
  smaller = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  large?: boolean;
  eyebrowDim?: boolean;
  smaller?: boolean;
}) {
  const center = align === "center";

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className={cn("max-w-4xl", center && "mx-auto text-center")}
    >
      <Eyebrow align={align} dim={eyebrowDim}>
        {eyebrow}
      </Eyebrow>
      <h2
        className={cn(
          "mt-5 font-['Cormorant_Garamond',Georgia,serif] font-light leading-[0.93] tracking-[-0.028em] ds-text",
          large
            ? smaller
              ? "text-3xl md:text-4xl lg:text-[3.1rem]"
              : "text-4xl md:text-5xl lg:text-[3.6rem]"
            : smaller
              ? "text-[1.75rem] md:text-3xl lg:text-4xl"
              : "text-3xl md:text-4xl lg:text-5xl",
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn("mt-5 text-[15px] leading-[1.8] ds-text-muted", center && "mx-auto max-w-2xl")}>
          {description}
        </p>
      )}
      <div className={cn("mt-8 w-10", center && "mx-auto")}>
        <GoldRule />
      </div>
    </motion.div>
  );
}

function Bridge({ text }: { text: string }) {
  return (
    <div style={{ backgroundColor: "var(--ds-background)" }}>
      <div className="mx-auto max-w-7xl px-6 py-7 sm:px-8 lg:px-12">
        <div className="flex items-center gap-8">
          <div className="flex-1">
            <GoldRule soft />
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.50em",
              textTransform: "uppercase",
              color: "var(--ds-text-subtle)",
            }}
          >
            {text}
          </span>
          <div className="flex-1">
            <GoldRule soft />
          </div>
        </div>
      </div>
    </div>
  );
}

class ModuleBoundary extends React.Component<
  { label: string; children: React.ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(err: any) {
    console.error(`[Homepage/${this.props.label}]`, err);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{ border: "1px solid var(--ds-border)", backgroundColor: "var(--ds-panel)", padding: "1.25rem" }}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-white/20" />
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "var(--ds-text-subtle)",
              }}
            >
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
// HERO
// ─────────────────────────────────────────────────────────────────────────────

function HeroSection({
  onScroll: _onScroll,
}: {
  onScroll?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const imgOpacity = useTransform(scrollY, [0, 700], [1, reduceMotion ? 1 : 0.26]);
  const imgScale = useTransform(scrollY, [0, 700], [1, reduceMotion ? 1 : 1.08]);
  const contentY = useTransform(scrollY, [0, 450], [0, reduceMotion ? 0 : -40]);

  return (
    <section
      className="relative isolate h-screen max-h-[1120px] min-h-[760px] w-full overflow-hidden"
      style={{ backgroundColor: "var(--ds-background)" }}
    >
      {/* Background with unified directional light system */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ opacity: imgOpacity, scale: imgScale }}
      >
        <Image
          src="/assets/images/writing-desk.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={75}
          className="object-cover object-[35%_55%] opacity-[0.28]"
        />
        {/* Top-left directional light bias */}
        <div
          className="absolute inset-0"
          style={{ 
            background: `
              radial-gradient(
                ellipse 80% 60% at 15% 20%,
                var(--ds-accent-soft) 0%,
                transparent 60%
              ),
              linear-gradient(
                165deg,
                rgba(0, 0, 0, 0.92) 0%,
                rgba(0, 0, 0, 0.78) 30%,
                rgba(0, 0, 0, 0.62) 60%,
                rgba(0, 0, 0, 0.44) 100%
              )
            `
          }}
        />
        {/* Radial depth falloff for focal anchoring */}
        <div
          className="absolute inset-0"
          style={{
            maskImage: `radial-gradient(
              ellipse 70% 50% at 50% 50%,
              black 60%,
              transparent 100%
            )`,
            WebkitMaskImage: `radial-gradient(
              ellipse 70% 50% at 50% 50%,
              black 60%,
              transparent 100%
            )`,
            background: "var(--ds-hero-scrim)"
          }}
        />
        <div className="absolute inset-0 opacity-[0.025]" style={GRAIN_STYLE} />
      </motion.div>

      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 z-20"
        style={{ height: 1, background: "linear-gradient(to right, transparent, var(--ds-accent-soft), transparent)" }}
      />

      {/* Content with stabilized reading zone */}
      <motion.div className="relative z-10 flex h-full items-center" style={{ y: contentY }}>
        <div className="mx-auto w-full max-w-7xl px-8 pb-24 pt-28 lg:px-16 lg:pt-36">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[58rem]"
          >
            {/* Brand mark with commanding presence and subtle entrance */}
            <div
              className="font-['Cormorant_Garamond',Georgia,serif] leading-[0.86] tracking-[-0.045em]"
              style={{ fontFeatureSettings: '"liga" 1, "kern" 1', fontWeight: 380 }}
            >
              <div className="flex flex-wrap items-baseline" style={{ gap: "0 0.9rem" }}>
                <motion.span 
                  className="ds-text"
                  style={{ fontSize: "clamp(4.2rem, 10.5vw, 10rem)" }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  Abraham
                </motion.span>
                <motion.span 
                  className="italic ds-text-muted"
                  style={{ 
                    fontSize: "clamp(3.4rem, 8.5vw, 8.2rem)", 
                    opacity: 0.55,
                    letterSpacing: "0.02em"
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.55 }}
                  transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                >
                  of
                </motion.span>
              </div>
              <motion.div 
                className="italic ds-accent"
                style={{ 
                  fontSize: "clamp(3.9rem, 9.7vw, 9.2rem)", 
                  marginTop: "0.25em",
                  fontWeight: 360
                }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                London
              </motion.div>
            </div>
            <motion.div
              className="mt-8 h-px"
              initial={{ width: 0 }}
              animate={{ width: "10rem" }}
              transition={{
                duration: 0.8,
                delay: 0.3,
                ease: [0.22, 1, 0.36, 1]
              }}
              style={{ backgroundColor: "var(--ds-accent)", opacity: 0.42 }}
            />

            {/* Hero message with commanding phrasing */}
            <motion.p
              className="mt-14 max-w-[32ch] font-['Cormorant_Garamond',Georgia,serif] font-light leading-[1.6] ds-text"
              style={{ fontSize: "clamp(1.1rem, 2.1vw, 1.4rem)", opacity: 0.92 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.92, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              Diagnose structural problems. Clarify the real situation.<br />
              Escalate only when it matters.
            </motion.p>

            {/* CTA hierarchy with strengthened primary dominance */}
            <motion.div 
              className="mt-14 flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href="/diagnostics"
                className="group inline-flex items-center justify-center gap-3 border px-7 py-4 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  minWidth: "180px",
                  borderColor: "var(--ds-accent-soft)",
                  backgroundColor: "var(--ds-accent-soft)",
                  color: "var(--ds-accent)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--ds-accent)";
                  e.currentTarget.style.backgroundColor = "var(--ds-accent-soft)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--ds-accent-soft)";
                  e.currentTarget.style.backgroundColor = "var(--ds-accent-soft)";
                }}
              >
                <ScrollText className="h-3.5 w-3.5" />
                Begin Assessment
                <ArrowRight className="h-3.5 w-3.5 opacity-70 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/diagnostics/executive-reporting"
                className="group inline-flex items-center justify-center gap-3 border px-7 py-4 transition-all duration-300"
                style={{
                  minWidth: "180px",
                  borderColor: "var(--ds-border)",
                  color: "var(--ds-text-muted)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--ds-border-strong)";
                  e.currentTarget.style.backgroundColor = "var(--ds-panel)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--ds-border)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <ScrollText className="h-3.5 w-3.5" style={{ color: "var(--ds-accent)", opacity: 0.8 }} />
                Executive Reporting
                <ArrowRight className="h-3.5 w-3.5 opacity-50 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:opacity-75" />
              </Link>

              <Link
                href="/strategy-room"
                className="group inline-flex items-center justify-center gap-3 border px-7 py-4 transition-all duration-300"
                style={{
                  minWidth: "180px",
                  borderColor: "var(--ds-border)",
                  color: "var(--ds-text-subtle)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--ds-border-strong)";
                  e.currentTarget.style.backgroundColor = "var(--ds-panel)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--ds-border)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Crown className="h-3.5 w-3.5" style={{ color: "var(--ds-accent)", opacity: 0.7 }} />
                Strategy Room
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM ARCHITECTURE
// ─────────────────────────────────────────────────────────────────────────────

function PlatformArchitecture({ counts }: { counts: HomePageProps["counts"] }) {
  return (
    <Section id="platform" variant="void" cap="platform · architecture · portfolio logic">
      <div className="grid gap-16 lg:grid-cols-[1.08fr_0.58fr] lg:items-start">
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-10"
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>Platform</Eyebrow>
            <h2
              className="mt-6 font-['Cormorant_Garamond',Georgia,serif] font-light leading-[0.90] tracking-[-0.035em] ds-text"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)" }}
            >
              Three layers.
              <br />
              <span className="ds-text-muted">One governing logic.</span>
            </h2>
          </motion.div>

          <motion.p variants={fadeUp} className="max-w-2xl text-[15px] leading-[1.85] ds-text-muted">
            Doctrine, structured products, and selective advisory operate as a single
            system. Each layer has a distinct function and a clear escalation path.
            None of them is decorative.
          </motion.p>

          <div style={{ borderTop: "1px solid var(--ds-border)" }}>
            {[
              {
                n: "01",
                title: "Doctrine and editorial",
                body: "Canon, editorials, and publications. The intellectual frame from which all structured products derive their authority.",
                icon: Compass,
                href: "/canon",
              },
              {
                n: "02",
                title: "Structured products",
                body: "Diagnostics, Executive Reporting, Global Market Intelligence, playbooks, and vault assets. The public commercial layer.",
                icon: Archive,
                href: "/diagnostics",
              },
              {
                n: "03",
                title: "Private mandate",
                body: "Consulting and Strategy Room. Reserved for situations where a structured product is insufficient and consequence is material.",
                icon: Crown,
                href: "/strategy-room",
              },
            ].map((item) => (
              <motion.div key={item.n} variants={fadeUp}>
                <Link
                  href={item.href}
                  className="group flex gap-6 py-7 transition"
                  style={{ borderBottom: "1px solid var(--ds-border)" }}
                >
                  <div className="shrink-0">
                    <div
                      className="flex h-8 w-8 items-center justify-center border"
                      style={{
                        borderColor: "var(--ds-border)",
                        backgroundColor: "var(--ds-panel)",
                      }}
                    >
                      <item.icon className="h-3.5 w-3.5 text-[var(--ds-text-subtle)] transition-colors group-hover:text-[var(--ds-text-muted)]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7px",
                          letterSpacing: "0.34em",
                          textTransform: "uppercase",
                          color: "var(--ds-text-subtle)",
                        }}
                      >
                        {item.n}
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "8.5px",
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: "var(--ds-text-muted)",
                        }}
                      >
                        {item.title}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed ds-text-subtle">{item.body}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.18 }}
          className="space-y-3 lg:sticky lg:top-28"
        >
          <Panel surface="lift">
            <div className="p-5">
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.40em",
                  textTransform: "uppercase",
                  color: "var(--ds-text-subtle)",
                  marginBottom: "1.25rem",
                }}
              >
                Platform registry
              </div>

              <div
                className="grid grid-cols-2 gap-px"
                style={{ backgroundColor: "var(--ds-border)" }}
              >
                {[
                  { label: "Library", value: counts.library, icon: LibraryBig },
                  { label: "Essays", value: counts.publications, icon: ScrollText },
                  { label: "Playbooks", value: counts.playbooks, icon: Workflow },
                  { label: "Deliverables", value: counts.downloads + counts.briefs, icon: Archive },
                ].map((item) => (
                  <div key={item.label} className="p-5" style={{ backgroundColor: "var(--ds-panel-alt)" }}>
                    <item.icon className="h-3.5 w-3.5 ds-text-subtle" />
                    <div
                      className="mt-4 font-['Cormorant_Garamond',Georgia,serif] leading-none ds-text"
                      style={{ fontSize: "2.4rem", fontWeight: 300 }}
                    >
                      {item.value}
                    </div>
                    <div
                      className="mt-1.5"
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "6.5px",
                        letterSpacing: "0.30em",
                        textTransform: "uppercase",
                        color: "var(--ds-text-subtle)",
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel surface="lift">
            <div style={{ borderTop: "1px solid var(--ds-border)" }}>
              {[
                { href: "/canon", eyebrow: "Doctrine", title: "Canon", icon: Compass },
                { href: "/artifacts", eyebrow: "Products", title: "Intelligence Archives", icon: Archive },
                { href: "/editorials", eyebrow: "Publications", title: "Editorials", icon: ScrollText },
                { href: "/diagnostics", eyebrow: "Gateway", title: "Diagnostics", icon: ScanSearch },
                { href: "/consulting", eyebrow: "Advisory", title: "Consulting", icon: Briefcase },
              ].map((dest) => (
                <Link
                  key={dest.href}
                  href={dest.href}
                  className="group flex items-center justify-between px-5 py-3.5 transition hover:bg-[var(--ds-panel)]"
                  style={{ borderBottom: "1px solid var(--ds-border)" }}
                >
                  <div className="flex items-center gap-3">
                    <dest.icon className="h-3.5 w-3.5 text-[var(--ds-text-subtle)] transition-colors group-hover:text-[var(--ds-text-muted)]" />
                    <div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7px",
                          letterSpacing: "0.26em",
                          textTransform: "uppercase",
                          color: "var(--ds-text-subtle)",
                        }}
                      >
                        {dest.eyebrow}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: "1rem",
                          color: "var(--ds-text-muted)",
                        }}
                      >
                        {dest.title}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 ds-text-subtle transition-all group-hover:translate-x-0.5" />
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
  const description =
    report?.description ??
    "A disciplined reading of global market conditions, policy pressure, and strategic positioning for Q1 2026.";
  const period = report ? `${report.quarter} ${report.year}` : "Current Edition";
  const findings = report?.keyFindings?.slice(0, 3) ?? [
    "Markets are pricing resilience, policy credibility, and strategic optionality above expansion.",
    "Trade friction and monetary constraint are reshaping capital allocation patterns across jurisdictions.",
    "The base case remains managed fragmentation — 43% probability — with escalation at 27%.",
  ];

  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      <Panel gold>
        <div className="p-8 md:p-11 lg:p-13">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Eyebrow>Global Market Intelligence</Eyebrow>
            <div
              style={{
                border: "1px solid var(--ds-accent-soft)",
                backgroundColor: "var(--ds-accent-soft)",
                padding: "0.4rem 0.75rem",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "var(--ds-accent)",
              }}
            >
              {period}
            </div>
          </div>

          <div className="mt-9 grid gap-9 lg:grid-cols-[1.35fr_0.65fr]">
            <div>
              <h3
                className="font-['Cormorant_Garamond',Georgia,serif] font-light leading-[1.0] ds-text md:text-[2.3rem]"
                style={{ fontSize: "clamp(2rem, 3vw, 2.3rem)" }}
              >
                {title}
              </h3>
              <p className="mt-4 text-[13.5px] leading-relaxed ds-text-muted">{description}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {["Public orientation", "Institutional edition", "Boardroom PDF"].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      border: "1px solid var(--ds-border)",
                      backgroundColor: "var(--ds-panel)",
                      padding: "0.25rem 0.75rem",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "var(--ds-text-subtle)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/intelligence/global-market-intelligence-q1-2026"
                  className="group inline-flex items-center gap-2 border px-5 py-3 transition"
                  style={{
                    borderColor: "var(--ds-accent-soft)",
                    color: "var(--ds-accent)",
                    backgroundColor: "var(--ds-accent-soft)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                >
                  Open intelligence surface
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/artifacts/global-market-intelligence-report-q1-2026"
                  className="inline-flex items-center gap-2 border px-5 py-3 transition"
                  style={{
                    borderColor: "var(--ds-border)",
                    backgroundColor: "var(--ds-panel)",
                    color: "var(--ds-text-muted)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                >
                  <Lock className="h-3.5 w-3.5" />
                  Institutional edition
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.36em",
                  textTransform: "uppercase",
                  color: "var(--ds-text-subtle)",
                  marginBottom: "1rem",
                }}
              >
                Key signals
              </div>
              {findings.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.10, duration: 0.5 }}
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    border: "1px solid var(--ds-border)",
                    backgroundColor: "var(--ds-panel)",
                    padding: "1rem",
                  }}
                >
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 ds-accent" />
                  <span className="text-[12px] leading-relaxed ds-text-muted">{f}</span>
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
  const reportFields = [
    { label: "Headline", value: "Situational reading, one sentence, institution-specific" },
    { label: "Constitutional route", value: "STRATEGY / DIAGNOSTIC / REJECT with confidence score" },
    { label: "Governance risk", value: "Named failure mode, not a category" },
    { label: "Top 3 pressure points", value: "Ranked, named, consequence if unaddressed" },
    { label: "Decision options", value: "2–3 concrete options, what each preserves vs sacrifices" },
    { label: "Correction priorities", value: "Ordered by urgency and structural impact" },
    { label: "7 / 30 / 90 day sequence", value: "Specific actions, not ambient guidance" },
  ];

  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      <Panel surface="lift">
        <div className="p-8 md:p-11 lg:p-13">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Eyebrow>Executive Reporting</Eyebrow>
            <div
              style={{
                border: "1px solid var(--ds-border)",
                backgroundColor: "var(--ds-panel)",
                padding: "0.4rem 0.75rem",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "var(--ds-text-subtle)",
              }}
            >
              Interpretation layer
            </div>
          </div>

          <div className="mt-9 grid gap-9 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h3
                className="font-['Cormorant_Garamond',Georgia,serif] font-light leading-[1.0] ds-text md:text-[2.3rem]"
                style={{ fontSize: "clamp(2rem, 3vw, 2.3rem)" }}
              >
                From diagnostic signal
                <br />
                <span className="ds-text-muted">to decision-grade output.</span>
              </h3>

              <p className="mt-4 text-[13.5px] leading-relaxed ds-text-muted">
                The governed layer between raw diagnostic assessment and private mandate work.
                A structured intake produces a board-grade report. The point is not to sound wise.
                The point is to read the institutional condition precisely enough that the decision
                path stops hiding.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/diagnostics/executive-reporting"
                  className="group inline-flex items-center gap-2 border px-5 py-3 transition"
                  style={{
                    borderColor: "var(--ds-accent-soft)",
                    color: "var(--ds-accent)",
                    backgroundColor: "var(--ds-accent-soft)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                >
                  Open Executive Reporting
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/diagnostics"
                  className="group inline-flex items-center gap-2 border px-5 py-3 transition"
                  style={{
                    borderColor: "var(--ds-border)",
                    backgroundColor: "var(--ds-panel)",
                    color: "var(--ds-text-muted)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                >
                  <ScanSearch className="h-3.5 w-3.5" />
                  Begin diagnostics
                </Link>
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.36em",
                  textTransform: "uppercase",
                  color: "var(--ds-text-subtle)",
                  marginBottom: "1rem",
                }}
              >
                Report output fields
              </div>

              <div style={{ borderTop: "1px solid var(--ds-border)" }}>
                {reportFields.map((field, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-2.5"
                    style={{ borderBottom: "1px solid var(--ds-border)" }}
                  >
                    <span
                      style={{
                        minWidth: "96px",
                        marginTop: "0.15rem",
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: "var(--ds-text-subtle)",
                      }}
                    >
                      {field.label}
                    </span>
                    <span
                      className="font-['Cormorant_Garamond',Georgia,serif] italic"
                      style={{
                        fontSize: "11.5px",
                        lineHeight: 1.7,
                        color: "var(--ds-text-muted)",
                      }}
                    >
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
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

function FlagshipBlogStrip({ posts }: { posts: BlogPostItem[] }) {
  if (posts.length === 0) return null;

  const formatDate = (iso: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return iso;
    }
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      <Panel surface="lift">
        <div className="p-8 md:p-11 lg:p-13">
          <div className="flex items-center gap-3">
            <span className="h-5 w-px" style={{ backgroundColor: "var(--ds-text-subtle)" }} />
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "var(--ds-text-subtle)",
              }}
            >
              From the blog
            </span>
          </div>
          <p
            className="mt-3"
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ds-text-subtle)",
            }}
          >
            Recent writing — direct, unedited thinking.
          </p>

          <ul className="mt-8">
            {posts.slice(0, 3).map((post) => (
              <li
                key={post.slug}
                style={{ borderBottom: "1px solid var(--ds-border)" }}
              >
                <Link
                  href={post.href}
                  className="group flex flex-col gap-2 py-4 transition-colors md:flex-row md:items-baseline md:gap-6"
                  onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--ds-panel)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent")}
                >
                  <span
                    className="shrink-0"
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "var(--ds-text-subtle)",
                      minWidth: "6.5rem",
                    }}
                  >
                    {formatDate(post.dateISO)}
                  </span>
                  <span
                    className="flex-1"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontStyle: "italic",
                      fontWeight: 300,
                      fontSize: "1.05rem",
                      lineHeight: 1.35,
                      color: "var(--ds-text-muted)",
                    }}
                  >
                    {post.title}
                  </span>
                  {post.excerpt && (
                    <span
                      className="hidden max-w-[32ch] truncate md:inline"
                      style={{
                        fontSize: "12px",
                        lineHeight: 1.5,
                        color: "var(--ds-text-subtle)",
                      }}
                    >
                      {post.excerpt}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 border px-5 py-3 transition"
              style={{
                borderColor: "var(--ds-border)",
                backgroundColor: "var(--ds-panel)",
                color: "var(--ds-text-muted)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8.5px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
              }}
            >
              All posts
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

function FlagshipPublication({ item }: { item: PublicationItem }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      <Panel surface="lift">
        <div className="p-8 md:p-11 lg:p-13">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Eyebrow>Editorial flagship</Eyebrow>
            {item.documentId && (
              <span
                style={{
                  border: "1px solid var(--ds-border)",
                  backgroundColor: "var(--ds-panel)",
                  padding: "0.4rem 0.75rem",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  color: "var(--ds-text-subtle)",
                }}
              >
                {item.documentId}
              </span>
            )}
          </div>

          <div className="mt-9 grid gap-9 lg:grid-cols-[1.35fr_0.65fr]">
            <div>
              <h3
                className="font-['Cormorant_Garamond',Georgia,serif] font-light leading-[1.0] text-white md:text-[2.3rem]"
                style={{ fontSize: "clamp(2rem, 3vw, 2.3rem)" }}
              >
                {item.title}
              </h3>
              {item.subtitle && <p className="mt-4 text-[13.5px] leading-relaxed text-white/40">{item.subtitle}</p>}
              {item.description && <p className="mt-3 text-[12.5px] leading-relaxed text-white/32">{item.description}</p>}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={item.href}
                  className="group inline-flex items-center gap-2 border px-5 py-3 transition"
                  style={{
                    borderColor: "var(--ds-accent-soft)",
                    color: "var(--ds-accent)",
                    backgroundColor: "var(--ds-accent-soft)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                >
                  Read editorial
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>

                {item.previewHref && (
                  <a
                    href={item.previewHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border px-5 py-3 transition"
                    style={{
                      borderColor: "var(--ds-border)",
                      backgroundColor: "var(--ds-panel)",
                      color: "var(--ds-text-muted)",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8.5px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                    }}
                  >
                    Preview <Eye className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.36em",
                  textTransform: "uppercase",
                  color: "var(--ds-text-subtle)",
                  marginBottom: "1rem",
                }}
              >
                Publication assets
              </div>

              {item.pdfHref && (
                <a
                  href={item.pdfHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between border p-4 transition"
                  style={{
                    borderColor: "var(--ds-border)",
                    backgroundColor: "var(--ds-panel)",
                  }}
                >
                  <span className="flex items-center gap-3 text-[12px] text-white/45">
                    <Download className="h-3.5 w-3.5" style={{ color: "var(--ds-accent)", opacity: 0.56 }} />
                    Premium PDF
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-white/20" />
                </a>
              )}

              {item.epubHref && (
                <a
                  href={item.epubHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between border p-4 transition"
                  style={{
                    borderColor: "var(--ds-border)",
                    backgroundColor: "var(--ds-panel)",
                  }}
                >
                  <span className="flex items-center gap-3 text-[12px] text-white/45">
                    <BookOpen className="h-3.5 w-3.5" style={{ color: "var(--ds-accent)", opacity: 0.56 }} />
                    EPUB edition
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-white/20" />
                </a>
              )}

              <a
                href={item.citationHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border p-4 transition"
                style={{
                  borderColor: "var(--ds-border)",
                  backgroundColor: "var(--ds-panel)",
                }}
              >
                <span className="flex items-center gap-3 text-[12px] text-white/45">
                  <FileText className="h-3.5 w-3.5" style={{ color: "var(--ds-accent)", opacity: 0.56 }} />
                  Citation record
                </span>
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
// CARDS
// ─────────────────────────────────────────────────────────────────────────────

function PubCard({ item }: { item: PublicationItem }) {
  return (
    <Panel surface="card">
      <div className="p-6 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>{item.category || "Editorial"}</Eyebrow>
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "var(--ds-text-subtle)",
            }}
          >
            {item.tier}
          </span>
        </div>

        <h3 className="mt-5 font-['Cormorant_Garamond',Georgia,serif] text-2xl font-light leading-snug text-white">
          {item.title}
        </h3>

        {item.description && <p className="mt-3 text-[12.5px] leading-relaxed text-white/38">{item.description}</p>}

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={item.href}
            className="group inline-flex items-center gap-2 border px-4 py-2.5 transition"
            style={{
              borderColor: "var(--ds-border)",
              backgroundColor: "var(--ds-panel)",
              color: "var(--ds-text-muted)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
            }}
          >
            Open <ChevronRight className="h-3.5 w-3.5" />
          </Link>

          {item.pdfHref && (
            <a
              href={item.pdfHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border px-4 py-2.5 transition"
              style={{
                borderColor: "var(--ds-accent-soft)",
                color: "var(--ds-accent)",
                backgroundColor: "var(--ds-accent-soft)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
              }}
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
    <Panel surface="card">
      <div className="p-6 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>{item.playbookType || "Playbook"}</Eyebrow>
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "var(--ds-text-subtle)",
            }}
          >
            {item.difficulty || "Advanced"}
          </span>
        </div>

        <h3 className="mt-5 font-['Cormorant_Garamond',Georgia,serif] text-2xl font-light leading-snug text-white">
          {item.title}
        </h3>

        {item.description && <p className="mt-3 text-[12.5px] leading-relaxed text-white/38">{item.description}</p>}

        <div className="mt-5">
          <Link
            href={item.href}
            className="group inline-flex items-center gap-2 border px-4 py-2.5 transition"
            style={{
              borderColor: "var(--ds-border)",
              backgroundColor: "var(--ds-panel)",
              color: "var(--ds-text-muted)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
            }}
          >
            Open playbook <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGNOSTIC LADDER
// ─────────────────────────────────────────────────────────────────────────────

function DiagnosticLadder() {
  const layers = [
    {
      n: "01",
      title: "Constitutional Diagnostic",
      tag: "Entry gate",
      href: "/diagnostics/constitutional-diagnostic",
      body: "10 dual-axis questions. Produces a constitutional route — STRATEGY, DIAGNOSTIC, or REJECT — with confidence score, named disqualifiers, and rationale log.",
      icon: ScanSearch,
      detail: "4–7 min · No login",
    },
    {
      n: "02",
      title: "Executive Reporting",
      tag: "Flagship",
      href: "/diagnostics/executive-reporting",
      body: "Structured intake. Returns a board-grade report: headline, governance risk, pressure points, decision options, correction priorities, and a 7/30/90 sequence.",
      icon: FileText,
      detail: "Paid product",
    },
    {
      n: "03",
      title: "Strategy Room",
      tag: "Private mandate",
      href: "/strategy-room",
      body: "The terminal layer. Accessed where a structured product is insufficient and the problem warrants direct advisory attention.",
      icon: Crown,
      detail: "By qualification",
    },
  ];

  return (
    <motion.div
      variants={stagger(0.1)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="grid gap-4 lg:grid-cols-3"
    >
      {layers.map((p) => (
        <motion.div key={p.n} variants={fadeUp}>
          <Link href={p.href} className="group block h-full">
            <Panel surface="card" className="h-full transition-all duration-300">
              <div className="p-7">
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="font-['Cormorant_Garamond',Georgia,serif] font-light leading-none transition-colors"
                    style={{ fontSize: "3.5rem", color: "var(--ds-border)" }}
                  >
                    {p.n}
                  </div>
                  <div
                    className="flex h-9 w-9 items-center justify-center border transition"
                    style={{
                      borderColor: "var(--ds-border)",
                      backgroundColor: "var(--ds-panel)",
                    }}
                  >
                    <p.icon className="h-4 w-4 text-white/25 transition-colors group-hover:text-white/55" />
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.32em",
                        textTransform: "uppercase",
                        color: "var(--ds-text-subtle)",
                      }}
                    >
                      {p.tag}
                    </span>
                    <span className="text-white/10">·</span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: "var(--ds-text-subtle)",
                      }}
                    >
                      {p.detail}
                    </span>
                  </div>

                  <h3 className="mt-2 font-['Cormorant_Garamond',Georgia,serif] text-[1.5rem] font-light text-white/85 transition-colors group-hover:text-white">
                    {p.title}
                  </h3>

                  <p className="mt-3 text-[12.5px] leading-relaxed text-white/35 transition-colors group-hover:text-white/50">
                    {p.body}
                  </p>
                </div>

                <div
                  className="mt-6 flex items-center gap-2 transition-all group-hover:gap-3"
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                    color: "var(--ds-text-subtle)",
                  }}
                >
                  <span>Enter</span>
                  <ArrowRight className="h-3.5 w-3.5" />
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
// ESCALATION CLOSE
// ─────────────────────────────────────────────────────────────────────────────

function EscalationClose() {
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      <Panel gold>
        <div className="px-8 py-14 md:px-16 md:py-18 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <div
              className="mx-auto mb-9 flex h-14 w-14 items-center justify-center border"
              style={{ borderColor: "var(--ds-accent-soft)", backgroundColor: "var(--ds-accent-soft)" }}
            >
              <Crown className="h-6 w-6" style={{ color: "var(--ds-accent)" }} />
            </div>

            <Eyebrow align="center">Entry points</Eyebrow>

            <h2
              className="mt-7 font-['Cormorant_Garamond',Georgia,serif] font-light leading-[0.95] tracking-[-0.03em] text-white"
              style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)" }}
            >
              Each route is designed for
              <span className="block" style={{ color: "var(--ds-accent)" }}>
                a different level of consequence.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-lg text-[14.5px] leading-[1.85] text-white/35">
              The diagnostic ladder surfaces the correct entry point. Products for
              interpretation. Advisory for situations where interpretation is insufficient.
            </p>

            <div className="mt-11 flex flex-wrap justify-center gap-3">
              <Link
                href="/diagnostics"
                className="group inline-flex items-center gap-3 border px-7 py-4 transition"
                style={{
                  borderColor: "var(--ds-accent-soft)",
                  color: "var(--ds-accent)",
                  backgroundColor: "var(--ds-accent-soft)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                }}
              >
                Begin Assessment
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/strategy-room"
                className="inline-flex items-center gap-3 border px-7 py-4 transition"
                style={{
                  borderColor: "var(--ds-border)",
                  backgroundColor: "var(--ds-panel)",
                  color: "var(--ds-text-muted)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                }}
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

function HomeHero({ intelligenceHref }: { intelligenceHref: string }) {
  const heroMountTime = React.useRef(0);

  React.useEffect(() => {
    heroMountTime.current = typeof performance !== "undefined" ? performance.now() : Date.now();
    track("hero_viewed");

    // Scroll depth tracking
    const thresholds = new Set<number>();
    const onScroll = () => {
      const scrollPct = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      for (const t of [25, 50, 75, 100]) {
        if (scrollPct >= t && !thresholds.has(t)) {
          thresholds.add(t);
          track("scroll_depth", { percent: t });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hero card exposure tracking via IntersectionObserver
  const cardsRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = cardsRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          track("hero_cards_visible", {
            time_to_visible_ms: typeof performance !== "undefined" ? Math.round(performance.now() - heroMountTime.current) : 0,
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const trackHeroClick = React.useCallback((variant: string) => {
    const elapsed = typeof performance !== "undefined" ? Math.round(performance.now() - heroMountTime.current) : 0;
    track(`hero_${variant}_clicked`, { time_to_action_ms: elapsed });
  }, []);

  return (
    <Section id="hero" variant="surface">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        {/* LEFT — why / what */}
        <div className="max-w-[560px]">
          <Eyebrow>Diagnostic Intelligence System</Eyebrow>

          <h1
            className="mt-4 font-['Cormorant_Garamond',Georgia,serif] font-light"
            style={{
              fontSize: "clamp(2.4rem, 5.5vw, 3.8rem)",
              lineHeight: 1.06,
              color: "#F5F5F5",
              letterSpacing: "-0.01em",
            }}
          >
            Diagnose what is actually wrong
            <span style={{ color: "rgba(184,184,184,0.72)" }}> — in your decisions, your team, or your organisation.</span>
          </h1>

          <p
            className="mt-3 font-['Cormorant_Garamond',Georgia,serif] font-light italic"
            style={{ fontSize: "1.05rem", lineHeight: 1.5, color: "rgba(184,184,184,0.85)" }}
          >
            Before it becomes a decision you can&rsquo;t reverse.
          </p>

          <p className="mt-4 max-w-[52ch] text-[14px] leading-[1.65]" style={{ color: "#B8B8B8" }}>
            Run a 10-minute diagnostic. Get a clear condition, trajectory, and next step — based on your actual situation, not generic advice.
          </p>

          <p
            className="mt-3"
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(184,184,184,0.80)",
            }}
          >
            Free to start. No subscription. No commitment.
          </p>

          <p className="mt-3 text-[12.5px] leading-[1.6]" style={{ color: "rgba(184,184,184,0.62)" }}>
            Built for founders, operators, and teams under pressure.
          </p>
        </div>

        {/* RIGHT — choose / act */}
        <div>
          {/* Dual-entry cards */}
          <div ref={cardsRef} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Link
              href="/diagnostics/purpose-alignment"
              className="group border border-white/[0.10] bg-white/[0.03] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.20] hover:bg-white/[0.06]"
              onClick={() => trackHeroClick("personal")}
            >
              <div className="flex items-start gap-3">
                <Compass className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/70 transition-colors group-hover:text-white" />
                <div style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px", letterSpacing: 0, textTransform: "uppercase",
                  color: "#F5F5F5",
                  fontWeight: 650,
                }}>
                  Your decisions feel off — start here
                </div>
              </div>
              <p className="mt-2.5 text-[13px] leading-[1.55]" style={{ color: "#B8B8B8" }}>
                Identify where your decisions are breaking down — and why.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 border-b border-white/20 pb-1 transition-colors group-hover:border-white/45" style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px", letterSpacing: 0, textTransform: "uppercase",
                color: "rgba(245,245,245,0.78)",
              }}>
                Run personal diagnostic · 8 min
                <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href="/diagnostics/constitutional-diagnostic"
              className="group border border-white/[0.10] bg-white/[0.03] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.20] hover:bg-white/[0.06]"
              onClick={() => trackHeroClick("institutional")}
            >
              <div className="flex items-start gap-3">
                <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/55 transition-colors group-hover:text-white/80" />
                <div style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px", letterSpacing: 0, textTransform: "uppercase",
                  color: "rgba(245,245,245,0.86)",
                  fontWeight: 650,
                }}>
                  Something is breaking in the business — start here
                </div>
              </div>
              <p className="mt-2.5 text-[13px] leading-[1.55]" style={{ color: "#B8B8B8" }}>
                Diagnose structural failure, misalignment, and execution risk.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 border-b pb-1 transition-colors group-hover:border-[#C9A96E]/70" style={{
                borderColor: "rgba(201,169,110,0.42)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px", letterSpacing: 0, textTransform: "uppercase",
                color: "#C9A96E",
              }}>
                Run constitutional diagnostic · 6 min
                <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>
          </div>

          {/* Start here — routing panel */}
          <div
            className="mt-3 overflow-hidden border border-white/[0.07]"
            style={{
              background: "rgba(0,0,0,0.38)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="px-5 py-3.5">
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(184,184,184,0.52)",
                }}
              >
                If neither option fits exactly
              </div>
              <div className="mt-2.5 space-y-0">
                {[
                  { trigger: "Something feels off — but you can\u2019t explain why", route: "Personal diagnostic", href: "/diagnostics/purpose-alignment", tier: "personal" },
                  { trigger: "Your decisions change under pressure", route: "Personal diagnostic", href: "/diagnostics/purpose-alignment", tier: "personal" },
                  { trigger: "Your team is misaligned with your direction", route: "Team assessment", href: "/diagnostics/team-assessment", tier: "institutional" },
                  { trigger: "The organisation is under structural pressure", route: "Constitutional diagnostic", href: "/diagnostics/constitutional-diagnostic", tier: "institutional" },
                  { trigger: "A high-stakes decision is already on the table", route: "Strategy Room criteria", href: "/strategy-room", tier: "premium" },
                ].map((item) => (
                  <Link
                    key={item.trigger}
                    href={item.href}
                    className="group flex items-center gap-3 border-b border-white/[0.06] py-2.5 transition-all duration-150 last:border-b-0 hover:translate-x-1"
                    onClick={() => track("start_here_clicked", { target: item.href })}
                  >
                    <div
                      className="h-1.5 w-1.5 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-[1.5]"
                      style={{
                        backgroundColor: item.tier === "personal"
                          ? "rgba(110,231,183,0.65)"
                          : item.tier === "premium"
                            ? "rgba(252,165,165,0.65)"
                            : "var(--ds-accent)",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="leading-[1.45] transition-colors duration-150 truncate"
                        style={{
                          fontSize: "11.5px",
                          color: item.tier === "personal" ? "rgba(245,245,245,0.66)" : "rgba(184,184,184,0.64)",
                          fontWeight: item.tier === "personal" ? 500 : 350,
                        }}
                      >
                        {item.trigger}
                      </p>
                      <p
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "6.8px",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: item.tier === "premium" ? "rgba(252,165,165,0.75)" : "rgba(201,169,110,0.72)",
                        }}
                      >
                        → {item.route}
                      </p>
                    </div>
                    <ArrowRight className="h-3 w-3 shrink-0 text-white/0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-white/50" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Reassurance line */}
          <p
            className="mt-3 text-[12px] leading-[1.55]"
            style={{ color: "rgba(184,184,184,0.62)" }}
          >
            You will know within minutes whether this is accurate. If it isn&rsquo;t, stop there.
          </p>
        </div>
      </div>
    </Section>
  );
}

function WhatThisPlatformIs() {
  return (
    <Section id="what-this-is" variant="void">
      <SectionHeader
        eyebrow="How it works"
        title={
          <>
            Misalignment becomes decision drift.
            <br />
            <span className="text-white/35">Decision drift becomes structural pressure.</span>
          </>
        }
        description="This system diagnoses both — and routes you to the correct next step."
        large
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-4">
        {[
          ["Diagnose", "Surface what is actually wrong — in your own decisions, your team's alignment, or your institution's structure."],
          ["Classify", "The engine computes trajectory, readiness, and failure modes — not just scores, but structural classifications."],
          ["Escalate", "Move only when the signal, authority, and consequence justify a higher-order container."],
          ["Intervene", "Executive Reporting and Strategy Room escalation layers — used only when free diagnostics confirm the need."],
        ].map(([title, body]) => (
          <Panel key={title} surface="lift">
            <div className="p-6">
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "var(--ds-accent)",
                }}
              >
                {title}
              </div>
              <p className="mt-4 text-[14px] leading-[1.8] ds-text-muted">{body}</p>
            </div>
          </Panel>
        ))}
      </div>

      {/* Anti-hype */}
      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase" }}>
        <span style={{ color: "var(--ds-text)" }}>What this is not:</span>
        {["Coaching", "Personality profiling", "Generic consulting", "Opinion dressed as insight"].map((item) => (
          <span key={item} style={{ color: "var(--ds-text-muted)", opacity: 0.72 }}>
            Not {item.toLowerCase()}
          </span>
        ))}
        <span style={{ color: "var(--ds-accent)", opacity: 0.90 }}>It is a diagnostic system.</span>
      </div>
    </Section>
  );
}

function HowItWorksLadder() {
  const stages = [
    {
      label: "Stage 1: Diagnostic",
      href: "/diagnostics/constitutional-diagnostic",
      cta: "Start diagnostic",
      effort: "6-10 minutes",
      explanation: "The constitutional entry point. Identifies seriousness, pressure, and route fit.",
      outcome: "A first reading of whether the problem should stay diagnostic or move upward.",
    },
    {
      label: "Stage 2: Team / Enterprise",
      href: "/diagnostics",
      cta: "Explore team assessment",
      effort: "10-25 minutes",
      explanation: "Structured assessment for teams and organisations dealing with execution, alignment, or institutional friction.",
      outcome: "Sharper visibility into drift, misalignment, and system-level breakdowns.",
    },
    {
      label: "Stage 3: Executive Reporting",
      href: "/diagnostics/executive-reporting",
      cta: "View Executive Reporting",
      effort: "£95",
      explanation: "The first escalation layer. Translates structural strain into financial exposure and a governed priority stack.",
      outcome: "Decision-grade clarity, implications, and governed next-step logic.",
    },
    {
      label: "Stage 4: Strategy Room",
      href: "/strategy-room",
      cta: "View Strategy Room",
      effort: "£395",
      explanation: "Governed intervention logic for situations where a real decision with consequence is already on the table.",
      outcome: "Decision architecture, trade-offs, owners, and execution cadence.",
    },
  ];

  return (
    <Section id="how-it-works" variant="surface">
      <SectionHeader
        eyebrow="The Ladder"
        title={
          <>
            A structured path,
            <br />
            <span className="text-white/35">not a pile of pages.</span>
          </>
        }
        description="The route is earned by signal, seriousness, and authority. Free stages come first. Escalation only when the signal justifies it."
        large
      />

      <Panel surface="lift" className="mt-10">
        <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "rgba(110,231,183,0.72)",
              }}
            >
              Personal path
            </div>
            <p className="mt-3 max-w-3xl text-[14px] leading-[1.8] ds-text-muted">
              Purpose Alignment reads the person before the Constitutional Diagnostic
              reads the organisation. A parallel entry point.
            </p>
          </div>
          <Link
            href="/diagnostics/purpose-alignment"
            className="group inline-flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/55 transition hover:text-white"
          >
            Take Purpose Alignment <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Panel>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {stages.map((stage) => (
          <Panel key={stage.label} surface="lift">
            <div className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                    color: "var(--ds-accent)",
                  }}
                >
                  {stage.label}
                </div>
                <div className="text-[11px] ds-text-subtle">{stage.effort}</div>
              </div>
              <p className="mt-4 text-[14px] leading-[1.8] ds-text-muted">{stage.explanation}</p>
              <p className="mt-3 text-[13px] leading-[1.75] ds-text-subtle">
                <span className="ds-text">Outcome:</span> {stage.outcome}
              </p>
              <div className="mt-4">
                <Link href={stage.href} className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] ds-text-muted transition">
                  {stage.cta} <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </Section>
  );
}

function WhoThisIsFor() {
  return (
    <Section id="who-this-is-for" variant="void">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
        <div>
          <SectionHeader
            eyebrow="Audience"
            title={
              <>
                Built for operators
                <br />
                <span className="text-white/35">carrying real consequence.</span>
              </>
            }
            description="This platform is for founders, executives, organizations under pressure, and leaders facing structural, strategic, or execution problems that cannot be solved by more noise."
          />
        </div>
        <Panel surface="lift">
          <div className="p-6">
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "var(--ds-accent)",
              }}
            >
              Poor Fit
            </div>
            <p className="mt-4 text-[14px] leading-[1.8] ds-text-muted">
              Poor fit when the situation is low-stakes, exploratory, or purely informational.
              The system is built for decisions where clarity has operational consequence.
            </p>
          </div>
        </Panel>
      </div>
    </Section>
  );
}

function ContentLibrarySection({
  featuredBlogPosts,
  featuredShorts,
  featuredPlaybooks,
  latestReport,
}: Pick<HomePageProps, "featuredBlogPosts" | "featuredShorts" | "featuredPlaybooks" | "latestReport">) {
  const intelligenceHref = "/artifacts";
  const libraryGroups = [
    {
      label: "Analysis",
      items: [
        ["Intelligence Archive", "Market signals, structural breakdowns, and institutional analysis.", intelligenceHref],
        ["Essays", "Long-form thinking on institutions, drift, leadership, and the real structure beneath visible problems.", "/blog"],
      ],
    },
    {
      label: "Doctrine",
      items: [
        ["Canon", "Foundational doctrine and core frameworks. The intellectual spine behind the system.", "/canon"],
        ["Architecture", "The governing model behind the diagnostic system.", "/books/the-architecture-of-human-purpose-landing"],
      ],
    },
    {
      label: "Tools",
      items: [
        ["Playbooks", "Operational responses to diagnosed failure modes. Practical, structured, reusable.", "/playbooks"],
        ["Shorts", "Concise signal for fast orientation and quick entry into the deeper body of work.", "/shorts"],
        ["Vault", "Restricted archive and deployable assets for members and serious operators.", "/vault"],
      ],
    },
  ] as Array<{ label: string; items: Array<[string, string, string]> }>;

  return (
    <Section id="library" variant="void">
      <SectionHeader
        eyebrow="The library behind the system"
        title={
          <>
            Depth, doctrine,
            <br />
            <span className="text-white/35">and applied tools.</span>
          </>
        }
        description="The diagnostic system is not assembled from borrowed parts. Below is the body of work it is built on — available for verification, deeper reading, and operational use."
        large
      />

      {/* Content directory */}
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {libraryGroups.map((group) => (
          <Panel key={group.label} surface="lift">
            <div className="p-5">
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  color: "var(--ds-accent)",
                }}
              >
                {group.label}
              </div>
              <div className="mt-4 space-y-4">
                {group.items.map(([title, body, href]) => (
                  <div key={title} className="border-t border-white/[0.06] pt-4 first:border-t-0 first:pt-0">
                    <Link
                      href={href}
                      className="group inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] ds-text transition hover:text-white"
                    >
                      {title}
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <p className="mt-2 text-[13px] leading-[1.65] ds-text-muted">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {/* Featured items */}
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {latestReport && (
          <Panel surface="lift">
            <div className="p-5">
              <div className="text-[10px] uppercase tracking-[0.2em] ds-text-subtle">Featured Intelligence</div>
              <div className="mt-3 text-[1.3rem] font-['Cormorant_Garamond',Georgia,serif] leading-[1.15] ds-text">
                {latestReport.title || "Quarterly Market Intelligence Report"}
              </div>
              <div className="mt-4">
                <Link href={intelligenceHref} className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] ds-text-subtle transition hover:text-white/70">
                  Open archive <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </Panel>
        )}
        {featuredBlogPosts[0] && (
          <Panel surface="lift">
            <div className="p-5">
              <div className="text-[10px] uppercase tracking-[0.2em] ds-text-subtle">Featured Essay</div>
              <div className="mt-3 text-[1.3rem] font-['Cormorant_Garamond',Georgia,serif] leading-[1.15] ds-text">
                {featuredBlogPosts[0].title}
              </div>
            </div>
          </Panel>
        )}
        {(featuredPlaybooks[0] || featuredShorts[0]) && (
          <Panel surface="lift">
            <div className="p-5">
              <div className="text-[10px] uppercase tracking-[0.2em] ds-text-subtle">Active Surface</div>
              <div className="mt-3 text-[1.3rem] font-['Cormorant_Garamond',Georgia,serif] leading-[1.15] ds-text">
                {featuredPlaybooks[0]?.title || featuredShorts[0]?.title || "Operational Frameworks"}
              </div>
            </div>
          </Panel>
        )}
      </div>

      {/* Shorts signal rail */}
      <div className="mt-14">
        <div className="mb-8">
          <Eyebrow dim>Recognition before deeper reading</Eyebrow>
        </div>
        <ShortsSignalRail
          items={HOMEPAGE_SHORT_SIGNALS}
          title="Signal Before Noise"
          subtitle="A controlled rail of high-fit Shorts. Recognition first, then the correct route."
        />
      </div>

      {/* Governing model — the intellectual spine */}
      <div className="mt-14 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div
          style={{
            border: "1px solid rgba(201,169,110,0.22)",
            backgroundColor: "rgba(201,169,110,0.04)",
            padding: "2rem",
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.38em",
              textTransform: "uppercase",
              color: "rgba(201,169,110,0.85)",
            }}
          >
            The model behind the diagnostic system
          </div>
          <h3
            className="mt-4 font-['Cormorant_Garamond',Georgia,serif] font-light italic leading-[1.05]"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", color: "rgba(255,255,255,0.92)" }}
          >
            The Architecture
            <span style={{ color: "var(--ds-accent)" }}> of Human Purpose</span>
          </h3>
          <p
            className="mt-4 font-['Cormorant_Garamond',Georgia,serif] font-light italic"
            style={{
              fontSize: "1rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.50)",
              borderLeft: "2px solid rgba(201,169,110,0.25)",
              paddingLeft: "1rem",
            }}
          >
            &ldquo;Human flourishing is not accidental. It is architectural.&rdquo;
          </p>
          <p className="mt-4 text-[13.5px] leading-[1.7] ds-text-muted">
            This is the framework the system uses to classify, interpret, and govern its outputs.
            Purpose, governance, formation, and legacy become operating disciplines,
            not abstract aspirations.
          </p>
          <div className="mt-5">
            <Link
              href="/books/the-architecture-of-human-purpose-landing"
              className="group inline-flex items-center gap-2 transition-colors"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8.5px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--ds-accent)",
              }}
            >
              Read the prelude
              <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div
          style={{
            border: "1px solid var(--ds-border)",
            backgroundColor: "var(--ds-panel-alt)",
            padding: "2rem",
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.38em",
              textTransform: "uppercase",
              color: "var(--ds-text-subtle)",
            }}
          >
            The Canon — applied doctrine
          </div>
          <p className="mt-4 text-[13.5px] leading-[1.7] ds-text-muted">
            Foundational frameworks applied to governance, execution, leadership,
            and institutional integrity. The thinking that precedes the diagnostic engine.
          </p>
          <div className="mt-5">
            <Link
              href="/canon"
              className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] ds-text-subtle transition hover:text-white/70"
            >
              Browse the Canon <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ProofLayer() {
  return (
    <Section id="proof-layer" variant="void">
      <div className="mx-auto max-w-[1100px]">
        {/* Section title */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "9px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#F5F5F5",
            fontWeight: 700,
          }}
        >
          What the system returns
        </div>
        <div className="mt-2 h-px w-16" style={{ backgroundColor: "rgba(201,169,110,0.35)" }} />

        {/* A: Example output — what the system actually produces */}
        <div className="mt-10">
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(201,169,110,0.80)",
              marginBottom: "1rem",
            }}
          >
            Illustrative output based on anonymised diagnostic patterns
          </div>
          <div
            style={{
              border: "1px solid rgba(255,215,0,0.22)",
              backgroundColor: "rgba(0,0,0,0.65)",
              boxShadow: "0 20px 70px rgba(0,0,0,0.30)",
            }}
          >
            <div style={{ padding: "1.5rem 1.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "1.25rem", lineHeight: 1.3, color: "#F5F5F5" }}>
                Execution coherence collapsing under governance drift
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#F87171", fontWeight: 700 }}>
                  Trajectory: DETERIORATING
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#F5F5F5", fontWeight: 700 }}>
                  Estimated exposure: £420,000 over 6 months
                </span>
              </div>
            </div>
            <div style={{ padding: "1.25rem 1.75rem 1.5rem" }}>
              <p className="text-[13.5px] leading-[1.65]" style={{ color: "#B8B8B8" }}>
                Stabilise governance cadence within 30 days. Decision authority is not ordered — three concurrent owners are producing conflicting mandates. Execution layer is compensating with informal authority, accelerating drift.
              </p>
              <p className="mt-4 border-t border-white/[0.08] pt-4 text-[12.5px] leading-[1.6]" style={{ color: "#F87171", fontWeight: 700 }}>
                Without intervention, conditions like this typically deteriorate within 30–90 days.
              </p>
            </div>
          </div>
        </div>

        {/* B: Observed outcomes — what happened when used */}
        <div className="mt-10">
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(201,169,110,0.80)",
              marginBottom: "1rem",
            }}
          >
            Observed outcomes
          </div>
          <ObservedOutcomesBlock />
          <p className="mt-4 text-[13px] leading-[1.6]" style={{ color: "rgba(184,184,184,0.70)" }}>
            The system does not improve outcomes directly. It makes the correct action visible.
          </p>
        </div>

        {/* C: Accuracy metrics — aggregate proof */}
        <AccuracyMetricsBlock />

        {/* D: Method link — for skeptics who want to inspect */}
        <div className="mt-10">
          <div
            style={{
              border: "1px solid rgba(201,169,110,0.18)",
              backgroundColor: "rgba(201,169,110,0.04)",
              padding: "1.25rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(201,169,110,0.90)",
                  fontWeight: 700,
                  marginBottom: "0.85rem",
                }}
              >
                Method
              </div>
              <p className="text-[13.5px] leading-[1.65]" style={{ color: "rgba(184,184,184,0.78)" }}>
                See how the system captures signal, classifies condition, and governs interpretation.
              </p>
            </div>
            <div className="mt-4">
              <Link
                href="/method"
                className="group inline-flex items-center gap-2 border-b pb-1 transition-colors hover:border-[#C9A96E]/60"
                style={{
                  borderColor: "rgba(201,169,110,0.30)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(201,169,110,0.85)",
                }}
              >
                Review the method
                <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function HomeDecisionSection() {
  return (
    <Section id="escalation-paths" variant="surface">
      <div className="mx-auto max-w-4xl">
        <Eyebrow>When free diagnosis confirms the need</Eyebrow>
        <h2
          className="mt-5 font-['Cormorant_Garamond',Georgia,serif] font-light leading-[0.95] tracking-[-0.028em] ds-text"
          style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
        >
          Two escalation paths. Both earned by signal.
        </h2>
        <p className="mt-4 max-w-2xl text-[14.5px] leading-[1.75] ds-text-muted">
          The system will not recommend escalation the evidence does not support.
          These paths exist only when the free diagnostic has confirmed a situation
          that justifies deeper interpretation or governed intervention.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
        <Panel surface="lift">
          <div className="p-6">
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "var(--ds-accent)",
              }}
            >
              Executive Reporting · £95
            </div>
            <h3 className="mt-4 font-['Cormorant_Garamond',Georgia,serif] text-[1.5rem] font-light leading-[1.1] ds-text">
              Understand the consequence
            </h3>
            <p className="mt-3 text-[14px] leading-[1.75] ds-text-muted">
              Translates structural strain into financial exposure, institutional
              constraint, and a governed priority stack. Board-grade interpretation
              from your actual inputs.
            </p>
            <div className="mt-5 space-y-1.5">
              {["One-time analysis — no subscription", "Generated from your actual submission", "If it reads like generic advice, do not proceed"].map((line) => (
                <p key={line} className="text-[12px] leading-[1.6] ds-text-subtle">{line}</p>
              ))}
            </div>
            <div className="mt-5">
              <Link
                href="/diagnostics/executive-reporting"
                className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] ds-text-muted transition hover:text-white"
              >
                Open Executive Reporting <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </Panel>

        <Panel surface="lift" gold>
          <div className="p-6">
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "var(--ds-accent)",
              }}
            >
              Strategy Room · £395
            </div>
            <h3 className="mt-4 font-['Cormorant_Garamond',Georgia,serif] text-[1.5rem] font-light leading-[1.1] ds-text">
              Decide what to do
            </h3>
            <p className="mt-3 text-[14px] leading-[1.75] ds-text-muted">
              Governed intervention logic for situations where a real decision with
              consequence is already on the table. Decision architecture, trade-offs,
              owners, and execution cadence.
            </p>
            <div className="mt-5 space-y-1.5">
              {["Not exploratory — not theoretical", "Qualified by signal and seriousness", "Escalation is earned, not purchased"].map((line) => (
                <p key={line} className="text-[12px] leading-[1.6] ds-text-subtle">{line}</p>
              ))}
            </div>
            <div className="mt-5">
              <Link
                href="/strategy-room"
                className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] ds-text-muted transition hover:text-white"
              >
                View Strategy Room criteria <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </Panel>
      </div>
    </Section>
  );
}

function HomeFinalCta({ intelligenceHref }: { intelligenceHref: string }) {
  return (
    <Section id="final-cta" variant="surface">
      <Panel surface="lift" gold>
        <div className="p-8 md:p-12">
          <div className="mx-auto max-w-4xl text-center">
            <Eyebrow align="center">Next Move</Eyebrow>
            <h2 className="mt-5 font-['Cormorant_Garamond',Georgia,serif] text-4xl font-light leading-[0.95] tracking-[-0.03em] ds-text">
              Start where the signal is clearest.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-[1.9] ds-text-muted">
              Start with the diagnostic if you need signal. Explore intelligence if you need context.
              View Strategy Room criteria only when a real decision with consequence is already on the table.
              Not exploratory. Not theoretical.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/diagnostics/constitutional-diagnostic"
                className="inline-flex items-center gap-3 border px-7 py-4 transition"
                style={{
                  borderColor: "var(--ds-accent-soft)",
                  backgroundColor: "var(--ds-accent-soft)",
                  color: "var(--ds-accent)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                }}
              >
                Start diagnostic
                <span className="text-[8px] opacity-70">6-8 min</span>
              </Link>
              <Link
                href={intelligenceHref}
                className="inline-flex items-center gap-3 border px-7 py-4 transition"
                style={{
                  borderColor: "var(--ds-border)",
                  backgroundColor: "var(--ds-panel)",
                  color: "var(--ds-text-muted)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                }}
              >
                Explore intelligence
              </Link>
              <Link
                href="/strategy-room"
                className="inline-flex items-center gap-3 border px-7 py-4 transition"
                style={{
                  borderColor: "var(--ds-border)",
                  color: "var(--ds-text-muted)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                }}
              >
                View Strategy Room criteria
              </Link>
            </div>
          </div>
        </div>
      </Panel>
    </Section>
  );
}

const HomePage: NextPage<HomePageProps> = ({
  featuredShorts = [],
  featuredBriefing = null,
  flagshipPublication = null,
  featuredPublications = [],
  featuredPlaybooks = [],
  featuredCanon = [],
  featuredBlogPosts = [],
  counts = {
    shorts: 0,
    canon: 0,
    briefs: 0,
    downloads: 0,
    library: 0,
    publications: 0,
    playbooks: 0,
  },
  latestReport,
}) => {
  const intelligenceHref = "/artifacts";

  return (
    <Layout
      title="Abraham of London"
      description="A strategic diagnostic platform for founders, executives, and organizations that need structured clarity before intervention."
      canonicalUrl="/"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/assets/images/social/og-image.jpg" />
      </Head>

      {/* 1. Recognition + Choice */}
      <HomeHero intelligenceHref={intelligenceHref} />

      {/* 2. Mechanism — what happens after you click */}
      <WhatThisPlatformIs />

      {/* 3. Product path — the ladder */}
      <HowItWorksLadder />

      {/* 4. Evidence — proof that earns trust */}
      <ProofLayer />

      {/* 5. Audience qualification */}
      <WhoThisIsFor />

      {/* 6. Escalation decision — commercial clarity */}
      <HomeDecisionSection />

      {/* — mode change: conversion system → content library — */}
      <Bridge text="diagnostic system · content library" />

      {/* 7. The governed library */}
      <ContentLibrarySection
        featuredBlogPosts={featuredBlogPosts}
        featuredShorts={featuredShorts}
        featuredPlaybooks={featuredPlaybooks}
        latestReport={latestReport}
      />

      {/* 8. Final action */}
      <HomeFinalCta intelligenceHref={intelligenceHref} />
    </Layout>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA HELPERS
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

function kindLower(d: any): string {
  return String(d?.kind || d?.type || d?.docKind || "").toLowerCase();
}

function flattenedPath(d: any): string {
  return String(d?._raw?.flattenedPath || "").toLowerCase();
}

function computedSlug(d: any): string {
  return String(d?.slugComputed || d?.slug || d?._raw?.flattenedPath || "");
}

function pickBooleanFlag(d: any): boolean {
  return Boolean(
    d?.featured === true ||
      d?.isFeatured === true ||
      d?.home === true ||
      d?.showOnHome === true ||
      d?.homepage === true,
  );
}

function publicationToItem(item: PublicationRecord): PublicationItem {
  const editorialHref = `/editorials/${encodeURIComponent(item.slug)}`;
  const previewHref = item.previewEnabled
    ? item.previewPath || `/api/editorials/preview/${encodeURIComponent(item.slug)}`
    : null;
  const pdfHref = item.pdfPath && item.pdfPath.trim() ? item.pdfPath.trim() : null;
  const epubHref =
    item.epubEnabled && item.epubPath && item.epubPath.trim() ? item.epubPath.trim() : null;

  return {
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle || null,
    description: item.description || null,
    author: item.author,
    date: item.date || null,
    tier: item.tier,
    category: item.category || null,
    readingTime: item.readingTime || null,
    documentId: item.contentId || null,
    href: editorialHref,
    pdfHref,
    previewHref,
    epubHref,
    citationHref: `/api/editorials/citation/${encodeURIComponent(item.slug)}`,
  };
}

function toItem(d: any): FeaturedItem | null {
  const k = kindLower(d);
  const fp = flattenedPath(d);

  const isShort = k === "short" || fp.startsWith("shorts/");
  const isBrief = k === "brief" || fp.startsWith("briefs/") || fp.startsWith("vault/briefs/");
  const isPost = k === "post" || fp.startsWith("blog/") || fp.startsWith("posts/");

  const collection = isShort ? "shorts" : isBrief ? "vault/briefs" : isPost ? "blog" : null;
  if (!collection) return null;

  const rawSlug = computedSlug(d);
  const bare = normalizeSlug(String(rawSlug))
    .replace(/^shorts\//, "")
    .replace(/^briefs\//, "")
    .replace(/^vault\/briefs\//, "")
    .replace(/^blog\//, "")
    .replace(/^posts\//, "");

  const href = collection === "vault/briefs" ? `/vault/briefs/${bare}` : joinHref(collection, bare);

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
    data?.allBooks,
    data?.allPlaybooks,
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
  c: { canon: number; briefs: number; shorts: number; downloads: number },
  n: number,
): boolean {
  return c.canon + c.briefs + c.shorts + c.downloads === 0 || n < 5;
}

function readPlaybooksFromGenerated(gen: any): PlaybookItem[] {
  return (Array.isArray(gen?.allPlaybooks) ? gen.allPlaybooks : [])
    .filter((p: any) => !p?.draft)
    .map((p: any) => {
      const slug = safeString(p?.slug).replace(/^\/+|\/+$/g, "");
      return {
        slug,
        title: safeString(p?.title, "Untitled Playbook"),
        description: safeString(p?.description) || null,
        difficulty: safeString(p?.difficulty) || null,
        playbookType: safeString(p?.playbookType) || null,
        estimatedTime: safeString(p?.estimatedTime) || null,
        href: `/playbooks/${slug}`,
      };
    })
    .filter((p: PlaybookItem) => !!p.slug);
}

function parseFrontmatter(content: string): Record<string, any> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const result: Record<string, any> = {};
  let currentArrayKey: string | null = null;

  for (const rawLine of (match[1] ?? "").split("\n")) {
    const line = rawLine.replace(/\r/g, "");
    if (!line.trim()) continue;

    const arrayItemMatch = line.match(/^\s*-\s+(.*)$/);
    if (arrayItemMatch && currentArrayKey) {
      if (!Array.isArray(result[currentArrayKey])) result[currentArrayKey] = [];
      result[currentArrayKey].push((arrayItemMatch[1] ?? "").trim().replace(/^['"]|['"]$/g, ""));
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!keyMatch) {
      currentArrayKey = null;
      continue;
    }

    const key: string = keyMatch[1]!;
    const rawValue: string = keyMatch[2] ?? "";
    const value = rawValue.trim();

    if (!value) {
      currentArrayKey = key;
      if (!(key in result)) result[key] = [];
      continue;
    }

    currentArrayKey = null;

    if (value.startsWith("[") && value.endsWith("]")) {
      result[key] = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
      continue;
    }

    if (/^\d+$/.test(value)) {
      result[key] = Number(value);
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      result[key] = value.slice(1, -1);
      continue;
    }

    result[key] = value;
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATIC PROPS
// ─────────────────────────────────────────────────────────────────────────────

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  let featuredShorts: FeaturedItem[] = [];
  let featuredBriefing: FeaturedItem | null = null;
  let featuredPlaybooks: PlaybookItem[] = [];
  let featuredCanon: HomePageProps["featuredCanon"] = [];
  let featuredBlogPosts: BlogPostItem[] = [];
  let latestReport: QuarterlyReport | null = null;
  let artifactFileCount = 0;

  const catalogue = getPublicationCatalogue();
  const flagshipPublicationRecord =
    getPublicationBySlug("ultimate-purpose-of-man") || catalogue[0] || null;
  const flagshipPublication = flagshipPublicationRecord
    ? publicationToItem(flagshipPublicationRecord)
    : null;

  const featuredPublications: PublicationItem[] = catalogue
    .filter((i) => i.slug !== flagshipPublication?.slug)
    .slice(0, 3)
    .map(publicationToItem);

  const counts = {
    shorts: 0,
    canon: 0,
    briefs: 0,
    downloads: 0,
    library: 0,
    publications: catalogue.length,
    playbooks: 0,
  };

  try {
    const fs = await import("fs");
    const path = await import("path");
    const dir = path.join(process.cwd(), "content/artifacts");

    if (fs.existsSync(dir)) {
      const reports: QuarterlyReport[] = [];
      const mdxFiles = fs.readdirSync(dir).filter((f: string) => f.endsWith(".mdx") && !f.includes(".backup"));
      artifactFileCount = mdxFiles.length;

      for (const file of mdxFiles) {
        const fm = parseFrontmatter(fs.readFileSync(path.join(dir, file), "utf-8"));
        if (fm.type === "quarterly_report" || file.includes("global-market-intelligence")) {
          let q = fm.quarter || "Q1";
          let y = fm.year || 2026;

          if (!fm.quarter) {
            if (file.includes("q1")) q = "Q1";
            if (file.includes("q2")) q = "Q2";
            if (file.includes("q3")) q = "Q3";
            if (file.includes("q4")) q = "Q4";
          }

          if (!fm.year && file.includes("2026")) y = 2026;

          reports.push({
            id: file.replace(".mdx", ""),
            slug: file.replace(".mdx", ""),
            title: fm.title || "Global Market Intelligence Report",
            description: fm.description || "Executive analysis of market conditions.",
            publishedAt: fm.date || new Date().toISOString(),
            quarter: q,
            year: y,
            readingTime: fm.readingTime || 25,
            pdfUrl: fm.pdfUrl || null,
            keyFindings: fm.keyFindings || [],
          });
        }
      }

      const qo: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
      reports.sort((a, b) =>
        a.year !== b.year ? b.year - a.year : (qo[b.quarter] || 0) - (qo[a.quarter] || 0),
      );
      latestReport = reports[0] || null;
    }
  } catch {
    latestReport = null;
  }

  const computeFromDocs = (docsIn: any[], dataForBooks?: any, dataForPlaybooks?: any) => {
    const stableDocs = (docsIn || []).filter((d) => !isDraftLocal(d));

    // Collect shorts docs for featured selection (counts are set authoritatively above).
    const shortsDocs: any[] = [];
    for (const d of stableDocs) {
      const k = kindLower(d);
      const fp = flattenedPath(d);
      if (k === "short" || fp.startsWith("shorts/")) shortsDocs.push(d);
    }

    const allPlaybooks = readPlaybooksFromGenerated(dataForPlaybooks);
    featuredPlaybooks = allPlaybooks.slice(0, 3);

    // Build featured-href index once, then look up — O(n) instead of O(n²).
    const featuredHrefs = new Set<string>();
    for (const d of stableDocs) {
      if (pickBooleanFlag(d)) {
        const item = toItem(d);
        if (item?.href) featuredHrefs.add(item.href);
      }
    }

    const candidates = stableDocs.map(toItem).filter(Boolean) as FeaturedItem[];
    const featured = candidates.filter((x) => featuredHrefs.has(x.href));

    featuredBriefing =
      featured.find((x) => x.kind === "brief") ||
      featured.find((x) => x.kind === "short") ||
      null;

    const fs2 = featured
      .filter((x) => x.kind === "short")
      .sort((a, b) => Date.parse(b.dateISO || "") - Date.parse(a.dateISO || ""))
      .slice(0, 8);

    featuredShorts =
      fs2.length > 0
        ? fs2
        : ((shortsDocs
            .sort((a: any, b: any) => (Date.parse(b?.date || "") || 0) - (Date.parse(a?.date || "") || 0))
            .slice(0, 8)
            .map(toItem)
            .filter(Boolean) as FeaturedItem[]));

    // Extract featured canon from already-loaded docs (no separate getAllCanons() call).
    featuredCanon = stableDocs
      .filter((c: any) => {
        const k = kindLower(c);
        const fp = flattenedPath(c);
        return (k === "canon" || fp.startsWith("canon/")) && c?.accessLevel !== "restricted";
      })
      .slice(0, 3)
      .map((c: any) => ({
        title: String(c?.title || ""),
        excerpt: (c?.excerpt || c?.description || null) as string | null,
        slug: String(c?.slug || ""),
        href: `/canon/${String(c?.slug || "").replace(/^\/?(canon\/)?/, "")}`,
        category: (c?.category || null) as string | null,
        readTime: (c?.readTime || null) as string | null,
      }));

    // Extract featured blog posts from already-loaded docs (no raw fs scan).
    featuredBlogPosts = stableDocs
      .filter((p: any) => {
        const k = kindLower(p);
        const fp = flattenedPath(p);
        return (k === "post" || fp.startsWith("blog/") || fp.startsWith("posts/")) &&
          !String(p?.slug || "").includes("ultimate-purpose-of-man");
      })
      .sort((a: any, b: any) => (Date.parse(b?.date || "") || 0) - (Date.parse(a?.date || "") || 0))
      .slice(0, 3)
      .map((p: any) => {
        const slug = String(p?.slug || p?._raw?.flattenedPath || "")
          .replace(/^(blog|posts)\//, "");
        return {
          slug,
          title: String(p?.title || "Untitled"),
          href: `/blog/${slug}`,
          excerpt: (p?.excerpt || p?.description || null) as string | null,
          dateISO: p?.date ? String(p.date) : null,
        };
      });
  };

  try {
    const mod: any = await import("@/lib/content/server");

    // ── Authoritative counts from SSOT getters ──────────────────────────
    const isLive = mod?.isPublished || ((d: any) => d?.draft !== true && d?.published !== false);
    const countLive = (fn: (() => any[]) | undefined) => {
      try { return (fn?.() || []).filter(isLive).length; } catch { return 0; }
    };

    counts.shorts   = countLive(mod?.getAllShorts);
    counts.canon    = countLive(mod?.getAllCanons);
    counts.briefs   = countLive(mod?.getAllBriefs);
    counts.downloads = countLive(mod?.getAllDownloads);
    counts.playbooks = countLive(mod?.getAllPlaybooks);

    // Additional authoritative totals for display categories
    const bookCount     = countLive(mod?.getAllBooks);
    const lexiconCount  = countLive(mod?.getAllLexicons);
    const resourceCount = countLive(mod?.getAllResources);
    const postCount     = countLive(mod?.getAllPosts);
    const printCount    = countLive(mod?.getAllPrints);

    // Library = Canon + Books + Lexicon + Resources + artifacts
    counts.library = counts.canon + bookCount + lexiconCount + resourceCount + artifactFileCount;

    // Publications = Posts + editorial catalogue
    counts.publications = postCount + catalogue.length;

    // Products = Downloads + Briefs + Prints
    // (counts.downloads and counts.briefs already set above)
    counts.downloads = counts.downloads + printCount;

    // ── Featured items (uses full doc corpus) ───────────────────────────
    const getContentlayerData = mod?.getContentlayerData;
    if (typeof getContentlayerData === "function") {
      const data = getContentlayerData();
      const docs = collectAnyDocs(data);
      if (docs.length > 0) {
        computeFromDocs(docs, data, data);
      }
    }
  } catch {
    // Content/server path failed; counts stay at initialized defaults.
    counts.library = artifactFileCount;
  }

  // featuredCanon and featuredBlogPosts are now computed inside
  // computeFromDocs() from the already-loaded contentlayer corpus,
  // eliminating two separate filesystem scans + getAllCanons() call.

  return {
    props: sanitizeData({
      featuredShorts,
      featuredBriefing,
      flagshipPublication,
      featuredPublications,
      featuredPlaybooks,
      featuredCanon,
      featuredBlogPosts,
      counts,
      latestReport,
    }),
    revalidate: 3600,
  };


};

export default HomePage;
