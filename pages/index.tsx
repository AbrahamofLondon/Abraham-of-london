// pages/index.tsx — INSTITUTIONAL HOME (BRIEFING / MUSEUM / WAR-ROOM EDITION)
// Tailwind-safe classes only (no decimals like h-4.5 / py-4.5)

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";

import Layout from "@/components/Layout";
import AnimatedStatsBar from "@/components/enhanced/AnimatedStatsBar";
import EnhancedVenturesSection from "@/components/enhanced/VenturesSection";

import Link from "next/link";
import Image from "next/image";

import { safeArraySlice } from "@/lib/utils/safe";
import { getAllShorts } from "@/lib/contentlayer-helper";

import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Compass,
  Cpu,
  FileText,
  Globe,
  Landmark,
  Library,
  Lock,
  Quote,
  Scale,
  ScrollText,
  Shield,
  Target,
  Vault,
  Workflow,
} from "lucide-react";

/* -----------------------------------------------------------------------------
   TYPES
----------------------------------------------------------------------------- */
type LooseShort = {
  title?: string;
  excerpt?: string | null;
  description?: string | null;
  readTime?: string | null;
  url?: string | null;
  slug?: string | null;
  draft?: boolean;
  published?: boolean;
  date?: string | Date | null;
  _raw?: { sourceFileName?: string; flattenedPath?: string };
};

type HomePageProps = {
  featuredShorts: LooseShort[];
};

/* -----------------------------------------------------------------------------
   ROUTES
----------------------------------------------------------------------------- */
const ROUTES = {
  consulting: "/consulting",
  canon: "/canon",
  canonVolume1: "/canon/volume-i-foundations-of-purpose",
  shorts: "/shorts",
  ventures: "/ventures",
  resources: "/resources",
  downloads: "/downloads",
  contact: "/contact",

  // Flagships
  vault: "/downloads/vault",
  strategicFrameworks: "/resources/strategic-frameworks",
  ultimatePurpose: "/blog/ultimate-purpose-of-man",
} as const;

/* -----------------------------------------------------------------------------
   UI HELPERS
----------------------------------------------------------------------------- */
const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const Divider: React.FC<{ tight?: boolean }> = ({ tight = false }) => (
  <div className={cx("relative bg-black", tight ? "py-6" : "py-10")}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
    </div>
  </div>
);

const Pill: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({
  children,
  icon,
}) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-200 backdrop-blur-sm">
    <span className="text-amber-300">{icon}</span>
    {children}
  </span>
);

const PrimaryBtn: React.FC<{
  href: string;
  children: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}> = ({ href, children, iconLeft, iconRight }) => (
  <Link
    href={href}
    className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-8 py-4 text-sm font-extrabold text-black shadow-2xl shadow-amber-900/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-amber-900/45"
  >
    {iconLeft}
    {children}
    {iconRight}
  </Link>
);

const SecondaryBtn: React.FC<{
  href: string;
  children: React.ReactNode;
  tone?: "amber" | "neutral";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}> = ({ href, children, tone = "neutral", iconLeft, iconRight }) => (
  <Link
    href={href}
    className={cx(
      "inline-flex items-center justify-center gap-3 rounded-2xl border bg-white/5 px-8 py-4 text-[11px] font-bold uppercase tracking-[0.2em] backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]",
      tone === "amber"
        ? "border-amber-400/25 text-amber-100 hover:border-amber-400/45 hover:bg-white/10"
        : "border-white/10 text-gray-200 hover:border-white/20 hover:bg-white/10"
    )}
  >
    {iconLeft}
    {children}
    {iconRight}
  </Link>
);

