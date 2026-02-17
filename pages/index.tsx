// pages/index.tsx — INSTITUTIONAL HOMEPAGE (Harrods meets McKinsey finish)
// BULLETPROOF: single content source (getContentlayerData) + deterministic transforms + safe fallbacks
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import fs from "fs";
import path from "path";

import {
  HeroSection,
  TrustSignals,
  StatsBar,
  CanonInstitutionalIntro,
  StrategicFunnelStrip,
  VaultTeaserRail,
  OperatorBriefing,
  ContentShowcase,
  EventsSection,
  InstitutionalClose,
} from "@/components/homepage";

import VenturesSection from "@/components/homepage/VenturesSection";
import { joinHref, normalizeSlug, sanitizeData, isDraftContent } from "@/lib/content/shared";
import type { CanonPrelude } from "@/components/homepage/CanonInstitutionalIntro";

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
  // Compare on date boundary (not time) to avoid “today becomes past at midnight” confusion.
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
   Section System (unchanged)
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
  const py = tight ? "py-16 md:py-20" : "py-20 md:py-24";
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
        <div className="pointer-events-none absolute inset-0 opacity-[0.035]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(212,175,55,0.55),transparent_58%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_72%,rgba(212,175,55,0.25),transparent_58%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 md:pt-24">
          <HeroSection counts={counts as any} />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10 md:mt-12">
          <Hairline />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-16">
          <TrustSignals />
        </div>

        <StatsBar />
      </section>

      {/* CANON INTRO */}
      <Section id="canon" tight border>
        <div className="mx-auto max-w-6xl">
          <CanonInstitutionalIntro prelude={canonPrelude} />
        </div>
      </Section>

      {/* STRATEGIC FUNNEL */}
      <Section id="strategy" tight border surface>
        <StrategicFunnelStrip />
      </Section>

      {/* VAULT TEASER */}
      <Section id="vault" tight border>
        <VaultTeaserRail />
      </Section>

      {/* VENTURES */}
      <Section id="ventures" tight border surface>
        <VenturesSection />
      </Section>

      {/* FEATURED BRIEFING */}
      {featuredBriefing && (
        <Section tight border>
          <OperatorBriefing featured={featuredBriefing as any} />
        </Section>
      )}

      {/* SHORTS SHOWCASE */}
      {hasShorts && (
        <Section tight border>
          <ContentShowcase items={featuredShorts as any} />
        </Section>
      )}

      {/* EVENTS */}
      {events.length > 0 ? (
        <Section id="events" tight border>
          <EventsSection events={events as any} />
        </Section>
      ) : (
        <Section id="events" tight border>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 sm:p-12 md:p-16 backdrop-blur-sm">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-[8px] font-mono uppercase tracking-[0.4em] text-amber-500/50 bg-amber-500/5 px-3 py-1.5 rounded-full border border-amber-500/10">
                Events Registry
              </span>
              <h2 className="mt-6 font-serif text-3xl md:text-4xl text-white/90">
                The calendar is being indexed.
              </h2>
              <p className="mt-4 text-sm md:text-base text-white/45 leading-relaxed max-w-2xl mx-auto">
                When sessions go live, they appear here first—quietly, clearly, and with enough context to decide.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/events"
                  className="group px-8 py-3.5 rounded-full border border-white/10 bg-white/[0.02] text-[10px] font-mono uppercase tracking-[0.3em] text-white/70 hover:text-white hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                >
                  <span className="group-hover:tracking-[0.35em] transition-all">View Events</span>
                </a>
                <a
                  href="/contact"
                  className="px-8 py-3.5 rounded-full bg-amber-600 text-[10px] font-mono uppercase tracking-[0.3em] text-white hover:bg-amber-700 hover:tracking-[0.35em] transition-all shadow-lg shadow-amber-900/20"
                >
                  Request a Session
                </a>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* INSTITUTIONAL CLOSE */}
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
   getStaticProps — SSOT via getContentlayerData()
============================================================================ */
function readLibraryCount(): number {
  try {
    const jsonPath = path.join(process.cwd(), "public", "pdfs", "registry.json");
    if (!fs.existsSync(jsonPath)) return 0;

    const raw = fs.readFileSync(jsonPath, "utf8");
    const parsed = JSON.parse(raw);

    const arr =
      Array.isArray(parsed?.items) ? parsed.items :
      Array.isArray(parsed) ? parsed :
      [];

    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
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

  try {
    // ✅ Single source of truth (same loader /events uses)
    const mod: any = await import("@/lib/content/server");
    const getContentlayerData = mod?.getContentlayerData;

    if (typeof getContentlayerData !== "function") {
      throw new Error("getContentlayerData() not available from '@/lib/content/server'");
    }

    const data = getContentlayerData();

    // Merge everything into one docs array for consistent filtering/transforms
    const docs: any[] = Array.isArray(data?.allDocuments) ? data.allDocuments : [];

    const stableDocs = docs.filter((d) => !isDraftContent(d));

    // Counts
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

    // Canon Prelude: source-lock by flattenedPath (Contentlayer stable)
    const books = Array.isArray(data?.allBooks) ? data.allBooks : [];
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

    // Events: pull from allEvents directly (no accidental exclusion)
    const rawEvents = Array.isArray(data?.allEvents) ? data.allEvents : [];
    events = rawEvents.map(toEvent).filter(Boolean) as EventItem[];
    events = events
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 6);

    // Featured items (shorts/briefs/posts) — deterministic
    const candidates = stableDocs.map(toItem).filter(Boolean) as FeaturedItem[];

    const featured = candidates.filter((x) => {
      // Find original doc for this item to read flags (featured/home/showOnHome)
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
  } catch (err) {
    console.error("[Home/getStaticProps] non-fatal:", err);
  }

  return {
    props: sanitizeData({ featuredShorts, featuredBriefing, events, counts, canonPrelude }),
    revalidate: 3600,
  };
};

export default HomePage;