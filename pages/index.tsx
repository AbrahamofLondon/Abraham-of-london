/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/index.tsx — HOMEPAGE (Institutional, Route-Disciplined, Two Flagships Surfaced)

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ShieldCheck,
  Layers,
  Sparkles,
  ChevronRight,
  Compass,
  AlertTriangle,
  BookOpen,
  ScrollText,
  LibraryBig,
  Activity,
  ScanSearch,
  Crown,
  Scale,
  Briefcase,
  FileText,
  Eye,
  Archive,
  Workflow,
  Download,
} from "lucide-react";

import Layout from "@/components/Layout";
import CinematicHero from "@/components/homepage/CinematicHero";
import EngagementLanes from "@/components/homepage/EngagementLanes";
import WhoIWorkWith from "@/components/WhoIWorkWith";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";
import VaultTeaserRail from "@/components/homepage/VaultTeaserRail";
import EventsSection from "@/components/homepage/EventsSection";
import ContentShowcase from "@/components/homepage/ContentShowcase";
import VenturesSection from "@/components/homepage/VenturesSection";
import InstitutionalClose from "@/components/homepage/InstitutionalClose";
import ExecutiveReportingFlagship from "@/components/homepage/ExecutiveReportingFlagship";
import ExecutiveBuyerFitSection from "@/components/diagnostics/ExecutiveBuyerFitSection";
import StrategyRoomIntegration from "@/components/consulting/StrategyRoomIntegration";
import {
  CanonInstitutionalIntro,
  OperatorBriefing,
} from "@/components/homepage";
import type { CanonPrelude } from "@/components/homepage/CanonInstitutionalIntro";

import { joinHref, normalizeSlug } from "@/lib/content/shared";
import { sanitizeData } from "@/lib/content/server";
import {
  getPublicationCatalogue,
  getPublicationBySlug,
} from "@/lib/editorial/catalogue";
import type { PublicationRecord } from "@/lib/editorial/types";
import type { PublicationItem } from "@/lib/editorial/server-readers";

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */
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

type PlaybookItem = {
  slug: string;
  title: string;
  description?: string | null;
  difficulty?: string | null;
  playbookType?: string | null;
  estimatedTime?: string | null;
  href: string;
};

type FeaturedRoute = {
  title: string;
  href: string;
  description: string;
  eyebrow: string;
  icon: React.ReactNode;
};

type HomePageProps = {
  featuredShorts: FeaturedItem[];
  featuredBriefing: FeaturedItem | null;
  flagshipPublication: PublicationItem | null;
  featuredPublications: PublicationItem[];
  featuredPlaybooks: PlaybookItem[];
  events: EventItem[];
  canonPrelude: CanonPrelude;
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

/* -----------------------------------------------------------------------------
  VERIFIED DESTINATIONS
----------------------------------------------------------------------------- */
const FEATURED_DESTINATIONS: FeaturedRoute[] = [
  {
    title: "Canon",
    href: "/canon",
    description:
      "Doctrine, purpose, governance, civilisation, and the long-form spine of the platform.",
    eyebrow: "Doctrine",
    icon: <Compass className="h-4 w-4" />,
  },
  {
    title: "Editorials",
    href: "/editorials",
    description:
      "Flagship essays, formal publications, citations, previews, and institutional written property.",
    eyebrow: "Publications",
    icon: <ScrollText className="h-4 w-4" />,
  },
  {
    title: "Playbooks",
    href: "/playbooks",
    description:
      "Execution-grade frameworks for leaders, operators, and institutions under pressure.",
    eyebrow: "Execution",
    icon: <Workflow className="h-4 w-4" />,
  },
  {
    title: "Resources",
    href: "/resources",
    description: "Structured tools, frameworks, and reference assets.",
    eyebrow: "Frameworks",
    icon: <LibraryBig className="h-4 w-4" />,
  },
  {
    title: "Vault Briefs",
    href: "/vault/briefs",
    description:
      "Operator-grade briefings, dossiers, and premium intelligence.",
    eyebrow: "Intelligence",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: "Consulting",
    href: "/consulting",
    description:
      "Private advisory, diagnostics, board-grade problem solving, and decision architecture.",
    eyebrow: "Advisory",
    icon: <Briefcase className="h-4 w-4" />,
  },
];

/* -----------------------------------------------------------------------------
  DESIGN SYSTEM COMPONENTS
----------------------------------------------------------------------------- */
const Hairline = ({ soft = false }: { soft?: boolean }) => (
  <div
    className={[
      "h-px w-full",
      soft
        ? "bg-gradient-to-r from-transparent via-white/10 to-transparent"
        : "bg-gradient-to-r from-transparent via-amber-500/30 to-transparent",
    ].join(" ")}
  />
);

const AnchorOffset = ({ id }: { id: string }) => (
  <span id={id} className="block scroll-mt-28" aria-hidden />
);

function SectionCap({ label }: { label: string }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-5">
        <div className="flex-1">
          <Hairline soft />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-white/55">
          {label}
        </div>
        <div className="flex-1">
          <Hairline soft />
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  children,
  variant = "default",
  cap,
}: {
  id?: string;
  children: React.ReactNode;
  variant?: "default" | "surface";
  cap?: string;
}) {
  const bg =
    variant === "surface"
      ? "bg-[radial-gradient(ellipse_at_20%_8%,rgba(245,158,11,0.08)_0%,transparent_52%),radial-gradient(ellipse_at_80%_36%,rgba(255,255,255,0.05)_0%,transparent_58%)] bg-[#070707]"
      : "bg-[#070707]";

  return (
    <section id={id} className={["relative", bg].join(" ")}>
      <div className="absolute inset-x-0 top-0">
        <Hairline soft />
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <Hairline soft />
      </div>
      <div className="absolute inset-0 aol-grain opacity-[0.05]" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
        {cap ? <SectionCap label={cap} /> : null}
        {children}
      </div>
    </section>
  );
}

