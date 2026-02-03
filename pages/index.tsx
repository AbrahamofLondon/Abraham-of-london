// pages/index.tsx — GREEN / BUILD‑PROOF / CONVERSION‑LED HOMEPAGE
// Pages Router • Netlify‑safe • Contentlayer‑safe

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import clsx from "clsx";
import { motion } from "framer-motion";

import {
  ArrowRight,
  BookOpen,
  Layers,
  Shield,
  Zap,
  Lock,
  Globe,
  BadgeCheck,
  Building2,
  GraduationCap,
  Newspaper,
  ChevronRight,
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
  MOTION PRESETS (SAFE, PREDICTABLE)
----------------------------------------------------------------------------- */

const easeOutQuint: any = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.6, ease: easeOutQuint },
  }),
};

const glowIn = {
  hidden: { opacity: 0, scale: 0.985 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: easeOutQuint } },
};

/* -----------------------------------------------------------------------------
  TRUST STRIP — VISUAL AUTHORITY + CONVERSION SIGNALS
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
      title: "Institutional‑grade doctrine",
      desc: "Operating systems, not opinions. Built for governance cadence and decision velocity.",
    },
    {
      icon: GraduationCap,
      title: "Education & Research",
      desc: "Frameworks and proofs you can teach, defend, and deploy.",
    },
    {
      icon: Newspaper,
      title: "Media‑ready clarity",
      desc: "Briefings engineered to travel across serious platforms.",
    },
    {
      icon: BadgeCheck,
      title: "Private‑client standard",
      desc: "Discreet. Structured. Outcome‑oriented.",
    },
  ];

  return (
    <section
      className={clsx(
        "relative bg-black py-24 border-y border-white/[0.05] overflow-hidden",
        className
      )}
    >
      {/* ambient grid */}
      <div className="absolute inset-0 bg-grid-technical mask-radial-fade opacity-15 pointer-events-none" />

      {/* authority glow */}
      <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[720px] w-[980px] -translate-x-1/2 rounded-full bg-amber-500/12 blur-[170px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-500/70">
              TRUST SIGNALS
            </div>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl text-white font-bold leading-tight">
              Built to be taken seriously — at first glance.
            </h2>
            <p className="mt-4 text-white/45 leading-relaxed">
              This is not content marketing. It is an operating environment: doctrine, artifacts, and
              briefings for leaders who don’t have time for fluff.
            </p>
          </div>

          <Link
            href="/resources"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-7 py-3 text-xs font-black uppercase tracking-[0.22em] text-white hover:border-amber-500/40 hover:bg-white/[0.08] transition"
          >
            Enter the Vault <ArrowRight className="h-4 w-4 opacity-70" />
          </Link>
        </div>

        <div className="mt-14 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
          <LogoWall logos={logos} minSize={180} gapClass="gap-10" ariaLabel="Abraham of London divisions" />
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {signals.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-7"
            >
              <s.icon className="h-6 w-6 text-amber-500/80" />
              <div className="mt-5 text-xs font-black uppercase tracking-widest text-white/90">
                {s.title}
              </div>
              <p className="mt-3 text-sm text-white/40 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------------
  PAGE
----------------------------------------------------------------------------- */

const HomePage: NextPage<HomePageProps> = ({ featuredShorts }) => {
  return (
    <Layout
      title="Abraham of London | Strategic Architecture"
      description="Canon‑rooted doctrine, frameworks, and deployable assets for high‑stakes execution."
      ogImage="https://www.abrahamoflondon.org/api/og/short?title=Strategic%20Architecture&category=SYSTEM"
      canonicalUrl="/"
    >
      <Head>
        <meta property="og:type" content="website" />
      </Head>

      {/* HERO */}
      <div className="relative overflow-hidden bg-black">
        <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[720px] w-[980px] -translate-x-1/2 rounded-full bg-amber-500/14 blur-[180px]" />

        <div className="pointer-events-none absolute inset-0 opacity-[0.14]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.14),transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:56px_56px]" />
        </div>

        <HeroSection />
        <TrustStrip />

        {/* SIGNAL BAR */}
        <div className="relative border-t border-white/10 bg-black/80 backdrop-blur">
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
                <div className="text-[10px] font-black uppercase tracking-[0.34em] text-white/80">
                  Institutional doctrine · Canon · Vault · Deployables
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <SignalPill icon={Shield} label="Governance" hint="Cadence · Failure modes" />
                <SignalPill icon={Layers} label="Frameworks" hint="Decision systems" />
                <SignalPill icon={Lock} label="Inner Circle" hint="Gated assets" />
                <SignalPill icon={Globe} label="Execution" hint="Board‑level clarity" />
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

                <motion.p custom={2} variants={fadeUp} className="mt-8 text-lg md:text-xl text-white/45">
                  The <span className="text-white/80 font-medium">Canon</span> defines the architecture.
                  The <span className="text-white/80 font-medium">Vault</span> ships deployables.
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
                body="The strategic doctrine: meaning, governance, cadence, decision logic."
                href="/canon/the-architecture-of-human-purpose"
                cta="Open the Mini‑Book"
              />
              <PremiumCard
                icon={Layers}
                eyebrow="Frameworks"
                title="Strategic Frameworks"
                body="Models, matrices, and operating systems built for control."
                href="/strategy"
                cta="Browse the System"
              />
              <PremiumCard
                icon={Zap}
                eyebrow="Vault"
                title="Deployable Artifacts"
                body="Assets you can actually deploy — and why the Inner Circle exists."
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
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  UI ATOMS
----------------------------------------------------------------------------- */

function SignalPill({ icon: Icon, label, hint }: { icon: any; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
      <Icon className="h-4 w-4 text-amber-500/80" />
      <div className="leading-tight">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/75">{label}</div>
        <div className="text-[11px] text-white/40">{hint}</div>
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
      className="group relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.03] p-8 transition hover:border-amber-500/40"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-500/12 blur-[80px]" />
      </div>

      <div className="relative">
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-2xl border border-white/10 bg-amber-500/10 p-3 text-amber-500">
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-500/70">{eyebrow}</div>
        </div>

        <div className="font-serif text-2xl leading-tight text-white/90 group-hover:text-white">{title}</div>
        <p className="mt-3 text-sm leading-relaxed text-white/40">{body}</p>

        <div className="mt-8 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/60 group-hover:text-amber-500">
          {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

/* -----------------------------------------------------------------------------
  DATA FETCHING (SERVER‑ONLY, SAFE)
----------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const featuredShorts: FeaturedShort[] = [];

  try {
    const mod: any = await import("@/lib/content/server");
    const getAll = mod?.getAllContentlayerDocs;

    if (typeof getAll === "function") {
      const docs = getAll() || [];

      const shorts = docs
        .filter((d: any) => {
          const kind = String(d?.kind || d?.type || "").toLowerCase();
          const fp = String(d?._raw?.flattenedPath || "").toLowerCase();
          return (kind === "short" || fp.startsWith("shorts/")) && !isDraftContent(d);
        })
        .sort((a: any, b: any) => (new Date(b?.date).getTime() || 0) - (new Date(a?.date).getTime() || 0))
        .slice(0, 8);

      for (const s of shorts) {
        const raw = s?.slug || s?._raw?.flattenedPath || "";
        const bare = normalizeSlug(String(raw)).replace(/^shorts\//, "");

        featuredShorts.push({
          title: String(s?.title || "Untitled Briefing"),
          slug: bare,
          excerpt: s?.excerpt || s?.description || null,
          href: joinHref("shorts", bare),
          dateISO: s?.date ? new Date(s.date).toISOString() : null,
          theme: String(s?.theme || "Intel"),
        });
      }
    }
  } catch (err) {
    console.error("[Home/getStaticProps] non‑fatal:", err);
  }

  return { props: { featuredShorts }, revalidate: 3600 };
};

export default HomePage;