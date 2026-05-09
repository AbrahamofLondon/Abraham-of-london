/* pages/library/[slug].tsx — LIBRARY DETAIL (PRIVATE BANK CADENCE)
 *
 * Private bank presentation for every asset:
 *   - Public PDFs: direct download + iframe preview (unchanged access)
 *   - Restricted PDFs: auth-gated via /api/library/[slug]
 *   - All assets: beautifully curated metadata, elegant layout, client delight
 */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import {
  ArrowLeft,
  ExternalLink,
  Download,
  FileText,
  Lock,
  Loader2,
  Shield,
  Bookmark,
  Clock,
  Tag,
} from "lucide-react";

import tiers, { type AccessTier } from "@/lib/access/tiers";

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
  accessLevel?: string | null;
  tier?: string | null;
};

type Props = {
  asset: PdfAsset;
  requiredTier: AccessTier;
  resolvedUrl: string | null;
  routeSlug: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function jsonSafe<T>(v: T): T {
  return JSON.parse(
    JSON.stringify(v, (_k, val) => (val === undefined ? null : val)),
  );
}

function coerceAsset(x: any): PdfAsset | null {
  if (!x) return null;

  const rawSlug = safeStr(
    x.slug || x.id || x.key || x.name || x.file || x.pdf || "",
  );
  const slug = normalizeSlug(rawSlug);
  if (!slug) return null;

  const title = safeStr(
    x.title || x.name || x.label || toRouteSlug(slug) || "Untitled",
  );

  const tags = Array.isArray(x.tags)
    ? x.tags.map((t: any) => safeStr(t)).filter(Boolean)
    : null;

  const updated =
    safeStr(
      x.updated ||
        x.updatedAt ||
        x.modified ||
        x.lastModified ||
        x.date ||
        "",
    ) || null;

  const isPublic =
    x.public === true ||
    x.isPublic === true ||
    String(x.accessLevel || "").toLowerCase() === "public" ||
    String(x.tier || "").toLowerCase() === "public" ||
    String(x.visibility || "").toLowerCase() === "public" ||
    String(x.access || "").toLowerCase() === "public" ||
    x.locked === false;

  return {
    slug,
    title,
    description:
      safeStr(x.description || x.excerpt || x.summary || "") || null,
    category: safeStr(x.category || x.collection || x.kind || "") || null,
    tags,
    href: safeStr(x.href || "") || null,
    url: safeStr(x.url || x.publicUrl || "") || null,
    path: safeStr(x.path || x.filePath || x.file || "") || null,
    public: Boolean(isPublic),
    updated,
    date: safeStr(x.date || x.publishedAt || "") || null,
    accessLevel:
      safeStr(x.accessLevel || x.tier || (isPublic ? "public" : "member")) ||
      null,
    tier:
      safeStr(x.tier || x.accessLevel || (isPublic ? "public" : "member")) ||
      null,
  };
}

function resolvePublicAssetUrl(asset: PdfAsset): string | null {
  const url = safeStr(asset.url || "");
  if (url) return url;

  const href = safeStr(asset.href || "");
  if (href) return href.startsWith("/") ? href : href;

  const path = safeStr(asset.path || "");
  if (path) {
    const p = normalizeSlug(path);
    if (p.startsWith("pdfs/")) return `/${p}`;
    if (p.startsWith("assets/")) return `/${p}`;
    if (p.startsWith("public/")) return `/${p.replace(/^public\//, "")}`;
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
  }

  return null;
}

async function loadPdfAssets(): Promise<PdfAsset[]> {
  try {
    const mod: any = await import("@/scripts/pdf/pdf-registry.source");
    const list =
      mod?.ALL_SOURCE_PDFS ||
      mod?.PDF_REGISTRY ||
      mod?.ALL_PDFS ||
      mod?.default;
    const arr: any[] = Array.isArray(list)
      ? list
      : Array.isArray(list?.items)
        ? list.items
        : [];
    return arr.map(coerceAsset).filter(Boolean) as PdfAsset[];
  } catch {
    return [];
  }
}

// ─── Static Generation ───────────────────────────────────────────────────────

export const getStaticPaths: GetStaticPaths = async () => {
  const assets = await loadPdfAssets();

  const paths = assets
    .map((a) => toRouteSlug(a.slug))
    .filter(Boolean)
    .map((slug) => ({ params: { slug } }));

  const seen = new Set<string>();
  const deduped = paths.filter((p) => {
    const k = String(p.params.slug).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return { paths: deduped, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const rawParam = params?.slug;
  const paramSlug = normalizeSlug(
    Array.isArray(rawParam) ? rawParam.join("/") : safeStr(rawParam),
  );
  if (!paramSlug) return { notFound: true, revalidate: 60 };

  const assets = await loadPdfAssets();
  const needle = paramSlug.toLowerCase();

  const asset =
    assets.find((a) => toRouteSlug(a.slug).toLowerCase() === needle) ||
    assets.find((a) => normalizeSlug(a.slug).toLowerCase() === needle) ||
    null;

  if (!asset) return { notFound: true, revalidate: 300 };

  const routeSlug = toRouteSlug(asset.slug);
  const requiredTier = tiers.normalizeRequired(
    asset.accessLevel ??
      asset.tier ??
      (asset.public ? "public" : "member"),
  );
  const isPublic = requiredTier === "public";

  // Public: resolve direct URL for open download + preview
  // Restricted: route through secure API proxy
  const secureKey = encodeURIComponent(normalizeSlug(asset.slug));
  const resolvedUrl = isPublic
    ? resolvePublicAssetUrl(asset)
    : `/api/library/${secureKey}`;

  const safeAsset: PdfAsset = isPublic
    ? asset
    : { ...asset, url: null, href: null, path: null };

  return {
    props: jsonSafe({
      asset: safeAsset,
      requiredTier,
      resolvedUrl,
      routeSlug,
    }),
    revalidate: 900,
  };
};

// ─── Presentation Helpers ────────────────────────────────────────────────────

function formatDate(value?: string | null) {
  if (!value) return null;
  const t = Date.parse(value);
  if (Number.isNaN(t)) return null;
  return new Date(t).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function assetCategoryIcon(category?: string | null) {
  const cat = (category || "").toLowerCase();
  if (cat.includes("framework") || cat.includes("governance")) return "🏛";
  if (cat.includes("leadership") || cat.includes("personal")) return "👤";
  if (cat.includes("theology") || cat.includes("family")) return "📖";
  if (cat.includes("operations") || cat.includes("strategic")) return "⚙";
  if (cat.includes("legacy")) return "🏗";
  if (cat.includes("market") || cat.includes("intel")) return "📊";
  return "📄";
}

// ─── Component ───────────────────────────────────────────────────────────────

const LibrarySlugPage: NextPage<Props> = ({
  asset,
  requiredTier,
  resolvedUrl,
  routeSlug,
}) => {
  const canonical = `/library/${encodeURIComponent(routeSlug)}`;
  const desc =
    asset.description || "Verified Library asset // Abraham of London.";

  const { data: session, status } = useSession();

  const required = tiers.normalizeRequired(requiredTier);
  const user = tiers.normalizeUser(
    (session?.user as any)?.tier ?? "public",
  );

  const needsAuth = required !== "public";
  const canAccess =
    !needsAuth || (!!session?.user && tiers.hasAccess(user, required));

  const url = resolvedUrl || null;
  const formattedDate = formatDate(asset.updated || asset.date);

  if (needsAuth && status === "loading") {
    return (
      <Layout title={asset.title}>
        <div className="min-h-screen bg-[rgb(3,3,5)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-5 w-5 animate-spin text-[#C9A96E]" />
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/40">
              Verifying clearance...
            </span>
          </div>
        </div>
      </Layout>
    );
  }

  if (needsAuth && (!session?.user || !canAccess)) {
    return (
      <Layout title={asset.title}>
        <div className="min-h-screen bg-[rgb(3,3,5)] flex items-center justify-center px-6">
          <AccessGate
            title={asset.title}
            requiredTier={required}
            message="This library asset requires appropriate access."
            isAuthenticated={!!session?.user}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={asset.title}
      description={desc}
      canonicalUrl={canonical}
      fullWidth
      className="bg-[rgb(3,3,5)] text-white"
    >
      <Head>
        <meta
          name="robots"
          content={
            required === "public" ? "index, follow" : "noindex, nofollow"
          }
        />
      </Head>

      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        {/* ── Hero Section ── */}
        <header
          className="border-b"
          style={{ borderBottomColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            {/* Breadcrumb */}
            <Link
              href="/library"
              className="group inline-flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.35em] transition-colors"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span className="group-hover:text-white/60 transition-colors">
                Library
              </span>
            </Link>

            <div className="mt-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              {/* Left: Metadata */}
              <div className="min-w-0 max-w-2xl">
                {/* Badge row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Category badge */}
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-mono uppercase tracking-[0.28em]"
                    style={{
                      backgroundColor: "rgba(201,169,110,0.08)",
                      color: "rgba(201,169,110,0.75)",
                      border: "1px solid rgba(201,169,110,0.15)",
                    }}
                  >
                    {assetCategoryIcon(asset.category)}{" "}
                    {asset.category || "Library Asset"}
                  </span>

                  {/* Tier badge */}
                  {required !== "public" ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-mono uppercase tracking-[0.28em]"
                      style={{
                        backgroundColor: "rgba(245,158,11,0.08)",
                        color: "rgba(245,158,11,0.7)",
                        border: "1px solid rgba(245,158,11,0.15)",
                      }}
                    >
                      <Lock className="h-3 w-3" />
                      {required}
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-mono uppercase tracking-[0.28em]"
                      style={{
                        backgroundColor: "rgba(34,197,94,0.08)",
                        color: "rgba(34,197,94,0.6)",
                        border: "1px solid rgba(34,197,94,0.12)",
                      }}
                    >
                      <Shield className="h-3 w-3" />
                      Public
                    </span>
                  )}

                  {/* Date */}
                  {formattedDate && (
                    <span
                      className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.28em]"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      <Clock className="h-3 w-3" />
                      {formattedDate}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1
                  className="mt-6 font-serif text-[2.2rem] md:text-[3.2rem] leading-tight"
                  style={{
                    color: "rgba(255,255,255,0.92)",
                    fontWeight: 300,
                  }}
                >
                  {asset.title}
                </h1>

                {/* Description */}
                {asset.description && (
                  <p
                    className="mt-5 max-w-2xl text-sm md:text-base leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {asset.description}
                  </p>
                )}

                {/* Tags */}
                {Array.isArray(asset.tags) && asset.tags.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-2">
                    {asset.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[8px] font-mono uppercase tracking-[0.25em]"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.04)",
                          color: "rgba(255,255,255,0.3)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Slug reference */}
                <div
                  className="mt-8 text-[8px] font-mono uppercase tracking-[0.3em]"
                  style={{ color: "rgba(255,255,255,0.15)" }}
                >
                  Reference:{" "}
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>
                    {asset.slug}
                  </span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="shrink-0 flex flex-col gap-3 min-w-[200px]">
                {url ? (
                  <>
                    {/* Open button */}
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center justify-center gap-2.5 rounded-lg px-5 py-3 text-[10px] font-mono uppercase tracking-[0.32em] transition-all duration-200"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.6)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255,255,255,0.07)";
                        e.currentTarget.style.color =
                          "rgba(255,255,255,0.8)";
                        e.currentTarget.style.borderColor =
                          "rgba(201,169,110,0.25)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255,255,255,0.04)";
                        e.currentTarget.style.color =
                          "rgba(255,255,255,0.6)";
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.08)";
                      }}
                    >
                      <ExternalLink className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                      Open
                    </a>

                    {/* Download button */}
                    <a
                      href={url}
                      className="group inline-flex items-center justify-center gap-2.5 rounded-lg px-5 py-3 text-[10px] font-mono uppercase tracking-[0.32em] transition-all duration-200"
                      style={{
                        backgroundColor: "rgba(201,169,110,0.12)",
                        color: "rgba(201,169,110,0.85)",
                        border: "1px solid rgba(201,169,110,0.2)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(201,169,110,0.2)";
                        e.currentTarget.style.color = "#C9A96E";
                        e.currentTarget.style.borderColor =
                          "rgba(201,169,110,0.35)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(201,169,110,0.12)";
                        e.currentTarget.style.color =
                          "rgba(201,169,110,0.85)";
                        e.currentTarget.style.borderColor =
                          "rgba(201,169,110,0.2)";
                      }}
                    >
                      <Download className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                      Download PDF
                    </a>

                    {/* Status note */}
                    <div
                      className="mt-1 rounded-lg px-4 py-2.5 text-[8px] font-mono uppercase tracking-[0.25em] leading-relaxed text-center"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.02)",
                        color: "rgba(255,255,255,0.2)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      {required === "public"
                        ? "Open access · No authentication required"
                        : `Restricted · ${required} clearance required`}
                    </div>
                  </>
                ) : (
                  <div
                    className="rounded-lg px-5 py-6 text-center"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <FileText
                      className="h-8 w-8 mx-auto mb-3"
                      style={{ color: "rgba(255,255,255,0.12)" }}
                    />
                    <p
                      className="text-[9px] font-mono uppercase tracking-[0.3em]"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      Asset URL unavailable
                    </p>
                    <p
                      className="mt-2 text-[7px] font-mono uppercase tracking-[0.25em]"
                      style={{ color: "rgba(255,255,255,0.15)" }}
                    >
                      Contact administration
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── Preview Section ── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {url ? (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: "rgb(5,5,7)",
              }}
            >
              {/* Preview header */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  backgroundColor: "rgba(255,255,255,0.015)",
                }}
              >
                <span
                  className="text-[8px] font-mono uppercase tracking-[0.35em]"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  <FileText className="h-3 w-3 inline mr-2" />
                  Document Preview
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[8px] font-mono uppercase tracking-[0.3em] transition-colors"
                  style={{ color: "rgba(201,169,110,0.5)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#C9A96E")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color =
                      "rgba(201,169,110,0.5)")
                  }
                >
                  <ExternalLink className="h-3 w-3 inline mr-1" />
                  Open in new tab
                </a>
              </div>

              {/* Preview frame */}
              <div className="aspect-[16/10] w-full">
                {needsAuth && !session?.user ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-[#C9A96E]" />
                  </div>
                ) : (
                  <iframe
                    src={url}
                    className="h-full w-full"
                    title={asset.title}
                    sandbox="allow-same-origin allow-scripts allow-forms allow-downloads"
                  />
                )}
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl px-8 py-16 text-center"
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: "rgb(5,5,7)",
              }}
            >
              <Bookmark
                className="h-10 w-10 mx-auto mb-4"
                style={{ color: "rgba(255,255,255,0.08)" }}
              />
              <p
                className="text-[10px] font-mono uppercase tracking-[0.3em]"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                Preview unavailable
              </p>
              <p
                className="mt-2 text-[8px] font-mono uppercase tracking-[0.25em]"
                style={{ color: "rgba(255,255,255,0.12)" }}
              >
                {required === "public"
                  ? "This public asset has no resolvable preview URL"
                  : "Sign in with appropriate clearance to access"}
              </p>
            </div>
          )}
        </section>

        {/* ── Footer metadata ── */}
        <section
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16"
          style={{ color: "rgba(255,255,255,0.12)" }}
        >
          <div
            className="h-px w-full mb-8"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          />
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-[7px] font-mono uppercase tracking-[0.3em]">
            <span>Abraham of London · Library</span>
            <span>Asset: {asset.slug}</span>
            <span>
              Access:{" "}
              {required === "public" ? "Open" : required}
            </span>
            {formattedDate && <span>Updated: {formattedDate}</span>}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default LibrarySlugPage;