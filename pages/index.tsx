/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/index.tsx — GLORIOUS FINISH (12/10) — RENDERING GUARANTEED
// Fixes: Events/Ventures not rendering (no gating, hardened dynamic imports, error boundary)

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
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
} from "lucide-react";

import Layout from "@/components/Layout";
import CinematicHero from "@/components/homepage/CinematicHero";
import EngagementLanes from "@/components/homepage/EngagementLanes";
import WhoIWorkWith from "@/components/WhoIWorkWith";
import { CanonInstitutionalIntro, OperatorBriefing } from "@/components/homepage";
import type { CanonPrelude } from "@/components/homepage/CanonInstitutionalIntro";

import { joinHref, normalizeSlug, sanitizeData } from "@/lib/content/shared";

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

/* -----------------------------------------------------------------------------
  HARDENED DYNAMIC IMPORTS
  - If any import fails, we render a clean fallback instead of “nothing”.
----------------------------------------------------------------------------- */
const StrategicFunnelStrip = dynamic(
  () =>
    import("@/components/homepage/StrategicFunnelStrip").catch(() => ({
      default: () => <InlineFail label="Funnel strip failed to load" />,
    })),
  { ssr: false, loading: () => <SectionSkeleton label="Loading funnel…" /> }
);

const VaultTeaserRail = dynamic(
  () =>
    import("@/components/homepage/VaultTeaserRail").catch(() => ({
      default: () => <InlineFail label="Vault rail failed to load" />,
    })),
  { ssr: false, loading: () => <SectionSkeleton label="Loading Vault rail…" /> }
);

const EventsSection = dynamic(
  () =>
    import("@/components/homepage/EventsSection").catch(() => ({
      default: (p: any) => (
        <InlineFail
          label="Events module failed to load"
          hint="Check components/homepage/EventsSection.tsx export and syntax."
        />
      ),
    })),
  // IMPORTANT: keep SSR off if you’re on Next 16 + pages router and any module is client-only.
  // Rendering is still guaranteed by the fallback above.
  { ssr: false, loading: () => <SectionSkeleton label="Loading events…" /> }
);

const ContentShowcase = dynamic(
  () =>
    import("@/components/homepage/ContentShowcase").catch(() => ({
      default: () => <InlineFail label="Content showcase failed to load" />,
    })),
  { ssr: false, loading: () => <ContentShowcaseSkeleton /> }
);

const VenturesSection = dynamic(
  () =>
    import("@/components/homepage/VenturesSection").catch(() => ({
      default: () => (
        <InlineFail
          label="Ventures module failed to load"
          hint="Check components/homepage/VenturesSection.tsx export and any browser-only code."
        />
      ),
    })),
  { ssr: false, loading: () => <SectionSkeleton label="Loading ventures…" /> }
);

const InstitutionalClose = dynamic(
  () =>
    import("@/components/homepage/InstitutionalClose").catch(() => ({
      default: () => <InlineFail label="Close module failed to load" />,
    })),
  { ssr: false, loading: () => <SectionSkeleton label="Loading close…" /> }
);

/* -----------------------------------------------------------------------------
  HOMEPAGE DESIGN SYSTEM (self-contained)
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
      ? "bg-[radial-gradient(ellipse_at_25%_10%,rgba(245,158,11,0.10)_0%,transparent_55%),radial-gradient(ellipse_at_82%_40%,rgba(255,255,255,0.07)_0%,transparent_60%)] bg-[#070707]"
      : "bg-[#070707]";

  return (
    <section id={id} className={["relative", bg].join(" ")}>
      <div className="absolute inset-x-0 top-0">
        <Hairline soft />
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <Hairline soft />
      </div>

      <div className="absolute inset-0 aol-grain opacity-[0.06]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-18 lg:py-20">
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

      <h2 className="mt-5 font-serif text-3xl md:text-4xl lg:text-5xl leading-[1.05] text-white">
        {title}
      </h2>

      {description ? (
        <p className="mt-4 text-base md:text-lg leading-relaxed text-white/75">
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
            key={it.href + it.label}
            href={it.href}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.28em] text-white/75 hover:bg-black/45 hover:text-white transition"
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
        "rounded-[30px] border border-white/12 bg-white/[0.055]",
        "shadow-[0_35px_95px_-60px_rgba(0,0,0,0.95)]",
        className,
      ].join(" ")}
    >
      <div className="relative rounded-[28px] border border-white/10 bg-black/40 backdrop-blur-md">
        <div className="absolute inset-x-0 top-0">
          <Hairline soft />
        </div>
        {children}
        <div className="absolute inset-x-0 bottom-0">
          <Hairline soft />
        </div>
      </div>
    </div>
  );
}

function Bridge({ text }: { text: string }) {
  return (
    <div className="bg-[#070707]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
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

/* -----------------------------------------------------------------------------
  FAILSAFE UI
----------------------------------------------------------------------------- */
function InlineFail({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-300 mt-0.5" />
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-300/90">
            Module status
          </div>
          <div className="mt-2 text-white font-serif text-xl">{label}</div>
          {hint ? <div className="mt-2 text-white/70 text-sm">{hint}</div> : null}
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
    // keep silent in UI; logged for dev
    // eslint-disable-next-line no-console
    console.error(`[Homepage/${this.props.label}]`, err);
  }
  render() {
    if (this.state.hasError) return <InlineFail label={`${this.props.label} crashed`} />;
    return this.props.children as any;
  }
}

