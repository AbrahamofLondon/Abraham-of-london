// pages/resources/surrender-framework/index.tsx — Surrender Framework Hub (public, indexed, SSG-safe)
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

import SurrenderAssetsLanding from "@/components/downloads/SurrenderAssetsLanding";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

/** Minimal shape expected by the landing component; permissive by design */
export type SurrenderAsset = {
  id: string;
  title: string;
  type?: string;
  tier?: string;
  outputPath?: string;

  description?: string;
  excerpt?: string;
  tags?: string[];
  category?: string;

  format?: string;
  formats?: string[];

  isInteractive?: boolean;
  isFillable?: boolean;
  requiresAuth?: boolean;

  version?: string;
  author?: string;
  priority?: number;

  // Optional enriched fields (harmless if missing)
  fileSizeHuman?: string;
  exists?: boolean;
  lastModified?: string;
};

type GroupKey = "worksheets" | "assessments" | "tools" | "other";

type Props = {
  canonical: string;
  assets: SurrenderAsset[];
  grouped: Record<GroupKey, SurrenderAsset[]>;
  stats: {
    total: number;
    interactive: number;
    fillable: number;
    public: number;
  };
  isFallbackData: boolean;
};

function norm(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\u00a0/g, " ") // NBSP -> space
    .replace(/[_\s]+/g, "-");
}

function asArray<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

function hasTag(tags: unknown, tag: string): boolean {
  const t = norm(tag);
  return asArray<string>(tags).map(norm).includes(t);
}

/**
 * Deterministic classification:
 * - Uses tags/category primarily
 * - Has a safe fallback for id/title pattern
 * - Never breaks due to casing mismatch
 */
function isSurrenderAsset(item: SurrenderAsset): boolean {
  const cat = norm(item?.category);
  const id = norm(item?.id);
  const title = norm(item?.title);
  const tags = item?.tags;

  // Strong signals
  if (cat === "surrender-framework") return true;
  if (cat === "surrender") return true;
  if (hasTag(tags, "surrender-framework")) return true;
  if (hasTag(tags, "surrender")) return true;

  // Category variants you already use ("Surrender Framework")
  if (cat === "surrender-framework" || cat === "surrender-framework-assets") return true;
  if (cat.replace(/-/g, " ") === "surrender framework") return true;

  // Fallback naming conventions
  if (id.startsWith("surrender-")) return true;
  if (title.includes("surrender")) return true;

  return false;
}

function groupOf(item: SurrenderAsset): GroupKey {
  const t = norm(item.type);
  const id = norm(item.id);
  const tags = item.tags ?? [];

  if (t === "worksheet" || hasTag(tags, "worksheet")) return "worksheets";
  if (t === "assessment" || hasTag(tags, "assessment") || hasTag(tags, "diagnostic")) return "assessments";
  if (
    t === "tool" ||
    t === "toolkit" ||
    t === "framework" ||
    t === "brief" ||
    t === "playbook" ||
    hasTag(tags, "tool")
  )
    return "tools";

  // Weak fallback heuristics
  if (id.includes("worksheet")) return "worksheets";
  if (id.includes("assessment") || id.includes("audit") || id.includes("diagnostic")) return "assessments";
  if (id.includes("framework") || id.includes("matrix")) return "tools";

  return "other";
}

