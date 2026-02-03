// pages/canon/index.tsx — MVP INSTITUTIONAL EDITION (BUILD-SAFE, CONVERSION-ORIENTED)
/* eslint-disable react/no-unescaped-entities */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  BookOpen,
  Lock,
  Unlock,
  Users,
  Calendar,
  Clock,
  ChevronRight,
  Sparkles,
  Award,
  Layers,
  Target,
  Compass,
  Building2,
  Castle,
  ScrollText,
  Library,
} from "lucide-react";

import Layout from "@/components/Layout";
import { safeSlice, safeArraySlice } from "@/lib/utils/safe";

// ============================================================================
// TYPES
// ============================================================================

type AccessLevel = "public" | "inner-circle" | "private";

type CanonItem = {
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  slug: string;
  href: string;
  accessLevel: AccessLevel;
  coverImage: string | null;
  dateISO: string | null;
  readTime: string | null;
  tags: string[];
  category: string | null;
  volume: string | null;
  featured: boolean;
  isTeachingEdition: boolean;
  volumeNumber: number | null;
};

type CanonSeries = {
  volume: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  items: CanonItem[];
  color: string;
};

type CanonIndexProps = {
  items: CanonItem[];
  counts: { total: number; public: number; inner: number; private: number };
  featuredItems: CanonItem[];
  series: CanonSeries[];
  teachingEditions: CanonItem[];
};

// ============================================================================
// CONSTANTS
// ============================================================================

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

// ============================================================================
// SMALL HELPERS
// ============================================================================

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function safeNormalizeSlug(input: string): string {
  try {
    return (input || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function safeIsDraftContent(doc: any): boolean {
  try {
    return Boolean(doc?.draft || doc?.status === "draft");
  } catch {
    return false;
  }
}

function safeSanitizeData<T>(data: T): T {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return data;
  }
}

function toAccessLevel(v: unknown): AccessLevel {
  try {
    const n = String(v || "").trim().toLowerCase();
    if (["inner-circle", "innercircle", "members"].includes(n)) return "inner-circle";
    if (["private", "draft", "restricted"].includes(n)) return "private";
    return "public";
  } catch {
    return "public";
  }
}

function safeGetAccessLevel(doc: any): string {
  try {
    if (!doc) return "public";

    // explicit fields
    if (doc.access === "inner-circle" || doc.access === "members") return "inner-circle";
    if (doc.access === "private" || doc.access === "restricted") return "private";

    // tags-based inference
    const tags = Array.isArray(doc.tags) ? doc.tags.map((t: any) => String(t).toLowerCase()) : [];
    if (tags.includes("inner-circle") || tags.includes("members")) return "inner-circle";
    if (tags.includes("private") || tags.includes("restricted")) return "private";

    // category-based inference
    const category = String(doc.category || "").toLowerCase();
    if (category.includes("inner-circle")) return "inner-circle";

    return "public";
  } catch {
    return "public";
  }
}

function accessBadge(level: AccessLevel) {
  switch (level) {
    case "public":
      return {
        label: "Public",
        icon: Unlock,
        className: "border-amber-500/30 bg-amber-500/10 text-amber-200",
        iconColor: "text-amber-300",
      };
    case "inner-circle":
      return {
        label: "Inner Circle",
        icon: Users,
        className: "border-amber-500/20 bg-amber-900/20 text-amber-200/90",
        iconColor: "text-amber-400",
      };
    case "private":
      return {
        label: "Private",
        icon: Lock,
        className: "border-white/10 bg-white/5 text-gray-300/80",
        iconColor: "text-gray-300/70",
      };
    default:
      return {
        label: "Public",
        icon: Unlock,
        className: "border-amber-500/30 bg-amber-500/10 text-amber-200",
        iconColor: "text-amber-300",
      };
  }
}

function extractVolumeNumber(title: string): number | null {
  try {
    const romanMatch = title.match(/Volume[-\s]([IVXLCDM]+)/i);
    if (romanMatch) {
      const roman = romanMatch[1].toUpperCase();
      const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
      let total = 0;
      let previous = 0;
      for (let i = roman.length - 1; i >= 0; i--) {
        const current = values[roman[i]];
        total += current < previous ? -current : current;
        previous = current;
      }
      return total;
    }
    const numberMatch = title.match(/Volume[-\s](\d+)/i);
    if (numberMatch) return parseInt(numberMatch[1], 10);
    return null;
  } catch {
    return null;
  }
}

function safeDateISO(d: any): string | null {
  try {
    if (!d) return null;
    const t = new Date(d).getTime();
    if (!Number.isFinite(t) || t <= 0) return null;
    return new Date(t).toISOString();
  } catch {
    return null;
  }
}

function fmtDate(iso: string | null): string | null {
  try {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t) || t <= 0) return null;
    return new Date(t).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return null;
  }
}

