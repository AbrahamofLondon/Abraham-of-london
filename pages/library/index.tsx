// pages/library/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { FileText, FolderOpen } from "lucide-react";

type PdfAsset = {
  id: string; // ✅ canonical route key: /library/[id]
  title: string;
  description?: string | null;
  excerpt?: string | null;
  category?: string | null;
  tags?: string[] | null;
  url?: string | null; // outputPath / fileUrl (web path)
  tier?: string | null;
  public?: boolean | null;
  updated?: string | null;
};

type Props = {
  assets: PdfAsset[];
  totalCount: number;
  source: string;
};

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

  // Prefer outputPath/fileUrl from registry.json
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

  // Public heuristic: free/public tiers are public
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

function readRegistryJson(): { assets: PdfAsset[]; source: string } {
  // ✅ Hard-source of truth for Pages Router SSG on Windows/Netlify
  // Reads: /public/pdfs/registry.json (written by tsx scripts/build-pdf-registry-json.ts)
  // Supports either: { items: [...] } or [...].
  // Never relies on ESM import of TS modules (Windows-safe).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require("fs") as typeof import("fs");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require("path") as typeof import("path");

  const jsonPath = path.join(process.cwd(), "public", "pdfs", "registry.json");
  if (!fs.existsSync(jsonPath)) {
    return { assets: [], source: "json-missing" };
  }

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

  // Stable sort: category then title
  uniq.sort((a, b) => {
    const ca = safeStr(a.category || "");
    const cb = safeStr(b.category || "");
    if (ca !== cb) return ca.localeCompare(cb);
    return safeStr(a.title || "").localeCompare(safeStr(b.title || ""));
  });

  return { assets: uniq, source: "json-registry" };
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { assets, source } = readRegistryJson();

  return {
    props: {
      assets,
      totalCount: assets.length,
      source,
    },
    revalidate: 300,
  };
};

const LibraryIndexPage: NextPage<Props> = ({ assets, totalCount, source }) => {
  return (
    <Layout title="Library" description="Verified Library // Abraham of London." fullWidth>
      <Head>
        <meta name="robots" content="index, follow" />
      </Head>

      <main className="min-h-screen bg-black text-white">
        <header className="border-b border-white/5 bg-zinc-950/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-10">
            <div className="mb-4 flex items-center gap-2 text-amber-400/70">
              <FolderOpen className="h-5 w-5" />
              <span className="text-[10px] font-mono uppercase tracking-[0.35em]">
                VAULT • {totalCount} {totalCount === 1 ? "ASSET" : "ASSETS"} • {source}
              </span>
            </div>

            <h1 className="font-serif text-3xl md:text-5xl text-white/95">Library</h1>
            <p className="mt-4 text-sm md:text-base text-white/45 max-w-3xl">
              Verified assets, documents, and publications from the Abraham of London archive.
            </p>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          {totalCount === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-16 text-center">
              <FileText className="h-8 w-8 text-white/20 mx-auto mb-4" />
              <p className="text-white/45 font-mono text-xs uppercase tracking-[0.3em]">
                No assets found in the vault
              </p>
              <p className="mt-2 text-white/30 text-xs">Source: {source}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset) => (
                <Link
                  key={asset.id}
                  href={`/library/${encodeURIComponent(asset.id)}`}
                  className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-amber-500/25 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <FileText className="h-5 w-5 text-amber-400/70" />
                    {asset.category && (
                      <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/35">
                        {asset.category}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-4 font-serif text-xl text-white/90 group-hover:text-amber-300 transition-colors line-clamp-2">
                    {asset.title}
                  </h2>

                  {(asset.description || asset.excerpt) && (
                    <p className="mt-2 text-xs text-white/45 line-clamp-2">
                      {asset.description || asset.excerpt}
                    </p>
                  )}

                  {Array.isArray(asset.tags) && asset.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                      {asset.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[7px] font-mono uppercase tracking-[0.2em] text-white/35"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 text-[9px] font-mono uppercase tracking-[0.28em] text-white/25">
                    ID: <span className="text-white/45">{asset.id}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default LibraryIndexPage;