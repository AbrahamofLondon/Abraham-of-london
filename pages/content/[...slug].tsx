// pages/library/[slug].tsx
// — LIBRARY DETAIL (PDF Asset Page) — Pages Router

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { ArrowLeft, ExternalLink, Download, FileText } from "lucide-react";

type PdfAsset = {
  slug: string;
  title: string;
  description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  href?: string | null;
  url?: string | null;
  path?: string | null;
  public?: boolean | null;
  updated?: string | null;
  date?: string | null;
};

type Props = { asset: PdfAsset };

function safeStr(v: any): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeSlug(input: string) {
  return (input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function jsonSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v, (_k, val) => (val === undefined ? null : val)));
}

function coerceAsset(x: any): PdfAsset | null {
  if (!x) return null;

  const slug =
    normalizeSlug(
      safeStr(x.slug || x.id || x.key || x.name || x.file || x.pdf || "")
    ) || "";

  const title = safeStr(x.title || x.name || x.label || slug || "Untitled");
  if (!slug) return null;

  const tags = Array.isArray(x.tags) ? x.tags.map((t: any) => safeStr(t)).filter(Boolean) : null;

  const updated =
    safeStr(x.updated || x.updatedAt || x.modified || x.lastModified || x.date || "") || null;

  const isPublic =
    x.public === true ||
    x.isPublic === true ||
    x.accessLevel === "public" ||
    x.tier === "public" ||
    x.visibility === "public" ||
    x.visibility === "Public" ||
    x.access === "public" ||
    x.access === "Public" ||
    x.locked === false;

  return {
    slug,
    title,
    description: safeStr(x.description || x.excerpt || x.summary || "") || null,
    category: safeStr(x.category || x.collection || x.kind || "") || null,
    tags,
    href: safeStr(x.href || "") || null,
    url: safeStr(x.url || x.publicUrl || "") || null,
    path: safeStr(x.path || x.filePath || x.file || "") || null,
    public: Boolean(isPublic),
    updated,
    date: safeStr(x.date || x.publishedAt || "") || null,
  };
}

function resolveAssetUrl(asset: PdfAsset): string | null {
  const url = safeStr(asset.url || "");
  if (url) return url;

  const href = safeStr(asset.href || "");
  if (href.startsWith("/")) return href;

  const path = safeStr(asset.path || "");
  if (path) {
    const p = normalizeSlug(path);
    if (p.startsWith("pdfs/")) return `/${p}`;
    if (p.startsWith("assets/")) return `/${p}`;
    if (p.startsWith("public/")) return `/${p.replace(/^public\//, "")}`;
  }

  return null;
}

export const getStaticPaths: GetStaticPaths = async () => {
  let assets: PdfAsset[] = [];
  try {
    const mod: any = await import("@/scripts/pdf/pdf-registry.source");
    const list = mod?.ALL_SOURCE_PDFS || mod?.PDF_REGISTRY || mod?.ALL_PDFS || mod?.default;
    const arr: any[] = Array.isArray(list) ? list : Array.isArray(list?.items) ? list.items : [];
    assets = arr.map(coerceAsset).filter(Boolean) as PdfAsset[];
  } catch {
    assets = [];
  }

  const paths = assets.map((a) => ({ params: { slug: normalizeSlug(a.slug) } }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = normalizeSlug(String(params?.slug || ""));

  let assets: PdfAsset[] = [];
  try {
    const mod: any = await import("@/scripts/pdf/pdf-registry.source");
    const list = mod?.ALL_SOURCE_PDFS || mod?.PDF_REGISTRY || mod?.ALL_PDFS || mod?.default;
    const arr: any[] = Array.isArray(list) ? list : Array.isArray(list?.items) ? list.items : [];
    assets = arr.map(coerceAsset).filter(Boolean) as PdfAsset[];
  } catch {
    assets = [];
  }

  const asset =
    assets.find((a) => a.slug.toLowerCase() === slug.toLowerCase()) ||
    assets.find((a) => normalizeSlug(a.slug).toLowerCase().endsWith(slug.toLowerCase())) ||
    null;

  if (!asset) return { notFound: true };

  return {
    props: jsonSafe({ asset }),
    revalidate: 900,
  };
};

const LibrarySlugPage: NextPage<Props> = ({ asset }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout title="Resolving Asset…">
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-[11px] font-mono uppercase tracking-[0.35em] text-white/50">
            Resolving Library Asset…
          </div>
        </main>
      </Layout>
    );
  }

  const url = resolveAssetUrl(asset);
  const canonical = `/library/${encodeURIComponent(asset.slug)}`;
  const desc =
    asset.description ||
    "Verified Library asset // Abraham of London.";

  return (
    <Layout title={asset.title} description={desc} canonicalUrl={canonical} fullWidth>
      <Head>
        <meta name="robots" content="index, follow" />
      </Head>

      <main className="min-h-screen bg-black text-white">
        <header className="border-b border-white/5 bg-zinc-950/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-10">
            <Link
              href="/library"
              className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-white/45 hover:text-amber-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Library
            </Link>

            <div className="mt-6 flex items-start justify-between gap-6">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  <FileText className="h-4 w-4 text-amber-400" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/55">
                    {asset.category || "Library Asset"}
                  </span>
                </div>

                <h1 className="mt-6 font-serif text-3xl md:text-5xl text-white/95 leading-tight">
                  {asset.title}
                </h1>

                {asset.description && (
                  <p className="mt-4 max-w-3xl text-sm md:text-base text-white/45 leading-relaxed">
                    {asset.description}
                  </p>
                )}

                <div className="mt-6 text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
                  Slug: <span className="text-white/60">{asset.slug}</span>
                </div>

                {Array.isArray(asset.tags) && asset.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {asset.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] font-mono uppercase tracking-[0.28em] text-white/40"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 flex flex-col gap-3">
                {url ? (
                  <>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-[10px] font-mono uppercase tracking-[0.35em] text-white/70 hover:border-amber-500/25 hover:text-amber-300 transition-all"
                    >
                      <ExternalLink className="h-4 w-4" /> Open
                    </a>

                    <a
                      href={url}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-[10px] font-mono uppercase tracking-[0.35em] text-white hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/20"
                    >
                      <Download className="h-4 w-4" /> Download
                    </a>
                  </>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/45 w-[260px]">
                    No direct URL in registry for this asset.
                    <div className="mt-2 text-[10px] font-mono text-white/35">
                      Add one of: <span className="text-white/55">url</span>, <span className="text-white/55">href</span>, or <span className="text-white/55">path</span>.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Inline preview (best-effort) */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          {url ? (
            <div className="rounded-3xl border border-white/10 bg-black overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02] text-[10px] font-mono uppercase tracking-[0.35em] text-white/45">
                Preview
              </div>
              <div className="aspect-[16/10] w-full">
                <iframe
                  src={url}
                  className="h-full w-full"
                  title={asset.title}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center text-white/45">
              Preview unavailable without a resolvable URL.
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default LibrarySlugPage;