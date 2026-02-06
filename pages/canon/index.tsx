/* pages/canon/index.tsx — THE CANON ARCHIVE (INTEGRITY MODE) */
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
  Activity
} from "lucide-react";

import Layout from "@/components/Layout";
import { getContentlayerData } from "@/lib/content/server";
import { normalizeSlug, sanitizeData } from "@/lib/content/shared";

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
};

// ============================================================================
// HELPERS
// ============================================================================

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

function toAccessLevel(v: unknown): AccessLevel {
  const s = String(v || "").trim().toLowerCase();
  if (["inner-circle", "innercircle", "members"].includes(s)) return "inner-circle";
  if (["private", "restricted", "draft"].includes(s)) return "private";
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

// ============================================================================
// DATA FETCHING
// ============================================================================

export const getStaticProps: GetStaticProps<CanonIndexProps> = async () => {
  try {
    const data = getContentlayerData();
    // Combine all potential Canon sources
    const rawDocs = [
      ...(data.allCanons || []),
      ...(data.allDocuments || []).filter((d: any) => 
        d._raw?.sourceFileDir?.includes("canon") || 
        d.category?.toLowerCase() === "canon" ||
        d.tags?.includes("canon")
      )
    ];

    const seenSlugs = new Set();
    const items: CanonItem[] = rawDocs
      .map((doc: any) => {
        const slug = (doc.slug || doc._raw?.flattenedPath || "").split('/').pop() || "";
        const title = doc.title || "Untitled Volume";
        const date = doc.date ? new Date(doc.date).toISOString() : null;
        
        return {
          title,
          subtitle: doc.subtitle || null,
          excerpt: doc.excerpt || doc.description || null,
          slug,
          href: `/canon/${slug}`,
          accessLevel: toAccessLevel(doc.accessLevel || doc.access),
          coverImage: doc.coverImage || null,
          dateISO: date,
          readTime: doc.readTime || "10 min",
          tags: Array.isArray(doc.tags) ? doc.tags : [],
          category: doc.category || "General",
          featured: Boolean(doc.featured),
          isTeachingEdition: title.toLowerCase().includes("teaching edition"),
          volumeNumber: extractVolumeNumber(title),
        };
      })
      .filter(item => {
        if (!item.slug || seenSlugs.has(item.slug)) return false;
        seenSlugs.add(item.slug);
        return true;
      })
      .sort((a, b) => (a.volumeNumber || 99) - (b.volumeNumber || 99));

    // Group into Architectural Series
    const series: CanonSeries[] = [
      {
        volume: "Volume I",
        title: "Foundations of Purpose",
        description: "First principles: purpose, mandate, meaning, and moral architecture.",
        icon: Target,
        items: items.filter(i => i.volumeNumber === 1),
        color: "from-amber-500/20 to-transparent",
      },
      {
        volume: "Volume II",
        title: "Governance & Formation",
        description: "Rules, routines, and structures that survive pressure and personality.",
        icon: Building2,
        items: items.filter(i => i.volumeNumber === 2),
        color: "from-blue-500/20 to-transparent",
      },
      {
        volume: "Volume III",
        title: "Civilisation & Legacy",
        description: "Institutions, continuity, and generational systems.",
        icon: Castle,
        items: items.filter(i => i.volumeNumber === 3),
        color: "from-purple-500/20 to-transparent",
      }
    ].filter(s => s.items.length > 0);

    const counts = items.reduce((acc, it) => {
      acc.total++;
      acc[it.accessLevel === "inner-circle" ? "inner" : it.accessLevel === "private" ? "private" : "public"]++;
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
    return { props: { items: [], counts: { total: 0, public: 0, inner: 0, private: 0 }, series: [], featuredItems: [] } };
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

const CanonIndexPage: NextPage<CanonIndexProps> = ({ items, counts, series, featuredItems }) => {
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
              <Stat label="Latest Update" value="Feb 2026" color="text-white" />
            </div>
          </div>
        </section>

        {/* Series Explorer */}
        <section className="max-w-7xl mx-auto px-8 py-24">
          {items.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
              <ScrollText className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">No volumes resolved in registry</p>
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