function resolveCanonSlug(doc: any): string {
  try {
    const raw = doc?.slugComputed || doc?.slug || doc?._raw?.flattenedPath || "";
    return safeNormalizeSlug(raw);
  } catch {
    return "";
  }
}

function resolveCanonHref(slug: string): string {
  try {
    const s = slug.replace(/^canon\//, "");
    return `/canon/${s}`;
  } catch {
    return "/canon";
  }
}

function inferIsTeachingEdition(title: string): boolean {
  return String(title || "").toLowerCase().includes("teaching edition");
}

// ============================================================================
// DATA LOADING (BUILD-SAFE: primary -> fallback)
// ============================================================================

export const getStaticProps: GetStaticProps<CanonIndexProps> = async () => {
  try {
    let data: any = { allCanons: [], allDocuments: [] };
    let allPublished: any[] = [];

    try {
      const contentModule = await import("@/lib/content");

      if (contentModule.getContentlayerData) {
        data = (await contentModule.getContentlayerData()) || { allCanons: [], allDocuments: [] };
      }
      if (contentModule.getPublishedDocuments) {
        allPublished = contentModule.getPublishedDocuments() || [];
      }
    } catch {
      // Fallback to generated
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const generated = await import("contentlayer/generated");
        const docs = generated?.allDocuments || [];
        allPublished = Array.isArray(docs) ? docs : [];

        data.allCanons = allPublished.filter((doc: any) => {
          try {
            const dir = String(doc._raw?.sourceFileDir || "").toLowerCase();
            return dir.includes("canon") || dir.includes("volumes");
          } catch {
            return false;
          }
        });
      } catch {
        // hard fail -> empty dataset
      }
    }

    const canonPrimary = Array.isArray(data.allCanons) ? data.allCanons : [];

    const canonSecondary = (Array.isArray(allPublished) ? allPublished : []).filter((doc: any) => {
      try {
        const fp = String(doc?._raw?.flattenedPath || "").toLowerCase();
        const tags = Array.isArray(doc?.tags) ? doc.tags.map((t: string) => String(t).toLowerCase()) : [];
        const cat = String(doc?.category || "").toLowerCase();
        const urlish = String(doc?.url || "").toLowerCase();
        return fp.startsWith("canon/") || tags.includes("canon") || tags.includes("volume") || cat.includes("canon") || urlish.includes("/canon/");
      } catch {
        return false;
      }
    });

    const seen = new Set<string>();
    const merged = [...canonPrimary, ...canonSecondary].filter((d: any) => {
      try {
        const k = resolveCanonSlug(d);
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      } catch {
        return false;
      }
    });

    const items: CanonItem[] = merged
      .filter((c: any) => c && !safeIsDraftContent(c))
      .map((c: any) => {
        const slug = resolveCanonSlug(c);
        const title = c?.title || "Untitled Canon";
        const isTeachingEdition = inferIsTeachingEdition(title);
        const volumeNumber = extractVolumeNumber(title);

        return {
          title,
          subtitle: c?.subtitle || null,
          excerpt: c?.excerpt || c?.description || null,
          coverImage: c?.coverImage || null,
          slug,
          href: resolveCanonHref(slug),
          accessLevel: toAccessLevel(safeGetAccessLevel(c)),
          dateISO: safeDateISO(c?.date),
          readTime: c?.readTime || null,
          tags: Array.isArray(c?.tags) ? c.tags.filter((x: any) => typeof x === "string") : [],
          category: c?.category || null,
          volume: c?.volume || null,
          featured: Boolean(c?.featured),
          isTeachingEdition,
          volumeNumber,
        };
      })
      .filter((x) => x.slug)
      .sort((a, b) => {
        // Teaching Editions last; featured earlier; then volume order; then date desc
        if (a.isTeachingEdition && !b.isTeachingEdition) return 1;
        if (!a.isTeachingEdition && b.isTeachingEdition) return -1;

        if (a.volumeNumber !== null && b.volumeNumber !== null) return a.volumeNumber - b.volumeNumber;

        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;

        const da = a.dateISO ? new Date(a.dateISO).getTime() : 0;
        const db = b.dateISO ? new Date(b.dateISO).getTime() : 0;
        return db - da || a.title.localeCompare(b.title);
      });

    const volumeSeries: Record<string, CanonItem[]> = {};
    for (const item of items) {
      if (item.volumeNumber !== null && !item.isTeachingEdition) {
        const key = `Volume ${item.volumeNumber}`;
        (volumeSeries[key] ||= []).push(item);
      }
    }

    const series: CanonSeries[] = [
      {
        volume: "Volume I",
        title: "Foundations of Purpose",
        description: "First principles: purpose, mandate, meaning, moral architecture.",
        icon: Target,
        items: volumeSeries["Volume 1"] || [],
        color: "from-amber-500/18 via-amber-500/8 to-transparent",
      },
      {
        volume: "Volume II",
        title: "Governance & Formation",
        description: "Rules, routines, and structures that survive pressure and personality.",
        icon: Building2,
        items: volumeSeries["Volume 2"] || [],
        color: "from-sky-500/16 via-sky-500/7 to-transparent",
      },
      {
        volume: "Volume III",
        title: "Civilisation & Legacy",
        description: "Institutions, continuity, civilisational incentives, generational systems.",
        icon: Castle,
        items: volumeSeries["Volume 3"] || [],
        color: "from-fuchsia-500/16 via-fuchsia-500/7 to-transparent",
      },
      {
        volume: "Volume IV",
        title: "Stewardship & Continuity",
        description: "Sustaining systems over time: stewardship, succession, resilience.",
        icon: Compass,
        items: volumeSeries["Volume 4"] || [],
        color: "from-emerald-500/16 via-emerald-500/7 to-transparent",
      },
      {
        volume: "Volume X",
        title: "Future Civilisation",
        description: "Arc-of-future thinking: how civilisations bend — and how builders steer.",
        icon: Layers,
        items: volumeSeries["Volume 10"] || [],
        color: "from-rose-500/16 via-rose-500/7 to-transparent",
      },
    ].filter((s) => s.items.length > 0);

    const counts = items.reduce(
      (acc, it) => {
        acc.total += 1;
        if (it.accessLevel === "public") acc.public += 1;
        else if (it.accessLevel === "inner-circle") acc.inner += 1;
        else acc.private += 1;
        return acc;
      },
      { total: 0, public: 0, inner: 0, private: 0 }
    );

    const featuredItems = safeArraySlice(
      items.filter((x) => x.featured && x.accessLevel !== "private"),
      0,
      6
    );

    const teachingEditions = safeArraySlice(
      items.filter((x) => x.isTeachingEdition && x.accessLevel === "public"),
      0,
      4
    );

    return {
      props: safeSanitizeData({ items, counts, featuredItems, series, teachingEditions }),
      revalidate: 1800,
    };
  } catch {
    return {
      props: {
        items: [],
        counts: { total: 0, public: 0, inner: 0, private: 0 },
        featuredItems: [],
        series: [],
        teachingEditions: [],
      },
      revalidate: 60,
    };
  }
};

