/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/blog/index.tsx — EDITORIAL ARCHIVE (Premium, editorial, scan-ready) */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { Search, Compass, Clock3 } from "lucide-react";

import Layout from "@/components/Layout";
import EssayCard from "@/components/essays/EssayCard";
import { resolveDocCoverImage } from "@/lib/content/shared";
import { selectFeaturedEssay } from "@/lib/blog/select-featured-post";
import type { BlogSeries } from "@/lib/blog/series";

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */

type PostItem = {
  slug: string;
  url: string;
  title: string;
  subtitle?: string | null;
  excerpt: string | null;
  date: string | null;
  dateIso: string | null;
  readTime: string | null;
  coverImage: string;
  tags: string[];
  author: string | null;
  featured?: boolean;
  coverAspect?: "wide" | "book" | "square" | string | null;
  coverFit?: "cover" | "contain" | "smart" | string | null;
  coverPosition?: "center" | string | null;
};

type SeriesSummary = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  partCount: number;
  publishedCount: number;
  firstPublishedPartSlug: string | null;
};

type BlogIndexProps = {
  items: PostItem[];
  totalPosts: number;
  seriesCatalogue: SeriesSummary[];
};

const DEFAULT_COVER = "/assets/images/writing-desk.webp";

/* -----------------------------------------------------------------------------
  HELPERS
----------------------------------------------------------------------------- */

function sanitizeData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function postBareSlug(input: unknown): string {
  let s = String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.(md|mdx)$/i, "");

  if (!s || s.includes("..")) return "";

  const stripOnce = (prefix: string) => {
    const p = prefix.replace(/^\/+/, "").replace(/\/+$/, "") + "/";
    if (s.toLowerCase().startsWith(p.toLowerCase())) {
      s = s.slice(p.length).replace(/^\/+/, "");
      return true;
    }
    return false;
  };

  let changed = true;
  while (changed) {
    changed = false;
    changed = stripOnce("content") || changed;
    changed = stripOnce("blog") || changed;
    changed = stripOnce("posts") || changed;
    changed = stripOnce("editorials") || changed;
  }

  s = s.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\/{2,}/g, "/");
  if (!s || s.includes("..")) return "";

  return s;
}

function normalizeTagArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((v) => safeString(v).trim()).filter(Boolean)
    : [];
}

function safeDateIso(value: unknown): string | null {
  const raw = safeString(value).trim();
  if (!raw) return null;
  const time = Date.parse(raw);
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString();
}

function safeDateLabel(value: unknown): string | null {
  const iso = safeDateIso(value);
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB");
}

/* -----------------------------------------------------------------------------
  SERIES SHELF
----------------------------------------------------------------------------- */

function seriesStatusLabel(published: number, total: number): string {
  if (published === 0) return "Planned";
  if (published >= total) return "Complete";
  return `${published} of ${total} published`;
}

