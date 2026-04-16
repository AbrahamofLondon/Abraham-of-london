/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/blog/index.tsx — ESSAYS ARCHIVE (Premium, scan-optimized + SmartCover: no-crop with blurred backdrop)
   ✅ FS-SSOT: reads content/blog via mdx-collections (NOT Contentlayer)
*/

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";

import Layout from "@/components/Layout";
import {
  Search,
  ArrowRight,
  Tag,
  Sparkles,
  Clock,
  RotateCcw,
  BookOpen,
  Compass,
  GalleryVerticalEnd,
} from "lucide-react";

import { joinHref, normalizeSlug } from "@/lib/content/shared";
import { sanitizeData } from "@/lib/content/shared";
import { getMdxCollectionMeta, type MdxMeta } from "@/lib/server/mdx-collections";

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

type BlogPost = {
  slug: string;
  url: string;
  title: string;
  excerpt: string | null;
  date: string | null;
  dateIso: string | null;
  readTime: string | null;
  coverImage: string | null;
  tags: string[];
  author: string | null;
  featured?: boolean;

  coverAspect?: CoverAspect | null;
  coverFit?: CoverFit | null;
  coverPosition?: CoverPosition | null;
};

type BlogIndexProps = {
  items: BlogPost[];
  totalPosts: number;
};

const DEFAULT_COVER = "/assets/images/writing-desk.webp"; // ✅ you said this exists

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function aspectRatioFor(aspect?: CoverAspect | null): string {
  switch ((aspect || "auto").toLowerCase()) {
    case "wide":
      return "16 / 9";
    case "book":
      return "3 / 4";
    case "square":
      return "1 / 1";
    case "standard":
      return "4 / 3";
    case "auto":
    default:
      return "4 / 3";
  }
}

function objectPositionFor(pos?: CoverPosition | null): string {
  const p = (pos || "center").toLowerCase().trim();
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
  return allowed.has(p) ? p : "center";
}

function normalizeFit(aspect?: CoverAspect | null, fit?: CoverFit | null): CoverFit {
  if (fit === "cover" || fit === "contain" || fit === "smart") return fit;
  return "smart";
}

function normalizeAspect(aspect?: CoverAspect | null): CoverAspect {
  switch ((aspect || "auto").toLowerCase()) {
    case "wide":
      return "wide";
    case "book":
      return "book";
    case "square":
      return "square";
    case "standard":
      return "standard";
    default:
      return "auto";
  }
}

/**
 * SmartCover:
 * - If fit === "cover" => classic crop (object-cover).
 * - Else ("smart"/"contain") => foreground contain (no crop) + background blurred cover (premium fill).
 */
function SmartCover({
  src,
  alt,
  aspect,
  fit,
  position,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  aspect: string;
  fit: CoverFit;
  position: string;
  sizes: string;
  priority?: boolean;
}) {
  const isCover = fit === "cover";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <div className="relative w-full" style={{ aspectRatio: aspect }}>
        {!isCover && (
          <>
            <Image
              src={src}
              alt=""
              fill
              className="object-cover scale-[1.08]"
              style={{ objectPosition: position, filter: "blur(18px)" }}
              sizes={sizes}
              priority={priority}
            />
            <div aria-hidden className="absolute inset-0 bg-black/55" />
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(245,158,11,0.10),transparent_55%)]"
            />
          </>
        )}

        <Image
          src={src}
          alt={alt}
          fill
          className={cx(isCover ? "object-cover" : "object-contain", "transition-transform duration-700")}
          style={{
            objectPosition: position,
            padding: isCover ? undefined : "14px",
          }}
          sizes={sizes}
          priority={priority}
        />

        <div
          aria-hidden
          className={cx(
            "absolute inset-0",
            isCover
              ? "bg-gradient-to-t from-black/60 via-transparent to-transparent"
              : "bg-gradient-to-t from-black/35 via-transparent to-transparent"
          )}
        />
      </div>
    </div>
  );
}

