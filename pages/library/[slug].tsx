// pages/library/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { ArrowLeft, ExternalLink, Download, FileText } from "lucide-react";

type PdfAsset = {
  id: string; // ✅ canonical route key: /library/[id]
  title: string;
  description?: string | null;
  excerpt?: string | null;
  category?: string | null;
  tags?: string[] | null;
  url?: string | null; // outputPath/fileUrl (web path)
  tier?: string | null;
  public?: boolean | null;
  updated?: string | null;
};

type Props = { asset: PdfAsset };

function safeStr(v: any): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normId(input: string) {
  return (input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function ensureWebPath(p: string | null | undefined): string | null {
  const v = safeStr(p).trim();
  if (!v) return null;
  return v.startsWith("/") ? v : `/${v}`;
}

function coerceAsset(x: any): PdfAsset | null {
  if (!x) return null;

  const id = normId(safeStr(x.id || x.slug || x.key || x.name || ""));
  if (!id) return null;

  const title = safeStr(x.title || x.name || x.label || id || "Untitled").trim() || "Untitled";
  const description = safeStr(x.description || x.summary || "") || null;
  const excerpt = safeStr(x.excerpt || "") || null;
  const category = safeStr(x.category || x.collection || x.kind || "") || null;

  const tags = Array.isArray(x.tags) ? x.tags.map((t: any) => safeStr(t)).filter(Boolean) : null;

  const url =
    ensureWebPath(x.outputPath) ||
    ensureWebPath(x.fileUrl) ||
    ensureWebPath(x.url) ||
    ensureWebPath(x.href) ||
    ensureWebPath(x.path) ||
    null;

  const tier = safeStr(x.tier || x.accessLevel || "") || null;
  const updated =
    safeStr(x.updatedAt || x.lastModified || x.lastModifiedISO || x.updated || x.date || "") || null;

  const isPublic =
    x.public === true ||
    x.isPublic === true ||
    String(x.tier || "").toLowerCase() === "free" ||
    String(x.tier || "").toLowerCase() === "public";

  return {
    id,
    title,
    description,
    excerpt,
    category,
    tags,
    url,
    tier,
    public: Boolean(isPublic),
    updated,
  };
}

function readRegistryJson(): PdfAsset[] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require("fs") as typeof import("fs");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require("path") as typeof import("path");

  const jsonPath = path.join(process.cwd(), "public", "pdfs", "registry.json");
  if (!fs.existsSync(jsonPath)) return [];

  const raw = fs.readFileSync(jsonPath, "utf8");
  const parsed = JSON.parse(raw);

  const arr: any[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.items)
      ? parsed.items
      : [];

  const assets = arr.map(coerceAsset).filter(Boolean) as PdfAsset[];

  // Dedup by id
  const seen = new Set<string>();
  const uniq: PdfAsset[] = [];
  for (const a of assets) {
    const k = a.id.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      uniq.push(a);
    }
  }
  return uniq;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const assets = readRegistryJson();
  const paths = assets.map((a) => ({ params: { slug: a.id } }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = normId(safeStr(params?.slug || ""));
  const assets = readRegistryJson();

  const asset =
    assets.find((a) => a.id.toLowerCase() === slug.toLowerCase()) || null;

  if (!asset) return { notFound: true };

  return {
    props: JSON.parse(JSON.stringify({ asset })),
    revalidate: 900,
  };
};

const LibrarySlugPage: NextPage<Props> = ({ asset }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout title="Resolving Asset…" fullWidth>
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-[11px] font-mono uppercase tracking-[0.35em] text-white/50">
            Resolving Library Asset…
          </div>
        </main>
      </Layout>
    );
  }

  const url = ensureWebPath(asset.url) || null;
  const canonical = `/library/${encodeURIComponent(asset.id)}`;
  const desc = asset.description || asset.excerpt || "Verified Library asset // Abraham of London.";

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

                {(asset.description || asset.excerpt) && (
                  <p className="mt-4 max-w-3xl text-sm md:text-base text-white/45 leading-relaxed">
                    {asset.description || asset.excerpt}
                  </p>
                )}

                <div className="mt-6 text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
                  ID: <span className="text-white/60">{asset.id}</span>
                  {asset.tier ? (
                    <>
                      {" "}
                      • Tier: <span className="text-white/60">{asset.tier}</span>
                    </>
                  ) : null}
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
                      download
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-[10px] font-mono uppercase tracking-[0.35em] text-white hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/20"
                    >
                      <Download className="h-4 w-4" /> Download
                    </a>
                  </>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/45 w-[260px]">
                    No direct URL in registry for this asset.
                    <div className="mt-2 text-[10px] font-mono text-white/35">
                      Ensure registry.json includes <span className="text-white/55">outputPath</span>.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          {url ? (
            <div className="rounded-3xl border border-white/10 bg-black overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02] text-[10px] font-mono uppercase tracking-[0.35em] text-white/45">
                Preview
              </div>
              <div className="aspect-[16/10] w-full">
                <iframe src={url} className="h-full w-full" title={asset.title} />
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