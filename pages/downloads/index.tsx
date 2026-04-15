/* pages/downloads/index.tsx — DOWNLOADS INDEX (Premium Archive) */
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  Download as DownloadIcon,
  Archive,
  Shield,
  FileText,
} from "lucide-react";

import Layout from "@/components/Layout";
import { sanitizeData } from "@/lib/content/shared";

type AccessLevel = "public" | "inner-circle" | "private";

type DownloadListItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  description: string | null;
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

function toAccessLevel(v: unknown): AccessLevel {
  const s = String(v || "").trim().toLowerCase();
  if (["inner-circle", "innercircle", "members", "subscriber", "member"].includes(s)) return "inner-circle";
  if (["private", "restricted", "confidential", "draft"].includes(s)) return "private";
  return "public";
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
  return new Date(t).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normalizeSlug(input: string): string {
  return String(input || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.mdx?$/i, "");
}

function resolveDownloadSlug(doc: any): string {
  const raw = normalizeSlug(doc?.slug || doc?._raw?.flattenedPath || "");
  return raw.split("/").filter(Boolean).pop() || "";
}

function resolveAssetUrl(doc: any): string | null {
  return doc.downloadUrl || doc.file || doc.fileUrl || doc.url || null;
}

export const getStaticProps: GetStaticProps<{
  downloads: DownloadListItem[];
  categories: string[];
  featuredCount: number;
}> = async () => {
  console.log("[PAGE_DATA] pages/downloads/index.tsx getStaticProps START");
  try {
  try {
  try {
    const { getContentlayerData } = await import("@/lib/content/server");
    const data = getContentlayerData();
    const docs = Array.isArray((data as any).allDownloads) ? (data as any).allDownloads : [];

    const downloads: DownloadListItem[] = docs
      .filter((d: any) => !d?.draft)
      .map((d: any) => {
        const slug = resolveDownloadSlug(d);
        const dateISO = safeDateISO(d?.date);

        return {
          slug,
          title: d?.title || "Strategic Asset",
          excerpt: d?.excerpt || d?.summary || null,
          description: d?.description ?? null,
          pageHref: `/downloads/${slug}`,
          assetUrl: resolveAssetUrl(d),
          accessLevel: toAccessLevel(d?.accessLevel || d?.tier),
          category: d?.category || "Operational",
          tags: Array.isArray(d?.tags) ? d.tags : [],
          dateISO,
          formattedDate: formatDate(dateISO),
          readTime: d?.readTime || "5 min",
          featured: Boolean(d?.featured),
        };
      })
      .filter((x: DownloadListItem) => Boolean(x.slug))
      .sort((a: DownloadListItem, b: DownloadListItem) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        const da = a.dateISO ? new Date(a.dateISO).getTime() : 0;
        const db = b.dateISO ? new Date(b.dateISO).getTime() : 0;
        return db - da || a.title.localeCompare(b.title);
      });

    const categories = Array.from(
      new Set(downloads.map((d) => d.category).filter(Boolean) as string[])
    ).sort();

    return {
      props: sanitizeData({
        downloads,
        categories,
        featuredCount: downloads.filter((d) => d.featured).length,
      }),
      revalidate: 1800,
    };
  } catch {
    return {
      props: { downloads: [], categories: [], featuredCount: 0 },
      revalidate: 1800,
    };
  }

  } finally {
  }

  } finally {
    console.log("[PAGE_DATA] pages/downloads/index.tsx getStaticProps END");
  }
};

const DownloadsIndexPage: NextPage<{
  downloads: DownloadListItem[];
  categories: string[];
  featuredCount: number;
}> = ({ downloads, categories }) => {
  const byCategory = categories.reduce((acc: Record<string, DownloadListItem[]>, c: string) => {
    acc[c] = downloads.filter((d) => d.category === c);
    return acc;
  }, {});

  return (
    <Layout
      title="Downloads | Abraham of London"
      description="Operational packs, templates, worksheets, and strategic assets."
      canonicalUrl="/downloads"
      fullWidth
      className="bg-black text-white"
    >
      <Head>
        <title>Downloads | Abraham of London</title>
      </Head>

      <main className="min-h-screen bg-[#050505] text-white">
        <section className="relative overflow-hidden border-b border-white/5 px-6 pb-20 pt-28 md:pt-36">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.06),transparent_45%)]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.36em] text-amber-300/90">
              <Archive className="h-4 w-4" />
              Operational Assets
            </div>

            <h1 className="mt-6 max-w-5xl font-serif text-5xl leading-[0.95] text-white md:text-7xl lg:text-8xl">
              Downloads
              <span className="ml-3 italic text-amber-200/90">Vault.</span>
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-white/65">
              Templates, packs, cue cards, worksheets, and decision assets designed for use,
              not decoration.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          {downloads.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-12 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/35">
                No downloads indexed
              </p>
            </div>
          ) : (
            <div className="space-y-14">
              {categories.map((cat) => (
                <section key={cat}>
                  <div className="mb-6 flex items-center gap-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.36em] text-white/45">
                      {cat}
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {(byCategory[cat] ?? []).map((item) => (
                      <article
                        key={item.slug}
                        className="group rounded-[2rem] border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-amber-500/30 hover:bg-white/[0.05]"
                      >
                        <div className="p-7">
                          <div className="flex items-start justify-between gap-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/85">
                              <FileText className="h-3.5 w-3.5" />
                              {item.accessLevel}
                            </div>

                            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/40">
                              {item.readTime || "Asset"}
                            </span>
                          </div>

                          <h2 className="mt-6 font-serif text-2xl leading-tight text-white transition-colors group-hover:text-amber-100">
                            {item.title}
                          </h2>

                          {item.excerpt ? (
                            <p className="mt-4 text-sm leading-relaxed text-white/65">
                              {item.excerpt}
                            </p>
                          ) : null}

                          <div className="mt-6 flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
                            {item.formattedDate ? <span>{item.formattedDate}</span> : null}
                            {item.formattedDate ? <span className="h-1 w-1 rounded-full bg-white/15" /> : null}
                            <span>{item.category}</span>
                          </div>

                          <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                              href={item.pageHref}
                              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.28em] text-white/85 transition-all hover:bg-white/[0.10]"
                            >
                              Open Page
                              <ArrowRight className="h-4 w-4" />
                            </Link>

                            {item.assetUrl && item.accessLevel === "public" ? (
                              <a
                                href={item.assetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300 transition-all hover:bg-amber-500/18"
                              >
                                <DownloadIcon className="h-4 w-4" />
                                Download
                              </a>
                            ) : item.accessLevel !== "public" ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.28em] text-white/45">
                                <Shield className="h-4 w-4 text-amber-300/80" />
                                Restricted
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default DownloadsIndexPage;