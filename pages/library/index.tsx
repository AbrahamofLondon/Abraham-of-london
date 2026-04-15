/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/library/index.tsx — LIBRARY INDEX (PDF REGISTRY, SSOT)

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Head from "next/head";
import { FileText, Lock } from "lucide-react";

import Layout from "@/components/Layout";
import tiers, { type AccessTier } from "@/lib/access/tiers";

type PdfAsset = {
  slug: string;
  routeSlug: string;
  title: string;
  description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  updated?: string | null;
  date?: string | null;
  requiredTier: AccessTier;
  isPublic: boolean;
  displayPath?: string | null;
};

type Props = {
  items: PdfAsset[];
  counts: {
    total: number;
    public: number;
    restricted: number;
  };
};

const RULE = "rgba(255,255,255,0.08)";

function safeStr(v: any): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeSlug(input: string) {
  return (input || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function toRouteSlug(registrySlug: string): string {
  const n = normalizeSlug(registrySlug);
  const parts = n.split("/").filter(Boolean);
  return parts.length ? (parts[parts.length - 1] ?? "") : "";
}

function toIsoDate(input: any): string | null {
  const s = safeStr(input);
  if (!s) return null;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

function jsonSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v, (_k, val) => (val === undefined ? null : val)));
}

function coerceTags(v: any): string[] | null {
  if (!Array.isArray(v)) return null;
  const out = v.map((x) => safeStr(x)).filter(Boolean);
  return out.length ? out : null;
}

function inferIsPublic(x: any): boolean {
  return (
    x?.public === true ||
    x?.isPublic === true ||
    String(x?.accessLevel || "").toLowerCase() === "public" ||
    String(x?.tier || "").toLowerCase() === "public" ||
    String(x?.visibility || "").toLowerCase() === "public" ||
    String(x?.access || "").toLowerCase() === "public" ||
    x?.locked === false
  );
}

function inferRequiredTier(x: any, isPublic: boolean): AccessTier {
  const raw = safeStr(x?.accessLevel || x?.tier || (isPublic ? "public" : "member"));
  return tiers.normalizeRequired(raw as any);
}

function inferDisplayPath(x: any): string | null {
  const href = safeStr(x?.href || "");
  const url = safeStr(x?.url || x?.publicUrl || "");
  const path = safeStr(x?.path || x?.filePath || x?.file || "");

  if (href && href.startsWith("/")) return href;
  if (path) {
    const p = normalizeSlug(path);
    if (p.startsWith("assets/") || p.startsWith("pdfs/")) return `/${p}`;
    if (p.startsWith("public/")) return `/${p.replace(/^public\//, "")}`;
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
  }
  if (url) return url;
  return null;
}

async function loadPdfAssets(): Promise<PdfAsset[]> {
  try {
    const mod: any = await import("@/scripts/pdf/pdf-registry.source");
    const list = mod?.ALL_SOURCE_PDFS || mod?.PDF_REGISTRY || mod?.ALL_PDFS || mod?.default;
    const arr: any[] = Array.isArray(list) ? list : Array.isArray(list?.items) ? list.items : [];

    const out = arr
      .map((x: any) => {
        const rawSlug = safeStr(x?.slug || x?.id || x?.key || x?.name || x?.file || x?.pdf || "");
        const slug = normalizeSlug(rawSlug);
        if (!slug) return null;

        const routeSlug = toRouteSlug(slug);
        if (!routeSlug) return null;

        const title = safeStr(x?.title || x?.name || x?.label || routeSlug || "Untitled");
        const desc = safeStr(x?.description || x?.excerpt || x?.summary || "") || null;
        const isPublic = inferIsPublic(x);
        const requiredTier = inferRequiredTier(x, isPublic);

        const updated =
          safeStr(x?.updated || x?.updatedAt || x?.modified || x?.lastModified || x?.date || "") ||
          null;
        const date = safeStr(x?.date || x?.publishedAt || "") || null;

        return {
          slug,
          routeSlug,
          title,
          description: desc,
          category: safeStr(x?.category || x?.collection || x?.kind || "Library") || "Library",
          tags: coerceTags(x?.tags),
          updated,
          date,
          requiredTier,
          isPublic: requiredTier === "public",
          displayPath: inferDisplayPath(x),
        } as PdfAsset;
      })
      .filter(Boolean) as PdfAsset[];

    const seen = new Set<string>();
    const deduped: PdfAsset[] = [];
    for (const it of out) {
      const k = it.routeSlug.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      deduped.push(it);
    }

    deduped.sort((a, b) => {
      const aIso = toIsoDate(a.updated || a.date || "") || "";
      const bIso = toIsoDate(b.updated || b.date || "") || "";
      return bIso.localeCompare(aIso);
    });

    return deduped;
  } catch {
    return [];
  }
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
  const items = await loadPdfAssets();

  const counts = items.reduce(
    (acc, it) => {
      acc.total++;
      if (it.isPublic) acc.public++;
      else acc.restricted++;
      return acc;
    },
    { total: 0, public: 0, restricted: 0 }
  );

  return {
    props: jsonSafe({ items, counts }),
    revalidate: 900,
  };

  } finally {
  }
};