// ============================================================================
// PAGE
// ============================================================================

const CanonIndexPage: NextPage<CanonIndexProps> = ({ items, counts, featuredItems, series, teachingEditions }) => {
  const title = "The Canon";
  const description =
    "Foundational work on purpose, governance, civilisation, and legacy — organised for builders, not browsers.";
  const canonicalUrl = `${SITE}/canon`;

  const hasAnyContent =
    items.length > 0 || series.length > 0 || featuredItems.length > 0 || teachingEditions.length > 0;

  const publicItems = items.filter((i) => i.accessLevel === "public" && !i.isTeachingEdition);
  const innerCircleItems = items.filter((i) => i.accessLevel === "inner-circle");

  // “Truthful” stats: no fake metrics.
  const lastUpdatedISO =
    items.map((x) => x.dateISO).filter(Boolean).sort().reverse()[0] || null;
  const lastUpdatedLabel = fmtDate(lastUpdatedISO);

  if (!hasAnyContent) {
    return (
      <Layout title={title} description={description} fullWidth>
        <Head>
          <title>{title} | Abraham of London</title>
          <meta name="description" content={description} />
          <link rel="canonical" href={canonicalUrl} />
        </Head>

        <section className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="text-center p-8 max-w-md">
            <ScrollText className="w-16 h-16 text-amber-400/50 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">The Canon</h1>
            <p className="text-gray-400 mb-8">
              The Canon library is being updated. Check back soon.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/30 px-6 py-3 text-amber-200 hover:bg-amber-500/30 transition-colors"
            >
              Return Home <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout title={title} description={description} fullWidth>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={`${title} | Abraham of London`} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
      </Head>

      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-black text-white">
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(212,175,55,0.10),transparent_52%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_40%,rgba(59,130,246,0.08),transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/55 to-black" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2">
              <ScrollText className="w-4 h-4 text-amber-200" />
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
                Doctrine · Strategy · Civilisation
              </span>
            </div>

            <h1 className="mt-8 font-serif text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              The Canon
            </h1>

            <p className="mt-6 text-lg md:text-xl leading-relaxed text-white/75 max-w-3xl">
              The foundational architecture behind Abraham of London: purpose, governance, continuity, and legacy.
              Not “content”. A body of work — designed to outlive platform cycles.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/books/the-architecture-of-human-purpose"
                className="group inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-8 py-4 text-sm font-black text-black transition hover:scale-[1.02]"
              >
                <BookOpen className="w-5 h-5" />
                Start with the Prelude
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="#series"
                className="inline-flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-bold text-white/85 hover:bg-white/10 hover:border-white/25 transition"
              >
                <Layers className="w-5 h-5" />
                Explore the Series
              </Link>

              <Link
                href="#pathway"
                className="inline-flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-950/20 px-8 py-4 text-sm font-bold text-amber-200 hover:bg-amber-950/30 transition"
              >
                <Compass className="w-5 h-5" />
                How to Use the Canon
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
              <Stat label="Public Volumes" value={counts.public} tone="amber" />
              <Stat label="Series Active" value={series.length} tone="neutral" />
              <Stat label="Teaching Editions" value={teachingEditions.length} tone="amberSoft" />
              <Stat label="Last Updated" value={lastUpdatedLabel || "—"} tone="blue" />
            </div>

            {/* Trust strip */}
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/70">
                <span className="inline-flex items-center gap-2">
                  <Library className="w-4 h-4 text-amber-200/90" />
                  Structured volumes (not posts)
                </span>
                <span className="inline-flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-200/90" />
                  “Start here” entry points
                </span>
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-200/90" />
                  Built for builders, not browsers
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERIES */}
      {series.length > 0 && (
        <section id="series" className="py-20 border-b border-white/10 bg-black text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <Layers className="w-4 h-4 text-amber-200" />
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/75">
                  The Series
                </span>
              </div>

              <h2 className="mt-6 font-serif text-3xl md:text-4xl font-bold">
                Architectural blueprints
              </h2>

              <p className="mt-4 text-white/70 max-w-3xl mx-auto text-lg">
                Each series is a lane in the same highway: purpose → governance → civilisation → continuity.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {series.map((s) => {
                const SeriesIcon = s.icon;
                const primaryItem = s.items[0];

                return (
                  <div
                    key={s.volume}
                    className={cx(
                      "group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition",
                      "hover:border-white/20 hover:-translate-y-0.5"
                    )}
                  >
                    <div className={cx("absolute inset-0 opacity-80 bg-gradient-to-br", s.color)} />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 backdrop-blur-sm">
                          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white">
                            {s.volume}
                          </span>
                          <span className="text-xs text-white/55">
                            {s.items.length} item{s.items.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <SeriesIcon className="w-8 h-8 text-white/15 group-hover:text-white/25 transition" />
                      </div>

                      <h3 className="mt-6 font-serif text-2xl font-bold">{s.title}</h3>
                      <p className="mt-3 text-white/70">{s.description}</p>

                      {primaryItem ? (
                        <Link
                          href={primaryItem.href}
                          className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-amber-200 hover:text-amber-100"
                        >
                          Explore {s.volume} <ChevronRight className="w-4 h-4" />
                        </Link>
                      ) : null}

                      <div className="mt-8 pt-6 border-t border-white/10 text-xs text-white/55">
                        Includes:{" "}
                        {safeArraySlice(s.items, 0, 3)
                          .map((it) => it.title.split("—")[0].split("–")[0].trim())
                          .join(", ")}
                        {s.items.length > 3 ? ` +${s.items.length - 3} more` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* PATHWAY */}
      <section id="pathway" className="py-20 border-b border-white/10 bg-gradient-to-b from-black to-amber-950/10 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2">
              <Compass className="w-4 h-4 text-amber-200" />
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
                Pathway
              </span>
            </div>
            <h2 className="mt-6 font-serif text-3xl md:text-4xl font-bold">How to use the Canon</h2>
            <p className="mt-4 text-white/70 max-w-3xl mx-auto text-lg">
              If you treat this like a blog, you’ll waste it. Use it like a manual.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <PathCard
              step="Step 1"
              title="Start with Foundations"
              body="Read the Prelude and Volume I. Get the operating philosophy before you chase tactics."
              hint="Recommended: Volume I first."
              icon={Target}
            />
            <PathCard
              step="Step 2"
              title="Build the governance layer"
              body="Move to Volume II. Most people fail here: no structure, no cadence, no decision hygiene."
              hint="Volume II: Governance & Formation."
              icon={Building2}
            />
            <PathCard
              step="Step 3"
              title="Apply with Teaching Editions"
              body="Use Teaching Editions to convert principles into actions, templates, and live systems."
              hint="Implementation-first."
              icon={BookOpen}
            />
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/books/the-architecture-of-human-purpose"
              className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-8 py-4 text-sm font-black text-black hover:from-amber-300 hover:to-amber-500 transition"
            >
              <BookOpen className="w-5 h-5" />
              Read the Prelude
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featuredItems.length > 0 && (
        <section className="py-20 border-b border-white/10 bg-black text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2">
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
                  Entry Points
                </span>
              </div>
              <h2 className="mt-6 font-serif text-3xl md:text-4xl font-bold">Start here</h2>
              <p className="mt-3 text-white/70">Essential foundations — chosen for maximum clarity.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredItems.map((item) => {
                const b = accessBadge(item.accessLevel);
                const BadgeIcon = b.icon;

                return (
                  <Link
                    key={item.slug}
                    href={item.href}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition hover:border-amber-500/30 hover:bg-white/[0.05]"
                  >
                    <div className="absolute right-4 top-4">
                      <div className="flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1.5 backdrop-blur-sm">
                        <Award className="w-3 h-3 text-amber-200" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">
                          Essential
                        </span>
                      </div>
                    </div>

                    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${b.className}`}>
                      <BadgeIcon className={`w-3 h-3 ${b.iconColor}`} />
                      <span className="text-[10px] font-black uppercase tracking-wider">{b.label}</span>
                    </div>

                    <h3 className="mt-6 font-serif text-2xl font-bold group-hover:text-amber-200 transition">
                      {item.title}
                    </h3>

                    {item.subtitle ? (
                      <p className="mt-2 text-sm font-medium text-white/60">{item.subtitle}</p>
                    ) : null}

                    {item.excerpt ? (
                      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/70 group-hover:text-white/75">
                        {item.excerpt}
                      </p>
                    ) : null}

                    <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6 text-xs">
                      <div className="flex items-center gap-4 text-white/55">
                        {fmtDate(item.dateISO) ? (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {fmtDate(item.dateISO)}
                          </span>
                        ) : null}
                        {item.readTime ? (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {item.readTime}
                          </span>
                        ) : null}
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/55 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* TEACHING EDITIONS */}
      {teachingEditions.length > 0 && (
        <section className="py-20 border-b border-white/10 bg-gradient-to-b from-black to-amber-950/10 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2">
                <BookOpen className="w-4 h-4 text-amber-200" />
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
                  Teaching Editions
                </span>
              </div>
              <h2 className="mt-6 font-serif text-3xl md:text-4xl font-bold">Applied methodology</h2>
              <p className="mt-4 text-white/70 max-w-2xl mx-auto">
                Practical versions designed to be deployed: frameworks, implementation cues, operational guidance.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {teachingEditions.map((item) => (
                <Link
                  key={item.slug}
                  href={item.href}
                  className="group relative overflow-hidden rounded-3xl border border-amber-500/20 bg-amber-950/15 p-8 transition hover:border-amber-500/35 hover:bg-amber-950/25"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">
                      Teaching Edition
                    </span>
                  </div>

                  <h3 className="mt-6 font-serif text-2xl font-bold group-hover:text-amber-200 transition">
                    {item.title}
                  </h3>

                  {item.subtitle ? <p className="mt-2 text-sm text-white/60">{item.subtitle}</p> : null}

                  {item.excerpt ? (
                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/70">
                      {item.excerpt}
                    </p>
                  ) : null}

                  <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6 text-xs">
                    <div className="flex items-center gap-4 text-white/55">
                      {fmtDate(item.dateISO) ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {fmtDate(item.dateISO)}
                        </span>
                      ) : null}
                      {item.readTime ? (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {item.readTime}
                        </span>
                      ) : null}
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-200/70 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PUBLIC LIST */}
      {publicItems.length > 0 && (
        <section className="py-20 bg-black text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300/90">
                  Public Library
                </p>
                <h2 className="mt-3 font-serif text-3xl md:text-4xl font-bold">All public volumes</h2>
                <p className="mt-3 text-white/65">
                  {publicItems.length} volumes available to all — foundations, not fluff.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/content"
                  className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-widest text-white/80 hover:bg-white/10 transition"
                >
                  All Content
                </Link>
                <Link
                  href="/shorts"
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 px-6 py-3 text-xs font-black uppercase tracking-widest text-amber-200 hover:bg-amber-500/15 transition"
                >
                  Applied Notes
                </Link>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {publicItems.map((item) => {
                const b = accessBadge(item.accessLevel);
                const BadgeIcon = b.icon;

                return (
                  <Link
                    key={item.slug}
                    href={item.href}
                    className="group block rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition hover:border-amber-500/30 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-serif text-2xl font-bold group-hover:text-amber-200 transition">
                          {item.title}
                        </h3>
                        {item.subtitle ? <p className="mt-2 text-sm text-white/60">{item.subtitle}</p> : null}
                      </div>

                      <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${b.className}`}>
                        <BadgeIcon className={`w-3 h-3 ${b.iconColor}`} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{b.label}</span>
                      </div>
                    </div>

                    {item.excerpt ? (
                      <p className="mt-6 line-clamp-3 text-sm leading-relaxed text-white/70 group-hover:text-white/75">
                        {item.excerpt}
                      </p>
                    ) : null}

                    {item.tags.length > 0 ? (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {safeSlice(item.tags, 0, 3).map((tag) => (
                          <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">
                            #{tag}
                          </span>
                        ))}
                        {item.tags.length > 3 ? (
                          <span className="text-xs text-white/45">+{item.tags.length - 3} more</span>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6 text-xs font-bold text-white/55">
                      <div className="flex items-center gap-4">
                        {fmtDate(item.dateISO) ? (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {fmtDate(item.dateISO)}
                          </span>
                        ) : null}
                        {item.readTime ? (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {item.readTime}
                          </span>
                        ) : null}
                        {item.volume ? (
                          <span className="flex items-center gap-1.5 text-amber-200/70">
                            <Layers className="w-4 h-4" />
                            {item.volume}
                          </span>
                        ) : null}
                      </div>

                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* INNER CIRCLE UPGRADE */}
      {innerCircleItems.length > 0 && (
        <section className="py-20 border-t border-white/10 bg-gradient-to-b from-black to-amber-950/10 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2">
                <Users className="w-4 h-4 text-amber-200" />
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
                  Inner Circle
                </span>
              </div>
              <h2 className="mt-6 font-serif text-3xl md:text-4xl font-bold">The complete methodology</h2>
              <p className="mt-4 text-white/70 max-w-2xl mx-auto">
                {innerCircleItems.length} additional volumes are reserved for members — advanced material and implementation depth.
              </p>
            </div>

            <div className="rounded-3xl border border-amber-500/25 bg-amber-950/20 p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-10 items-start">
                <div>
                  <h3 className="font-serif text-2xl md:text-3xl font-bold">Access the full framework</h3>
                  <p className="mt-4 text-white/70">
                    This isn't “exclusive” for ego. It's protected because it’s operational — and accountability matters.
                  </p>

                  <ul className="mt-6 space-y-3 text-white/75">
                    {[
                      "Advanced volumes + implementation depth",
                      "Ongoing updates and new releases",
                      "Applied frameworks and case logic",
                      "Higher-signal rooms and accountability",
                    ].map((x) => (
                      <li key={x} className="flex items-center gap-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        {x}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/inner-circle"
                    className="mt-8 inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-8 py-4 text-sm font-black text-black hover:from-amber-300 hover:to-amber-500 transition"
                  >
                    <Users className="w-5 h-5" />
                    Join the Inner Circle
                    <ChevronRight className="w-5 h-5" />
                  </Link>

                  <p className="mt-4 text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                    Signal over noise · Accountability over applause
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {safeSlice(innerCircleItems, 0, 4).map((item) => (
                    <div
                      key={item.slug}
                      className="rounded-2xl border border-amber-500/20 bg-black/30 p-4 hover:border-amber-500/35 transition"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-3 h-3 text-amber-200" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">
                          Inner Circle
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-2">{item.title}</h4>
                      {item.volume ? <p className="mt-1 text-xs text-amber-200/60">{item.volume}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

// ============================================================================
// COMPONENTS
// ============================================================================

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "neutral" | "amber" | "amberSoft" | "blue";
}) {
  const cls =
    tone === "amber"
      ? "border-amber-500/30 bg-amber-500/10"
      : tone === "amberSoft"
      ? "border-amber-500/20 bg-amber-900/20"
      : tone === "blue"
      ? "border-blue-500/20 bg-blue-900/20"
      : "border-white/10 bg-white/5";

  const valCls =
    tone === "amber" ? "text-amber-200" : tone === "blue" ? "text-blue-200/90" : "text-white";

  return (
    <div className={cx("rounded-xl border p-4 backdrop-blur-sm", cls)}>
      <div className={cx("text-2xl font-black mb-1", valCls)}>{value}</div>
      <div className="text-[11px] font-black text-white/55 uppercase tracking-[0.22em]">{label}</div>
    </div>
  );
}

function PathCard({
  step,
  title,
  body,
  hint,
  icon: Icon,
}: {
  step: string;
  title: string;
  body: string;
  hint: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 hover:border-amber-500/25 transition">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2">
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">{step}</span>
        </div>
        <Icon className="w-7 h-7 text-white/20 group-hover:text-white/28 transition" />
      </div>
      <h3 className="font-serif text-2xl font-bold text-white">{title}</h3>
      <p className="mt-4 text-white/70 leading-relaxed">{body}</p>
      <div className="mt-6 text-sm font-bold text-amber-200/70">{hint}</div>
    </div>
  );
}

export default CanonIndexPage;