function HQHeader({
  eyebrow,
  title,
  description,
  align = "center",
  icon,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  icon?: React.ReactNode;
}) {
  const isCenter = align === "center";

  return (
    <div className={["max-w-4xl", isCenter ? "mx-auto text-center" : ""].join(" ")}>
      <div
        className={[
          "flex items-center gap-2",
          isCenter ? "justify-center" : "",
        ].join(" ")}
      >
        {icon ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.05] text-amber-300">
            {icon}
          </span>
        ) : null}
        <span className="text-[10px] font-mono uppercase tracking-[0.38em] text-amber-300/90">
          {eyebrow}
        </span>
      </div>

      <h2 className="mt-5 font-serif text-3xl leading-[1.05] text-white md:text-4xl lg:text-5xl">
        {title}
      </h2>

      {description ? (
        <p className="mt-4 text-base leading-relaxed text-white/75 md:text-lg">
          {description}
        </p>
      ) : null}

      <div className="mt-8">
        <Hairline />
      </div>
    </div>
  );
}

function ExecutiveRail({
  items,
  align = "center",
}: {
  items: Array<{ href: string; label: string; icon?: React.ReactNode }>;
  align?: "left" | "center";
}) {
  const isCenter = align === "center";

  return (
    <div className={["mt-8", isCenter ? "flex justify-center" : ""].join(" ")}>
      <div className="inline-flex flex-wrap items-center gap-3 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 backdrop-blur-md">
        {items.map((it) => (
          <Link
            key={`${it.href}-${it.label}`}
            href={it.href}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.28em] text-white/75 transition hover:bg-black/45 hover:text-white"
          >
            {it.icon ? <span className="text-amber-300">{it.icon}</span> : null}
            {it.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[30px] border border-white/12 bg-white/[0.04]",
        "shadow-[0_35px_95px_-60px_rgba(0,0,0,0.95)]",
        className,
      ].join(" ")}
    >
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/40 backdrop-blur-md">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03),transparent_55%)]" />
        {children}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
}

function Bridge({ text }: { text: string }) {
  return (
    <div className="bg-[#070707]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <Hairline soft />
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-white/55">
            {text}
          </div>
          <div className="flex-1">
            <Hairline soft />
          </div>
        </div>
      </div>
    </div>
  );
}

function PublicationCard({ item }: { item: PublicationItem }) {
  return (
    <Panel>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-300/85">
            {item.category || "Editorial"}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/45">
            {item.tier}
          </div>
        </div>

        <h3 className="mt-5 font-serif text-2xl leading-tight text-white">
          {item.title}
        </h3>

        {item.subtitle ? (
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            {item.subtitle}
          </p>
        ) : null}

        {item.description ? (
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            {item.description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
          {item.readingTime ? <span>{item.readingTime}</span> : null}
          {item.date ? <span>{item.date}</span> : null}
          {item.documentId ? <span>{item.documentId}</span> : null}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={item.href}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-white/85 hover:bg-white/[0.08]"
          >
            Open Page <ChevronRight className="h-4 w-4" />
          </Link>

          {item.pdfHref ? (
            <a
              href={item.pdfHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300 hover:bg-amber-500/18"
            >
              Open PDF <ArrowRight className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

function PlaybookCard({ item }: { item: PlaybookItem }) {
  return (
    <Panel>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-300/85">
            {item.playbookType || "Playbook"}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/45">
            {item.difficulty || "Advanced"}
          </div>
        </div>

        <h3 className="mt-5 font-serif text-2xl leading-tight text-white">
          {item.title}
        </h3>

        {item.description ? (
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            {item.description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
          {item.estimatedTime ? <span>{item.estimatedTime}</span> : null}
          <span>Execution Asset</span>
        </div>

        <div className="mt-7">
          <Link
            href={item.href}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-white/85 hover:bg-white/[0.08]"
          >
            Open Playbook <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Panel>
  );
}

function RouteCard({ item }: { item: FeaturedRoute }) {
  return (
    <Panel>
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 text-amber-300/85">
          {item.icon}
          <div className="text-[10px] font-mono uppercase tracking-[0.34em]">
            {item.eyebrow}
          </div>
        </div>

        <h3 className="mt-5 font-serif text-2xl text-white">{item.title}</h3>
        <p className="mt-4 text-sm leading-relaxed text-white/70">
          {item.description}
        </p>

        <div className="mt-7">
          <Link
            href={item.href}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-white/85 hover:bg-white/[0.08]"
          >
            Enter <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Panel>
  );
}

function OperatingStat({
  label,
  value,
  body,
  icon,
}: {
  label: string;
  value: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <Panel>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.30em] text-white/38">
            {label}
          </div>
          <div className="text-amber-300/80">{icon}</div>
        </div>
        <div className="mt-6 font-serif text-5xl leading-none text-white">
          {value}
        </div>
        <p className="mt-5 text-base leading-relaxed text-white/68">{body}</p>
      </div>
    </Panel>
  );
}

function FlagshipProductCard() {
  return (
    <Panel>
      <div className="p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-300/85">
              Flagship Product
            </div>
            <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.24em] text-white/45">
              Executive Reporting · Diagnostics Bridge
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-white/50">
            Premium Interpretation Layer
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h3 className="font-serif text-3xl leading-[1.02] text-white md:text-4xl">
              Executive Reporting
            </h3>

            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/60">
              The premium bridge between raw diagnostic signal and private
              mandate work.
            </p>

            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/72 md:text-[15px]">
              Built for founders, boards, leadership teams, and institutions
              that need disciplined interpretation before escalation. This is
              where signal becomes structured judgement.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
              <span>Diagnostic-grade</span>
              <span>Board-facing</span>
              <span>Strategy-ready</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/diagnostics/executive-reporting"
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-6 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300 transition hover:bg-amber-500/18"
              >
                Open Flagship Product
                <ChevronRight className="h-4 w-4" />
              </Link>

              <Link
                href="/diagnostics"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-white/85 transition hover:bg-white/[0.08]"
              >
                Enter Diagnostics
                <ScanSearch className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/30 p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.30em] text-white/45">
              Product Logic
            </div>

            <div className="mt-5 space-y-3">
              {[
                "Structured interpretation before intervention",
                "Bridges free signal and private mandate",
                "Filters weak cases before advisory escalation",
                "Produces decision-facing outputs, not generic feedback",
              ].map((line) => (
                <div
                  key={line}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/78"
                >
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <span>{line}</span>
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs leading-relaxed text-white/45">
              This is the first commercial layer that feels like a serious
              institutional product rather than a glorified form result.
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function FlagshipPublicationCard({ item }: { item: PublicationItem }) {
  return (
    <Panel>
      <div className="p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-300/85">
              Flagship Editorial
            </div>
            <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.24em] text-white/45">
              {item.category || "Editorial"} · {item.tier}
            </div>
          </div>

          {item.documentId ? (
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-white/50">
              {item.documentId}
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <h3 className="font-serif text-3xl leading-[1.02] text-white md:text-4xl">
              {item.title}
            </h3>

            {item.subtitle ? (
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/60">
                {item.subtitle}
              </p>
            ) : null}

            {item.description ? (
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/72 md:text-[15px]">
                {item.description}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
              {item.readingTime ? <span>{item.readingTime}</span> : null}
              {item.date ? <span>{item.date}</span> : null}
              <span>Abraham of London</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={item.href}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-6 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300 transition hover:bg-amber-500/18"
              >
                Read Editorial
                <ChevronRight className="h-4 w-4" />
              </Link>

              {item.previewHref ? (
                <a
                  href={item.previewHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-white/85 transition hover:bg-white/[0.08]"
                >
                  Preview
                  <Eye className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/30 p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.30em] text-white/45">
              Publication Assets
            </div>

            <div className="mt-5 space-y-3">
              {item.pdfHref ? (
                <a
                  href={item.pdfHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white transition hover:bg-white/[0.07]"
                >
                  <span className="inline-flex items-center gap-3">
                    <Download className="h-4 w-4 text-amber-300" />
                    Premium PDF Edition
                  </span>
                  <ArrowRight className="h-4 w-4 text-white/45" />
                </a>
              ) : null}

              {item.epubHref ? (
                <a
                  href={item.epubHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white transition hover:bg-white/[0.07]"
                >
                  <span className="inline-flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-amber-300" />
                    EPUB Edition
                  </span>
                  <ArrowRight className="h-4 w-4 text-white/45" />
                </a>
              ) : null}

              <a
                href={item.citationHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white transition hover:bg-white/[0.07]"
              >
                <span className="inline-flex items-center gap-3">
                  <FileText className="h-4 w-4 text-amber-300" />
                  Citation Record
                </span>
                <ArrowRight className="h-4 w-4 text-white/45" />
              </a>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-white/45">
              Clean page first. Verified assets second. No raw dump, no dead-end
              file theatre.
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function InlineFail({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-300" />
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-300/90">
            Module status
          </div>
          <div className="mt-2 font-serif text-xl text-white">{label}</div>
          {hint ? <div className="mt-2 text-sm text-white/70">{hint}</div> : null}
        </div>
      </div>
    </div>
  );
}

class ModuleBoundary extends React.Component<
  { label: string; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: any) {
    console.error(`[Homepage/${this.props.label}]`, err);
  }

  render() {
    if (this.state.hasError) {
      return <InlineFail label={`${this.props.label} crashed`} />;
    }
    return this.props.children;
  }
}

/* -----------------------------------------------------------------------------
  HOMEPAGE COMPONENT
----------------------------------------------------------------------------- */
const HomePage: NextPage<HomePageProps> = ({
  featuredShorts = [],
  featuredBriefing = null,
  flagshipPublication = null,
  featuredPublications = [],
  featuredPlaybooks = [],
  events = [],
  counts = {
    shorts: 0,
    canon: 0,
    briefs: 0,
    downloads: 0,
    library: 0,
    publications: 0,
    playbooks: 0,
  },
  canonPrelude,
}) => {
  const heroCounts = {
    shorts: counts.shorts,
    canon: counts.canon,
    briefs: counts.briefs,
    library: counts.library,
  };

  const actions = [
    {
      href: "/diagnostics",
      title: "Begin with Diagnostics",
      description:
        "Use the diagnostic ladder to establish signal, pressure, and fit before escalation.",
      tag: "Gateway",
    },
    {
      href: "/diagnostics/executive-reporting",
      title: "View Executive Reporting",
      description:
        "See the flagship bridge product that turns diagnostic signal into decision-grade interpretation.",
      tag: "Flagship",
    },
    {
      href: "/consulting/strategy-room",
      title: "Enter Strategy Room",
      description:
        "Private chamber for situations where consequence is already material and mandate-level intervention is justified.",
      tag: "Selective",
    },
  ];

  return (
    <Layout
      title="Abraham of London"
      description="Institutional doctrine, diagnostics, disciplined strategy, editorial canon, playbooks, and deployable assets for builders."
      canonicalUrl="/"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/assets/images/social/og-image.jpg" />
      </Head>

      <section className="relative z-0 isolate bg-black">
        <CinematicHero
          counts={heroCounts}
          onScroll={() =>
            document
              .getElementById("prelude")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        />
      </section>

      <ExecutiveReportingFlagship />

      <Section id="prelude" variant="surface" cap="Prelude — doctrinal gateway">
        <AnchorOffset id="prelude" />

        <HQHeader
          eyebrow="Prelude"
          title="The gateway to the whole system."
          description="Not a blog. Not a personality platform. Doctrine, diagnostics, strategy, playbooks, deployables, publications, and private mandate work arranged as one disciplined architecture."
          icon={<Layers className="h-4 w-4" />}
        />

        <ExecutiveRail
          items={[
            {
              href: "/canon",
              label: "Canon",
              icon: <Compass className="h-3.5 w-3.5" />,
            },
            {
              href: "/editorials",
              label: "Editorials",
              icon: <BookOpen className="h-3.5 w-3.5" />,
            },
            {
              href: "/playbooks",
              label: "Playbooks",
              icon: <Workflow className="h-3.5 w-3.5" />,
            },
            {
              href: "/vault/briefs",
              label: "Briefs",
              icon: <FileText className="h-3.5 w-3.5" />,
            },
            {
              href: "/diagnostics",
              label: "Diagnostics",
              icon: <ScanSearch className="h-3.5 w-3.5" />,
            },
            {
              href: "/consulting",
              label: "Advisory",
              icon: <Briefcase className="h-3.5 w-3.5" />,
            },
          ]}
        />

        <div className="mt-10">
          <Panel>
            <div className="p-6 md:p-10">
              <ModuleBoundary label="CanonIntro">
                <CanonInstitutionalIntro prelude={canonPrelude} />
              </ModuleBoundary>
            </div>
          </Panel>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-4">
          <OperatingStat
            label="Registry"
            value={String(counts.library)}
            body="Indexed assets, frameworks, texts, and strategic material across the platform."
            icon={<LibraryBig className="h-5 w-5" />}
          />
          <OperatingStat
            label="Editorial Spine"
            value={String(counts.publications)}
            body="Flagship publications and editorial property treated as institutional assets, not loose content."
            icon={<ScrollText className="h-5 w-5" />}
          />
          <OperatingStat
            label="Playbooks"
            value={String(counts.playbooks)}
            body="Execution-grade frameworks for operators who need more than inspiration."
            icon={<Workflow className="h-5 w-5" />}
          />
          <OperatingStat
            label="Deployables"
            value={String(counts.downloads)}
            body="Execution assets, templates, and controlled operating resources."
            icon={<Archive className="h-5 w-5" />}
          />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {FEATURED_DESTINATIONS.map((item) => (
            <RouteCard key={item.href} item={item} />
          ))}
        </div>

        <div className="mt-10">
          <Panel>
            <div className="p-6 md:p-10">
              <ModuleBoundary label="FunnelStrip">
                <StrategicFunnelStrip />
              </ModuleBoundary>
            </div>
          </Panel>
        </div>
      </Section>

      <Bridge text="From doctrine → to two flagships" />

      <Section
        id="flagships"
        variant="surface"
        cap="Flagships — product and editorial"
      >
        <AnchorOffset id="flagships" />

        <HQHeader
          eyebrow="Flagships"
          title="The front of the platform now carries its lead product and lead publication."
          description="One flagship product for interpretation and escalation. One flagship editorial for doctrine and argument in full."
          icon={<Crown className="h-4 w-4" />}
        />

        <div className="mt-10 space-y-8">
          <FlagshipProductCard />
          {flagshipPublication ? (
            <FlagshipPublicationCard item={flagshipPublication} />
          ) : null}
        </div>
      </Section>

      <Bridge text="From flagships → to credibility" />

      <Section id="proof" variant="surface" cap="Credibility — withstands scrutiny">
        <AnchorOffset id="proof" />

        <HQHeader
          eyebrow="Credibility"
          title="This system is designed to survive hostile scrutiny."
          description="If it cannot survive cross-examination, pressure, and consequence, it is not strategy. It is theatre."
          icon={<ShieldCheck className="h-4 w-4" />}
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Panel>
              <div className="p-6 md:p-10">
                <div className="grid gap-8 md:grid-cols-3">
                  {[
                    {
                      n: "01",
                      t: "Doctrine-backed",
                      d: "A coherent worldview, moral frame, and decision logic designed to hold under pressure.",
                    },
                    {
                      n: "02",
                      t: "Commercially structured",
                      d: "Content is public signal. Diagnostics are paid clarity. Advisory is selective mandate work.",
                    },
                    {
                      n: "03",
                      t: "System-first",
                      d: "A living platform: doctrine, diagnostics, editorial property, playbooks, deployables, and controlled engagement paths.",
                    },
                  ].map((x) => (
                    <div
                      key={x.n}
                      className="border-l border-amber-500/25 pl-5"
                    >
                      <div className="text-[10px] font-mono tracking-[0.28em] text-amber-300/90">
                        {x.n}
                      </div>
                      <div className="mt-2 font-medium text-white">{x.t}</div>
                      <div className="mt-2 text-sm leading-relaxed text-white/70">
                        {x.d}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          <div className="lg:col-span-5">
            <Panel>
              <div className="p-6 md:p-10">
                <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-white/65">
                  Operator Spotlight
                </div>

                {featuredBriefing ? (
                  <>
                    <div className="mt-4 font-serif text-2xl text-white">
                      {featuredBriefing.title}
                    </div>
                    <div className="mt-3 leading-relaxed text-white/70">
                      {featuredBriefing.excerpt ||
                        "Operator-grade intelligence engineered for decisions."}
                    </div>
                    <div className="mt-6">
                      <Link
                        href={featuredBriefing.href}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.32em] text-amber-300 hover:bg-amber-500/20"
                      >
                        Open Briefing <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 leading-relaxed text-white/70">
                    No featured briefing available.
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </Section>

      <Bridge text="From credibility → to diagnostics" />

      <Section
        id="diagnostics"
        variant="default"
        cap="Diagnostics architecture — gateway to escalation"
      >
        <AnchorOffset id="diagnostics" />

        <HQHeader
          eyebrow="Diagnostics"
          title="Clarity before intervention."
          description="The platform does not force serious buyers into advisory too early. Diagnostics establish the signal. Executive Reporting interprets it. Strategy Room intervenes when the cost of delay or misjudgment is already material."
          icon={<Activity className="h-4 w-4" />}
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Panel className="h-full">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-300/85">
                  Step 01
                </div>
                <ScanSearch className="h-5 w-5 text-amber-300/80" />
              </div>

              <h3 className="mt-5 font-serif text-3xl leading-tight text-white">
                Diagnostics
              </h3>

              <p className="mt-4 text-sm leading-relaxed text-white/70">
                The gateway layer. Use this to read pressure, drift, misalignment,
                and structural weakness before forcing a solution.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "Directional Integrity — individual signal",
                  "Team Alignment — execution and communication signal",
                  "Enterprise Diagnostic — institutional consequence signal",
                ].map((line) => (
                  <div
                    key={line}
                    className="flex items-start gap-3 text-sm text-white/58"
                  >
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/diagnostics"
                  className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300 hover:bg-amber-500/18"
                >
                  Open Diagnostics <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Panel>

          <Panel className="h-full">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-300/85">
                  Step 02
                </div>
                <FileText className="h-5 w-5 text-amber-300/80" />
              </div>

              <h3 className="mt-5 font-serif text-3xl leading-tight text-white">
                Executive Reporting
              </h3>

              <p className="mt-4 text-sm leading-relaxed text-white/70">
                The flagship bridge product. It takes raw diagnostic signal and turns
                it into a disciplined executive artifact: narrative, exposure,
                correction priority, and decision fit.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "Readable by founders, boards, and operators",
                  "Narrative + matrix + exposure in one output",
                  "Premium bridge before private mandate work",
                ].map((line) => (
                  <div
                    key={line}
                    className="flex items-start gap-3 text-sm text-white/58"
                  >
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/diagnostics/executive-reporting"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-white/85 hover:bg-white/[0.08]"
                >
                  View Flagship Product <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Panel>

          <Panel className="h-full">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-300/85">
                  Step 03
                </div>
                <Crown className="h-5 w-5 text-amber-300/80" />
              </div>

              <h3 className="mt-5 font-serif text-3xl leading-tight text-white">
                Strategy Room
              </h3>

              <p className="mt-4 text-sm leading-relaxed text-white/70">
                The private chamber. Reserved for high-consequence situations where
                the problem is already material and structured intervention is justified.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "Selective, not casual",
                  "For live decisions under pressure",
                  "Mandate work with documented trade-offs and control",
                ].map((line) => (
                  <div
                    key={line}
                    className="flex items-start gap-3 text-sm text-white/58"
                  >
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/consulting/strategy-room"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-white/85 hover:bg-white/[0.08]"
                >
                  Enter Strategy Room <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Panel>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <ScanSearch className="h-4 w-4" />,
              title: "Signal first",
              body: "Use diagnostics to establish what is actually happening before the room fills with noise.",
            },
            {
              icon: <Scale className="h-4 w-4" />,
              title: "Interpretation second",
              body: "Executive Reporting turns signal into a decision-grade reading that can be understood and acted on.",
            },
            {
              icon: <Crown className="h-4 w-4" />,
              title: "Mandate last",
              body: "Strategy Room is the private chamber when the consequences already justify intervention.",
            },
          ].map((item) => (
            <Panel key={item.title}>
              <div className="p-6">
                <div className="flex items-center gap-2 text-amber-300/90">
                  {item.icon}
                  <div className="text-[10px] font-mono uppercase tracking-[0.30em]">
                    {item.title}
                  </div>
                </div>
                <div className="mt-4 text-sm leading-relaxed text-white/68">
                  {item.body}
                </div>
              </div>
            </Panel>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/diagnostics"
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-6 py-3 text-[10px] font-mono uppercase tracking-[0.32em] text-amber-300 hover:bg-amber-500/18"
          >
            Begin with Diagnostics <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/diagnostics/executive-reporting"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-[10px] font-mono uppercase tracking-[0.32em] text-white/85 hover:bg-white/[0.08]"
          >
            Open Flagship Product <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </Section>

      <Bridge text="From diagnostics → to buyer fit" />

      <Section id="buyer-fit" variant="surface" cap="Buyer fit — who this is for">
        <AnchorOffset id="buyer-fit" />
        <ModuleBoundary label="ExecutiveBuyerFitSection">
          <ExecutiveBuyerFitSection />
        </ModuleBoundary>
      </Section>

      <Bridge text="From clarity → to intervention" />

      <Section
        id="strategy-room"
        variant="default"
        cap="Escalation — when reporting becomes mandate"
      >
        <AnchorOffset id="strategy-room" />
        <ModuleBoundary label="StrategyRoomIntegration">
          <StrategyRoomIntegration />
        </ModuleBoundary>
      </Section>

      {featuredPublications.length > 0 || featuredPlaybooks.length > 0 ? (
        <>
          <Bridge text="From diagnostics → to editorial canon and execution" />

          <Section
            id="publications"
            variant="surface"
            cap="Publications and playbooks — doctrine and execution"
          >
            <AnchorOffset id="publications" />

            <HQHeader
              eyebrow="Publications & Playbooks"
              title="Ideas that can be read. Frameworks that can be used."
              description="Publishing is part of the doctrine-bearing architecture of the brand. Playbooks translate that doctrine into execution."
              icon={<ScrollText className="h-4 w-4" />}
            />

            {featuredPublications.length > 0 ? (
              <>
                <div className="mt-10 text-[10px] font-mono uppercase tracking-[0.34em] text-white/50">
                  Supporting Publications
                </div>
                <div className="mt-4 grid gap-6 lg:grid-cols-3">
                  {featuredPublications.slice(0, 3).map((item) => (
                    <PublicationCard key={item.slug} item={item} />
                  ))}
                </div>
              </>
            ) : null}

            {featuredPlaybooks.length > 0 ? (
              <>
                <div className="mt-12 text-[10px] font-mono uppercase tracking-[0.34em] text-white/50">
                  Execution Playbooks
                </div>
                <div className="mt-4 grid gap-6 lg:grid-cols-3">
                  {featuredPlaybooks.slice(0, 3).map((item) => (
                    <PlaybookCard key={item.slug} item={item} />
                  ))}
                </div>
              </>
            ) : null}

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/editorials"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-[10px] font-mono uppercase tracking-[0.32em] text-white/85 hover:bg-white/[0.08]"
              >
                Browse Publications <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/playbooks"
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-6 py-3 text-[10px] font-mono uppercase tracking-[0.32em] text-amber-300 hover:bg-amber-500/18"
              >
                Browse Playbooks <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </Section>
        </>
      ) : null}

      <Bridge text="From publications → to operators" />

      <Section id="who" variant="default" cap="Operators — target audience">
        <AnchorOffset id="who" />

        <HQHeader
          eyebrow="Operators"
          title="Built for people carrying responsibility, not spectators collecting inspiration."
          description="Founders, boards, leadership teams, and builders who prefer standards over slogans."
          icon={<Sparkles className="h-4 w-4" />}
        />

        <div className="mt-10">
          <Panel>
            <div className="p-4 md:p-6">
              <ModuleBoundary label="WhoIWorkWith">
                <WhoIWorkWith />
              </ModuleBoundary>
            </div>
          </Panel>
        </div>
      </Section>

      <Bridge text="From operators → to engagement lanes" />

      <Section id="lanes" variant="surface" cap="Engagement — clean commercial boundaries">
        <AnchorOffset id="lanes" />

        <HQHeader
          eyebrow="Engagement"
          title="Public signal. Commissioned diagnostics. Private mandate work."
          description="Clean boundaries protect trust, pricing, and seriousness. No confusion. No leakage."
          icon={<Layers className="h-4 w-4" />}
        />

        <div className="mt-10">
          <Panel>
            <div className="p-6 md:p-10">
              <ModuleBoundary label="EngagementLanes">
                <EngagementLanes />
              </ModuleBoundary>
            </div>
          </Panel>
        </div>
      </Section>

      <Bridge text="From lanes → to next actions" />

      <Section id="pathways" variant="default" cap="Pathways — three clean moves">
        <AnchorOffset id="pathways" />

        <HQHeader
          eyebrow="Pathways"
          title="Three clear moves. No wandering."
          description="The architecture now tells the user what to do next."
          icon={<ArrowRight className="h-4 w-4" />}
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {actions.map((a) => (
            <Panel key={a.title}>
              <div className="p-6 md:p-8">
                <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-300/85">
                  {a.tag}
                </div>
                <div className="mt-4 font-serif text-2xl text-white">
                  {a.title}
                </div>
                <div className="mt-3 leading-relaxed text-white/70">
                  {a.description}
                </div>
                <div className="mt-6">
                  <Link
                    href={a.href}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.32em] text-white/85 hover:bg-white/[0.08]"
                  >
                    Enter <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </Section>

      <Bridge text="From actions → to events and assets" />

      <Section id="events" variant="surface" cap="Events — live rooms">
        <AnchorOffset id="events" />

        <HQHeader
          eyebrow="Events"
          title="Salons, briefings, and live rooms."
          description="Where doctrine meets operators and ideas are tested in live environments."
          icon={<CalendarDays className="h-4 w-4" />}
        />

        <div className="mt-10">
          <Panel>
            <div className="p-6 md:p-10">
              <ModuleBoundary label="EventsSection">
                <EventsSection events={events as any} />
              </ModuleBoundary>
            </div>
          </Panel>
        </div>
      </Section>

      <Section id="vault" variant="default" cap="Vault — deployables">
        <AnchorOffset id="vault" />

        <HQHeader
          eyebrow="Vault"
          title="Deployables for actual execution."
          description="Templates, packs, frameworks, and operating assets engineered for reuse, not decoration."
          icon={<Archive className="h-4 w-4" />}
        />

        <div className="mt-10">
          <Panel>
            <div className="p-6 md:p-10">
              <ModuleBoundary label="VaultTeaserRail">
                <VaultTeaserRail />
              </ModuleBoundary>
            </div>
          </Panel>
        </div>
      </Section>

      {featuredBriefing ? (
        <>
          <Bridge text="From deployables → to intelligence feed" />

          <Section id="briefing" variant="surface" cap="Briefing — operator intelligence">
            <AnchorOffset id="briefing" />

            <HQHeader
              eyebrow="Briefing"
              title="Operator-grade intelligence."
              description="Focused transmission: clarity that survives hostile scrutiny."
              icon={<FileText className="h-4 w-4" />}
            />

            <div className="mt-10">
              <Panel>
                <div className="p-6 md:p-10">
                  <ModuleBoundary label="OperatorBriefing">
                    <OperatorBriefing featured={featuredBriefing as any} />
                  </ModuleBoundary>
                </div>
              </Panel>
            </div>
          </Section>
        </>
      ) : null}

      {featuredShorts.length > 0 ? (
        <>
          <Bridge text="From intelligence → to dispatches" />

          <Section id="dispatches" variant="default" cap="Dispatches — rapid intel">
            <AnchorOffset id="dispatches" />

            <HQHeader
              eyebrow="Dispatches"
              title="Short, sharp intelligence notes."
              description="Engineered for retrieval and reuse — fast, crisp, disciplined."
              icon={<Eye className="h-4 w-4" />}
            />

            <div className="mt-10">
              <Panel>
                <div className="p-6 md:p-10">
                  <ModuleBoundary label="ContentShowcase">
                    <ContentShowcase
                      items={featuredShorts as any}
                      title="Dispatches"
                      description="Short, sharp intelligence notes engineered for retrieval and reuse."
                    />
                  </ModuleBoundary>
                </div>
              </Panel>
            </div>
          </Section>
        </>
      ) : null}

      <Bridge text="From content → to ventures" />

      <Section id="ventures" variant="surface" cap="Ventures — institutions in motion">
        <AnchorOffset id="ventures" />

        <HQHeader
          eyebrow="Ventures"
          title="Institutions do not remain ideas."
          description="The platform supports real ventures, systems, and infrastructure designed to move in the world."
          icon={<Layers className="h-4 w-4" />}
        />

        <div className="mt-10">
          <Panel>
            <div className="p-6 md:p-10">
              <ModuleBoundary label="VenturesSection">
                <VenturesSection />
              </ModuleBoundary>
            </div>
          </Panel>
        </div>
      </Section>

      <Section id="close" variant="default" cap="Close — institutional seal">
        <div className="mx-auto max-w-5xl">
          <Panel>
            <div className="p-6 md:p-10">
              <ModuleBoundary label="InstitutionalClose">
                <InstitutionalClose />
              </ModuleBoundary>
            </div>
          </Panel>
        </div>
      </Section>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  DATA HELPERS
----------------------------------------------------------------------------- */
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
      d?.homepage === true
  );
}

function publicationToItem(item: PublicationRecord): PublicationItem {
  const editorialHref = `/editorials/${encodeURIComponent(item.slug)}`;

  const previewHref =
    item.previewEnabled
      ? item.previewPath ||
        `/api/editorials/preview/${encodeURIComponent(item.slug)}`
      : null;

  const pdfHref =
    item.pdfPath && item.pdfPath.trim() ? item.pdfPath.trim() : null;

  const epubHref =
    item.epubEnabled && item.epubPath && item.epubPath.trim()
      ? item.epubPath.trim()
      : null;

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
  const isBrief =
    k === "brief" || fp.startsWith("briefs/") || fp.startsWith("vault/briefs/");
  const isPost =
    k === "post" || fp.startsWith("blog/") || fp.startsWith("posts/");

  const collection = isShort
    ? "shorts"
    : isBrief
      ? "vault/briefs"
      : isPost
        ? "blog"
        : null;

  if (!collection) return null;

  const rawSlug = computedSlug(d);
  const bare = normalizeSlug(String(rawSlug))
    .replace(/^shorts\//, "")
    .replace(/^briefs\//, "")
    .replace(/^vault\/briefs\//, "")
    .replace(/^blog\//, "")
    .replace(/^posts\//, "");

  const href =
    collection === "vault/briefs"
      ? `/vault/briefs/${bare}`
      : joinHref(collection, bare);

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
  const raw = String(
    d?.mode || d?.format || d?.delivery || "in-person"
  ).toLowerCase();

  if (raw.includes("hybrid")) return "hybrid";
  if (raw.includes("online") || raw.includes("virtual")) return "online";
  return "in-person";
}

function deriveEventStatus(date: string, explicit?: any): EventItem["status"] {
  const explicitRaw = String(explicit || "").toLowerCase();

  if (
    explicitRaw === "open" ||
    explicitRaw === "limited" ||
    explicitRaw === "full" ||
    explicitRaw === "past"
  ) {
    return explicitRaw as EventItem["status"];
  }

  const t = Date.parse(date);
  if (!Number.isFinite(t)) return "open";

  const now = new Date();
  const eventDay = new Date(t);
  const endOfEventDay = new Date(
    eventDay.getFullYear(),
    eventDay.getMonth(),
    eventDay.getDate(),
    23,
    59,
    59,
    999
  );

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
  const location = safeString(
    d?.location,
    mode === "online" ? "Online" : "London"
  );
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
  counts: { canon: number; briefs: number; shorts: number; downloads: number },
  docsLen: number
): boolean {
  const sum = counts.canon + counts.briefs + counts.shorts + counts.downloads;
  return sum === 0 || docsLen < 5;
}

const PRELUDE_SOURCE_FP = "books/the-architecture-of-human-purpose";

function readPlaybooksFromGenerated(gen: any): PlaybookItem[] {
  const arr = Array.isArray(gen?.allPlaybooks) ? gen.allPlaybooks : [];

  return arr
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

/* -----------------------------------------------------------------------------
  DATA FETCHING
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  let featuredShorts: FeaturedItem[] = [];
  let featuredBriefing: FeaturedItem | null = null;
  let featuredPlaybooks: PlaybookItem[] = [];
  let events: EventItem[] = [];

  const catalogue = getPublicationCatalogue();
  const flagshipPublicationRecord =
    getPublicationBySlug("ultimate-purpose-of-man") || catalogue[0] || null;

  const flagshipPublication = flagshipPublicationRecord
    ? publicationToItem(flagshipPublicationRecord)
    : null;

  const featuredPublications: PublicationItem[] = catalogue
    .filter((item) => item.slug !== flagshipPublication?.slug)
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

  let canonPrelude: CanonPrelude = {
    title: "The Architecture of Human Purpose",
    subtitle: "Prelude MiniBook — Gateway to the Canon",
    description:
      "A strategic introduction to the forthcoming multi-volume Canon on purpose, civilisation, identity, governance and destiny.",
    excerpt:
      "Human flourishing is not accidental. It is architectural. This Prelude reveals the structural laws that govern human purpose and civilisational rise.",
    coverImage: "/assets/images/books/the-architecture-of-human-purpose.jpg",
    href: "/books/the-architecture-of-human-purpose",
    canonHref: "/canon",
    ctaLabel: "Open the Prelude MiniBook",
  };

  const computeFromDocs = (
    docsIn: any[],
    dataForBooks?: any,
    dataForPlaybooks?: any
  ) => {
    const stableDocs = (docsIn || []).filter((d) => !isDraftLocal(d));

    const shortsDocs = stableDocs.filter(
      (d) => kindLower(d) === "short" || flattenedPath(d).startsWith("shorts/")
    );
    const canonDocs = stableDocs.filter(
      (d) => kindLower(d) === "canon" || flattenedPath(d).startsWith("canon/")
    );
    const briefsDocs = stableDocs.filter(
      (d) =>
        kindLower(d) === "brief" ||
        flattenedPath(d).startsWith("briefs/") ||
        flattenedPath(d).startsWith("vault/briefs/")
    );
    const downloadsDocs = stableDocs.filter(
      (d) =>
        kindLower(d) === "download" ||
        flattenedPath(d).startsWith("downloads/")
    );

    counts.shorts = shortsDocs.length;
    counts.canon = canonDocs.length;
    counts.briefs = briefsDocs.length;
    counts.downloads = downloadsDocs.length;

    const books = Array.isArray((dataForBooks as any)?.allBooks)
      ? (dataForBooks as any).allBooks
      : [];

    const preludeBook = books.find((b: any) => {
      const fp = String(b?._raw?.flattenedPath || "");
      const slug = String(b?.slug || "");
      return (
        fp === PRELUDE_SOURCE_FP ||
        slug === "/books/the-architecture-of-human-purpose"
      );
    });

    if (preludeBook) {
      const rawBookSlug = safeString(preludeBook?.slug) || PRELUDE_SOURCE_FP;
      const bareBookSlug = normalizeSlug(rawBookSlug)
        .replace(/^books\//, "")
        .replace(/^\/books\//, "");

      canonPrelude = {
        title: safeString(preludeBook?.title, canonPrelude.title),
        subtitle: safeString(preludeBook?.subtitle, canonPrelude.subtitle),
        description: safeString(
          preludeBook?.description,
          canonPrelude.description
        ),
        excerpt: safeString(
          preludeBook?.excerpt || preludeBook?.description,
          canonPrelude.excerpt
        ),
        coverImage: "/assets/images/books/the-architecture-of-human-purpose.jpg",
        href: `/books/${bareBookSlug}`,
        canonHref: "/canon",
        ctaLabel: "Open the Prelude MiniBook",
      };
    }

    const allPlaybooks = readPlaybooksFromGenerated(dataForPlaybooks);
    featuredPlaybooks = allPlaybooks.slice(0, 3);
    counts.playbooks = allPlaybooks.length;

    const rawEvents = stableDocs.filter(
      (d) => kindLower(d) === "event" || flattenedPath(d).startsWith("events/")
    );

    events = (rawEvents.map(toEvent).filter(Boolean) as EventItem[])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 6);

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
            .sort(
              (a: any, b: any) =>
                (Date.parse(b?.date || "") || 0) -
                (Date.parse(a?.date || "") || 0)
            )
            .slice(0, 8)
            .map(toItem)
            .filter(Boolean) as FeaturedItem[]);
  };

  try {
    const mod: any = await import("@/lib/content/server");
    const getContentlayerData = mod?.getContentlayerData;

    if (typeof getContentlayerData !== "function") {
      throw new Error("getContentlayerData missing");
    }

    const data = getContentlayerData();
    const docs = collectAnyDocs(data);
    computeFromDocs(docs, data, data);

    if (shouldForceFallback(counts, docs.length)) {
      throw new Error("FORCE_FALLBACK_TO_GENERATED");
    }
  } catch {
    try {
      const gen: any = await import("contentlayer/generated");
      const docs = collectAnyDocs(gen);
      computeFromDocs(docs, gen, gen);
    } catch {
      // keep defaults
    }
  }

  return {
    props: sanitizeData({
      featuredShorts,
      featuredBriefing,
      flagshipPublication,
      featuredPublications,
      featuredPlaybooks,
      events,
      counts,
      canonPrelude,
    }),
    revalidate: 3600,
  };
};

export default HomePage;