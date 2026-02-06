/* pages/downloads/index.tsx — DOWNLOADS VAULT (PRODUCTION INTEGRITY) */
import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Download as DownloadIcon,
  Shield,
  Sparkles,
  FolderOpen,
  Users,
  Activity,
  FileText
} from "lucide-react";

import Layout from "@/components/Layout";
import { getContentlayerData } from "@/lib/content/server";
import { normalizeSlug, sanitizeData } from "@/lib/content/shared";

type AccessLevel = "public" | "inner-circle" | "private";

type DownloadListItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  description: string | null;
  coverImage: string | null;
  pageHref: string;
  assetUrl: string | null;
  accessLevel: AccessLevel;
  category: string | null;
  tags: string[];
  dateISO: string | null;
  formattedDate: string | null;
  readTime: string | null;
  featured: boolean;
};

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

function toAccessLevel(v: unknown): AccessLevel {
  const s = String(v || "").trim().toLowerCase();
  if (["inner-circle", "innercircle", "members", "subscriber"].includes(s)) return "inner-circle";
  if (["private", "restricted", "confidential", "draft"].includes(s)) return "private";
  return "public";
}

function resolveDocCoverImage(doc: any): string | null {
  return doc.coverImage || doc.featuredImage || doc.image || doc.thumbnail || null;
}

function resolveDownloadSlug(doc: any): string {
  const raw = doc?._raw?.flattenedPath || "";
  // Extract the final segment to ensure it maps to /[slug] regardless of folder nesting
  return raw.split('/').pop() || "";
}

function resolveAssetUrl(doc: any): string | null {
  return doc.downloadUrl || doc.file || doc.fileUrl || doc.url || null;
}

function safeDateISO(d: any): string | null {
  const t = new Date(d ?? "").getTime();
  if (!Number.isFinite(t) || t <= 0) return null;
  return new Date(t).toISOString();
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t) || t <= 0) return null;
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const data = getContentlayerData();
    const docs = Array.isArray(data.allDownloads) ? data.allDownloads : [];

    const downloads: DownloadListItem[] = docs
      .map((d: any) => {
        const slug = resolveDownloadSlug(d);
        const dateISO = safeDateISO(d?.date);
        const category = (typeof d?.category === "string" && d.category.trim() ? d.category.trim() : "Operational");
        
        return {
          slug,
          title: d?.title || "Strategic Asset",
          excerpt: d?.excerpt || d?.summary || null,
          description: d?.description ?? null,
          coverImage: resolveDocCoverImage(d),
          pageHref: `/downloads/${slug}`,
          assetUrl: resolveAssetUrl(d),
          accessLevel: toAccessLevel(d?.accessLevel),
          category,
          tags: Array.isArray(d?.tags) ? d.tags : [],
          dateISO,
          formattedDate: formatDate(dateISO),
          readTime: d?.readTime || "5 min",
          featured: Boolean(d?.featured),
        };
      })
      // HARDENED FILTER: Allow all valid slugs and titles to ensure 75/75 resolution
      .filter((x) => Boolean(x.slug) && x.title !== "Untitled Download")
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        const da = a.dateISO ? new Date(a.dateISO).getTime() : 0;
        const db = b.dateISO ? new Date(b.dateISO).getTime() : 0;
        return db - da || a.title.localeCompare(b.title);
      });

    const categories = Array.from(new Set(downloads.map((d) => d.category).filter(Boolean) as string[])).sort();
    const featuredCount = downloads.filter((d) => d.featured).length;

    return { 
      props: sanitizeData({ downloads, categories, featuredCount }), 
      revalidate: 60 
    };
  } catch (error) {
    console.error("Downloads Critical Failure:", error);
    return { props: { downloads: [], categories: [], featuredCount: 0 } };
  }
};

export default function DownloadsIndexPage({ downloads, categories, featuredCount }: any) {
  const featured = downloads.filter((d: any) => d.featured);
  const byCategory = categories.reduce((acc: any, c: string) => {
    acc[c] = downloads.filter((d: any) => d.category === c);
    return acc;
  }, {} as Record<string, DownloadListItem[]>);

  return (
    <Layout title="Strategic Assets">
      <main className="min-h-screen bg-[#050505] text-white selection:bg-[#D4AF37]/30">
        {/* Institutional Header */}
        <section className="relative pt-32 pb-20 border-b border-white/5 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/grid-white.svg')] opacity-[0.02] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-8 relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <Activity className="h-4 w-4 text-[#D4AF37]" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#D4AF37] font-bold">Registry Online</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-light tracking-tighter mb-8 leading-[0.9]">
              Strategic <br /><span className="italic font-serif text-[#D4AF37]">Assets.</span>
            </h1>
            <div className="flex gap-16">
              <div className="space-y-1">
                <span className="block text-4xl font-light">{downloads.length}</span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Total Briefs</span>
              </div>
              <div className="space-y-1">
                <span className="block text-4xl font-light text-[#D4AF37]">{featuredCount}</span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Priority Access</span>
              </div>
            </div>
          </div>
        </section>

        {downloads.length === 0 ? (
          <div className="py-40 text-center space-y-4">
            <FolderOpen className="mx-auto h-12 w-12 text-zinc-800" />
            <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest">Awaiting Contentlayer Synchronization</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-8 py-24 space-y-32">
            {categories.map((cat) => (
              <section key={cat} className="space-y-12">
                <div className="flex items-center gap-6">
                   <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 whitespace-nowrap">{cat}</h2>
                   <div className="h-px w-full bg-white/5" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
                  {byCategory[cat].map((item: any) => (
                    <DownloadIndexCard key={item.slug} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}

function AccessBadge({ level }: { level: AccessLevel }) {
  const cls = level === "public" ? "border-emerald-400/20 text-emerald-400 bg-emerald-400/5" 
            : level === "inner-circle" ? "border-[#D4AF37]/20 text-[#D4AF37] bg-[#D4AF37]/5" 
            : "border-zinc-700 text-zinc-500";
  return <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${cls}`}>{level}</span>;
}

function DownloadIndexCard({ item }: { item: DownloadListItem }) {
  return (
    <div className="group relative p-10 bg-[#050505] hover:bg-zinc-900/30 transition-all duration-500">
      <div className="flex flex-col h-full justify-between">
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <AccessBadge level={item.accessLevel} />
            <span className="text-[9px] font-mono text-zinc-600 uppercase">{item.readTime}</span>
          </div>
          <Link href={item.pageHref}>
            <h3 className="text-2xl font-medium group-hover:text-[#D4AF37] transition-colors leading-tight">
              {item.title}
            </h3>
          </Link>
          {item.excerpt && <p className="text-sm text-zinc-500 line-clamp-2 font-light leading-relaxed">{item.excerpt}</p>}
        </div>
        <div className="mt-12 pt-6 border-t border-white/5 flex justify-between items-center">
          <Link href={item.pageHref} className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 group-hover:gap-4 transition-all text-white group-hover:text-[#D4AF37]">
            View Brief <ArrowRight className="h-3 w-3" />
          </Link>
          {item.assetUrl && item.accessLevel === "public" && (
            <a href={item.assetUrl} className="p-2 border border-white/10 hover:bg-white hover:text-black transition-all">
              <DownloadIcon className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}