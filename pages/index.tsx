/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/index.tsx — HOMEPAGE
// Institutional Monumentalism — governed, editorial, severe where needed.
// The page is a threshold, not a pitch deck.

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
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
  ShieldCheck,
  TrendingUp,
  Workflow,
} from "lucide-react";

import Layout from "@/components/Layout";
import ShortsSignalRail from "@/components/shorts/ShortsSignalRail";
import DoctrineShowcase from "@/components/homepage/DoctrineShowcase";
import EngagementLanes from "@/components/homepage/EngagementLanes";
import WhoIWorkWith from "@/components/WhoIWorkWith";
import VaultTeaserRail from "@/components/homepage/VaultTeaserRail";
import ContentShowcase from "@/components/homepage/ContentShowcase";
import VenturesSection from "@/components/homepage/VenturesSection";
import ExecutiveBuyerFitSection from "@/components/diagnostics/ExecutiveBuyerFitSection";
import StrategyRoomIntegration from "@/components/consulting/StrategyRoomIntegration";
import { OperatorBriefing } from "@/components/homepage";

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
        backgroundColor: variant === "void" ? "var(--ds-background)" : "var(--ds-background-muted)",
        color: "var(--ds-text)"
      }}
    >
      {id ? <Anchor id={id} /> : null}

      {variant === "surface" && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "var(--ds-hero-wash)",
          }}
        />
      )}

      <div className="pointer-events-none absolute inset-0 opacity-[0.030]" style={GRAIN_STYLE} />
      <div className="pointer-events-none absolute inset-x-0 top-0">
        <GoldRule soft />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <GoldRule soft />
      </div>

      <div
        className={cn(
          "relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12",
          compact ? "py-16 lg:py-24" : "py-20 lg:py-28",
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
  return (
    <Section id="hero" variant="surface" cap="front door · orientation · progression">
      <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <Eyebrow>Strategic Diagnostic Platform</Eyebrow>
          <h1
            className="mt-6 font-['Cormorant_Garamond',Georgia,serif] font-light leading-[0.9] tracking-[-0.04em] ds-text"
            style={{ fontSize: "clamp(3.1rem, 8vw, 6.3rem)" }}
          >
            Resolve structural problems
            <br />
            <span className="ds-text-muted">before they become expensive drift.</span>
          </h1>

          <p className="mt-8 max-w-3xl text-[16px] leading-[1.9] ds-text-muted">
            Abraham of London is a governed operating system for diagnosis, strategic
            clarity, and intervention. It helps founders, executives, and organizations
            under pressure identify what is actually wrong, clarify what must happen next,
            and escalate only when the situation justifies it.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/diagnostics/constitutional-diagnostic"
              className="group inline-flex items-center justify-center gap-3 border px-7 py-4 transition"
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
              Start the Diagnostic
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/strategy-room"
              className="group inline-flex items-center justify-center gap-3 border px-7 py-4 transition"
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
              Enter Strategy Room
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>

            <Link
              href={intelligenceHref}
              className="group inline-flex items-center justify-center gap-3 border px-7 py-4 transition"
              style={{
                borderColor: "var(--ds-border)",
                color: "var(--ds-text-subtle)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "9px",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
              }}
            >
              Browse Intelligence
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <Panel surface="lift">
          <div className="p-6 md:p-7">
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.40em",
                textTransform: "uppercase",
                color: "var(--ds-text-subtle)",
              }}
            >
              Start Here
            </div>
            <div className="mt-4 space-y-4">
              {[
                "Use Diagnostics when you need signal, not speculation.",
                "Use Executive Reporting when the issue is serious enough to justify paid interpretation.",
                "Use Strategy Room when a real decision with real consequence is already on the table.",
              ].map((item) => (
                <div key={item} className="flex gap-4 border-b pb-4 last:border-b-0 last:pb-0" style={{ borderColor: "var(--ds-border)" }}>
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--ds-accent)" }} />
                  <p className="text-[14px] leading-[1.75] ds-text-muted">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </Section>
  );
}

function WhatThisPlatformIs() {
  return (
    <Section id="what-this-is" variant="void" cap="system · what this platform is">
      <SectionHeader
        eyebrow="Operating Model"
        title={
          <>
            Not a blog. Not a generic consultancy.
            <br />
            <span className="text-white/35">A progressive system for diagnosis, clarity, and intervention.</span>
          </>
        }
        description="This platform is a structured operating system for diagnosis, strategic clarity, and intervention. It is designed to move a serious user through a governed sequence: diagnose the problem, clarify the reality, escalate deliberately, and intervene only when the situation warrants it."
        large
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-4">
        {[
          ["Diagnose", "Surface what is actually wrong before advice, action, or narrative distortion takes over."],
          ["Clarify", "Translate pressure, drift, and conflicting signals into a decision-grade reading."],
          ["Escalate", "Move only when the stakes, authority, and urgency justify a higher-order container."],
          ["Intervene", "Use Strategy Room or advisory only when structured products are no longer sufficient."],
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
    </Section>
  );
}

function HowItWorksLadder() {
  const stages = [
    {
      label: "Stage 1: Diagnostic",
      href: "/diagnostics/constitutional-diagnostic",
      effort: "6-10 minutes",
      explanation: "The constitutional entry point for identifying seriousness, pressure, and route fit.",
      outcome: "A first reading of whether the problem should stay diagnostic or move upward.",
    },
    {
      label: "Stage 2: Team / Enterprise Assessment",
      href: "/diagnostics",
      effort: "10-25 minutes",
      explanation: "Structured assessment layers for teams and organizations dealing with execution, alignment, or institutional friction.",
      outcome: "Sharper visibility into drift, misalignment, and system-level breakdowns.",
    },
    {
      label: "Stage 3: Executive Reporting",
      href: "/diagnostics/executive-reporting",
      effort: "Paid analysis",
      explanation: "A board-grade interpretation layer for decision-makers who need disciplined reading before intervention. This is the first paid engagement in the ladder.",
      outcome: "Decision-grade clarity, implications, and governed next-step logic.",
    },
    {
      label: "Stage 4: Strategy Room",
      href: "/strategy-room",
      effort: "Qualified escalation",
      explanation: "The private chamber for situations where a real decision with real consequence must be forced under constraint.",
      outcome: "Decision architecture, trade-offs, owners, and execution cadence.",
    },
  ];

  return (
    <Section id="how-it-works" variant="surface" cap="journey · how the system works">
      <SectionHeader
        eyebrow="The Ladder"
        title={
          <>
            A structured path,
            <br />
            <span className="text-white/35">not a pile of pages.</span>
          </>
        }
        description="The system is designed as a deliberate escalation ladder. Strategy Room is not the first step for everyone. The route is earned by signal, seriousness, and authority."
        large
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        {stages.map((stage, index) => (
          <Panel key={stage.label} surface="lift" gold={index === 0 || index === 2}>
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
              <p className="mt-4 text-[13px] leading-[1.75] ds-text-subtle">
                <span className="ds-text">Expected outcome:</span> {stage.outcome}
              </p>
              <div className="mt-5">
                <Link href={stage.href} className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] ds-text-muted transition">
                  Open stage <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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
    <Section id="who-this-is-for" variant="void" cap="fit · who this is for">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
        <div>
          <SectionHeader
            eyebrow="Audience"
            title={
              <>
                Built for serious operators,
                <br />
                <span className="text-white/35">not casual browsers.</span>
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
              Who This Is Not For
            </div>
            <p className="mt-4 text-[14px] leading-[1.8] ds-text-muted">
              It is not for people looking for inspiration without accountability,
              generic productivity advice, low-stakes thought leadership, or access
              to premium aesthetics without a real decision context.
            </p>
          </div>
        </Panel>
      </div>
    </Section>
  );
}

function ContentWithContext({
  featuredBlogPosts,
  featuredShorts,
  featuredPlaybooks,
  latestReport,
}: Pick<HomePageProps, "featuredBlogPosts" | "featuredShorts" | "featuredPlaybooks" | "latestReport">) {
  const intelligenceHref = "/artifacts";

  return (
    <Section id="content" variant="surface" cap="content · context · authority">
      <SectionHeader
        eyebrow="Content With Context"
        title={
          <>
            Depth, with orientation.
            <br />
            <span className="text-white/35">Every surface has a job.</span>
          </>
        }
        description="The content layer exists to build judgment, not just atmosphere. If a first-time user lands here, they should know what each category is for and where it leads."
        large
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        {[
          ["Intelligence", "Deeper analysis for operators facing structural decisions, strategic pressure, or institutional consequence.", intelligenceHref],
          ["Essays", "Long-form thinking on institutions, drift, leadership, execution, and the real structure beneath visible problems.", "/blog"],
          ["Shorts", "Concise signal for fast orientation, daily strategic clarity, and quick entry into the deeper body of work.", "/shorts"],
          ["Frameworks", "Practical operating models, playbooks, and structured tools that turn thinking into governed action.", "/playbooks"],
          ["Canon", "Foundational doctrine and core frameworks. The deeper intellectual spine behind the system.", "/canon"],
          ["Vault", "Restricted archive and deployable assets for members and serious operators who need reusable tools and briefings.", "/vault"],
        ].map(([title, body, href]) => (
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
              <div className="mt-5">
                <Link href={href} className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] ds-text-muted transition">
                  Explore <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {latestReport && (
          <Panel surface="lift">
            <div className="p-6">
              <div className="text-[11px] uppercase tracking-[0.2em] ds-text-subtle">Latest Intelligence</div>
              <div className="mt-3 text-[1.4rem] font-['Cormorant_Garamond',Georgia,serif] leading-[1.15] ds-text">
                {latestReport.title}
              </div>
              <p className="mt-3 text-[14px] leading-[1.8] ds-text-muted">{latestReport.description}</p>
            </div>
          </Panel>
        )}

        {featuredBlogPosts[0] && (
          <Panel surface="lift">
            <div className="p-6">
              <div className="text-[11px] uppercase tracking-[0.2em] ds-text-subtle">Featured Essay</div>
              <div className="mt-3 text-[1.35rem] font-['Cormorant_Garamond',Georgia,serif] leading-[1.15] ds-text">
                {featuredBlogPosts[0].title}
              </div>
              <p className="mt-3 text-[14px] leading-[1.8] ds-text-muted">{featuredBlogPosts[0].excerpt || "Long-form thinking designed to reframe the problem correctly."}</p>
            </div>
          </Panel>
        )}

        {(featuredShorts[0] || featuredPlaybooks[0]) && (
          <Panel surface="lift">
            <div className="p-6">
              <div className="text-[11px] uppercase tracking-[0.2em] ds-text-subtle">Active Surface</div>
              <div className="mt-3 text-[1.35rem] font-['Cormorant_Garamond',Georgia,serif] leading-[1.15] ds-text">
                {featuredPlaybooks[0]?.title || featuredShorts[0]?.title || "Operational Frameworks"}
              </div>
              <p className="mt-3 text-[14px] leading-[1.8] ds-text-muted">
                {featuredPlaybooks[0]?.description || featuredShorts[0]?.excerpt || "Practical signal designed for operators who need usable structure, not just ideas."}
              </p>
            </div>
          </Panel>
        )}
      </div>
    </Section>
  );
}

function ShortsRailSection() {
  return (
    <Section id="shorts-signal" variant="void" cap="shorts · signal layer">
      <SectionHeader
        eyebrow="Shorts Signal Rail"
        title={
          <>
            Recognition before deeper reading.
            <br />
            <span className="text-white/35">Short-form signal for the right next move.</span>
          </>
        }
        description="These are not a feed. They are a curated signal layer designed to move the right person from recognition into diagnosis, deeper intelligence, or strategic escalation."
        large
      />
      <div className="mt-12">
        <ShortsSignalRail
          items={HOMEPAGE_SHORT_SIGNALS}
          title="Signal Before Noise"
          subtitle="A controlled rail of high-fit Shorts. Recognition first, then the correct route."
        />
      </div>
    </Section>
  );
}

function AuthoritySignal({ counts }: { counts: HomePageProps["counts"] }) {
  return (
    <Section id="authority-signal" variant="void" cap="proof · authority signal">
      <SectionHeader
        eyebrow="Authority Signal"
        title={
          <>
            Seriousness without theatre.
            <br />
            <span className="text-white/35">What this platform helps surface.</span>
          </>
        }
        description="The platform is designed to surface structural problems that usually remain hidden under noise, sentiment, or internal politics."
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <Panel surface="lift">
          <div className="grid grid-cols-2 gap-4 p-6">
            {[
              { label: "Diagnostics", value: "4-stage path" },
              { label: "Canon", value: String(counts.canon || 0) },
              { label: "Shorts", value: String(counts.shorts || 0) },
              { label: "Library", value: String(counts.library || 0) },
            ].map((item) => (
              <div key={item.label} className="border p-4" style={{ borderColor: "var(--ds-border)" }}>
                <div className="text-[10px] uppercase tracking-[0.2em] ds-text-subtle">{item.label}</div>
                <div className="mt-2 text-[1.6rem] font-['Cormorant_Garamond',Georgia,serif] ds-text">{item.value}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel surface="lift">
          <div className="p-6">
            <div className="text-[11px] uppercase tracking-[0.2em] ds-text-subtle">The Platform Helps Surface</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                "Institutional drift hidden behind busy execution.",
                "Decision ambiguity disguised as complexity.",
                "Authority gaps that make strategy impossible to execute.",
                "Misalignment between what leaders think and what the system can carry.",
              ].map((item) => (
                <div key={item} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--ds-accent)" }} />
                  <p className="text-[14px] leading-[1.8] ds-text-muted">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </Section>
  );
}

function HomeFinalCta({ intelligenceHref }: { intelligenceHref: string }) {
  return (
    <Section id="final-cta" variant="surface" cap="exit · next move">
      <Panel surface="lift" gold>
        <div className="p-8 md:p-12">
          <div className="mx-auto max-w-4xl text-center">
            <Eyebrow align="center">Next Move</Eyebrow>
            <h2 className="mt-5 font-['Cormorant_Garamond',Georgia,serif] text-4xl font-light leading-[0.95] tracking-[-0.03em] ds-text">
              Do not leave without a route.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-[1.9] ds-text-muted">
              Start with the Diagnostic if you need signal. Browse Intelligence if you need context.
              Enter Strategy Room only when a real decision with real consequence is already on the table.
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
                Start the Diagnostic
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
                Browse Intelligence
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
                Enter Strategy Room
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

      <HomeHero intelligenceHref={intelligenceHref} />

      <Bridge text="orientation · system" />
      <WhatThisPlatformIs />

      <Bridge text="system · ladder" />
      <HowItWorksLadder />

      <Bridge text="ladder · shorts" />
      <ShortsRailSection />

      <Bridge text="shorts · content" />
      <ContentWithContext
        featuredBlogPosts={featuredBlogPosts}
        featuredShorts={featuredShorts}
        featuredPlaybooks={featuredPlaybooks}
        latestReport={latestReport}
      />

      <Bridge text="content · audience" />
      <WhoThisIsFor />

      <Bridge text="audience · proof" />
      <AuthoritySignal counts={counts} />

      <Bridge text="proof · exit" />
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
