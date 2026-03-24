/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/index.tsx — HOMEPAGE (SSR-stable, no hidden first paint, no client-only homepage shell)

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
  Vault,
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
import { CanonInstitutionalIntro, OperatorBriefing } from "@/components/homepage";
import type { CanonPrelude } from "@/components/homepage/CanonInstitutionalIntro";

import { joinHref, normalizeSlug } from "@/lib/content/shared";
import { sanitizeData } from "@/lib/content/server";

import fs from "fs";
import path from "path";
import matter from "gray-matter";

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

type PublicationItem = {
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  author: string;
  date?: string | null;
  tier: string;
  category?: string | null;
  readingTime?: string | null;
  documentId?: string | null;
  href: string;
  pdfHref: string;
};

type HomePageProps = {
  featuredShorts: FeaturedItem[];
  featuredBriefing: FeaturedItem | null;
  featuredPublications: PublicationItem[];
  events: EventItem[];
  canonPrelude: CanonPrelude;
  counts: {
    shorts: number;
    canon: number;
    briefs: number;
    downloads: number;
    library: number;
    publications: number;
  };
};

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
      <div className={["flex items-center gap-2", isCenter ? "justify-center" : ""].join(" ")}>
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

          <a
            href={item.pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300 hover:bg-amber-500/18"
          >
            Open PDF <ArrowRight className="h-4 w-4" />
          </a>
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
        <div className="mt-6 font-serif text-5xl leading-none text-white">{value}</div>
        <p className="mt-5 text-base leading-relaxed text-white/68">{body}</p>
      </div>
    </Panel>
  );
}

