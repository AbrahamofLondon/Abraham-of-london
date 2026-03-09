/* eslint-disable @typescript-eslint/no-explicit-any */
/* components/content/DirectorateOversight.tsx
   INSTITUTIONAL READER SHELL — premium longform surface for essays, books, volumes, dossiers.
*/

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
  activeCode?: string;
  emptyLabel?: string;
  childrenTopRight?: React.ReactNode;
};

const DEFAULT_COVER = "/assets/images/blog/default-blog-cover.jpg";

function formatDate(input?: string | null): string {
  if (!input) return "archive";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "archive";
  return d.toLocaleDateString("en-GB");
}

function normalizeReadTime(value?: string | number | null): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function getResolvedCategory(kind: DirectorateKind, category?: string): string {
  if (category && String(category).trim()) return String(category).trim();

  switch (kind) {
    case "book":
      return "Book";
    case "volume":
      return "Volume";
    case "essay":
      return "Essay";
    default:
      return "Document";
  }
}

function EmptyStateIcon({ kind }: { kind: DirectorateKind }) {
  if (kind === "book" || kind === "volume") {
    return <BookOpen className="mx-auto mb-3 h-6 w-6 text-white/30" />;
  }
  if (kind === "essay") {
    return <FileText className="mx-auto mb-3 h-6 w-6 text-white/30" />;
  }
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
  const hasContent = Boolean(String(activeCode || "").trim());

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-black">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 aol-vignette" />
          <div className="absolute inset-0 aol-grain opacity-[0.10]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-gradient-to-l from-white/[0.02] to-transparent lg:block" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-10 pt-[calc(var(--aol-header-h,88px)+2rem)] lg:px-10">
          <div className="flex items-center justify-between gap-6">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 transition-colors hover:bg-white/[0.06]"
            >
              <ArrowLeft className="h-4 w-4 text-white/70" />
              <span className="aol-micro text-white/55">{backLabel}</span>
            </Link>

            <div className="flex flex-wrap items-center justify-end gap-3 text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
              {requiredTier !== "public" ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-400">
                  <Lock className="h-3 w-3" />
                  {getTierLabel(requiredTier)}
                </span>
              ) : null}

              {resolvedReadTime ? (
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5" />
                  {resolvedReadTime}
                </span>
              ) : null}

              {childrenTopRight}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_24px_90px_rgba(0,0,0,0.38)]">
                <div className="relative w-full" style={{ aspectRatio: "16 / 10" }}>
                  <Image
                    src={resolvedCover}
                    alt={title}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 720px"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 ring-1 ring-inset ring-white/5"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/60">
                  {resolvedCategory}
                </span>

                <span className="h-1 w-1 rounded-full bg-white/20" />

                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
                  {formatDate(date)}
                </span>

                {tags?.[0] ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
                      <Tag className="h-3.5 w-3.5" />
                      {String(tags[0])}
                    </span>
                  </>
                ) : null}
              </div>

              <h1 className="mt-6 font-serif text-4xl tracking-tight text-white/95 md:text-5xl">
                {title}
              </h1>

              {subtitle ? (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-amber-200/55 md:text-base">
                  {subtitle}
                </p>
              ) : null}

              {excerpt ? (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
                  {excerpt}
                </p>
              ) : null}

              <div className="mt-8 aol-hairline" />
              <div className="mt-6 text-[10px] font-mono uppercase tracking-[0.35em] text-white/30">
                {imprint}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-6 py-14 lg:px-10">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_24px_90px_rgba(0,0,0,0.26)] md:p-10">
          {unlockError ? (
            <div className="mb-6 flex items-center justify-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{unlockError}</span>
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            </div>
          ) : hasContent ? (
            <SafeMDXRenderer code={activeCode} />
          ) : (
            <div className="py-10 text-center text-white/55">
              <EmptyStateIcon kind={kind} />
              <div>{emptyLabel}</div>
            </div>
          )}
        </div>

        <div className="mt-10 aol-hairline" />
        <div className="mt-8 text-center">
          <div className="aol-micro text-white/35">{imprint}</div>
        </div>
      </section>
    </>
  );
}