// components/shorts/TodaysShort.tsx
// Today's Short — one complete short, picked daily.
// No teasers, no streaks, no urgency. Full content on arrival.

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TodaysShortModel = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  theme: string;
  category: string;
  readTime: string;
  date: string;
};

export type RelatedShortModel = {
  slug: string;
  title: string;
  excerpt: string;
  theme: string;
  category: string;
};

// ---------------------------------------------------------------------------
// Read-time helpers
// ---------------------------------------------------------------------------

function computeReadTime(wordCount: number): string {
  const min = Math.max(1, Math.ceil(wordCount / 220));
  return `${min} min read`;
}

function estimateWordCount(body: string): number {
  if (!body) return 0;
  // Strip HTML tags, markdown syntax, and count words
  const cleaned = body
    .replace(/<[^>]*>/g, "")
    .replace(/[#*_`\[\]()>|~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.split(/\s+/).filter(Boolean).length;
}

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

function getAlreadyReadSlugs(): Set<string> {
  return new Set(getReadHistory().map((e) => e.slug));
}

// ---------------------------------------------------------------------------
// Curated first-short pool (for first-time visitors)
// ---------------------------------------------------------------------------

const CURATED_FIRST_SHORTS = [
  "authority-is-the-missing-layer",
  "when-the-dashboard-lies-politely",
  "the-discipline-of-bounded-adaptation",
  "clarity-is-not-a-feeling",
  "the-cost-of-living-in-escalation",
];

// ---------------------------------------------------------------------------
// Deterministic daily selection
// ---------------------------------------------------------------------------

function getDailySeed(): string {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
}

function selectTodaysShort(
  shorts: TodaysShortModel[],
  alreadyRead: Set<string>,
  isFirstVisit: boolean,
): TodaysShortModel | null | undefined {
  if (shorts.length === 0) {
    // Fallback: return a placeholder
    return {
      slug: "",
      title: "No short available",
      excerpt: "",
      body: "",
      theme: "",
      category: "",
      readTime: "",
      date: "",
    };
  }

  const seed = getDailySeed();

  // First-time visitor: pick from curated pool
  if (isFirstVisit) {
    const curated = shorts.filter((s) => CURATED_FIRST_SHORTS.includes(s.slug));
    if (curated.length > 0) {
      const idx = Math.abs(hashCode(seed) % curated.length);
      return curated[idx];
    }
  }

  // Returning visitor: prefer unread shorts
  const unread = shorts.filter((s) => !alreadyRead.has(s.slug));
  const pool = unread.length > 0 ? unread : shorts;

  // Theme rotation: weight themes so one theme doesn't dominate
  const themeCounts = new Map<string, number>();
  for (const s of pool) {
    const t = s.theme || "purpose";
    themeCounts.set(t, (themeCounts.get(t) || 0) + 1);
  }

  // Find least-represented theme among the pool
  let minCount = Infinity;
  let minTheme = "purpose";
  for (const [theme, count] of themeCounts) {
    if (count < minCount) {
      minCount = count;
      minTheme = theme;
    }
  }

  // Prefer shorts from the least-represented theme
  const themePool = pool.filter((s) => (s.theme || "purpose") === minTheme);
  const finalPool = themePool.length > 0 ? themePool : pool;

  const idx = Math.abs(hashCode(seed) % finalPool.length);
  return finalPool[idx];
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

// ---------------------------------------------------------------------------
// Related shorts selector
// ---------------------------------------------------------------------------

function selectRelatedShorts(
  current: TodaysShortModel,
  allShorts: TodaysShortModel[],
  alreadyRead: Set<string>,
  count: number = 3,
): RelatedShortModel[] {
  const excluded = new Set([current.slug, ...alreadyRead]);
  const sameTheme = allShorts.filter(
    (s) => s.theme === current.theme && !excluded.has(s.slug),
  );
  const other = allShorts.filter(
    (s) => s.theme !== current.theme && !excluded.has(s.slug),
  );

  const result: RelatedShortModel[] = [];
  for (const s of sameTheme) {
    if (result.length >= count) break;
    result.push({
      slug: s.slug,
      title: s.title,
      excerpt: s.excerpt,
      theme: s.theme,
      category: s.category,
    });
  }
  for (const s of other) {
    if (result.length >= count) break;
    result.push({
      slug: s.slug,
      title: s.title,
      excerpt: s.excerpt,
      theme: s.theme,
      category: s.category,
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export type TodaysShortProps = {
  shorts: TodaysShortModel[];
};

export default function TodaysShort({ shorts }: TodaysShortProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Client-side selection (needs localStorage for read history)
  const { todaysShort, relatedShorts, isFirstVisit } = React.useMemo(() => {
    if (!mounted) {
      return { todaysShort: null, relatedShorts: [], isFirstVisit: true };
    }

    const alreadyRead = getAlreadyReadSlugs();
    const isFirst = alreadyRead.size === 0;

    const selected = selectTodaysShort(shorts, alreadyRead, isFirst);

    // Mark as read
    if (selected && selected.slug) {
      addToReadHistory(selected.slug, selected.theme);
    }

    const related = selected
      ? selectRelatedShorts(selected, shorts, getAlreadyReadSlugs(), 3)
      : [];

    return { todaysShort: selected, relatedShorts: related, isFirstVisit: isFirst };
  }, [mounted, shorts]);

  // Compute honest read time
  const wordCount = todaysShort?.body ? estimateWordCount(todaysShort.body) : 0;
  const displayReadTime = todaysShort?.body ? computeReadTime(wordCount) : "";

  if (!todaysShort) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-serif text-lg italic" style={{ color: "var(--ds-text-muted)" }}>
          Loading...
        </p>
      </div>
    );
  }

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

        {/* Full body content */}
        {todaysShort.body && (
          <div
            className="prose-custom max-w-2xl font-serif font-light leading-relaxed"
            style={{
              fontSize: "clamp(1rem, 1.1vw, 1.1rem)",
              lineHeight: 1.75,
              color: "var(--ds-text-secondary)",
            }}
            dangerouslySetInnerHTML={{ __html: todaysShort.body }}
          />
        )}

        {/* Read full short link */}
        <div className="mt-10">
          <Link
            href={`/shorts/${todaysShort.slug}`}
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