function toDisplayDate(dateLike: unknown): { date: string | null; iso: string | null } {
  if (!dateLike) return { date: null, iso: null };
  const d = new Date(String(dateLike));
  if (!Number.isFinite(d.getTime())) return { date: null, iso: null };
  return {
    date: d.toLocaleDateString("en-GB"),
    iso: d.toISOString(),
  };
}

function toReadTime(meta: any): string | null {
  // support either readTime or readingTime from frontmatter/loader
  const rt = meta?.readTime ?? meta?.readingTime;
  if (typeof rt === "string" && rt.trim()) return rt.trim();
  if (typeof rt === "number" && Number.isFinite(rt)) return `${rt} min read`;
  return null;
}

function isDraftish(meta: any): boolean {
  if (meta?.draft === true) return true;
  if (meta?.published === false) return true;
  const status = String(meta?.status || "").toLowerCase();
  if (status === "draft") return true;
  return false;
}

function cardSpanClass(aspect?: CoverAspect | null, index = 0): string {
  const normalized = normalizeAspect(aspect);

  if (normalized === "wide") return "sm:col-span-2";
  if (normalized === "book" && index % 5 === 0) return "lg:row-span-2";

  return "";
}

function cardShellClass(aspect?: CoverAspect | null): string {
  const normalized = normalizeAspect(aspect);

  switch (normalized) {
    case "wide":
      return "bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]";
    case "book":
      return "bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02))]";
    case "square":
      return "bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))]";
    default:
      return "bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))]";
  }
}

function cardTitleClass(aspect?: CoverAspect | null): string {
  switch (normalizeAspect(aspect)) {
    case "wide":
      return "text-[1.7rem] md:text-[1.95rem]";
    case "book":
      return "text-[1.55rem] md:text-[1.8rem]";
    default:
      return "text-[1.35rem] md:text-[1.55rem]";
  }
}

function cardExcerptLines(aspect?: CoverAspect | null): string {
  return normalizeAspect(aspect) === "wide" ? "line-clamp-3" : "line-clamp-2";
}

function StoryCard({
  post,
  index,
}: {
  post: BlogPost;
  index: number;
}) {
  const src = post.coverImage || DEFAULT_COVER;
  const aspect = aspectRatioFor(post.coverAspect);
  const fit = normalizeFit(post.coverAspect, post.coverFit);
  const pos = objectPositionFor(post.coverPosition);
  const normalizedAspect = normalizeAspect(post.coverAspect);

  return (
    <Link
      href={post.url}
      className={cx(
        "group block rounded-[30px] border border-white/10 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/25 hover:bg-white/[0.045]",
        cardSpanClass(post.coverAspect, index),
        cardShellClass(post.coverAspect)
      )}
    >
      <article className="h-full rounded-[24px] border border-white/8 bg-black/45 p-4 md:p-5">
        <SmartCover
          src={src}
          alt={post.title}
          aspect={aspect}
          fit={fit}
          position={pos}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-mono uppercase tracking-[0.32em]">
          {post.date ? <span className="text-amber-200/75">{post.date}</span> : null}
          {post.readTime ? <span className="text-white/35">{post.readTime}</span> : null}
          <span className="text-white/25">
            {normalizedAspect === "book"
              ? "Portrait"
              : normalizedAspect === "wide"
                ? "Panorama"
                : normalizedAspect === "square"
                  ? "Study"
                  : "Essay"}
          </span>
        </div>

        <h2
          className={cx(
            "mt-3 font-serif leading-[1.02] tracking-[-0.03em] text-white/94 transition-colors group-hover:text-amber-100",
            cardTitleClass(post.coverAspect)
          )}
        >
          {post.title}
        </h2>

        {post.excerpt ? (
          <p className={cx("mt-3 text-sm leading-relaxed text-white/58", cardExcerptLines(post.coverAspect))}>
            {post.excerpt}
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <div className="flex min-w-0 flex-wrap gap-2">
            {(post.tags || []).slice(0, normalizedAspect === "wide" ? 3 : 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[9px] font-mono uppercase tracking-[0.22em] text-white/48"
              >
                {tag}
              </span>
            ))}
          </div>

          <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.32em] text-amber-200/78">
            Open
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </article>
    </Link>
  );
}

