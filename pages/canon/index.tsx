// pages/canon/index.tsx - COMPLETE FIXED VERSION
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
  Library,
  Layers,
  Target,
  Compass,
  Building2,
  Castle,
  ScrollText,
} from "lucide-react";

import Layout from "@/components/Layout";
import { safeSlice, safeArraySlice } from "@/lib/utils/safe";


// REMOVED: import from "@/lib/content" - This was causing the Webpack chunk error

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
  icon: React.ComponentType<any>;
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

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

// SAFE HELPER FUNCTIONS (No imports from problematic modules)
function safeNormalizeSlug(input: string): string {
  try {
    return (input || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function safeGetAccessLevel(doc: any): string {
  try {
    if (!doc) return "public";
    
    // Check access field
    if (doc.access === "inner-circle" || doc.access === "members") return "inner-circle";
    if (doc.access === "private" || doc.access === "restricted") return "private";
    
    // Check tags
    const tags = Array.isArray(doc.tags) ? doc.tags.map((t: any) => String(t).toLowerCase()) : [];
    if (tags.includes("inner-circle") || tags.includes("members")) return "inner-circle";
    if (tags.includes("private") || tags.includes("restricted")) return "private";
    
    // Check category
    const category = String(doc.category || "").toLowerCase();
    if (category.includes("inner-circle")) return "inner-circle";
    
    return "public";
  } catch {
    return "public";
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
  } catch (error) {
    return "public";
  }
}

function accessBadge(level: AccessLevel) {
  switch (level) {
    case "public":
      return { label: "Public", icon: Unlock, className: "border-amber-500/30 bg-amber-500/10 text-amber-200", iconColor: "text-amber-300" };
    case "inner-circle":
      return { label: "Inner Circle", icon: Users, className: "border-amber-500/20 bg-amber-900/20 text-amber-200/90", iconColor: "text-amber-400" };
    case "private":
      return { label: "Private", icon: Lock, className: "border-gray-500/20 bg-gray-900/20 text-gray-400", iconColor: "text-gray-400" };
    default:
      return { label: "Public", icon: Unlock, className: "border-amber-500/30 bg-amber-500/10 text-amber-200", iconColor: "text-amber-300" };
  }
}

function extractVolumeNumber(title: string): number | null {
  try {
    const romanMatch = title.match(/Volume[-\s]([IVX]+)/i);
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
  } catch (error) {
    return null;
  }
}

function safeDateISO(d: any): string | null {
  try {
    if (!d) return null;
    const t = new Date(d).getTime();
    if (!Number.isFinite(t) || t <= 0) return null;
    return new Date(t).toISOString();
  } catch (error) {
    return null;
  }
}

function fmtDate(iso: string | null): string | null {
  try {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t) || t <= 0) return null;
    return new Date(t).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
  } catch (error) {
    return null;
  }
}

function resolveCanonSlug(doc: any): string {
  try {
    const raw = doc?.slugComputed || doc?.slug || doc?._raw?.flattenedPath || "";
    return safeNormalizeSlug(raw);
  } catch (error) {
    return "";
  }
}

function resolveCanonHref(slug: string): string {
  try {
    const s = slug.replace(/^canon\//, "");
    return `/canon/${s}`;
  } catch (error) {
    return "/canon";
  }
}

export const getStaticProps: GetStaticProps<CanonIndexProps> = async () => {
  // SAFE: All operations wrapped in try-catch with defaults
  try {
    // Step 1: Try to get data from contentlayer with dynamic import
    let data: any = { allCanons: [], allDocuments: [] };
    let allPublished: any[] = [];
    
    try {
      // DYNAMIC IMPORT to avoid Webpack chunk errors
      const contentModule = await import("@/lib/content");
      
      if (contentModule.getContentlayerData) {
        data = await contentModule.getContentlayerData() || { allCanons: [], allDocuments: [] };
      }
      
      if (contentModule.getPublishedDocuments) {
        allPublished = contentModule.getPublishedDocuments() || [];
      }
    } catch (error) {
      console.warn("⚠️ Contentlayer import failed, using empty data");
      // Fallback: Try direct import from contentlayer/generated
      try {
        // @ts-ignore - contentlayer/generated is generated at build time
        const generated = await import("contentlayer/generated");
        const docs = generated?.allDocuments || [];
        allPublished = Array.isArray(docs) ? docs : [];
        
        // Filter for canon items
        data.allCanons = allPublished.filter((doc: any) => {
          try {
            const dir = String(doc._raw?.sourceFileDir || "").toLowerCase();
            return dir.includes('canon') || dir.includes('volumes');
          } catch {
            return false;
          }
        });
      } catch (genError) {
        console.warn("⚠️ Contentlayer/generated also failed");
      }
    }

    // Step 2: Process canon data safely
    const canonPrimary = Array.isArray(data.allCanons) ? data.allCanons : [];
    
    const canonSecondary = (Array.isArray(allPublished) ? allPublished : []).filter((doc: any) => {
      try {
        const fp = String(doc?._raw?.flattenedPath || "").toLowerCase();
        const tags = Array.isArray(doc?.tags) ? doc.tags.map((t: string) => String(t).toLowerCase()) : [];
        const cat = String(doc?.category || "").toLowerCase();
        const urlish = String(doc?.url || "").toLowerCase();
        return fp.startsWith("canon/") || tags.includes("canon") || tags.includes("volume") || cat.includes("canon") || urlish.includes("/canon/");
      } catch (error) {
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
      } catch (error) {
        return false;
      }
    });

    // Step 3: Transform to CanonItems safely
    const items: CanonItem[] = merged
      .filter((c: any) => {
        try {
          return c && !safeIsDraftContent(c);
        } catch (error) {
          return false;
        }
      })
      .map((c: any) => {
        try {
          const slug = resolveCanonSlug(c);
          const title = c?.title || "Untitled Canon";
          const isTeachingEdition = title.toLowerCase().includes("teaching edition");
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
        } catch (error) {
          // Return minimal valid item if transformation fails
          return {
            title: "Untitled Canon",
            subtitle: null,
            excerpt: null,
            coverImage: null,
            slug: "",
            href: "/canon",
            accessLevel: "public" as AccessLevel,
            dateISO: null,
            readTime: null,
            tags: [],
            category: null,
            volume: null,
            featured: false,
            isTeachingEdition: false,
            volumeNumber: null,
          };
        }
      })
      .filter((x) => x.slug) // Remove items with empty slugs
      .sort((a, b) => {
        try {
          if (a.isTeachingEdition && !b.isTeachingEdition) return 1;
          if (!a.isTeachingEdition && b.isTeachingEdition) return -1;

          if (a.volumeNumber !== null && b.volumeNumber !== null) return a.volumeNumber - b.volumeNumber;
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;

          const da = a.dateISO ? new Date(a.dateISO).getTime() : 0;
          const db = b.dateISO ? new Date(b.dateISO).getTime() : 0;
          return db - da || a.title.localeCompare(b.title);
        } catch (error) {
          return 0;
        }
      });

    // Step 4: Group by volume series safely
    const volumeSeries: Record<string, CanonItem[]> = {};
    for (const item of items) {
      try {
        if (item.volumeNumber !== null && !item.isTeachingEdition) {
          const key = `Volume ${item.volumeNumber}`;
          (volumeSeries[key] ||= []).push(item);
        }
      } catch (error) {
        // Skip this item if grouping fails
      }
    }

    // Step 5: Create series with fallbacks
    const series: CanonSeries[] = [
      { 
        volume: "Volume I", 
        title: "Foundations of Purpose", 
        description: "Architectural principles for human purpose and intentional existence", 
        icon: Target, 
        items: volumeSeries["Volume 1"] || [], 
        color: "from-amber-500/20 to-amber-600/10" 
      },
      { 
        volume: "Volume II", 
        title: "Governance & Formation", 
        description: "Systems, structures, and processes for sustainable institutions", 
        icon: Building2, 
        items: volumeSeries["Volume 2"] || [], 
        color: "from-blue-500/20 to-blue-600/10" 
      },
      { 
        volume: "Volume III", 
        title: "Civilisation & Legacy", 
        description: "Building enduring civilisations and generational legacy", 
        icon: Castle, 
        items: volumeSeries["Volume 3"] || [], 
        color: "from-purple-500/20 to-purple-600/10" 
      },
      { 
        volume: "Volume IV", 
        title: "Stewardship & Continuity", 
        description: "Sustaining systems and maintaining continuity across generations", 
        icon: Compass, 
        items: volumeSeries["Volume 4"] || [], 
        color: "from-emerald-500/20 to-emerald-600/10" 
      },
      { 
        volume: "Volume X", 
        title: "Future Civilisation", 
        description: "Visionary frameworks for the arc of future human organisation", 
        icon: Layers, 
        items: volumeSeries["Volume 10"] || [], 
        color: "from-rose-500/20 to-rose-600/10" 
      },
    ].filter((s) => s.items.length > 0);

    // Step 6: Calculate counts safely
    const counts = items.reduce(
      (acc, it) => {
        try {
          acc.total += 1;
          if (it.accessLevel === "public") acc.public += 1;
          else if (it.accessLevel === "inner-circle") acc.inner += 1;
          else acc.private += 1;
        } catch (error) {
          // Skip this item if counting fails
        }
        return acc;
      },
      { total: 0, public: 0, inner: 0, private: 0 }
    );

    // Step 7: Filter featured items and teaching editions
    const featuredItems = items
      .filter((x) => {
        try {
          return x.featured && x.accessLevel !== "private";
        } catch (error) {
          return false;
        }
      })
      safeArraySlice(..., 0, 6);

    const teachingEditions = items
      .filter((x) => {
        try {
          return x.isTeachingEdition && x.accessLevel === "public";
        } catch (error) {
          return false;
        }
      })
      safeArraySlice(..., 0, 4);

    // Step 8: Return sanitized props
    return {
      props: safeSanitizeData({ 
        items, 
        counts, 
        featuredItems, 
        series, 
        teachingEditions 
      }),
      revalidate: 1800,
    };

  } catch (error) {
    // CRITICAL: Always return valid props
    console.error("❌ CRITICAL: Canon index page failed completely:", error);
    
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

// ==================== COMPONENT ====================

const CanonIndexPage: NextPage<CanonIndexProps> = ({ items, counts, featuredItems, series, teachingEditions }) => {
  // SAFE: Check if we have any content to show
  const hasAnyContent = items.length > 0 || series.length > 0 || featuredItems.length > 0 || teachingEditions.length > 0;
  
  const title = "The Canon";
  const description = "Foundational work on purpose, governance, civilisation, and legacy — organised for builders, not browsers.";
  const canonicalUrl = `${SITE}/canon`;

  // SAFE: Filter with try-catch
  const publicItems = items.filter((i) => {
    try {
      return i.accessLevel === "public" && !i.isTeachingEdition;
    } catch (error) {
      return false;
    }
  });
  
  const innerCircleItems = items.filter((i) => {
    try {
      return i.accessLevel === "inner-circle";
    } catch (error) {
      return false;
    }
  });

  // Render fallback if absolutely no content
  if (!hasAnyContent) {
    return (
      <Layout title={title} description={description} fullWidth>
        <Head>
          <title>{title} | Abraham of London</title>
          <meta name="description" content={description} />
          <link rel="canonical" href={canonicalUrl} />
        </Head>

        <section className="min-h-screen flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <ScrollText className="w-16 h-16 text-amber-400/50 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">The Canon</h1>
            <p className="text-gray-400 mb-8">
              The Canon library is temporarily being updated. Please check back soon.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/30 px-6 py-3 text-amber-200 hover:bg-amber-500/30 transition-colors"
            >
              Return to Home
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

      {/* Hero - ALWAYS SHOWS EVEN WITH EMPTY DATA */}
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.08),transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-amber-400">
                <ScrollText className="w-4 h-4" />
                <span>The Complete Works · Foundations</span>
              </div>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white">
              The Canon
            </h1>

            <p className="mt-6 text-lg md:text-xl leading-relaxed text-gray-400 max-w-3xl">
              The architectural blueprint for intentional existence, governance, and civilisation-building.
              These volumes represent the foundational methodology applied across all Abraham of London work.
            </p>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl">
              <Stat label="Total Volumes" value={counts.total} tone="neutral" />
              <Stat label="Core Series" value={series.length} tone="amber" />
              <Stat label="Teaching Editions" value={teachingEditions.length} tone="amberSoft" />
              <Stat label="Years in Development" value={"4+"} tone="blue" />
              <Stat label="Active Volumes" value={new Date().getFullYear()} tone="neutral" />
            </div>

            <div className="mt-12 flex flex-wrap gap-4">
              {items.length > 0 ? (
                <Link
                  href={items[0]?.href || "/canon"}
                  className="group inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-sm font-bold text-black transition-all hover:scale-105 hover:from-amber-400 hover:to-amber-500"
                >
                  <BookOpen className="w-5 h-5" />
                  Start with Foundations
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <div className="inline-flex items-center gap-3 rounded-xl bg-gray-800 px-8 py-4 text-sm font-bold text-gray-400">
                  <BookOpen className="w-5 h-5" />
                  Content Loading...
                </div>
              )}

              <Link
                href="#series"
                className="inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-gray-300 transition-all hover:border-white/30 hover:bg-white/10"
              >
                <Layers className="w-5 h-5" />
                Explore Series
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Series - CONDITIONAL */}
      {series.length > 0 && (
        <section id="series" className="py-20 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-amber-400" />
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400">The Complete Series</p>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
                Architectural Blueprints for Civilisation
              </h2>
              <p className="text-gray-400 max-w-3xl mx-auto text-lg">
                Each volume builds upon the last, creating a comprehensive framework for intentional existence,
                governance, and legacy-building.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {series.map((s) => {
                const SeriesIcon = s.icon;
                const primaryItem = s.items[0];
                return (
                  <div
                    key={s.volume}
                    className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${s.color} p-8 transition-all hover:border-white/20 hover:scale-[1.02]`}
                  >
                    <div className="absolute top-4 right-4">
                      <SeriesIcon className="w-8 h-8 text-white/10 group-hover:text-white/20 transition-colors" />
                    </div>

                    <div className="mb-6">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 backdrop-blur-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-white">{s.volume}</span>
                        <span className="text-xs text-gray-400">{s.items.length} volume{s.items.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    <h3 className="font-serif text-2xl font-bold text-white mb-3">{s.title}</h3>
                    <p className="text-gray-400 mb-6">{s.description}</p>

                    {primaryItem && (
                      <Link href={primaryItem.href} className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white group/link">
                        <span>Explore {s.volume}</span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                      </Link>
                    )}

                    <div className="mt-6 pt-6 border-t border-white/5">
                      <div className="text-xs text-gray-500">
                        Includes:{" "}
                        {s.items
                          safeArraySlice(..., 0, 3)
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

      {/* Featured - CONDITIONAL */}
      {featuredItems.length > 0 && (
        <section className="py-20 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400">Essential Foundations</p>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white">Entry Points to the Work</h2>
              <p className="mt-2 text-gray-400">Start here to understand the core methodology</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredItems.map((item) => {
                const b = accessBadge(item.accessLevel);
                const BadgeIcon = b.icon;

                return (
                  <Link
                    key={item.slug}
                    href={item.href}
                    className="group relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-white/0 p-8 transition-all hover:border-amber-500/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-amber-500/10"
                  >
                    {item.featured && (
                      <div className="absolute right-4 top-4">
                        <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1.5 backdrop-blur-sm">
                          <Award className="w-3 h-3 text-amber-300" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200">Essential</span>
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${b.className}`}>
                        <BadgeIcon className={`w-3 h-3 ${b.iconColor}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{b.label}</span>
                      </div>
                    </div>

                    <h3 className="font-serif text-2xl font-bold text-white transition-colors group-hover:text-amber-400">
                      {item.title}
                    </h3>

                    {item.subtitle && <p className="mt-2 text-sm font-medium text-gray-400">{item.subtitle}</p>}

                    {item.excerpt && (
                      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-gray-400 group-hover:text-gray-300">
                        {item.excerpt}
                      </p>
                    )}

                    <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6 text-xs">
                      <div className="flex items-center gap-4 text-gray-500">
                        {fmtDate(item.dateISO) && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {fmtDate(item.dateISO)}
                          </span>
                        )}
                        {item.readTime && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {item.readTime}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Teaching Editions - CONDITIONAL */}
      {teachingEditions.length > 0 && (
        <section className="py-20 border-b border-white/10 bg-gradient-to-b from-black to-amber-950/5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <div className="inline-flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400">Teaching Editions</p>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">Applied Methodology</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Practical implementations and teaching versions of core concepts for direct application
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {teachingEditions.map((item) => (
                <Link
                  key={item.slug}
                  href={item.href}
                  className="group relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-black/50 p-8 transition-all hover:border-amber-500/40 hover:bg-amber-950/30"
                >
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1.5 backdrop-blur-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200">Teaching Edition</span>
                    </div>
                  </div>

                  <h3 className="font-serif text-2xl font-bold text-white transition-colors group-hover:text-amber-400 pr-16">
                    {item.title}
                  </h3>

                  {item.subtitle && <p className="mt-2 text-sm font-medium text-gray-400">{item.subtitle}</p>}

                  {item.excerpt && (
                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-gray-400 group-hover:text-gray-300">
                      {item.excerpt}
                    </p>
                  )}

                  <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6 text-xs">
                    <div className="flex items-center gap-4 text-gray-500">
                      {fmtDate(item.dateISO) && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {fmtDate(item.dateISO)}
                        </span>
                      )}
                      {item.readTime && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {item.readTime}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400/60 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Public Library - CONDITIONAL */}
      {publicItems.length > 0 ? (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">The Complete Collection</p>
                <h2 className="mt-3 font-serif text-3xl md:text-4xl font-bold text-white">All Public Volumes</h2>
                <p className="mt-2 text-gray-400">{publicItems.length} foundational volumes available to all builders and thinkers</p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/content"
                  className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-300 transition-all hover:bg-white/10"
                >
                  All Content
                </Link>
                <Link
                  href="/shorts"
                  className="rounded-full border border-amber-400/40 bg-amber-500/10 px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-200 transition-all hover:bg-amber-500/20"
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
                    className="group block rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-black/50 p-8 transition-all hover:border-amber-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-amber-500/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-serif text-2xl font-bold text-white transition-colors group-hover:text-amber-400">
                          {item.title}
                        </h3>
                        {item.subtitle && <p className="mt-2 text-sm font-medium text-gray-400">{item.subtitle}</p>}
                      </div>
                      <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${b.className}`}>
                        <BadgeIcon className={`w-3 h-3 ${b.iconColor}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{b.label}</span>
                      </div>
                    </div>

                    {item.excerpt && (
                      <p className="mt-6 line-clamp-3 text-sm leading-relaxed text-gray-400 group-hover:text-gray-300">
                        {item.excerpt}
                      </p>
                    )}

                    {item.tags.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {item.safeSlice(tags, 0, 3).map((tag) => (
                          <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
                            #{tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && <span className="text-xs text-gray-500">+{item.tags.length - 3} more</span>}
                      </div>
                    )}

                    <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6 text-xs font-medium text-gray-500">
                      <div className="flex items-center gap-4">
                        {fmtDate(item.dateISO) && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {fmtDate(item.dateISO)}
                          </span>
                        )}
                        {item.readTime && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {item.readTime}
                          </span>
                        )}
                        {item.volume && (
                          <span className="flex items-center gap-1.5 text-amber-400/70">
                            <Layers className="w-4 h-4" />
                            {item.volume}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        // Show empty state only if we have no public items but have other content
        hasAnyContent && (
          <section className="py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl border border-dashed border-white/10 p-20 text-center text-gray-500">
                <Library className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-lg">No public canon entries available yet.</p>
                <p className="mt-2 text-sm">Check back soon or join the Inner Circle for early access.</p>
              </div>
            </div>
          </section>
        )
      )}

      {/* Inner Circle CTA - CONDITIONAL */}
      {innerCircleItems.length > 0 && (
        <section className="py-20 border-t border-white/10 bg-gradient-to-b from-black to-amber-950/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <div className="inline-flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-amber-400" />
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400">Extended Framework</p>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">The Complete Methodology</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                {innerCircleItems.length} additional volumes available exclusively to Inner Circle members.
              </p>
            </div>

            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-black/50 p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-white mb-4">Access the Complete Framework</h3>
                  <p className="text-gray-300 mb-6">
                    Full access to advanced volumes, implementations, and ongoing canon development.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Full access to all canon volumes and series",
                      "Advanced implementation frameworks",
                      "Case studies and real-world applications",
                      "Ongoing volume development and updates",
                      "Direct methodology consultation access",
                    ].map((x, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-300">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        {x}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/inner-circle"
                    className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-sm font-bold text-black hover:from-amber-400 hover:to-amber-500 transition-all"
                  >
                    <Users className="w-5 h-5" />
                    Join the Inner Circle
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {safeSlice(innerCircleItems, 0, 4).map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 hover:border-amber-500/40 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Inner Circle</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white line-clamp-2">{item.title}</h4>
                      {item.volume && <p className="text-xs text-amber-400/70 mt-1">{item.volume}</p>}
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

function Stat({ label, value, tone }: { label: string; value: string | number; tone: "neutral" | "amber" | "amberSoft" | "blue" }) {
  const cls =
    tone === "amber"
      ? "border-amber-500/30 bg-amber-500/10"
      : tone === "amberSoft"
      ? "border-amber-500/20 bg-amber-900/20"
      : tone === "blue"
      ? "border-blue-500/20 bg-blue-900/20"
      : "border-white/10 bg-white/5";

  const valCls = tone === "amber" ? "text-amber-200" : tone === "blue" ? "text-blue-200/90" : "text-white";

  return (
    <div className={`rounded-xl border p-4 backdrop-blur-sm ${cls}`}>
      <div className={`text-2xl font-bold mb-1 ${valCls}`}>{value}</div>
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default CanonIndexPage;