function sortAssets(list: SurrenderAsset[]): SurrenderAsset[] {
  return [...list].sort((a, b) => {
    const pa = typeof a.priority === "number" ? a.priority : 999;
    const pb = typeof b.priority === "number" ? b.priority : 999;
    if (pa !== pb) return pa - pb;
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

/**
 * Load registry at build-time.
 * Priority order:
 * 1) Generated static TS registry (best, fastest, safest for Next builds)
 * 2) registry.json via fs (optional if you produce it)
 * 3) Source registry (scripts/pdf/pdf-registry.source) if absolutely needed
 */
async function loadRegistry(): Promise<{ registry: SurrenderAsset[]; isFallbackData: boolean }> {
    let registry: SurrenderAsset[] = [];
  let isFallbackData = true;

  // 1) Best source: generated static TS registry
  try {
    const mod = await import("@/lib/pdf/registry.static");
    const items =
      (Array.isArray((mod as any).GENERATED_PDF_CONFIGS) && (mod as any).GENERATED_PDF_CONFIGS) ||
      (typeof (mod as any).getAllPDFs === "function" && (mod as any).getAllPDFs()) ||
      [];

    if (Array.isArray(items) && items.length > 0) {
      registry = items as SurrenderAsset[];
      isFallbackData = false;
    }
  } catch {
    // continue
  }

  // 2) Last resort: source registry (Node-only, build-time only)
  if (registry.length === 0) {
    try {
      const src = await import("@/scripts/pdf/pdf-registry.source");
      const fn = (src as any).getPDFRegistrySource;
      if (typeof fn === "function") {
        const items = fn();
        if (Array.isArray(items) && items.length > 0) {
          registry = items as SurrenderAsset[];
          isFallbackData = true;
        }
      }
    } catch {
      // ignore
    }
  }

  // 3) LAST RESORT: source registry (Node-only). Safe in getStaticProps.
  try {
    const src = await import("@/scripts/pdf/pdf-registry.source");
    const fn = (src as any).getPDFRegistrySource;
    if (typeof fn === "function") {
      const items = fn();
      if (Array.isArray(items) && items.length) {
        return { registry: items as SurrenderAsset[], isFallbackData: true };
      }
    }
    if (Array.isArray((src as any).ALL_SOURCE_PDFS_DEDUPED) && (src as any).ALL_SOURCE_PDFS_DEDUPED.length) {
      return { registry: (src as any).ALL_SOURCE_PDFS_DEDUPED as SurrenderAsset[], isFallbackData: true };
    }
    if (Array.isArray((src as any).EXISTING_PDFS) && (src as any).EXISTING_PDFS.length) {
      return { registry: (src as any).EXISTING_PDFS as SurrenderAsset[], isFallbackData: true };
    }
  } catch {
    // ignore
  }

  return { registry: [], isFallbackData: true };
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const canonical = `${SITE}/resources/surrender-framework`;

  const { registry, isFallbackData } = await loadRegistry();

  // Filter + normalize
  const assets = sortAssets(registry.filter(isSurrenderAsset));

  const grouped: Record<GroupKey, SurrenderAsset[]> = {
    worksheets: [],
    assessments: [],
    tools: [],
    other: [],
  };

  for (const a of assets) grouped[groupOf(a)].push(a);

  grouped.worksheets = sortAssets(grouped.worksheets);
  grouped.assessments = sortAssets(grouped.assessments);
  grouped.tools = sortAssets(grouped.tools);
  grouped.other = sortAssets(grouped.other);

  const stats = {
    total: assets.length,
    interactive: assets.filter((a) => Boolean(a.isInteractive)).length,
    fillable: assets.filter((a) => Boolean(a.isFillable)).length,
    public: assets.filter((a) => norm(a.tier) === "public").length,
  };

  return {
    props: {
      canonical,
      assets,
      grouped,
      stats,
      isFallbackData,
    },
    revalidate: 3600,
  };
};

const SurrenderFrameworkPage: NextPage<Props> = ({ canonical, assets, grouped, stats, isFallbackData }) => {
  return (
    <Layout
      title="Surrender Framework | Abraham of London"
      description="Worksheets, assessments, and tools that operationalise the Surrender Framework."
      canonicalUrl="/resources/surrender-framework"
      fullWidth
      className="bg-black"
    >
      <Head>
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index,follow" />
      </Head>

      {isFallbackData ? (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-amber-500/30 bg-amber-500/15 px-4 py-2 text-amber-200 text-xs font-semibold backdrop-blur-sm">
          Data mode: fallback
        </div>
      ) : null}

      {/* Header rail */}
      <div className="bg-black border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <Link
            href="/resources/strategic-frameworks"
            className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/45 hover:text-amber-200 transition-colors"
          >
            ← Back to Strategic Frameworks
          </Link>

          <Link
            href="/vault"
            className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70 hover:text-amber-200 transition-colors"
          >
            Open Vault →
          </Link>
        </div>
      </div>

      {/* Controlled empty state */}
      {assets.length === 0 ? (
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">Registry Empty</div>
            <h1 className="mt-4 font-serif text-3xl text-white">No Surrender assets indexed yet.</h1>
            <p className="mt-3 text-white/60 max-w-2xl mx-auto">
              This page is live, but the registry filter returned zero items. Ensure assets include{" "}
              <span className="font-mono text-amber-200">tags: ["surrender-framework"]</span> or{" "}
              <span className="font-mono text-amber-200">category: "surrender-framework"</span>.
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <Link
                href="/vault"
                className="inline-flex items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-amber-200 hover:bg-amber-500/15 transition-colors"
              >
                Open Vault
              </Link>
              <Link
                href="/resources/strategic-frameworks"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white hover:border-white/20 transition-colors"
              >
                Back to Frameworks
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <SurrenderAssetsLanding assets={assets} grouped={grouped} stats={stats} />
      )}
    </Layout>
  );
};

export default SurrenderFrameworkPage;