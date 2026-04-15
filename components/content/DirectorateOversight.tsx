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
type CoverAspect = "wide" | "book" | "square" | "standard" | "auto";
type CoverFit = "cover" | "contain" | "smart";
type CoverPosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top left"
  | "top right"
  | "bottom left"
  | "bottom right";

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
  coverAspect?: CoverAspect | null;
  coverFit?: CoverFit | null;
  coverPosition?: CoverPosition | null;
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
  return Number.isNaN(d.getTime())
    ? "archive"
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
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

function resolveAspectRatio(aspect?: CoverAspect | null): string {
  switch ((aspect || "auto").toLowerCase()) {
    case "wide":
      return "16 / 9";
    case "book":
      return "3 / 4";
    case "square":
      return "1 / 1";
    case "standard":
      return "4 / 3";
    default:
      return "16 / 10";
  }
}

function resolvePosition(pos?: CoverPosition | null): string {
  const normalized = String(pos || "center").toLowerCase().trim();
  const allowed = new Set([
    "center",
    "top",
    "bottom",
    "left",
    "right",
    "top left",
    "top right",
    "bottom left",
    "bottom right",
  ]);
  return allowed.has(normalized) ? normalized : "center";
}

function resolveFit(fit?: CoverFit | null): CoverFit {
  return fit === "cover" || fit === "contain" || fit === "smart" ? fit : "smart";
}

function SmartHeroCover({
  src,
  alt,
  aspect,
  fit,
  position,
}: {
  src: string;
  alt: string;
  aspect: string;
  fit: CoverFit;
  position: string;
}) {
  const isCover = fit === "cover";

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-black/50 shadow-[0_30px_100px_-60px_rgba(0,0,0,0.95)]">
      <div className="relative w-full" style={{ aspectRatio: aspect }}>
        {!isCover && (
          <>
            <Image
              src={src}
              alt=""
              fill
              className="object-cover scale-[1.05]"
              style={{ objectPosition: position, filter: "blur(22px)" }}
              sizes="(max-width: 1024px) 100vw, 920px"
              priority
            />
            <div aria-hidden className="absolute inset-0 bg-black/55" />
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(245,158,11,0.14),transparent_40%)]" />
          </>
        )}

        <Image
          src={src}
          alt={alt}
          fill
          priority
          className={isCover ? "object-cover" : "object-contain"}
          style={{
            objectPosition: position,
            padding: isCover ? undefined : "18px",
          }}
          sizes="(max-width: 1024px) 100vw, 920px"
        />

        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.52))]" />
      </div>
    </div>
  );
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
  coverAspect,
  coverFit,
  coverPosition,
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
  const heroAspect = resolveAspectRatio(coverAspect);
  const heroFit = resolveFit(coverFit);
  const heroPosition = resolvePosition(coverPosition);

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
      <section className="relative overflow-hidden border-b border-white/10 bg-[#060609]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_15%,rgba(245,158,11,0.12),transparent_30%),radial-gradient(circle_at_84%_12%,rgba(255,255,255,0.06),transparent_26%),linear-gradient(180deg,#050506_0%,#09090d_100%)]" />
          <div className="absolute inset-0 aol-vignette" />
          <div className="absolute inset-0 aol-grain opacity-[0.10]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-12 pt-[calc(var(--aol-header-h,88px)+2rem)] lg:px-10">
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

          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.3em]">
                <span className="text-amber-200/68">{resolvedCategory}</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="text-white/35">{formatDate(date)}</span>
                {tags?.[0] && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span className="text-white/35">{tags[0]}</span>
                  </>
                )}
              </div>

              <h1 className="mt-6 max-w-[14ch] font-serif text-4xl leading-[0.94] tracking-[-0.04em] text-white md:text-6xl">
                {title}
              </h1>

              {subtitle ? <p className="mt-5 max-w-2xl text-lg text-amber-200/62">{subtitle}</p> : null}
              {excerpt ? (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/62 md:text-base">
                  {excerpt}
                </p>
              ) : null}

              <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-white/34">Reading Time</div>
                  <div className="mt-2 font-serif text-2xl text-white">{resolvedReadTime || "Essay"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-white/34">Access</div>
                  <div className="mt-2 font-serif text-2xl text-white">{getTierLabel(requiredTier)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-white/34">Imprint</div>
                  <div className="mt-2 text-sm leading-relaxed text-white/66">{imprint}</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <SmartHeroCover
                src={resolvedCover}
                alt={title}
                aspect={heroAspect}
                fit={heroFit}
                position={heroPosition}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-9 order-2 lg:order-1">
            <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-3 shadow-[0_30px_100px_-70px_rgba(0,0,0,0.95)]">
              <div className="rounded-[26px] border border-white/8 bg-black/45 p-8 md:p-12">
                <div className="mb-8 flex items-center gap-3 border-b border-white/10 pb-6">
                  <div className="h-px w-10 bg-amber-400/40" />
                  <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-200/68">
                    Reading Chamber
                  </div>
                </div>

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
            </div>

            <div className="mt-10 h-px bg-white/10" />
            <div className="mt-8 text-center text-[10px] font-mono tracking-widest text-white/30">
              {imprint}
            </div>
          </div>

          {hasValidContent && !loading && !unlockError && (
            <div className="lg:col-span-3 order-1 lg:order-2 lg:sticky lg:top-24 h-fit">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5">
                <div className="mb-4 text-[10px] font-mono uppercase tracking-[0.34em] text-amber-200/68">
                  On This Page
                </div>
                <SafeTableOfContents delayMs={600} />
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
