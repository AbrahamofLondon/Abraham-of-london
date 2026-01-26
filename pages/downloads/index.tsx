/* pages/downloads/index.tsx — DOWNLOADS VAULT (INTEGRITY MODE) */
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
  Tag,
  Users,
  FileText,
} from "lucide-react";

import Layout from "@/components/Layout";
// ✅ FIXED: Import server-side functions from correct location
import { 
  getContentlayerData 
} from "@/lib/content/server";

import { 
  normalizeSlug, 
  sanitizeData 
} from "@/lib/content/shared";

type AccessLevel = "public" | "inner-circle" | "private";

type DownloadListItem = {
  slug: string;            // slug without downloads/
  title: string;
  excerpt: string | null;
  description: string | null;
  coverImage: string | null;
  pageHref: string;        // ALWAYS /downloads/{slug}
  assetUrl: string | null; // actual file link (pdf/docx/etc), optional
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
  const raw = doc?.slugComputed || doc?.slug || doc?._raw?.flattenedPath || "";
  const n = normalizeSlug(raw);
  return n.replace(/^downloads\//, "");
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

/**
 * STRATEGIC FIX: INTEGRITY MODE
 * 1. Uses getContentlayerData for absolute synchronization.
 * 2. Filters strictly for titled downloads with /downloads/ path integrity.
 */
export const getStaticProps: GetStaticProps<{
  downloads: DownloadListItem[];
  categories: string[];
  featuredCount: number;
}> = async () => {
  try {
    // COMMAND: Get contentlayer data for absolute build-time integrity
    const data = getContentlayerData(); // ✅ Removed await - it's synchronous now
    const docs = Array.isArray(data.allDownloads) ? data.allDownloads : [];

    const downloads: DownloadListItem[] = docs
      .map((d: any) => {
        const slug = resolveDownloadSlug(d);
        const dateISO = safeDateISO(d?.date);
        const category = (typeof d?.category === "string" && d.category.trim() ? d.category.trim() : null);
        const tags = Array.isArray(d?.tags) ? d.tags.filter((x: any) => typeof x === "string") : [];
        const excerpt = (typeof d?.excerpt === "string" && d.excerpt.trim() ? d.excerpt : null);
        const accessLevel = toAccessLevel(d?.accessLevel);

        return {
          slug,
          title: d?.title ?? "Untitled Download",
          excerpt,
          description: d?.description ?? null,
          coverImage: resolveDocCoverImage(d),
          pageHref: `/downloads/${slug}`,
          assetUrl: resolveAssetUrl(d),
          accessLevel,
          category,
          tags,
          dateISO,
          formattedDate: formatDate(dateISO),
          readTime: d?.readTime ?? d?.normalizedReadTime ?? null,
          featured: Boolean(d?.featured),
        };
      })
      // INTEGRITY MODE: show only /downloads/* and ensure title existence
      .filter((x) => Boolean(x.slug) && x.pageHref.startsWith("/downloads/") && Boolean(x.title) && x.title !== "Untitled Download")
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
      revalidate: 3600 
    };
  } catch (error) {
    console.error("Downloads index getStaticProps failed:", error);
    return { 
      props: { downloads: [], categories: [], featuredCount: 0 }, 
      revalidate: 3600 
    };
  }
};

export default function DownloadsIndexPage({ downloads, categories, featuredCount }: InferGetStaticPropsType<typeof getStaticProps>) {
  const title = "Strategic Assets & Resources";
  const description = "Premium tools, frameworks, and resources for leaders building institutions that last.";

  const featured = downloads.filter((d) => d.featured);
  const rest = downloads.filter((d) => !d.featured);

  const byCategory = categories.reduce((acc, c) => {
    acc[c] = downloads.filter((d) => d.category === c);
    return acc;
  }, {} as Record<string, DownloadListItem[]>);

  return (
    <Layout title={title} description={description}>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE}/downloads`} />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-900 text-white">
        <section className="relative overflow-hidden border-b border-white/10" id="top">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">Premium Resources</span>
            </div>

            <h1 className="mb-6 font-serif text-5xl font-light tracking-tight md:text-6xl lg:text-7xl">
              Strategic Assets
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-xl leading-8 text-slate-300">
              Curated tools, frameworks, and diagnostics designed for exceptional operators.
            </p>

            <div className="mb-12 grid grid-cols-2 gap-4 max-w-xl mx-auto md:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold mb-1">{downloads.length}</div>
                <div className="text-xs font-medium text-slate-300 uppercase tracking-wider">Total Assets</div>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-amber-200 mb-1">{featuredCount}</div>
                <div className="text-xs font-medium text-amber-300 uppercase tracking-wider">Featured</div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="#featured" className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-sm font-bold text-black transition-all hover:scale-105">
                <Sparkles className="h-5 w-5" /> Browse Featured <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/inner-circle" className="inline-flex items-center gap-3 rounded-xl border border-amber-400/40 bg-white/5 px-8 py-4 text-sm font-bold text-amber-100 transition-all hover:bg-white/10">
                <Users className="h-5 w-5" /> Member Access
              </Link>
            </div>
          </div>
        </section>

        {downloads.length === 0 ? (
          <section className="py-20 text-center">
            <FolderOpen className="mx-auto mb-4 h-12 w-12 text-slate-500" />
            <h2 className="text-xl font-medium">Resources in Preparation</h2>
          </section>
        ) : (
          <div className="space-y-20 py-16">
            {featured.length > 0 && (
              <section id="featured" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="mb-10 font-serif text-3xl font-light">Featured Assets</h2>
                <div className="grid gap-8 lg:grid-cols-2">
                  {featured.map((d) => <DownloadIndexCard key={d.slug} item={d} />)}
                </div>
              </section>
            )}

            {categories.map((c) => (
              <section key={c} id={`cat-${encodeURIComponent(c)}`} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-20">
                <h3 className="mb-8 font-serif text-2xl font-light border-b border-white/10 pb-4">{c}</h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {byCategory[c].map((d) => <DownloadIndexCard key={d.slug} item={d} />)}
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
  const label = level === "inner-circle" ? "Members" : level === "private" ? "Private" : "Public";
  const cls = level === "public" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" 
            : level === "inner-circle" ? "border-amber-400/30 bg-amber-500/10 text-amber-200" 
            : "border-rose-400/30 bg-rose-500/10 text-rose-200";
  return <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest ${cls}`}>{label}</span>;
}

function DownloadIndexCard({ item }: { item: DownloadListItem }) {
  const canDirectDownload = item.accessLevel === "public" && Boolean(item.assetUrl);
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:border-amber-500/30 hover:bg-white/10 p-6 flex flex-col h-full">
      <Link href={item.pageHref} className="block mb-6 relative aspect-[16/10] overflow-hidden rounded-xl bg-black/30">
        {item.coverImage ? (
          <Image src={item.coverImage} alt={item.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center italic text-white/20">Asset</div>
        )}
      </Link>
      <div className="mb-3 flex items-center justify-between"><AccessBadge level={item.accessLevel} /></div>
      <Link href={item.pageHref}><h3 className="mb-2 line-clamp-2 font-serif text-xl font-light text-white group-hover:text-amber-200">{item.title}</h3></Link>
      {item.excerpt && <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-slate-300">{item.excerpt}</p>}
      <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-slate-500">{item.formattedDate}</span>
        <div className="flex gap-2">
          {canDirectDownload ? (
            <a href={item.assetUrl!} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black hover:bg-amber-400 flex items-center gap-2">
              <DownloadIcon className="h-4 w-4" /> Download
            </a>
          ) : (
            <Link href={item.pageHref} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 flex items-center gap-2">
              Access <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}