function DiagnosticEntryCard() {
  return (
    <Panel className="h-full">
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-300/85">
            Diagnostics
          </div>
          <ScanSearch className="h-5 w-5 text-amber-300/80" />
        </div>

        <h3 className="mt-5 font-serif text-3xl leading-tight text-white">
          Paid clarity before mandate work.
        </h3>

        <p className="mt-4 text-sm leading-relaxed text-white/70">
          Not every serious problem should begin with a call. Some should begin
          with a disciplined reading of reality.
        </p>

        <div className="mt-6 space-y-3">
          {[
            "Quick Diagnostic — individual signal",
            "Team Alignment — execution and coherence reading",
            "Enterprise Diagnostic — structural interpretation under pressure",
          ].map((line) => (
            <div key={line} className="flex items-start gap-3 text-sm text-white/58">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" />
              <span>{line}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/diagnostics"
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300 hover:bg-amber-500/18"
          >
            Enter Diagnostics <ChevronRight className="h-4 w-4" />
          </Link>

          <Link
            href="/purpose-alignment"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-white/85 hover:bg-white/[0.08]"
          >
            Run Instrument <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Panel>
  );
}

function AdvisoryPathCard() {
  return (
    <Panel className="h-full">
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-300/85">
            Advisory
          </div>
          <Briefcase className="h-5 w-5 text-amber-300/80" />
        </div>

        <h3 className="mt-5 font-serif text-3xl leading-tight text-white">
          Private work begins where consequence hardens.
        </h3>

        <p className="mt-4 text-sm leading-relaxed text-white/70">
          Strategy Room and private advisory remain selective. Diagnostics improve
          fit before private work is accepted.
        </p>

        <div className="mt-6 space-y-3">
          {[
            "Board-grade decision environments",
            "Founder advisory under pressure",
            "Structured artifacts, not decorative advice",
          ].map((line) => (
            <div key={line} className="flex items-start gap-3 text-sm text-white/58">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" />
              <span>{line}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/consulting"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-white/85 hover:bg-white/[0.08]"
          >
            Advisory Page <ChevronRight className="h-4 w-4" />
          </Link>

          <Link
            href="/consulting/strategy-room"
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300 hover:bg-amber-500/18"
          >
            Enter Strategy Room <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Panel>
  );
}

/* -----------------------------------------------------------------------------
  FAILSAFE UI
----------------------------------------------------------------------------- */
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

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="animate-pulse rounded-[30px] border border-white/12 bg-white/[0.055] p-10">
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-10 rounded-2xl bg-white/10" />
        <div className="h-6 w-28 rounded-full bg-white/10" />
      </div>
      <div className="mt-6 h-7 w-64 rounded bg-white/10" />
      <div className="mt-8 text-[10px] font-mono uppercase tracking-[0.3em] text-white/55">
        {label}
      </div>
    </div>
  );
}

function ContentShowcaseSkeleton() {
  return (
    <div className="rounded-[30px] border border-white/12 bg-white/[0.055] p-10">
      <div className="h-5 w-28 animate-pulse rounded bg-white/10" />
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-white/12 bg-black/40"
          />
        ))}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
  HOMEPAGE COMPONENT
----------------------------------------------------------------------------- */
const HomePage: NextPage<HomePageProps> = ({
  featuredShorts = [],
  featuredBriefing = null,
  featuredPublications = [],
  events = [],
  counts = {
    shorts: 0,
    canon: 0,
    briefs: 0,
    downloads: 0,
    library: 0,
    publications: 0,
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
      href: "/canon",
      title: "Enter the Canon",
      description:
        "Doctrine, purpose, governance, and civilisation arranged as one coherent spine.",
      tag: "Primary",
    },
    {
      href: "/diagnostics",
      title: "Run Diagnostics",
      description:
        "Paid clarity for individuals, teams, and institutions before advisory escalation.",
      tag: "Diagnostic",
    },
    {
      href: "/consulting/strategy-room",
      title: "Enter Strategy Room",
      description:
        "For high-consequence decisions requiring documented thinking, trade-offs, and control.",
      tag: "Private",
    },
  ];

  return (
    <Layout
      title="Abraham of London"
      description="Institutional doctrine, diagnostics, disciplined strategy, editorial canon, and deployable assets for builders."
      canonicalUrl="/"
      fullWidth
      headerTransparent
    >

   <Head>
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/assets/images/social/og-home.jpg" />
      </Head>

      <section className="relative bg-black">
        <CinematicHero
          counts={heroCounts}
          onScroll={() =>
            document.getElementById("prelude")?.scrollIntoView({ behavior: "smooth" })
          }
        />
      </section>

      <Section id="prelude" variant="surface" cap="Prelude — doctrinal gateway">
        <AnchorOffset id="prelude" />

        <HQHeader
          eyebrow="Prelude"
          title="The gateway to the whole system."
          description="Not a blog. Not a personality platform. Doctrine, diagnostics, strategy, deployables, and private mandate work arranged as one disciplined architecture."
          icon={<Layers className="h-4 w-4" />}
        />

        <ExecutiveRail
          items={[
            { href: "/canon", label: "Canon", icon: <Compass className="h-3.5 w-3.5" /> },
            { href: "/editorials", label: "Editorials", icon: <BookOpen className="h-3.5 w-3.5" /> },
            { href: "/vault", label: "Vault", icon: <Vault className="h-3.5 w-3.5" /> },
            { href: "/diagnostics", label: "Diagnostics", icon: <ScanSearch className="h-3.5 w-3.5" /> },
            { href: "/consulting", label: "Advisory", icon: <Briefcase className="h-3.5 w-3.5" /> },
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

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <OperatingStat
            label="Registry"
            value={String(counts.library)}
            body="Indexed assets, frameworks, texts, and strategic material across the platform."
            icon={<LibraryBig className="h-5 w-5" />}
          />
          <OperatingStat
            label="Editorial Spine"
            value={String(counts.publications)}
            body="Flagship publications and printed assets treated as institutional property, not loose posts."
            icon={<ScrollText className="h-5 w-5" />}
          />
          <OperatingStat
            label="Deployables"
            value={String(counts.downloads)}
            body="Execution-grade assets, templates, and controlled operating resources."
            icon={<Vault className="h-5 w-5" />}
          />
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

      <Bridge text="From doctrine → to credibility" />

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
                      d: "A living platform: doctrine, diagnostics, editorial property, deployables, and controlled engagement paths.",
                    },
                  ].map((x) => (
                    <div key={x.n} className="border-l border-amber-500/25 pl-5">
                      <div className="text-[10px] font-mono tracking-[0.28em] text-amber-300/90">
                        {x.n}
                      </div>
                      <div className="mt-2 font-medium text-white">{x.t}</div>
                      <div className="mt-2 text-sm leading-relaxed text-white/70">{x.d}</div>
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
                      {featuredBriefing.excerpt || "Operator-grade intelligence engineered for decisions."}
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

      <Section id="diagnostics" variant="default" cap="Diagnostics — paid clarity">
        <AnchorOffset id="diagnostics" />

        <HQHeader
          eyebrow="Diagnostics"
          title="A paid entry layer for serious operators."
          description="Not every issue warrants immediate advisory. Some require a disciplined reading of drift, weakness, misalignment, and correction priority."
          icon={<Activity className="h-4 w-4" />}
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <DiagnosticEntryCard />
          <AdvisoryPathCard />
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <ScanSearch className="h-4 w-4" />,
              title: "Quick Diagnostic",
              body: "Fast signal for individuals or small-team clarity.",
            },
            {
              icon: <Scale className="h-4 w-4" />,
              title: "Strategic Diagnostic",
              body: "Deeper interpretation where correction priority matters more than raw scoring.",
            },
            {
              icon: <Crown className="h-4 w-4" />,
              title: "Diagnostic + Advisory",
              body: "For decisions with politics, execution risk, and consequence.",
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

        <div className="mt-10 flex justify-center">
          <Link
            href="/diagnostics"
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-6 py-3 text-[10px] font-mono uppercase tracking-[0.32em] text-amber-300 hover:bg-amber-500/18"
          >
            Enter Diagnostics <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </Section>

      {featuredPublications.length > 0 ? (
        <>
          <Bridge text="From diagnostics → to editorial canon" />

          <Section id="publications" variant="surface" cap="Editorial canon — flagship publications">
            <AnchorOffset id="publications" />

            <HQHeader
              eyebrow="Editorial Canon"
              title="Books, flagship editorials, and institutional texts."
              description="Publishing is not filler here. It is part of the operating system and part of the doctrine-bearing architecture of the brand."
              icon={<ScrollText className="h-4 w-4" />}
            />

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {featuredPublications.slice(0, 3).map((item) => (
                <PublicationCard key={item.slug} item={item} />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link
                href="/editorials"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-[10px] font-mono uppercase tracking-[0.32em] text-white/85 hover:bg-white/[0.08]"
              >
                Browse Publications <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </Section>
        </>
      ) : null}

      <Bridge text="From editorials → to operators" />

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
          title="Public signal. Paid diagnostics. Private mandate work."
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
                <div className="mt-4 font-serif text-2xl text-white">{a.title}</div>
                <div className="mt-3 leading-relaxed text-white/70">{a.description}</div>
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
          icon={<Vault className="h-4 w-4" />}
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

function toItem(d: any): FeaturedItem | null {
  const k = kindLower(d);
  const fp = flattenedPath(d);

  const isShort = k === "short" || fp.startsWith("shorts/");
  const isBrief =
    k === "brief" || fp.startsWith("briefs/") || fp.startsWith("vault/briefs/");
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

  const href =
    collection === "vault/briefs" ? `/vault/briefs/${bare}` : joinHref(collection, bare);

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
    data?.allBooks,
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

function readPrintSourcePublications(): PublicationItem[] {
  const dir = path.join(process.cwd(), "scripts", "pdf", "print-sources");
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".print.md"));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const parsed = matter(raw);
      const data = parsed.data as Record<string, unknown>;

      const slug = file.replace(/\.print\.md$/i, "");
      const title = safeString(data.title, slug);
      const subtitle = safeString(data.subtitle) || null;
      const description = safeString(data.description) || null;
      const author = safeString(data.author, "Abraham of London");
      const date = safeString(data.date) || null;
      const tier = safeString(data.tier, "public");
      const category = safeString(data.category) || "Editorial";
      const readingTime =
        safeString(data.readingTime) ||
        safeString(data.readTime) ||
        null;
      const documentId = safeString(data.documentId) || null;

      return {
        slug,
        title,
        subtitle,
        description,
        author,
        date,
        tier,
        category,
        readingTime,
        documentId,
        href: `/editorials/${slug}`,
        pdfHref: `/assets/downloads/${slug}.pdf`,
      };
    })
    .sort((a, b) => {
      const da = Date.parse(a.date || "") || 0;
      const db = Date.parse(b.date || "") || 0;
      return db - da;
    });
}

/* -----------------------------------------------------------------------------
  DATA FETCHING
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  let featuredShorts: FeaturedItem[] = [];
  let featuredBriefing: FeaturedItem | null = null;
  let events: EventItem[] = [];
  let featuredPublications: PublicationItem[] = readPrintSourcePublications();

  const counts = {
    shorts: 0,
    canon: 0,
    briefs: 0,
    downloads: 0,
    library: readLibraryCount(),
    publications: featuredPublications.length,
  };

  let canonPrelude: CanonPrelude = {
    title: "The Architecture of Human Purpose",
    subtitle: "Prelude MiniBook — Gateway to the Canon",
    description:
      "A strategic introduction to the forthcoming multi-volume Canon on purpose, civilisation, identity, governance and destiny.",
    excerpt:
      "Human flourishing is not accidental. It is architectural. This Prelude reveals the structural laws that govern human purpose and civilisational rise.",
    coverImage: "/assets/images/books/the-architecture-of-human-purpose.jpg",
    href: "/books/the-architecture-of-human-purpose-landing",
    canonHref: "/canon",
    ctaLabel: "Open the Prelude MiniBook",
  };

  const computeFromDocs = (docsIn: any[], dataForBooks?: any) => {
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
      (d) => kindLower(d) === "download" || flattenedPath(d).startsWith("downloads/")
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
      return fp === PRELUDE_SOURCE_FP || slug === "/books/the-architecture-of-human-purpose";
    });

    if (preludeBook) {
      canonPrelude = {
        title: safeString(preludeBook?.title, canonPrelude.title),
        subtitle: safeString(preludeBook?.subtitle, canonPrelude.subtitle),
        description: safeString(preludeBook?.description, canonPrelude.description),
        excerpt: safeString(
          preludeBook?.excerpt || preludeBook?.description,
          canonPrelude.excerpt
        ),
        coverImage: "/assets/images/books/the-architecture-of-human-purpose.jpg",
        href: "/books/the-architecture-of-human-purpose-landing",
        canonHref: "/canon",
        ctaLabel: "Open the Prelude MiniBook",
      };
    }

    const rawEvents = stableDocs.filter(
      (d) => kindLower(d) === "event" || flattenedPath(d).startsWith("events/")
    );

    events = rawEvents
      .map(toEvent)
      .filter(Boolean) as EventItem[];

    events = events
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
                (Date.parse(b?.date || "") || 0) - (Date.parse(a?.date || "") || 0)
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
    computeFromDocs(docs, data);

    if (shouldForceFallback(counts, docs.length)) {
      throw new Error("FORCE_FALLBACK_TO_GENERATED");
    }
  } catch {
    try {
      const gen: any = await import("contentlayer/generated");
      const docs = collectAnyDocs(gen);
      computeFromDocs(docs, gen);
    } catch {
      // keep defaults
    }
  }

  return {
    props: sanitizeData({
      featuredShorts,
      featuredBriefing,
      featuredPublications,
      events,
      counts,
      canonPrelude,
    }),
    revalidate: 3600,
  };
};

export default HomePage;