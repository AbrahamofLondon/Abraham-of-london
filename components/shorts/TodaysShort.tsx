// components/shorts/TodaysShort.tsx
// Today's Short — one complete short, picked daily (server-side).
// The daily short is selected in getStaticProps via a deterministic date seed,
// so only that short's body ships in props and real prose is emitted into the
// SSR/SSG HTML. The body is rendered to STATIC HTML at build time via
// renderDocBodyToStaticHtml (the same sanctioned path the short detail page
// uses) and rendered here through StaticMDXRenderer — NOT through
// useMDXComponent, whose `new Function(body.code)` evaluation breaks SSG on this
// estate's ESM-formatted compiled MDX.

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StaticMDXRenderer } from "@/lib/mdx/static-mdx-runtime";
import { readTimeFromText } from "@/lib/shorts/read-time";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// The daily short carries its body as build-time static HTML (`bodyHtml`).
export type TodaysShortModel = {
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string; // static HTML from renderDocBodyToStaticHtml (build time)
  raw: string; // markdown source — used only for the read-time estimate
  theme: string;
  category: string;
  readTime: string;
  date: string;
};

// Related shorts are metadata-only (no body payload).
export type RelatedShortModel = {
  slug: string;
  title: string;
  excerpt: string;
  theme: string;
  category: string;
};

// ---------------------------------------------------------------------------
// Read history (localStorage)
// ---------------------------------------------------------------------------

const STORAGE_KEY = "aol:shorts:read-history";

type ReadEntry = {
  slug: string;
  theme: string;
  dateSeen: string;
};

function getReadHistory(): ReadEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ReadEntry[];
  } catch {
    return [];
  }
}