function ShelfLink({ post }: { post: BlogPost }) {
  return (
    <Link href={post.url} className="group block rounded-[24px] border border-white/10 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
      <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-white/32">
        {post.date || "Undated"} {post.readTime ? `• ${post.readTime}` : ""}
      </div>
      <div className="mt-2 font-serif text-[1.2rem] leading-tight text-white/85 transition-colors group-hover:text-amber-100">
        {post.title}
      </div>
      {post.excerpt ? (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/48">
          {post.excerpt}
        </p>
      ) : null}
    </Link>
  );
}

const BlogIndex: NextPage<BlogIndexProps> = ({ items, totalPosts }) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);

  const allTags = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const p of items) for (const t of p.tags || []) map.set(t, (map.get(t) || 0) + 1);
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14)
      .map(([t]) => t);
  }, [items]);

  const featured = React.useMemo(() => {
    const flagged = items.filter((p) => p.featured);
    const pick = flagged.length ? flagged : items.slice(0, 3);
    return pick.slice(0, 3);
  }, [items]);

  const latest = React.useMemo(() => items.slice(0, 6), [items]);
  const leadStory = featured[0] || items[0] || null;
  const companionStories = React.useMemo(
    () => featured.filter((post) => post.url !== leadStory?.url).slice(0, 2),
    [featured, leadStory]
  );
  const archiveStories = React.useMemo(
    () => items.filter((post) => post.url !== leadStory?.url),
    [items, leadStory]
  );

  const filteredPosts = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return archiveStories.filter((post) => {
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        (post.excerpt || "").toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q));

      const matchesTag = !selectedTag || post.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [archiveStories, searchQuery, selectedTag]);

  const heroImage = items.find((p) => p.coverImage)?.coverImage || DEFAULT_COVER;

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedTag(null);
  };

  return (
    <Layout
      title="Essays // Abraham of London"
      canonicalUrl="/blog"
      className="bg-black text-white"
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <title>Essays // Abraham of London</title>
      </Head>

      <section
        className="relative overflow-hidden border-b border-white/10"
      >
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(245,158,11,0.10),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.06),transparent_28%),linear-gradient(180deg,#050506_0%,#09090d_100%)]" />
        <div aria-hidden className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:96px_96px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/60">
                  Story Catalogue
                </span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
                  {totalPosts} stories
                </span>
              </div>

              <h1 className="mt-6 max-w-[10ch] font-serif text-4xl tracking-[-0.04em] text-white/95 md:text-6xl">
                A more beautiful room for reading.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/58 md:text-base">
                Not a feed. Not a vault. A curated salon of essays, dispatches, and long thoughts designed to be wandered,
                admired, and returned to.
              </p>

              <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ["Atmosphere", "A reading room before it becomes a search result."],
                  ["Range", "Wide covers, portrait covers, dense essays, shorter studies."],
                  ["Nourishment", "Beauty first, then signal, then something worth keeping."],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/40">{k}</div>
                    <div className="mt-2 text-xs leading-snug text-white/70">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
                {leadStory ? (
                  <Link
                    href={leadStory.url}
                    className="group block overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:border-amber-300/25 hover:bg-white/[0.045]"
                  >
                    <article className="rounded-[28px] border border-white/8 bg-black/40 p-4 md:p-5">
                      <SmartCover
                        src={leadStory.coverImage || heroImage}
                        alt={leadStory.title}
                        aspect={aspectRatioFor(leadStory.coverAspect || "wide")}
                        fit={normalizeFit(leadStory.coverAspect, leadStory.coverFit)}
                        position={objectPositionFor(leadStory.coverPosition)}
                        sizes="(max-width: 1024px) 100vw, 820px"
                        priority
                      />

                      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-mono uppercase tracking-[0.34em]">
                        <span className="text-amber-200/80">Lead Story</span>
                        {leadStory.date ? <span className="text-white/35">{leadStory.date}</span> : null}
                        {leadStory.readTime ? <span className="text-white/35">{leadStory.readTime}</span> : null}
                        {leadStory.author ? <span className="text-white/28">{leadStory.author}</span> : null}
                      </div>

                      <h2 className="mt-4 max-w-[16ch] font-serif text-[2rem] leading-[0.96] tracking-[-0.04em] text-white transition-colors group-hover:text-amber-100 md:text-[3.2rem]">
                        {leadStory.title}
                      </h2>

                      {leadStory.excerpt ? (
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 md:text-base">
                          {leadStory.excerpt}
                        </p>
                      ) : null}

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
                        <div className="flex flex-wrap gap-2">
                          {(leadStory.tags || []).slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[9px] font-mono uppercase tracking-[0.22em] text-white/48"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.34em] text-amber-200/75">
                          Enter story
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </article>
                  </Link>
                ) : null}

                <div className="space-y-4">
                  <div className="rounded-[30px] border border-white/10 bg-white/[0.025] p-5">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.34em] text-amber-200/70">
                      <Compass className="h-4 w-4" />
                      Ways In
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-white/30">Browse by mood</div>
                        <div className="mt-2 text-sm leading-relaxed text-white/68">
                          Move through the catalogue by instinct, not obligation. Search when you know. Wander when you do not.
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-white/30">Latest</div>
                          <div className="mt-2 font-serif text-xl text-white">{latest.length}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-white/30">Themes</div>
                          <div className="mt-2 font-serif text-xl text-white">{allTags.length}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-white/10 bg-white/[0.025] p-5">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.34em] text-amber-200/70">
                      <GalleryVerticalEnd className="h-4 w-4" />
                      Companion Stories
                    </div>

                    <div className="mt-4 space-y-3">
                      {companionStories.map((post) => (
                        <ShelfLink key={post.url} post={post} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(8,8,10,0.95),rgba(8,8,10,0.88))] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-12">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.34em] text-amber-200/70">
                <BookOpen className="h-4 w-4" />
                Reading Atlas
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                <input
                  type="text"
                  placeholder="Search essays, tags, themes…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white/85 placeholder:text-white/20 outline-none transition-colors focus:border-amber-500/25 focus:bg-white/[0.05]"
                />
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.34em] text-white/32">
                Filter by recurring themes
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-mono uppercase tracking-[0.25em] transition-all",
                    !selectedTag
                      ? "border-amber-500/25 bg-amber-500/10 text-amber-100"
                      : "border-white/10 bg-white/[0.02] text-white/45 hover:bg-white/[0.04] hover:text-white/70"
                  )}
                >
                  <Tag className="h-3.5 w-3.5" />
                  All
                </button>

                {allTags.map((t) => {
                  const active = selectedTag === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTag(active ? null : t)}
                      className={cx(
                        "rounded-full border px-4 py-2 text-[10px] font-mono uppercase tracking-[0.25em] transition-all",
                        active
                          ? "border-amber-500/25 bg-amber-500/10 text-amber-100"
                          : "border-white/10 bg-white/[0.02] text-white/45 hover:bg-white/[0.04] hover:text-white/70"
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
              Showing {filteredPosts.length} of {archiveStories.length} archive stories
            </div>

            {(searchQuery || selectedTag) && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.35em] text-white/55 hover:text-white/75 hover:bg-white/[0.05] transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            {filteredPosts.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
                <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">No matches</div>
                <div className="mt-3 text-white/70">Try a different keyword or clear the tag filter.</div>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-200/70">
                      Archive Floor
                    </div>
                    <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-white">
                      Stories arranged like objects worth keeping.
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {filteredPosts.map((post, index) => (
                    <StoryCard key={post.url} post={post} index={index} />
                  ))}
                </div>
              </>
            )}
          </div>

          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70">Current Mood</div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">Current Filters</div>
                    <div className="mt-2 text-sm text-white/75">
                      {selectedTag ? (
                        <span className="text-amber-200/80">{selectedTag}</span>
                      ) : (
                        <span className="text-white/50">All tags</span>
                      )}
                      <span className="mx-2 text-white/25">•</span>
                      {searchQuery ? (
                        <span className="text-white/75">“{searchQuery}”</span>
                      ) : (
                        <span className="text-white/50">No search</span>
                      )}
                    </div>

                    {(searchQuery || selectedTag) && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.35em] text-white/55 hover:text-white/75 hover:bg-white/[0.05] transition-all"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70">
                  <Sparkles className="h-4 w-4" />
                  Spotlight Shelf
                </div>

                <div className="mt-4 space-y-4">
                  {featured.map((p) => (
                    <Link key={p.url} href={p.url} className="group block">
                      <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
                        {p.date || "—"} {p.readTime ? `• ${p.readTime}` : ""}
                      </div>
                      <div className="mt-1 font-serif text-lg text-white/85 group-hover:text-amber-100 transition-colors line-clamp-2">
                        {p.title}
                      </div>
                      <div className="mt-2 h-px bg-white/10" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70">
                  <Clock className="h-4 w-4" />
                  Freshly Added
                </div>

                <div className="mt-4 space-y-3">
                  {latest.map((p) => (
                    <Link key={p.url} href={p.url} className="group block">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
                            {p.tags?.[0] ? p.tags[0] : "Essay"}
                          </div>
                          <div className="mt-1 text-sm text-white/75 group-hover:text-amber-100 transition-colors line-clamp-2">
                            {p.title}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-white/25 group-hover:text-amber-200/80 transition-colors" />
                      </div>
                      <div className="mt-3 h-px bg-white/10" />
                    </Link>
                  ))}
                </div>
              </div>

              {allTags.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70">
                    <Tag className="h-4 w-4" />
                    Top Tags
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {allTags.slice(0, 10).map((t) => {
                      const active = selectedTag === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedTag(active ? null : t)}
                          className={cx(
                            "rounded-full px-4 py-2 border text-[10px] font-mono uppercase tracking-[0.25em] transition-all",
                            active
                              ? "border-amber-500/25 bg-amber-500/10 text-amber-100"
                              : "border-white/10 bg-white/[0.02] text-white/45 hover:text-white/70 hover:bg-white/[0.04]"
                          )}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  console.log("[PAGE_DATA] pages/blog/index.tsx getStaticProps START");
  try {
  try {
    // ✅ FS SSOT: content/blog
    const metas = await getMdxCollectionMeta("blog");

    const items: BlogPost[] = (metas || [])
      .filter((m: any) => !isDraftish(m))
      .map((m: MdxMeta & any) => {
        const rawSlug = normalizeSlug(m.slug || "");
        const { date, iso } = toDisplayDate(m.date || m.updated);

        const coverImage =
          (typeof m.coverImage === "string" && m.coverImage.trim() ? m.coverImage.trim() : null) ||
          (typeof m.image === "string" && m.image.trim() ? m.image.trim() : null) ||
          DEFAULT_COVER;

        const tags = Array.isArray(m.tags) ? (m.tags.filter((t: any) => typeof t === "string") as string[]) : [];

        return {
          slug: rawSlug,
          url: joinHref("blog", rawSlug),
          title: (typeof m.title === "string" && m.title.trim()) ? m.title.trim() : "Untitled Essay",
          excerpt:
            (typeof (m.excerpt) === "string" && m.excerpt.trim() ? m.excerpt.trim() : null) ||
            (typeof (m.description) === "string" && m.description.trim() ? m.description.trim() : null),
          date,
          dateIso: iso,
          readTime: toReadTime(m) || "5 min read",
          coverImage,
          tags,
          author: (typeof m.author === "string" && m.author.trim()) ? m.author.trim() : "Abraham of London",
          featured: m.featured === true,

          coverAspect: (m.coverAspect || null) as CoverAspect | null,
          coverFit: (m.coverFit || null) as CoverFit | null,
          coverPosition: (m.coverPosition || null) as CoverPosition | null,
        };
      })
      .sort((a, b) => (b.dateIso || "").localeCompare(a.dateIso || ""));

    return {
      props: sanitizeData({
        items,
        totalPosts: items.length,
      }),
      revalidate: 3600,
    };
  } catch {
    return { props: { items: [], totalPosts: 0 }, revalidate: 60 };
  }


  } finally {
    console.log("[PAGE_DATA] pages/blog/index.tsx getStaticProps END");
  }
};

export default BlogIndex;
