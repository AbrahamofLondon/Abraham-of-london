/* pages/canon/index.tsx — THE CANON ARCHIVE (INTEGRITY MODE) */
/* eslint-disable react/no-unescaped-entities */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  BookOpen,
  Lock,
  Users,
  Calendar,
  ChevronRight,
  Sparkles,
  Award,
  Layers,
  Target,
  Building2,
  Castle,
  ScrollText,
  Library,
  Activity,
  AlertCircle
} from "lucide-react";

import Layout from "@/components/Layout";
import { getAllCanons, normalizeSlug, sanitizeData } from "@/lib/content/server";

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
  featured: boolean;
  isTeachingEdition: boolean;
  volumeNumber: number | null;
  series: string;
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
  series: CanonSeries[];
  featuredItems: CanonItem[];
  error?: string;
};

// ============================================================================
// HELPERS
// ============================================================================

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

function toAccessLevel(v: unknown): AccessLevel {
  const s = String(v || "").trim().toLowerCase();
  if (s === "inner-circle" || s === "innercircle" || s === "members") return "inner-circle";
  if (s === "private" || s === "restricted" || s === "draft") return "private";
  return "public";
}

function extractVolumeNumber(title: string): number | null {
  const romanMatch = title.match(/Volume[-\s]([IVXLCDM]+)/i);
  if (romanMatch) {
    const roman = romanMatch[1].toUpperCase();
    const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0, prev = 0;
    for (let i = roman.length - 1; i >= 0; i--) {
      const cur = values[roman[i]];
      total += cur < prev ? -cur : cur;
      prev = cur;
    }
    return total;
  }
  const numMatch = title.match(/Volume[-\s](\d+)/i);
  return numMatch ? parseInt(numMatch[1], 10) : null;
}

function extractSeries(title: string): string {
  if (title.includes("Foundations")) return "Volume I";
  if (title.includes("Governance")) return "Volume II";
  if (title.includes("Civilisation")) return "Volume III";
  return "General";
}

// ============================================================================
// DATA FETCHING
// ============================================================================