function addToReadHistory(slug: string, theme: string): void {
  if (typeof window === "undefined") return;
  try {
    const history = getReadHistory();
    // Remove existing entry for this slug (to update dateSeen)
    const filtered = history.filter((e) => e.slug !== slug);
    filtered.push({ slug, theme, dateSeen: new Date().toISOString().split("T")[0] || "" });
    // Keep only last 100 entries
    const trimmed = filtered.slice(-100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage may be full or unavailable
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export type TodaysShortProps = {
  // Selected server-side; carries the daily short's body as static HTML.
  todaysShort: TodaysShortModel;
  // Metadata-only related list (no body payload).
  relatedShorts: RelatedShortModel[];
};

export default function TodaysShort({ todaysShort, relatedShorts }: TodaysShortProps) {
  // Honest read time derived from the markdown source (no payload cost; raw is
  // small relative to compiled code and only used here).
  const displayReadTime = React.useMemo(() => {
    if (todaysShort.readTime) return todaysShort.readTime;
    return todaysShort.raw ? readTimeFromText(todaysShort.raw) : "";
  }, [todaysShort.readTime, todaysShort.raw]);

  // Mark as read on click-through to the full short (NOT on selection).
  const handleReadFull = React.useCallback(() => {
    if (todaysShort.slug) addToReadHistory(todaysShort.slug, todaysShort.theme);
  }, [todaysShort.slug, todaysShort.theme]);

  if (!todaysShort.slug) {
    return null;
  }

  return (
    <section className="relative">
      {/* Today's Short */}
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10 lg:py-16">
        {/* Label */}
        <div className="mb-6 flex items-center gap-3">
          <span
            className="inline-block h-px w-8"
            style={{ background: "linear-gradient(to right, var(--ds-accent), transparent)" }}
          />
          <span
            className="font-mono text-[7.5px] uppercase tracking-[0.40em]"
            style={{ color: "var(--ds-accent)" }}
          >
            Today&rsquo;s Short
          </span>
          {displayReadTime && (
            <>
              <span style={{ color: "var(--ds-text-subtle)", opacity: 0.4 }}>/</span>
              <span
                className="font-mono text-[7.5px] uppercase tracking-[0.30em]"
                style={{ color: "var(--ds-text-subtle)" }}
              >
                {displayReadTime}
              </span>
            </>
          )}
        </div>

        {/* Support line */}
        <p
          className="mb-8 font-serif font-light italic"
          style={{
            fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)",
            lineHeight: 1.6,
            color: "var(--ds-text-muted)",
            maxWidth: "48ch",
          }}
        >
          One idea a day, picked for you — or browse the full archive below.
        </p>

        {/* Title */}
        <h2
          className="mb-6 font-serif font-light"
          style={{
            fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: "var(--ds-text)",
          }}
        >
          {todaysShort.title}
        </h2>

        {/* Category + theme */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <span
            className="inline-block rounded-sm px-2.5 py-1 font-mono text-[7px] uppercase tracking-[0.30em]"
            style={{
              border: "1px solid var(--ds-accent-soft)",
              color: "var(--ds-accent)",
              backgroundColor: "color-mix(in srgb, var(--ds-accent) 8%, transparent)",
            }}
          >
            {todaysShort.category || "Signal"}
          </span>
          <span
            className="font-mono text-[7px] uppercase tracking-[0.30em]"
            style={{ color: "var(--ds-text-subtle)" }}
          >
            {todaysShort.theme || "purpose"}
          </span>
        </div>

        {/* Full body content — build-time static HTML (no runtime MDX eval) */}
        {todaysShort.bodyHtml && (
          <div
            className="prose-custom max-w-2xl font-serif font-light leading-relaxed"
            style={{
              fontSize: "clamp(1rem, 1.1vw, 1.1rem)",
              lineHeight: 1.75,
              color: "var(--ds-text-secondary)",
            }}
          >
            <StaticMDXRenderer html={todaysShort.bodyHtml} />
          </div>
        )}

        {/* Read full short link */}
        <div className="mt-10">
          <Link
            href={`/shorts/${todaysShort.slug}`}
            onClick={handleReadFull}
            className="group inline-flex items-center gap-2 border-b pb-0.5 font-mono text-[8px] uppercase tracking-[0.35em] transition-colors"
            style={{
              borderColor: "var(--ds-accent-soft)",
              color: "var(--ds-accent)",
            }}
          >
            Read full note
            <ArrowUpRight
              style={{
                width: "12px",
                height: "12px",
                transition: "transform 250ms ease",
              }}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(to right, var(--ds-accent-soft), transparent)" }}
        />
      </div>

      {/* Related shorts */}
      {relatedShorts.length > 0 && (
        <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10 lg:py-14">
          <div className="mb-6 flex items-center gap-3">
            <span
              className="inline-block h-px w-6"
              style={{ background: "linear-gradient(to right, var(--ds-accent), transparent)" }}
            />
            <span
              className="font-mono text-[7.5px] uppercase tracking-[0.40em]"
              style={{ color: "var(--ds-text-subtle)" }}
            >
              If this resonated
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {relatedShorts.map((related) => (
              <Link
                key={related.slug}
                href={`/shorts/${related.slug}`}
                className="group block border p-5 transition-colors hover:bg-white/[0.02]"
                style={{ borderColor: "var(--ds-border)" }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="font-mono text-[6.5px] uppercase tracking-[0.30em]"
                    style={{ color: "var(--ds-accent)" }}
                  >
                    {related.category || "Signal"}
                  </span>
                  <span style={{ color: "var(--ds-text-subtle)", opacity: 0.3 }}>·</span>
                  <span
                    className="font-mono text-[6.5px] uppercase tracking-[0.25em]"
                    style={{ color: "var(--ds-text-subtle)" }}
                  >
                    {related.theme}
                  </span>
                </div>
                <h3
                  className="font-serif font-light transition-colors group-hover:text-white"
                  style={{
                    fontSize: "clamp(1rem, 1.1vw, 1.15rem)",
                    lineHeight: 1.15,
                    color: "var(--ds-text)",
                  }}
                >
                  {related.title}
                </h3>
                {related.excerpt && (
                  <p
                    className="mt-2 line-clamp-2 font-serif font-light text-sm leading-relaxed"
                    style={{ color: "var(--ds-text-muted)" }}
                  >
                    {related.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(to right, transparent, var(--ds-accent-soft), transparent)" }}
        />
      </div>
    </section>
  );
}
