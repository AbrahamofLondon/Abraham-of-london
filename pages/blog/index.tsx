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
import { Search, ArrowRight, Tag, Sparkles, Clock, RotateCcw } from "lucide-react";

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

  const filteredPosts = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((post) => {
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        (post.excerpt || "").toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q));

      const matchesTag = !selectedTag || post.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [items, searchQuery, selectedTag]);

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

      {/* HERO */}
      <section
        className="relative overflow-hidden border-b border-white/10"
        style={{ paddingTop: "calc(var(--aol-header-h,88px) + 12px)" }}
      >
        <div className="relative mx-auto max-w-7xl px-6 lg:px-12 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/60">
                  Essays & Insights
                </span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
                  {totalPosts} notes
                </span>
              </div>

              <h1 className="mt-6 font-serif text-4xl md:text-5xl tracking-tight text-white/95">
                Essays &amp; Insights
              </h1>
              <p className="mt-3 max-w-xl text-sm md:text-base text-white/55 leading-relaxed">
                Institutional thinking, strategic frameworks, and civilizational notes — written for builders who govern
                what they touch.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3 max-w-xl">
                {[
                  ["Signal", "No noise. Only essentials."],
                  ["Blueprints", "Principles → execution."],
                  ["Legacy", "Order that outlasts."],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/40">{k}</div>
                    <div className="mt-2 text-xs text-white/70 leading-snug">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                <div className="relative w-full" style={{ aspectRatio: "21 / 9" }}>
                  <Image
                    src={heroImage}
                    alt="Essays banner"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 900px"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/10 to-black/40" />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.18),transparent_55%)]"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
                    Institutional notes • scan-ready
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/55">Index ↓</div>
                </div>
              </div>
            </div>
          </div>

          {/* Featured */}
          {featured.length > 0 && (
            <div className="mt-10">
              <div className="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70">
                <Sparkles className="h-4 w-4" />
                Featured
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {featured.map((post) => {
                  const src = post.coverImage || DEFAULT_COVER;
                  const aspect = aspectRatioFor(post.coverAspect || "wide");
                  const fit = normalizeFit(post.coverAspect, post.coverFit);
                  const pos = objectPositionFor(post.coverPosition);

                  return (
                    <Link
                      key={post.url}
                      href={post.url}
                      className="group block rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.03] transition-colors"
                    >
                      <article className="p-5">
                        <SmartCover
                          src={src}
                          alt={post.title}
                          aspect={aspect}
                          fit={fit}
                          position={pos}
                          sizes="(max-width: 768px) 100vw, 360px"
                          priority
                        />

                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-mono uppercase tracking-[0.35em]">
                          {post.date ? <span className="text-amber-200/70">{post.date}</span> : null}
                          {post.readTime ? <span className="text-white/35">{post.readTime}</span> : null}
                          {post.tags?.[0] ? <span className="text-white/25">{post.tags[0]}</span> : null}
                        </div>

                        <h3 className="mt-3 font-serif text-xl text-white/92 leading-tight tracking-tight group-hover:text-amber-100 transition-colors line-clamp-2">
                          {post.title}
                        </h3>

                        {post.excerpt ? (
                          <p className="mt-3 text-sm text-white/55 leading-relaxed line-clamp-2">{post.excerpt}</p>
                        ) : null}

                        <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70">
                          Read
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sticky filters */}
      <section className="sticky top-20 z-30 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                <input
                  type="text"
                  placeholder="Search essays, tags, themes…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white/85 placeholder:text-white/20 outline-none focus:border-amber-500/25 focus:bg-white/[0.05]"
                />
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 border text-[10px] font-mono uppercase tracking-[0.25em] transition-all",
                    !selectedTag
                      ? "border-amber-500/25 bg-amber-500/10 text-amber-100"
                      : "border-white/10 bg-white/[0.02] text-white/45 hover:text-white/70 hover:bg-white/[0.04]"
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
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
              Showing {filteredPosts.length} of {items.length}
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

      {/* MAIN */}
      <section className="mx-auto max-w-7xl px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cards */}
          <div className="lg:col-span-8">
            {filteredPosts.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
                <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">No matches</div>
                <div className="mt-3 text-white/70">Try a different keyword or clear the tag filter.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPosts.map((post) => {
                  const src = post.coverImage || DEFAULT_COVER;
                  const aspect = aspectRatioFor(post.coverAspect);
                  const fit = normalizeFit(post.coverAspect, post.coverFit);
                  const pos = objectPositionFor(post.coverPosition);

                  return (
                    <Link
                      key={post.url}
                      href={post.url}
                      className="group block rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.03] transition-colors"
                    >
                      <article className="p-5">
                        <SmartCover
                          src={src}
                          alt={post.title}
                          aspect={aspect}
                          fit={fit}
                          position={pos}
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />

                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-mono uppercase tracking-[0.35em]">
                          {post.date ? <span className="text-amber-200/70">{post.date}</span> : null}
                          {post.readTime ? <span className="text-white/35">{post.readTime}</span> : null}
                          {post.tags?.[0] ? <span className="text-white/25">{post.tags[0]}</span> : null}
                        </div>

                        <h2 className="mt-3 font-serif text-xl text-white/92 tracking-tight leading-tight group-hover:text-amber-100 transition-colors line-clamp-2">
                          {post.title}
                        </h2>

                        {post.excerpt ? (
                          <p className="mt-3 text-sm text-white/55 leading-relaxed line-clamp-2">{post.excerpt}</p>
                        ) : null}

                        <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70">
                          Read essay
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Executive Sidebar */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70">Quick Index</div>

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
                  Featured
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
                  Latest
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
};

export default BlogIndex;