export const getStaticProps: GetStaticProps<CanonIndexProps> = async () => {
  try {
    const rawDocs = getAllCanons() || [];

    if (!rawDocs.length) {
      console.warn("[CANON] No documents found in getAllCanons()");
    }

    const seenSlugs = new Set();
    const items: CanonItem[] = rawDocs
      .filter((doc: any) => !doc.draft)
      .map((doc: any) => {
        // ✅ FIX: Clean slug properly to prevent double slashes
        const rawSlug = normalizeSlug(doc.slug || doc._raw?.flattenedPath || "");
        const slug = rawSlug.replace(/^canon\//, ""); // Remove 'canon/' prefix
        const title = doc.title || "Untitled Volume";
        const date = doc.date ? new Date(doc.date).toISOString() : null;
        const series = doc.series || extractSeries(title);
        
        return {
          title,
          subtitle: doc.subtitle || null,
          excerpt: doc.excerpt || doc.description || null,
          slug,
          href: `/canon/${slug}`, // ✅ Clean URL: /canon/volume-name
          accessLevel: toAccessLevel(doc.accessLevel || doc.access),
          coverImage: doc.coverImage || null,
          dateISO: date,
          readTime: doc.readTime || "10 min",
          tags: Array.isArray(doc.tags) ? doc.tags : [],
          category: doc.category || "General",
          featured: Boolean(doc.featured),
          isTeachingEdition: title.toLowerCase().includes("teaching edition"),
          volumeNumber: extractVolumeNumber(title),
          series,
        };
      })
      .filter(item => {
        if (!item.slug || seenSlugs.has(item.slug)) return false;
        seenSlugs.add(item.slug);
        return true;
      })
      .sort((a, b) => (a.volumeNumber || 99) - (b.volumeNumber || 99));

    // Group into Architectural Series
    const seriesMap = new Map<string, CanonSeries>();
    
    items.forEach(item => {
      if (!seriesMap.has(item.series)) {
        const seriesConfig: Record<string, { title: string; description: string; icon: any; color: string }> = {
          "Volume I": {
            title: "Foundations of Purpose",
            description: "First principles: purpose, mandate, meaning, and moral architecture.",
            icon: Target,
            color: "from-amber-500/20 to-transparent",
          },
          "Volume II": {
            title: "Governance & Formation",
            description: "Rules, routines, and structures that survive pressure and personality.",
            icon: Building2,
            color: "from-blue-500/20 to-transparent",
          },
          "Volume III": {
            title: "Civilisation & Legacy",
            description: "Institutions, continuity, and generational systems.",
            icon: Castle,
            color: "from-purple-500/20 to-transparent",
          },
        };
        
        const config = seriesConfig[item.series] || {
          title: item.series,
          description: "Canonical volumes",
          icon: BookOpen,
          color: "from-gray-500/20 to-transparent",
        };
        
        seriesMap.set(item.series, {
          volume: item.series,
          title: config.title,
          description: config.description,
          icon: config.icon,
          items: [],
          color: config.color,
        });
      }
      
      seriesMap.get(item.series)!.items.push(item);
    });

    const series = Array.from(seriesMap.values()).filter(s => s.items.length > 0);

    const counts = items.reduce((acc, it) => {
      acc.total++;
      if (it.accessLevel === "public") acc.public++;
      else if (it.accessLevel === "inner-circle") acc.inner++;
      else acc.private++;
      return acc;
    }, { total: 0, public: 0, inner: 0, private: 0 });

    return {
      props: sanitizeData({ 
        items, 
        counts, 
        series, 
        featuredItems: items.filter(i => i.featured).slice(0, 6) 
      }),
      revalidate: 60
    };
  } catch (error) {
    console.error("Canon Index Failure:", error);
    return { 
      props: { 
        items: [], 
        counts: { total: 0, public: 0, inner: 0, private: 0 }, 
        series: [], 
        featuredItems: [],
        error: "Failed to load Canon documents"
      } 
    };
  }
};

// ============================================================================
// UI COMPONENTS
// ============================================================================

const Stat = ({ label, value, color }: { label: string, value: any, color: string }) => (
  <div className="border-l border-white/10 pl-6">
    <div className={`text-2xl font-light ${color}`}>{value}</div>
    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{label}</div>
  </div>
);

const CanonIndexPage: NextPage<CanonIndexProps> = ({ items, counts, series, featuredItems, error }) => {
  const latestUpdate = items.length > 0 
    ? new Date(Math.max(...items.map(i => new Date(i.dateISO || 0).getTime()))).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : "Feb 2026";

  return (
    <Layout title="The Canon">
      <main className="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30">
        {/* Institutional Hero */}
        <section className="relative pt-32 pb-20 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center gap-3 mb-8">
              <Activity className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-amber-500 font-bold">Canonical Archive</span>
            </div>
            
            <h1 className="text-7xl md:text-9xl font-light tracking-tighter mb-12">
              The <span className="italic font-serif text-amber-500">Canon.</span>
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-4xl">
              <Stat label="Total Volumes" value={counts.total} color="text-white" />
              <Stat label="Public Access" value={counts.public} color="text-white" />
              <Stat label="Inner Circle" value={counts.inner} color="text-amber-500" />
              <Stat label="Latest Update" value={latestUpdate} color="text-white" />
            </div>
          </div>
        </section>

        {/* Series Explorer */}
        <section className="max-w-7xl mx-auto px-8 py-24">
          {error && (
            <div className="mb-12 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
              <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
              <p className="text-amber-200/70">{error}</p>
            </div>
          )}

          {items.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
              <ScrollText className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">No volumes resolved in registry</p>
              {process.env.NODE_ENV === 'development' && (
                <p className="mt-4 text-amber-500/50 text-xs font-mono">
                  Check that canon documents exist in content/canon/
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-32">
              {series.map((s) => (
                <div key={s.volume} className="grid lg:grid-cols-3 gap-16 items-start">
                  <div className="lg:sticky lg:top-32 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-zinc-400">
                      {s.volume}
                    </div>
                    <h2 className="text-4xl font-light tracking-tight">{s.title}</h2>
                    <p className="text-zinc-500 leading-relaxed font-light">{s.description}</p>
                  </div>
                  
                  <div className="lg:col-span-2 grid gap-px bg-white/5 border border-white/5">
                    {s.items.map((item) => (
                      <Link key={item.slug} href={item.href} className="group relative p-10 bg-[#050505] hover:bg-zinc-900/40 transition-all duration-500">
                        <div className="flex justify-between items-start mb-6">
                          <span className="text-[10px] font-mono text-zinc-600 uppercase">{item.readTime}</span>
                          {item.accessLevel !== 'public' && <Lock className="h-3 w-3 text-amber-600" />}
                        </div>
                        <h3 className="text-2xl font-medium mb-4 group-hover:text-amber-500 transition-colors">{item.title}</h3>
                        <p className="text-zinc-500 text-sm line-clamp-2 font-light leading-relaxed">{item.excerpt}</p>
                        <div className="mt-8 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          View Analysis <ChevronRight className="h-3 w-3" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default CanonIndexPage;