/* -----------------------------------------------------------------------------
  SKELETONS
----------------------------------------------------------------------------- */
function SkeletonLine({ w = "w-3/4", amber = false }: { w?: string; amber?: boolean }) {
  return <div className={["h-3 rounded", amber ? "bg-amber-500/20" : "bg-white/10", w].join(" ")} />;
}

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-[30px] border border-white/12 bg-white/[0.055] p-10 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-10 rounded-2xl bg-white/10" />
        <div className="h-6 w-28 rounded-full bg-white/10" />
      </div>
      <div className="mt-6 h-7 w-64 rounded bg-white/10" />
      <div className="mt-4 space-y-2">
        <SkeletonLine w="w-5/6" />
        <SkeletonLine w="w-2/3" />
        <SkeletonLine w="w-1/2" />
      </div>
      <div className="mt-8 text-[10px] font-mono uppercase tracking-[0.3em] text-white/55">
        {label}
      </div>
    </div>
  );
}

function ContentShowcaseSkeleton() {
  return (
    <div className="rounded-[30px] border border-white/12 bg-white/[0.055] p-10">
      <div className="h-5 w-28 rounded bg-white/10 animate-pulse" />
      <div className="mt-4 h-7 w-56 rounded bg-white/10 animate-pulse" />
      <div className="mt-2 h-4 w-full max-w-md rounded bg-white/10 animate-pulse" />
      <div className="mt-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/12 bg-black/40 p-6 animate-pulse">
            <div className="h-3 w-32 rounded bg-white/10" />
            <div className="mt-4 h-5 w-5/6 rounded bg-white/10" />
            <div className="mt-3 space-y-2">
              <SkeletonLine w="w-5/6" />
              <SkeletonLine w="w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
  HOMEPAGE
----------------------------------------------------------------------------- */
const HomePage: NextPage<HomePageProps> = ({
  featuredShorts,
  featuredBriefing,
  events,
  counts,
  canonPrelude,
}) => {
  const heroCounts = {
    shorts: counts.shorts,
    canon: counts.canon,
    briefs: counts.briefs,
    library: counts.library,
  };

  const actions = [
    { href: "/canon", title: "Enter the Canon", description: "Doctrine, purpose, governance — compressed into one spine.", tag: "Primary" },
    { href: "/vault", title: "Open the Vault", description: "Deployables: templates, packs, operating assets engineered for execution.", tag: "Deploy" },
    { href: "/consulting/strategy-room", title: "Strategy Room", description: "For founders and leadership teams under pressure: architecture, cadence, decision rights.", tag: "Engage" },
  ];

  return (
    <Layout
      title="Abraham of London"
      description="Institutional doctrine, disciplined strategy, and practical resources for builders."
      canonicalUrl="/"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/assets/images/social/og-home.jpg" />
      </Head>

      <a
        href="#prelude"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-black focus:px-4 focus:py-3 focus:text-[12px] focus:font-mono focus:uppercase focus:tracking-widest focus:text-amber-100 focus:ring-2 focus:ring-amber-500"
      >
        Skip to Prelude
      </a>

      {/* HERO */}
      <section className="relative bg-black">
        <CinematicHero
          counts={heroCounts}
          onScroll={() => document.getElementById("prelude")?.scrollIntoView({ behavior: "smooth" })}
        />
      </section>

      {/* PRELUDE */}
      <Section id="prelude" variant="surface" cap="Prelude — system spine">
        <AnchorOffset id="prelude" />
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <HQHeader
            eyebrow="Prelude"
            title="The spine of the entire system."
            description="This is not a blog. It’s an institutional platform: doctrine → strategy → deployables."
            icon={<Layers className="h-4 w-4" />}
          />

          <ExecutiveRail
            items={[
              { href: "/canon", label: "Canon", icon: <Compass className="h-3.5 w-3.5" /> },
              { href: "/vault", label: "Vault", icon: <Vault className="h-3.5 w-3.5" /> },
              { href: "/library", label: "Library", icon: <Layers className="h-3.5 w-3.5" /> },
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

          <div className="mt-10">
            <Panel>
              <div className="p-6 md:p-10">
                <ModuleBoundary label="FunnelStrip">
                  <StrategicFunnelStrip />
                </ModuleBoundary>
              </div>
            </Panel>
          </div>
        </motion.div>
      </Section>

      <Bridge text="From doctrine → to credibility" />

      {/* CREDIBILITY */}
      <Section id="proof" variant="surface" cap="Credibility — withstands scrutiny">
        <AnchorOffset id="proof" />
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <HQHeader
            eyebrow="Credibility"
            title="Why this holds under pressure."
            description="If it can’t survive hostile cross-examination, it isn’t strategy — it’s theatre."
            icon={<ShieldCheck className="h-4 w-4" />}
          />

          <div className="mt-10 grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <Panel>
                <div className="p-6 md:p-10">
                  <div className="grid md:grid-cols-3 gap-8">
                    {[
                      { n: "01", t: "Doctrine-backed", d: "Coherent worldview, moral frame, and decision logic designed to survive scrutiny." },
                      { n: "02", t: "Systems-first", d: "Strategy as operating logic: cadence, controls, incentives, accountability loops." },
                      { n: "03", t: "Indexed library", d: `A living archive: ${counts.library} registry items plus Canon, briefs, and deployables.` },
                    ].map((x) => (
                      <div key={x.n} className="border-l border-amber-500/25 pl-5">
                        <div className="text-[10px] font-mono tracking-[0.28em] text-amber-300/90">{x.n}</div>
                        <div className="mt-2 text-white font-medium">{x.t}</div>
                        <div className="mt-2 text-white/70 text-sm leading-relaxed">{x.d}</div>
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
                      <div className="mt-4 font-serif text-2xl text-white">{featuredBriefing.title}</div>
                      <div className="mt-3 text-white/70 leading-relaxed">
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
                    <div className="mt-4 text-white/70 leading-relaxed">
                      Mark a briefing as <span className="text-white">featured</span> and it will appear here as the
                      on-deck operator card.
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          </div>
        </motion.div>
      </Section>

      <Bridge text="From credibility → to operators" />

      {/* WHO I WORK WITH */}
      <Section id="who" variant="default" cap="Operators — target audience">
        <AnchorOffset id="who" />
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <HQHeader
            eyebrow="Operators"
            title="Who this is built for."
            description="Founders and leaders who prefer standards over slogans — and execution over performance."
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
        </motion.div>
      </Section>

      <Bridge text="From operators → to engagement lanes" />

      {/* LANES */}
      <Section id="lanes" variant="surface" cap="Engagement — clean boundaries">
        <AnchorOffset id="lanes" />
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <HQHeader
            eyebrow="Engagement"
            title="Four lanes. No confusion."
            description="Public signals stay public. Private work stays private. The architecture scales without leaking."
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
        </motion.div>
      </Section>

      <Bridge text="From lanes → to next actions" />

      {/* PATHWAYS */}
      <Section id="pathways" variant="default" cap="Pathways — three moves">
        <AnchorOffset id="pathways" />
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <HQHeader
            eyebrow="Pathways"
            title="Three clean moves."
            description="If you’re new: don’t wander. Pick a lane and move."
            icon={<ArrowRight className="h-4 w-4" />}
          />

          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {actions.map((a) => (
              <Panel key={a.title}>
                <div className="p-6 md:p-8">
                  <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-300/85">{a.tag}</div>
                  <div className="mt-4 font-serif text-2xl text-white">{a.title}</div>
                  <div className="mt-3 text-white/70 leading-relaxed">{a.description}</div>
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

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { k: "Canon", v: counts.canon },
              { k: "Briefs", v: counts.briefs },
              { k: "Library", v: counts.library },
              { k: "Dispatches", v: counts.shorts },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl border border-white/12 bg-white/[0.055] p-5 text-center">
                <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/65">{x.k}</div>
                <div className="mt-2 font-serif text-3xl text-amber-300">{x.v}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </Section>

      <Bridge text="From actions → to events and assets" />

      {/* EVENTS — ALWAYS RENDER (no gating) */}
      <Section id="events" variant="surface" cap="Events — live rooms">
        <AnchorOffset id="events" />
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <HQHeader
            eyebrow="Events"
            title="Salons, briefings, live rooms."
            description="Where doctrine meets operators. Built for clarity, not crowd-pleasing."
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
        </motion.div>
      </Section>

      {/* VAULT */}
      <Section id="vault" variant="default" cap="Vault — deployables">
        <AnchorOffset id="vault" />
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <HQHeader
            eyebrow="Vault"
            title="Deployables for serious execution."
            description="Templates, packs, and operating assets engineered for reuse — not decoration."
            icon={<Layers className="h-4 w-4" />}
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
        </motion.div>
      </Section>

      <Bridge text="From deployables → to intelligence feed" />

      {/* FEATURED BRIEFING */}
      {featuredBriefing && (
        <Section id="briefing" variant="surface" cap="Briefing — operator intelligence">
          <AnchorOffset id="briefing" />
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <HQHeader
              eyebrow="Briefing"
              title="Operator-grade intelligence."
              description="Focused transmission: clarity that survives hostile scrutiny."
              icon={<ShieldCheck className="h-4 w-4" />}
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
          </motion.div>
        </Section>
      )}

      {/* DISPATCHES */}
      {featuredShorts.length > 0 && (
        <Section id="dispatches" variant="default" cap="Dispatches — rapid intel">
          <AnchorOffset id="dispatches" />
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <HQHeader
              eyebrow="Dispatches"
              title="Short, sharp intelligence notes."
              description="Engineered for retrieval and reuse — fast, crisp, disciplined."
              icon={<Sparkles className="h-4 w-4" />}
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
          </motion.div>
        </Section>
      )}

      <Bridge text="From content → to ventures" />

      {/* VENTURES — ALWAYS RENDER (no gating) */}
      <Section id="ventures" variant="surface" cap="Ventures — institutions in motion">
        <AnchorOffset id="ventures" />
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <HQHeader
            eyebrow="Ventures"
            title="Institutions don’t remain ideas."
            description="The platform supports real work: ventures, systems, and deployable infrastructure."
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
        </motion.div>
      </Section>

      {/* CLOSE */}
      <Section id="close" variant="default" cap="Close — institutional seal">
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="mx-auto max-w-5xl">
            <Panel>
              <div className="p-6 md:p-10">
                <ModuleBoundary label="InstitutionalClose">
                  <InstitutionalClose />
                </ModuleBoundary>
              </div>
            </Panel>
          </div>
        </motion.div>
      </Section>
    </Layout>
  );
};

/* ============================================================================
  DATA FETCHING (same logic)
============================================================================ */
import fs from "fs";
import path from "path";

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
  return Boolean(d?.featured === true || d?.isFeatured === true || d?.home === true || d?.showOnHome === true || d?.homepage === true);
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

  const date = d?.eventDate || d?.date || d?.startDate || d?.datetime || d?.start || d?.startsAt || null;
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
    const downloadsDocs = stableDocs.filter((d) => kindLower(d) === "download" || flattenedPath(d).startsWith("downloads/"));

    counts.shorts = shortsDocs.length;
    counts.canon = canonDocs.length;
    counts.briefs = briefsDocs.length;
    counts.downloads = downloadsDocs.length;

    const books = Array.isArray((dataForBooks as any)?.allBooks) ? (dataForBooks as any).allBooks : [];
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
    if (typeof getContentlayerData !== "function") throw new Error("getContentlayerData missing");
    const data = getContentlayerData();
    const docs = collectAnyDocs(data);
    computeFromDocs(docs, data);
    if (shouldForceFallback(counts, docs.length)) throw new Error("FORCE_FALLBACK_TO_GENERATED");
  } catch {
    try {
      const gen: any = await import("contentlayer/generated");
      const docs = collectAnyDocs(gen);
      computeFromDocs(docs, gen);
    } catch {
      // keep fallback props
    }
  }

  return {
    props: sanitizeData({ featuredShorts, featuredBriefing, events, counts, canonPrelude }),
    revalidate: 3600,
  };
};

export default HomePage;