const Card: React.FC<{
  eyebrow?: string;
  title: string;
  body: string;
  icon?: React.ReactNode;
  href?: string;
  meta?: string;
  tone?: "amber" | "neutral";
}> = ({ eyebrow, title, body, icon, href, meta, tone = "neutral" }) => {
  const base = (
    <div
      className={cx(
        "group relative overflow-hidden rounded-3xl border bg-white/[0.03] p-7 backdrop-blur-xl transition-all duration-300",
        tone === "amber"
          ? "border-amber-400/20 hover:border-amber-400/35 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-amber-500/10"
          : "border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
      )}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-400">
              {eyebrow}
            </p>
          ) : null}

          <h3 className="mt-3 font-serif text-2xl font-semibold text-amber-100">
            {title}
          </h3>

          <p className="mt-3 text-sm font-light leading-relaxed text-gray-300">
            {body}
          </p>

          {meta ? (
            <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.35em] text-amber-200/80">
              {meta}
            </p>
          ) : null}
        </div>

        {icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
            {icon}
          </div>
        ) : null}
      </div>

      {/* Hover sheen */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.06),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );

  if (!href) return base;

  return (
    <Link href={href} className="block">
      {base}
    </Link>
  );
};

/* -----------------------------------------------------------------------------
   HERO — compact, high-signal, proof-by-design
----------------------------------------------------------------------------- */
const HeroBriefing: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-black">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(245,158,11,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8 lg:pb-14">
        {/* Pills */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Pill icon={<Landmark className="h-4 w-4" />}>Institutional Systems</Pill>
          <Pill icon={<Workflow className="h-4 w-4" />}>Cadence</Pill>
          <Pill icon={<Scale className="h-4 w-4" />}>Governance</Pill>
          <Pill icon={<Shield className="h-4 w-4" />}>Ethics</Pill>
          <Pill icon={<Globe className="h-4 w-4" />}>UK ↔ Africa</Pill>
        </div>

        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left */}
          <div className="lg:col-span-7">
            <h1 className="font-serif text-5xl font-semibold leading-tight text-amber-100 sm:text-6xl lg:text-7xl">
              Abraham of London
            </h1>

            <p className="mt-5 max-w-2xl text-lg font-light leading-relaxed text-gray-200 sm:text-xl">
              Strategy that holds. Systems that deploy.
            </p>

            {/* CTAs */}
            <div className="mt-7 flex flex-wrap gap-3">
              <PrimaryBtn
                href={ROUTES.consulting}
                iconLeft={<Briefcase className="h-5 w-5" />}
                iconRight={<ArrowRight className="h-5 w-5" />}
              >
                Engage
              </PrimaryBtn>

              <SecondaryBtn
                href={ROUTES.strategicFrameworks}
                tone="amber"
                iconLeft={<Compass className="h-5 w-5" />}
                iconRight={<ArrowRight className="h-5 w-5" />}
              >
                Frameworks
              </SecondaryBtn>

              <SecondaryBtn
                href={ROUTES.vault}
                tone="neutral"
                iconLeft={<Vault className="h-5 w-5" />}
                iconRight={<Lock className="h-5 w-5" />}
              >
                Vault
              </SecondaryBtn>
            </div>

            {/* Micro-proof rail (demonstration, not claims) */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { k: "Output", v: "Deployable artefacts" },
                { k: "Method", v: "Decision system" },
                { k: "Standard", v: "Governance-ready" },
              ].map((x) => (
                <div
                  key={x.k}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-gray-500">
                    {x.k}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-amber-100">{x.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Briefing Objects */}
          <div className="lg:col-span-5">
            <div className="grid gap-4">
              <Card
                tone="amber"
                eyebrow="Flagship object"
                title="Ultimate Purpose of Man"
                body="First principles: meaning, morality, destiny. The anchor beneath every system."
                href={ROUTES.ultimatePurpose}
                icon={<ScrollText className="h-6 w-6" />}
                meta="Read the thesis"
              />

              <Card
                eyebrow="Framework library"
                title="Strategic Frameworks"
                body="Models, matrices, and decision tools engineered for use — not applause."
                href={ROUTES.strategicFrameworks}
                icon={<Target className="h-6 w-6" />}
                meta="Deploy the tools"
              />

              <Card
                eyebrow="Asset vault"
                title="The Vault"
                body="Templates, operator packs, and institutional artefacts for builders who ship."
                href={ROUTES.vault}
                icon={<Vault className="h-6 w-6" />}
                meta="Open the pack"
                tone="amber"
              />
            </div>
          </div>
        </div>

        {/* Hero Visual (tight + dossier overlay) */}
        <div className="relative mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <div className="relative aspect-[16/9]">
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/0 via-black/30 to-black/80" />

            {/* Dossier stamp */}
            <div className="pointer-events-none absolute left-6 top-6 z-20 sm:left-8 sm:top-8">
              <div className="rotate-[-3deg] rounded-2xl border border-amber-400/25 bg-black/60 px-5 py-4 backdrop-blur-xl shadow-2xl shadow-amber-900/20">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.45em] text-gray-300">
                  Briefing File
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.45em] text-amber-200">
                    Declassified
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-semibold tracking-[0.25em] text-amber-100">
                  AOL-OS-0007
                </p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.35em] text-gray-400">
                  UK ↔ Africa • Systems • Governance
                </p>
              </div>
            </div>

            <Image
              src="/assets/images/abraham-of-london-banner.webp"
              alt="Abraham of London — Institutional Advisory Platform"
              fill
              priority
              quality={95}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
            />
          </div>

          {/* Bottom rail: compact, high-signal */}
          <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 h-11 w-11 rounded-xl bg-amber-500/10 p-2.5">
                <Cpu className="h-full w-full text-amber-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-100">
                  Blueprint → pressure-test → deploy
                </p>
                <p className="mt-1.5 text-sm font-light text-gray-300">
                  Decision systems. Operator artefacts. Cadence installed.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { icon: <CheckCircle2 className="h-4 w-4" />, label: "Partner-led" },
                { icon: <Shield className="h-4 w-4" />, label: "Governance-ready" },
                { icon: <Award className="h-4 w-4" />, label: "Institutional quality" },
              ].map((x) => (
                <span
                  key={x.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-200"
                >
                  <span className="text-amber-300">{x.icon}</span>
                  {x.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   OPERATOR BRIEFING — compact “evidence grid”
----------------------------------------------------------------------------- */
const OperatorBriefing: React.FC = () => {
  const items = [
    {
      title: "Mandate",
      body: "Define the win. Lock decision rights. Remove ambiguity.",
      icon: <Target className="h-5 w-5" />,
      meta: "Success definition • constraints • trade-offs",
    },
    {
      title: "Governance",
      body: "Controls, cadence, owners, accountability loops.",
      icon: <Scale className="h-5 w-5" />,
      meta: "Decision rights • KPIs • meeting system",
    },
    {
      title: "Artefacts",
      body: "Playbooks, packs, templates — built to be used.",
      icon: <FileText className="h-5 w-5" />,
      meta: "Operator notes • templates • packs",
    },
    {
      title: "Deployment",
      body: "Roadmap, milestones, named owners. Execution becomes routine.",
      icon: <Workflow className="h-5 w-5" />,
      meta: "Roadmap • owners • cadence",
    },
  ];

  return (
    <section className="bg-black py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.45em] text-amber-300">
              Operator briefing
            </p>
            <h2 className="mt-3 font-serif text-3xl font-light text-amber-100 sm:text-4xl">
              The work, in objects.
            </h2>
          </div>

          <Link
            href={ROUTES.consulting}
            className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-200 transition-all hover:border-white/20 hover:bg-white/10 sm:inline-flex"
          >
            Engagements <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((x) => (
            <div
              key={x.title}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                  {x.icon}
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-amber-100">{x.title}</p>
              <p className="mt-2 text-sm font-light leading-relaxed text-gray-300">
                {x.body}
              </p>
              <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.35em] text-gray-500">
                {x.meta}
              </p>
            </div>
          ))}
        </div>

        {/* Tiny CTA rail */}
        <div className="mt-6 flex flex-wrap gap-2">
          <SecondaryBtn
            href={ROUTES.ultimatePurpose}
            tone="neutral"
            iconLeft={<ScrollText className="h-5 w-5" />}
            iconRight={<ChevronRight className="h-5 w-5" />}
          >
            Ultimate Purpose
          </SecondaryBtn>
          <SecondaryBtn
            href={ROUTES.strategicFrameworks}
            tone="amber"
            iconLeft={<Compass className="h-5 w-5" />}
            iconRight={<ChevronRight className="h-5 w-5" />}
          >
            Frameworks
          </SecondaryBtn>
          <SecondaryBtn
            href={ROUTES.vault}
            tone="neutral"
            iconLeft={<Vault className="h-5 w-5" />}
            iconRight={<Lock className="h-5 w-5" />}
          >
            Vault Packs
          </SecondaryBtn>
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   CANON PATHWAY — compact, no fluff
----------------------------------------------------------------------------- */
const CanonPathway: React.FC = () => {
  const tiers = [
    {
      title: "Public Library",
      body: "Read the thesis and core principles.",
      meta: "Open access",
      href: ROUTES.canon,
      icon: <Library className="h-6 w-6" />,
    },
    {
      title: "Executive Shorts",
      body: "Briefs engineered for action.",
      meta: "High signal",
      href: ROUTES.shorts,
      icon: <BookOpen className="h-6 w-6" />,
    },
    {
      title: "Vault Assets",
      body: "Templates and operator packs.",
      meta: "Deployable",
      href: ROUTES.vault,
      icon: <Vault className="h-6 w-6" />,
    },
  ];

  return (
    <section className="bg-black py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.45em] text-amber-300">
              Canon pathway
            </p>
            <h2 className="mt-3 font-serif text-3xl font-light text-amber-100 sm:text-4xl">
              Read → apply → deploy.
            </h2>
          </div>

          <Link
            href={ROUTES.canonVolume1}
            className="hidden items-center gap-2 rounded-full border border-amber-400/25 bg-white/5 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200 transition-all hover:border-amber-400/45 hover:bg-white/10 sm:inline-flex"
          >
            Start Volume I <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {tiers.map((t) => (
            <Link
              key={t.title}
              href={t.href}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/25 hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold text-amber-100">{t.title}</p>
                  <p className="mt-2 text-sm font-light leading-relaxed text-gray-300">
                    {t.body}
                  </p>
                  <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.35em] text-gray-500">
                    {t.meta}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                  {t.icon}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-gray-500">
                  Open file
                </span>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                  View <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   EXECUTIVE INTELLIGENCE STRIP — Shorts, compact, premium cards
----------------------------------------------------------------------------- */
const ExecutiveIntelligenceStrip: React.FC<{ shorts: LooseShort[] }> = ({
  shorts,
}) => {
  const items = safeArraySlice(shorts ?? [], 0, 6) as LooseShort[];
  if (!items.length) return null;

  const hrefFor = (s: LooseShort) => {
    if (s.url) return s.url;
    if (s.slug) return `/shorts/${String(s.slug).replace(/^\/+/, "")}`;
    const raw = s._raw?.flattenedPath || s._raw?.sourceFileName;
    if (raw) return `/shorts/${String(raw).replace(/\.mdx?$/, "")}`;
    return ROUTES.shorts;
  };

  return (
    <section className="bg-black py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.45em] text-amber-300">
              Executive intelligence
            </p>
            <h2 className="mt-3 font-serif text-3xl font-light text-amber-100 sm:text-4xl">
              Briefs for builders.
            </h2>
          </div>

          <Link
            href={ROUTES.shorts}
            className="hidden items-center gap-2 rounded-full border border-amber-400/25 bg-white/5 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200 transition-all hover:border-amber-400/45 hover:bg-white/10 sm:inline-flex"
          >
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {items.map((s, idx) => (
            <Link
              key={`${s.title ?? "short"}-${idx}`}
              href={hrefFor(s)}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/25 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-amber-500/10"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-gray-400">
                    {(s.readTime || "SHORT").toString()}
                  </p>
                  <h3 className="mt-3 font-serif text-2xl font-semibold text-amber-100">
                    {s.title || "Untitled"}
                  </h3>
                  <p className="mt-3 text-sm font-light leading-relaxed text-gray-300">
                    {(s.excerpt ||
                      s.description ||
                      "High-signal notes engineered for execution.").toString()}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-gray-500">
                  Open brief
                </span>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                  Read <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>

              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.06),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   CLOSE — concise, premium, no preaching
----------------------------------------------------------------------------- */
const Close: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-black py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(245,158,11,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.08),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl sm:p-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.45em] text-amber-300">
                Next step
              </p>
              <h2 className="mt-3 font-serif text-3xl font-light text-amber-100 sm:text-4xl">
                Choose a file. Open it.
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-gray-300">
                Frameworks for decisions. Purpose for direction. Vault assets for deployment. Advisory
                when stakes are high.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryBtn
                  href={ROUTES.consulting}
                  iconLeft={<Briefcase className="h-5 w-5" />}
                  iconRight={<ArrowRight className="h-5 w-5" />}
                >
                  Engage
                </PrimaryBtn>

                <SecondaryBtn
                  href={ROUTES.strategicFrameworks}
                  tone="amber"
                  iconLeft={<Compass className="h-5 w-5" />}
                  iconRight={<ChevronRight className="h-5 w-5" />}
                >
                  Frameworks
                </SecondaryBtn>

                <SecondaryBtn
                  href={ROUTES.contact}
                  tone="neutral"
                  iconLeft={<Shield className="h-5 w-5" />}
                  iconRight={<ArrowRight className="h-5 w-5" />}
                >
                  Introductions
                </SecondaryBtn>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="grid gap-3">
                {[
                  {
                    title: "Start here",
                    body: "Ultimate Purpose of Man → a first-principles anchor.",
                    icon: <ScrollText className="h-5 w-5" />,
                  },
                  {
                    title: "Deploy",
                    body: "Strategic Frameworks → decision tools engineered for use.",
                    icon: <Target className="h-5 w-5" />,
                  },
                  {
                    title: "Ship",
                    body: "Vault assets → templates and operator packs.",
                    icon: <Vault className="h-5 w-5" />,
                  },
                ].map((x) => (
                  <div
                    key={x.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
                        {x.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-100">{x.title}</p>
                        <p className="mt-1.5 text-sm font-light leading-relaxed text-gray-300">
                          {x.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={ROUTES.ultimatePurpose}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.25em] text-gray-200 transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <ScrollText className="h-4 w-4 text-amber-300" />
                  Ultimate Purpose
                </Link>

                <Link
                  href={ROUTES.strategicFrameworks}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-white/5 px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.25em] text-amber-200 transition-all hover:border-amber-400/45 hover:bg-white/10"
                >
                  <Compass className="h-4 w-4 text-amber-300" />
                  Frameworks
                </Link>

                <Link
                  href={ROUTES.vault}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.25em] text-gray-200 transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <Vault className="h-4 w-4 text-amber-300" />
                  Vault
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.45em] text-gray-500">
              Designed in London • Built for duty, consequence, legacy
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   DATA UTILS
----------------------------------------------------------------------------- */
function toTime(input: LooseShort["date"]): number {
  if (!input) return 0;
  const d = input instanceof Date ? input : new Date(String(input));
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
}

/* -----------------------------------------------------------------------------
   PAGE
----------------------------------------------------------------------------- */
const HomePage: NextPage<HomePageProps> = ({ featuredShorts }) => {
  return (
    <Layout
      title="Abraham of London — Strategy, Frameworks, Canon, Vault"
      description="Consulting-grade decision systems and deployable artefacts: Strategic Frameworks, The Canon, and Vault assets."
      ogImage="/assets/images/social/og-image.jpg"
      canonicalUrl="/"
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Abraham of London",
        url: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(
          /\/+$/,
          ""
        ),
        description:
          "Consulting-grade decision systems and deployable artefacts: Strategic Frameworks, The Canon, and Vault assets.",
      }}
    >
      <main className="bg-black">
        <HeroBriefing />

        {/* Keep stats early, but the page is already premium */}
        <section className="bg-black">
          <AnimatedStatsBar />
        </section>

        <Divider tight />

        <OperatorBriefing />

        <Divider />

        {/* Ventures as proof, but compact */}
        <section className="bg-black">
          <EnhancedVenturesSection />
        </section>

        <Divider />

        <CanonPathway />

        <Divider />

        <ExecutiveIntelligenceStrip shorts={featuredShorts} />

        <Divider />

        <Close />
      </main>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
   SSG
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const all = (await getAllShorts()) as LooseShort[];

  const published = (all || [])
    .filter((s) => !s?.draft)
    .filter((s) => s?.published !== false)
    .sort((a, b) => toTime(b.date) - toTime(a.date));

  const featuredShorts = safeArraySlice(published, 0, 6) as LooseShort[];

  return {
    props: { featuredShorts },
    revalidate: 60 * 30,
  };
};

export default HomePage;