function SeriesShelf({ catalogue }: { catalogue: SeriesSummary[] }) {
  if (catalogue.length === 0) return null;
  return (
    <section
      className="border-b"
      style={{
        borderColor: "var(--ds-border)",
        backgroundColor: "var(--ds-background-muted)",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-7 lg:px-12">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-5">
          <span
            aria-hidden="true"
            style={{
              width: 1,
              height: 16,
              backgroundColor: "rgba(201,150,58,0.5)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span
            className="font-mono uppercase tracking-[0.38em]"
            style={{ fontSize: "7px", color: "var(--ds-accent)" }}
          >
            Applied Essay Series
          </span>
        </div>

        {/* Cards grid */}
        <div
          className={`grid gap-px`}
          style={{
            gridTemplateColumns: `repeat(${Math.min(catalogue.length, 3)}, 1fr)`,
            backgroundColor: "var(--ds-border)",
          }}
        >
          {catalogue.map((series) => {
            const statusLabel = seriesStatusLabel(series.publishedCount, series.partCount);
            const isComplete = series.publishedCount >= series.partCount;
            const href = `/blog/series/${series.slug}`;
            const entryHref =
              series.firstPublishedPartSlug
                ? `/blog/series/${series.slug}/${series.firstPublishedPartSlug}`
                : href;

            return (
              <Link
                key={series.slug}
                href={href}
                className="group block transition-colors duration-200 hover:bg-[rgba(201,150,58,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,150,58,0.4)] focus-visible:ring-inset"
                style={{ backgroundColor: "var(--ds-background-muted)" }}
              >
                <div className="px-7 py-6">
                  {/* Status */}
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="font-mono uppercase tracking-[0.28em]"
                      style={{ fontSize: "7px", color: "var(--ds-accent)" }}
                    >
                      {series.partCount}-Part Series
                    </span>
                    <span
                      style={{
                        width: 1,
                        height: 8,
                        backgroundColor: "var(--ds-border)",
                        display: "inline-block",
                      }}
                    />
                    <span
                      className="font-mono uppercase tracking-[0.24em]"
                      style={{
                        fontSize: "7px",
                        color: isComplete ? "var(--ds-accent)" : "var(--ds-text-subtle)",
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="font-serif italic mb-2 transition-colors duration-200 group-hover:text-white"
                    style={{
                      fontWeight: 300,
                      fontSize: "clamp(0.95rem, 1.3vw, 1.15rem)",
                      lineHeight: 1.2,
                      color: "var(--ds-text)",
                    }}
                  >
                    {series.title}
                  </h3>

                  {/* Excerpt */}
                  <p
                    className="text-[12px] leading-[1.65rem] mb-4"
                    style={{ color: "var(--ds-text-muted)", maxWidth: "54ch" }}
                  >
                    {series.excerpt}
                  </p>

                  {/* CTA row */}
                  <div className="flex items-center gap-6">
                    <span
                      className="font-mono uppercase tracking-[0.24em] transition-colors duration-200 group-hover:text-[#C9963A] whitespace-nowrap"
                      style={{ fontSize: "7.5px", color: "var(--ds-text-subtle)" }}
                    >
                      Enter the series →
                    </span>
                    {series.firstPublishedPartSlug && entryHref !== href && (
                      <Link
                        href={entryHref}
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono uppercase tracking-[0.24em] transition-colors duration-200 hover:text-[#C9963A] whitespace-nowrap"
                        style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
                      >
                        Begin Part One →
                      </Link>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------------
  PAGE
----------------------------------------------------------------------------- */

const BlogIndex: NextPage<BlogIndexProps> = ({ items, totalPosts, seriesCatalogue }) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);

  const allTags = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      for (const tag of item.tags || []) {
        map.set(tag, (map.get(tag) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14)
      .map(([tag]) => tag);
  }, [items]);

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.subtitle || "").toLowerCase().includes(q) ||
        (item.excerpt || "").toLowerCase().includes(q) ||
        (item.tags || []).some((tag) => tag.toLowerCase().includes(q));

      const matchesTag = !selectedTag || (item.tags || []).includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [items, searchQuery, selectedTag]);

  const leadStory = selectFeaturedEssay(filtered) || null;
  const archiveStories = filtered.filter((i) => i.slug !== leadStory?.slug);
  const spotlightShelf = archiveStories.slice(0, 3);

  const heroImage = leadStory?.coverImage || DEFAULT_COVER;

  return (
    <Layout
      title="Editorials // Abraham of London"
      canonicalUrl="/blog"
      className="ds-surface-essays bg-black text-white"
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <title>Editorials // Abraham of London</title>
      </Head>

      <section
        className="relative overflow-hidden border-b"
        style={{ paddingTop: 64, borderColor: "var(--ds-border)" }}
      >
        <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-12">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.05fr_0.95fr_0.42fr]">
            {/* LEFT INTRO */}
            <div className="xl:pr-4">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2"
                style={{
                  borderColor: "var(--ds-border)",
                  backgroundColor: "var(--ds-panel)",
                }}
              >
                <span
                  className="text-[10px] font-mono uppercase tracking-[0.35em]"
                  style={{ color: "var(--ds-text)" }}
                >
                  Story Catalogue
                </span>
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ backgroundColor: "var(--ds-text-subtle)" }}
                />
                <span
                  className="text-[10px] font-mono uppercase tracking-[0.25em]"
                  style={{ color: "var(--ds-text-subtle)" }}
                >
                  {totalPosts} stories
                </span>
              </div>

              <h1
                className="mt-6 max-w-[10ch] font-serif text-5xl leading-[0.92] tracking-tight md:text-6xl"
                style={{ color: "var(--ds-text)" }}
              >
                Essays and long-form writing.
              </h1>

              <p
                className="mt-5 max-w-[26ch] text-base leading-relaxed md:text-xl md:leading-9"
                style={{ color: "var(--ds-text-muted)" }}
              >
                Strategic essays, institutional dispatches, and extended analysis
                from Abraham of London. Arranged by date, searchable by theme.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  {
                    title: "Atmosphere",
                    body: "A reading room before it becomes a search result.",
                  },
                  {
                    title: "Range",
                    body: "Wide covers, portrait covers, dense essays, shorter studies.",
                  },
                  {
                    title: "Nourishment",
                    body: "Beauty first, then signal, then something worth keeping.",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-3xl border p-5"
                    style={{
                      borderColor: "var(--ds-border)",
                      backgroundColor: "var(--ds-panel)",
                    }}
                  >
                    <div
                      className="text-[10px] font-mono uppercase tracking-[0.32em]"
                      style={{ color: "var(--ds-text-subtle)" }}
                    >
                      {card.title}
                    </div>
                    <p
                      className="mt-3 text-sm leading-7"
                      style={{ color: "var(--ds-text-muted)" }}
                    >
                      {card.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CENTER LEAD STORY */}
            <div className="xl:px-2">
              {leadStory ? (
                <article
                  className="relative overflow-hidden rounded-[2rem] border"
                  style={{
                    borderColor: "var(--ds-border)",
                    backgroundColor: "var(--ds-panel)",
                    boxShadow: "var(--ds-shadow-xl)",
                  }}
                >
                  <Link href={leadStory.url} className="block">
                    <div
                      className="relative m-6 overflow-hidden rounded-[1.5rem] border"
                      style={{
                        borderColor: "var(--ds-border)",
                        backgroundColor: "var(--ds-background-muted)",
                        aspectRatio: "4 / 5",
                      }}
                    >
                      <Image
                        src={heroImage}
                        alt={leadStory.title}
                        fill
                        priority
                        className="object-cover"
                        sizes="(max-width: 1280px) 100vw, 42vw"
                      />
                      <div
                        aria-hidden
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(3,3,5,0.04) 0%, rgba(3,3,5,0.16) 100%)",
                        }}
                      />
                    </div>

                    <div className="px-6 pb-7">
                      <div
                        className="text-[10px] font-mono uppercase tracking-[0.32em]"
                        style={{ color: "var(--ds-text-subtle)" }}
                      >
                        Lead Story{" "}
                        {leadStory.date ? (
                          <>
                            <span style={{ color: "var(--ds-text-muted)" }}>
                              {leadStory.date}
                            </span>
                          </>
                        ) : null}
                        {leadStory.readTime ? (
                          <>
                            {" "}
                            <span style={{ color: "var(--ds-text-muted)" }}>
                              {leadStory.readTime}
                            </span>
                          </>
                        ) : null}
                      </div>

                      <div
                        className="mt-4 text-[10px] font-mono uppercase tracking-[0.32em]"
                        style={{ color: "var(--ds-text)" }}
                      >
                        Abraham of London
                      </div>

                      <h2
                        className="mt-4 font-serif text-4xl leading-[0.94] tracking-tight md:text-5xl"
                        style={{ color: "var(--ds-text)" }}
                      >
                        {leadStory.title}
                      </h2>

                      {leadStory.excerpt ? (
                        <p
                          className="mt-5 text-base leading-8 md:text-lg"
                          style={{ color: "var(--ds-text-muted)" }}
                        >
                          {leadStory.excerpt}
                        </p>
                      ) : null}

                      {leadStory.tags?.length > 0 ? (
                        <div className="mt-6 flex flex-wrap gap-2">
                          {leadStory.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em]"
                              style={{
                                borderColor: "var(--ds-border)",
                                color: "var(--ds-text)",
                                backgroundColor: "var(--ds-panel-alt)",
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div
                        className="mt-6 flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.28em]"
                        style={{ color: "var(--ds-text)" }}
                      >
                        Enter Story <span aria-hidden="true">→</span>
                      </div>
                    </div>
                  </Link>
                </article>
              ) : null}
            </div>

            {/* RIGHT RAIL */}
            <aside className="space-y-6">
              <div
                className="rounded-[2rem] border p-5"
                style={{
                  borderColor: "var(--ds-border)",
                  backgroundColor: "var(--ds-panel)",
                }}
              >
                <div
                  className="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em]"
                  style={{ color: "var(--ds-text)" }}
                >
                  <Compass className="h-3.5 w-3.5" />
                  Ways In
                </div>

                <div
                  className="rounded-[1.25rem] border p-5"
                  style={{
                    borderColor: "var(--ds-border)",
                    backgroundColor: "var(--ds-panel-alt)",
                  }}
                >
                  <div
                    className="text-[10px] font-mono uppercase tracking-[0.32em]"
                    style={{ color: "var(--ds-text-subtle)" }}
                  >
                    Browse by mood
                  </div>
                  <p
                    className="mt-3 text-sm leading-7"
                    style={{ color: "var(--ds-text)" }}
                  >
                    Move through the catalogue by instinct, not obligation.
                    Search when you know. Wander when you do not.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div
                    className="rounded-[1.25rem] border p-4"
                    style={{
                      borderColor: "var(--ds-border)",
                      backgroundColor: "var(--ds-panel-alt)",
                    }}
                  >
                    <div
                      className="text-[10px] font-mono uppercase tracking-[0.28em]"
                      style={{ color: "var(--ds-text-subtle)" }}
                    >
                      Latest
                    </div>
                    <div
                      className="mt-4 font-serif text-3xl"
                      style={{ color: "var(--ds-text)" }}
                    >
                      {Math.min(items.length, 6)}
                    </div>
                  </div>

                  <div
                    className="rounded-[1.25rem] border p-4"
                    style={{
                      borderColor: "var(--ds-border)",
                      backgroundColor: "var(--ds-panel-alt)",
                    }}
                  >
                    <div
                      className="text-[10px] font-mono uppercase tracking-[0.28em]"
                      style={{ color: "var(--ds-text-subtle)" }}
                    >
                      Themes
                    </div>
                    <div
                      className="mt-4 font-serif text-3xl"
                      style={{ color: "var(--ds-text)" }}
                    >
                      {allTags.length}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="rounded-[2rem] border p-5"
                style={{
                  borderColor: "var(--ds-border)",
                  backgroundColor: "var(--ds-panel)",
                }}
              >
                <div
                  className="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em]"
                  style={{ color: "var(--ds-text)" }}
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  Companion Stories
                </div>

                <div className="space-y-4">
                  {spotlightShelf.length > 0 ? (
                    spotlightShelf.map((item) => (
                      <EssayCard
                        key={item.url}
                        variant="compact"
                        post={item}
                      />
                    ))
                  ) : (
                    <div
                      className="rounded-[1.25rem] border p-5"
                      style={{
                        borderColor: "var(--ds-border)",
                        backgroundColor: "var(--ds-panel-alt)",
                        color: "var(--ds-text-muted)",
                      }}
                    >
                      No companion stories available.
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Applied Essay Series shelf — dynamic, reads from getBlogSeriesCatalogue() */}
      <SeriesShelf catalogue={seriesCatalogue} />

      <section
        className="border-b"
        style={{ borderColor: "var(--ds-border)" }}
      >
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
            <div>
              <div
                className="mb-3 text-[10px] font-mono uppercase tracking-[0.35em]"
                style={{ color: "var(--ds-text-subtle)" }}
              >
                Reading filters
              </div>

              <div className="relative max-w-xl">
                <Search
                  className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--ds-text-subtle)" }}
                />
                <input
                  type="text"
                  placeholder="Search essays, tags, themes…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-[var(--ds-accent-soft)] focus:bg-[rgba(255,255,255,0.05)] placeholder:text-[var(--ds-text-subtle)]"
                  style={{
                    borderColor: "var(--ds-border)",
                    backgroundColor: "var(--ds-panel)",
                    color: "var(--ds-text)",
                  }}
                />
              </div>

              {allTags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-mono uppercase tracking-[0.25em] transition-all",
                      selectedTag
                        ? "hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--ds-text)]"
                        : "",
                    ].join(" ")}
                    style={
                      !selectedTag
                        ? {
                            borderColor: "var(--ds-accent-soft)",
                            backgroundColor: "var(--ds-accent-soft)",
                            color: "var(--ds-accent)",
                          }
                        : {
                            borderColor: "var(--ds-border)",
                            backgroundColor: "var(--ds-panel)",
                            color: "var(--ds-text-muted)",
                          }
                    }
                  >
                    All
                  </button>

                  {allTags.map((tag) => {
                    const active = selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(active ? null : tag)}
                        className={[
                          "rounded-full border px-4 py-2 text-[10px] font-mono uppercase tracking-[0.25em] transition-all",
                          !active
                            ? "hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--ds-text)]"
                            : "",
                        ].join(" ")}
                        style={
                          active
                            ? {
                                borderColor: "var(--ds-accent-soft)",
                                backgroundColor: "var(--ds-accent-soft)",
                                color: "var(--ds-accent)",
                              }
                            : {
                                borderColor: "var(--ds-border)",
                                backgroundColor: "var(--ds-panel)",
                                color: "var(--ds-text-muted)",
                              }
                        }
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="xl:justify-self-end">
              <div
                className="rounded-[1.5rem] border p-5"
                style={{
                  borderColor: "var(--ds-border)",
                  backgroundColor: "var(--ds-panel)",
                }}
              >
                <div
                  className="text-[10px] font-mono uppercase tracking-[0.35em]"
                  style={{ color: "var(--ds-text-subtle)" }}
                >
                  Current mood
                </div>
                <p
                  className="mt-3 text-sm leading-7"
                  style={{ color: "var(--ds-text-muted)" }}
                >
                  {selectedTag
                    ? `Filtered by ${selectedTag}`
                    : "All tags"}{" "}
                  • {searchQuery ? `Search: ${searchQuery}` : "No search"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <div className="grid grid-cols-1 gap-12 xl:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-8 flex items-end justify-between gap-6">
              <div>
                <div
                  className="mb-3 text-[10px] font-mono uppercase tracking-[0.35em]"
                  style={{ color: "var(--ds-text-subtle)" }}
                >
                  Archive floor
                </div>
                <h2
                  className="font-serif text-4xl leading-none"
                  style={{ color: "var(--ds-text)" }}
                >
                  Complete archive.
                </h2>
              </div>

              <div
                className="hidden text-[10px] font-mono uppercase tracking-[0.35em] md:block"
                style={{ color: "var(--ds-text-subtle)" }}
              >
                Showing {archiveStories.length} of {totalPosts} archive stories
              </div>
            </div>

            <div className="ds-surface-essays grid grid-cols-1 gap-8 xl:grid-cols-1">
              {archiveStories.map((item, idx) => (
                <EssayCard
                  key={item.url}
                  post={item}
                  priority={idx === 0}
                />
              ))}

              {filtered.length === 0 && (
                <div
                  className="rounded-3xl border p-10 text-center"
                  style={{
                    borderColor: "var(--ds-border)",
                    backgroundColor: "var(--ds-panel)",
                  }}
                >
                  <div
                    className="text-[10px] font-mono uppercase tracking-[0.35em]"
                    style={{ color: "var(--ds-text-subtle)" }}
                  >
                    No matches
                  </div>
                  <div
                    className="mt-3"
                    style={{ color: "var(--ds-text-muted)" }}
                  >
                    Try a different keyword or clear the tag filter.
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div
              className="rounded-[2rem] border p-5"
              style={{
                borderColor: "var(--ds-border)",
                backgroundColor: "var(--ds-panel)",
              }}
            >
              <div
                className="mb-4 text-[10px] font-mono uppercase tracking-[0.35em]"
                style={{ color: "var(--ds-text)" }}
              >
                Spotlight Shelf
              </div>

              <div className="space-y-4">
                {items.slice(0, 3).map((item) => (
                  <EssayCard
                    key={`spotlight-${item.url}`}
                    variant="compact"
                    post={item}
                  />
                ))}
              </div>
            </div>

            <div
              className="rounded-[2rem] border p-5"
              style={{
                borderColor: "var(--ds-border)",
                backgroundColor: "var(--ds-panel)",
              }}
            >
              <div
                className="mb-4 text-[10px] font-mono uppercase tracking-[0.35em]"
                style={{ color: "var(--ds-text)" }}
              >
                Freshly Added
              </div>

              <div className="space-y-3">
                {items.slice(0, 4).map((item) => (
                  <Link
                    key={`fresh-${item.url}`}
                    href={item.url}
                    className="block border-b pb-3 transition-colors"
                    style={{ borderColor: "var(--ds-border)" }}
                  >
                    <div
                      className="text-[10px] font-mono uppercase tracking-[0.28em]"
                      style={{ color: "var(--ds-text-subtle)" }}
                    >
                      {item.date || "Recent"}
                      {item.readTime ? ` • ${item.readTime}` : ""}
                    </div>
                    <div
                      className="mt-2 font-serif text-2xl leading-tight"
                      style={{ color: "var(--ds-text)" }}
                    >
                      {item.title}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  try {
    const { getPublishedPosts } = await import("@/lib/content/server");
    const { getBlogSeriesCatalogue } = await import("@/lib/blog/series");
    const all = getPublishedPosts() || [];

    // Build the series catalogue summary for the dynamic shelf
    const catalogue = getBlogSeriesCatalogue();
    const seriesCatalogue: SeriesSummary[] = catalogue.map((s) => {
      const publishedParts = s.parts.filter((p) => p.status === "PUBLISHED");
      const firstPublished = publishedParts
        .sort((a, b) => a.order - b.order)[0] ?? null;
      return {
        slug: s.slug,
        title: s.title,
        description: s.description,
        excerpt: s.excerpt,
        partCount: s.partCount,
        publishedCount: publishedParts.length,
        firstPublishedPartSlug: firstPublished?.slug ?? null,
      };
    });

    const items: PostItem[] = all
      .filter((doc: any) => !doc?.draft)
      // Exclude blog series posts — they live at /blog/series/[seriesSlug]/[partSlug]
      .filter((doc: any) => !doc?.series)
      .map((doc: any) => {
        const fp = String(
          doc?.urlSlug ||
            doc?._raw?.flattenedPath ||
            doc?.slug ||
            doc?._raw?.sourceFilePath ||
            "",
        );

        const bare = postBareSlug(fp);
        if (!bare) return null;

        const url = safeString(doc?.url) || `/blog/${bare}`;

        return {
          slug: bare,
          url,
          title: doc.title || "Untitled Essay",
          subtitle: doc.subtitle || null,
          excerpt: doc.excerpt || doc.description || null,
          date: safeDateLabel(doc.date),
          dateIso: safeDateIso(doc.date),
          readTime: doc.readTime || null,
          coverImage: resolveDocCoverImage(doc, { contentType: "BLOG" }) || DEFAULT_COVER,
          tags: normalizeTagArray(doc.tags),
          author: doc.author || "Abraham of London",
          featured: !!doc.featured,
          coverAspect: doc.coverAspect || null,
          coverFit: doc.coverFit || null,
          coverPosition: doc.coverPosition || null,
        };
      })
      .filter(Boolean) as PostItem[];

    items.sort((a, b) => (b.dateIso || "").localeCompare(a.dateIso || ""));

    return {
      props: sanitizeData({
        items,
        totalPosts: items.length,
        seriesCatalogue,
      }),
      // No revalidate — content is static (contentlayer build-time JSON).
      // ISR would re-run getStaticProps in a Netlify Lambda where the
      // runtime filesystem differs from the build container, risking
      // cache poisoning. Redeploy to update content.
    };
  } catch {
    return {
      props: { items: [], totalPosts: 0, seriesCatalogue: [] },
    };
  }
};

export default BlogIndex;
