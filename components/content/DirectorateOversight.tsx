/* components/content/DirectorateOversight.tsx */
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Clock3,
  Tag,
  Lock,
  Loader2,
  AlertCircle,
  BookOpen,
  FileText,
  Library,
} from "lucide-react";

import type { AccessTier } from "@/lib/access/tier-policy";
import { getTierLabel } from "@/lib/access/tier-policy";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import { SafeTableOfContents } from "@/components/mdx/TableOfContents";

type DirectorateKind = "essay" | "book" | "volume" | "document";

type DirectorateOversightProps = {
  kind?: DirectorateKind;
  title: string;
  excerpt?: string;
  subtitle?: string;
  category?: string;
  date?: string | null;
  tags?: string[];
  readTime?: string | number | null;
  cover?: string;
  backHref: string;
  backLabel?: string;
  imprint?: string;
  requiredTier?: AccessTier;
  loading?: boolean;
  unlockError?: string | null;
  activeCode?: string | null;           // ← important: allow null
  emptyLabel?: string;
  childrenTopRight?: React.ReactNode;
};

const DEFAULT_COVER = "/assets/images/blog/default-blog-cover.jpg";

function formatDate(input?: string | null): string {
  if (!input) return "archive";
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "archive" : d.toLocaleDateString("en-GB");
}

function normalizeReadTime(value?: string | number | null): string | null {
  if (value == null || value === "") return null;
  return String(value);
}

function getResolvedCategory(kind: DirectorateKind, category?: string): string {
  if (category?.trim()) return category.trim();
  switch (kind) {
    case "book": return "Book";
    case "volume": return "Volume";
    case "essay": return "Essay";
    default: return "Document";
  }
}

function EmptyStateIcon({ kind }: { kind: DirectorateKind }) {
  if (kind === "book" || kind === "volume") return <BookOpen className="mx-auto mb-3 h-6 w-6 text-white/30" />;
  if (kind === "essay") return <FileText className="mx-auto mb-3 h-6 w-6 text-white/30" />;
  return <Library className="mx-auto mb-3 h-6 w-6 text-white/30" />;
}

export default function DirectorateOversight({
  kind = "document",
  title,
  excerpt,
  subtitle,
  category,
  date,
  tags,
  readTime,
  cover,
  backHref,
  backLabel = "Back",
  imprint = "Abraham of London • Institutional Notes",
  requiredTier = "public",
  loading = false,
  unlockError = null,
  activeCode = "",
  emptyLabel = "No content available.",
  childrenTopRight,
}: DirectorateOversightProps) {
  const resolvedCover = cover || DEFAULT_COVER;
  const resolvedCategory = getResolvedCategory(kind, category);
  const resolvedReadTime = normalizeReadTime(readTime);

  // === CRITICAL: Clean and validate the code before rendering ===
  const cleanCode = React.useMemo(() => {
    if (!activeCode || typeof activeCode !== "string") return "";
    const trimmed = activeCode.trim();

    // Reject obvious React runtime garbage / minified bundles
    if (
      trimmed.length > 500 &&
      (trimmed.includes("Object.create") ||
       trimmed.includes("getOwnPropertyDescriptor") ||
       trimmed.includes("react-dom-client"))
    ) {
      console.warn("[DirectorateOversight] Detected invalid MDX code (React runtime leak). Skipping render.");
      return "";
    }
    return trimmed;
  }, [activeCode]);

  const hasValidContent = cleanCode.length > 30; // reasonable minimum for real content

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/10 bg-[#060609]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 aol-vignette" />
          <div className="absolute inset-0 aol-grain opacity-[0.10]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-10 pt-[calc(var(--aol-header-h,88px)+2rem)] lg:px-10">
          <div className="flex items-center justify-between gap-6">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 transition hover:bg-white/[0.06]"
            >
              <ArrowLeft className="h-4 w-4 text-white/70" />
              <span className="text-sm text-white/55">{backLabel}</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
              {requiredTier !== "public" && (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-400">
                  <Lock className="h-3 w-3" /> {getTierLabel(requiredTier)}
                </span>
              )}
              {resolvedReadTime && (
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5" /> {resolvedReadTime}
                </span>
              )}
              {childrenTopRight}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                <div className="relative w-full" style={{ aspectRatio: "16/10" }}>
                  <Image
                    src={resolvedCover}
                    alt={title}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 720px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs">
                <span className="text-amber-200/60">{resolvedCategory}</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="text-white/35">{formatDate(date)}</span>
                {tags?.[0] && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span className="text-white/35">{tags[0]}</span>
                  </>
                )}
              </div>

              <h1 className="mt-6 font-serif text-4xl tracking-tight text-white md:text-5xl">
                {title}
              </h1>

              {subtitle && <p className="mt-4 text-lg text-amber-200/60">{subtitle}</p>}
              {excerpt && <p className="mt-4 text-white/70">{excerpt}</p>}

              <div className="mt-8 h-px bg-white/10" />
              <div className="mt-6 text-[10px] font-mono uppercase tracking-widest text-white/30">
                {imprint}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Area */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-9 order-2 lg:order-1">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-8 md:p-12 shadow-xl">
              {unlockError ? (
                <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-red-400 flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5" />
                  {unlockError}
                </div>
              ) : loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                </div>
              ) : hasValidContent ? (
                <SafeMDXRenderer code={cleanCode} debug={process.env.NODE_ENV === "development"} />
              ) : (
                <div className="py-20 text-center text-white/50">
                  <EmptyStateIcon kind={kind} />
                  <p className="mt-4">{emptyLabel}</p>
                </div>
              )}
            </div>

            <div className="mt-10 h-px bg-white/10" />
            <div className="mt-8 text-center text-[10px] font-mono tracking-widest text-white/30">
              {imprint}
            </div>
          </div>

          {/* TOC Sidebar */}
          {hasValidContent && !loading && !unlockError && (
            <div className="lg:col-span-3 order-1 lg:order-2 lg:sticky lg:top-24 h-fit">
              <SafeTableOfContents delayMs={600} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}