function formatDate(value?: string | null) {
  const iso = toIsoDate(value || "");
  if (!iso) return "Undated";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function assetType(item: PdfAsset) {
  const cat = String(item.category || "").toLowerCase();
  if (cat.includes("framework")) return "Framework";
  if (cat.includes("reference")) return "Reference";
  return "PDF";
}

function formatBadge(item: PdfAsset) {
  const path = item.displayPath || "";
  if (path.toLowerCase().endsWith(".epub")) return "EPUB";
  return "PDF";
}

function filterKey(item: PdfAsset) {
  const type = assetType(item);
  if (!item.isPublic) return "Restricted";
  return type;
}

function LibraryRow({ item }: { item: PdfAsset }) {
  return (
    <Link
      href={`/library/${encodeURIComponent(item.routeSlug)}`}
      className="group grid gap-3 border-b py-3 transition-colors duration-200 md:grid-cols-[1.5rem_5rem_1fr_3rem_5rem_6rem]"
      style={{ borderBottomColor: "rgba(255,255,255,0.04)" }}
    >
      <div className="pt-0.5">
        <FileText className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.2)" }} />
      </div>
      <div className="font-mono text-[6.5px] uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.22)" }}>
        {assetType(item)}
      </div>
      <div className="min-w-0">
        <h2 className="truncate font-serif text-[1rem] italic transition-colors duration-200 group-hover:text-white" style={{ color: "rgba(255,255,255,0.72)" }}>
          {item.title}
        </h2>
        <p className="mt-0.5 truncate text-[12px]" style={{ color: "rgba(255,255,255,0.32)" }}>
          {item.description || item.slug.replace(/\//g, " · ")}
        </p>
      </div>
      <div className="font-mono text-[6.5px] uppercase tracking-[0.26em] md:text-right" style={{ color: "rgba(255,255,255,0.18)" }}>
        {formatBadge(item)}
      </div>
      <div className="font-mono text-[6.5px] uppercase tracking-[0.26em] md:text-right" style={{ color: "rgba(255,255,255,0.2)" }}>
        {item.isPublic ? "Public" : "Restricted"}
      </div>
      <div className="font-mono text-[6.5px] uppercase tracking-[0.24em] md:text-right" style={{ color: "rgba(255,255,255,0.18)" }}>
        {formatDate(item.updated || item.date)}
      </div>
    </Link>
  );
}

const LibraryIndexPage: NextPage<Props> = ({ items, counts }) => {
  const [activeFilter, setActiveFilter] = React.useState("All");

  const filtered = React.useMemo(() => {
    if (activeFilter === "All") return items;
    return items.filter((item) => filterKey(item) === activeFilter);
  }, [items, activeFilter]);

  const filters = ["All", "PDF", "Framework", "Reference", "Restricted"];

  return (
    <Layout
      title="Library | Abraham of London"
      description="Verified PDF library assets — controlled distribution, audit-friendly URLs."
      fullWidth
      className="bg-black text-white"
      headerTransparent={false}
    >
      <Head>
        <title>Library | Abraham of London</title>
      </Head>

      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <section className="border-b" style={{ borderBottomColor: RULE }}>
          <div className="mx-auto max-w-6xl px-6 pb-8 pt-20 lg:px-10 lg:pb-10 lg:pt-24">
            <div className="flex items-center gap-3">
              <span style={{ width: 1, height: 18, backgroundColor: "rgba(201,169,110,0.42)", display: "inline-block" }} />
              <span className="font-mono text-[7.5px] uppercase tracking-[0.4em]" style={{ color: "rgba(201,169,110,0.8)" }}>
                LIBRARY · ASSET REGISTRY
              </span>
            </div>

            <h1 className="mt-6 font-serif text-[1.8rem] italic" style={{ color: "rgba(255,255,255,0.88)", fontWeight: 300 }}>
              The reference corpus.
            </h1>

            <p className="mt-5 font-mono text-[8px] uppercase tracking-[0.34em]" style={{ color: "rgba(255,255,255,0.28)" }}>
              Documents, frameworks, and reference materials organized by type and access.
            </p>

            <div className="mt-6 h-px w-full" style={{ backgroundColor: RULE }} />

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
              {filters.map((entry) => {
                const active = activeFilter === entry;
                return (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => setActiveFilter(entry)}
                    className="font-mono text-[7.5px] uppercase tracking-[0.3em]"
                    style={{
                      color: active ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.28)",
                      textDecoration: active ? "underline" : "none",
                      textUnderlineOffset: "0.35rem",
                    }}
                  >
                    {entry}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-8 lg:py-10">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <div className="mb-6 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[6.5px] uppercase tracking-[0.28em]" style={{ color: "rgba(255,255,255,0.22)" }}>
              <span>{counts.total} assets indexed</span>
              <span>{counts.public} public</span>
              <span>{counts.restricted} restricted</span>
              <span>{filtered.length} visible</span>
            </div>

            {filtered.length === 0 ? (
              <div className="border px-6 py-16 text-center" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <p className="font-mono text-[8px] uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.24)" }}>
                  No assets matching current classification
                </p>
              </div>
            ) : (
              <div>
                {filtered.map((item) => (
                  <LibraryRow key={item.slug} item={item} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default LibraryIndexPage;
