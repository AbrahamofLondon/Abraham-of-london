/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/books/index.tsx — BOOKS ARCHIVE (Premium, scan-ready, SSOT-safe slugs) */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";

import Layout from "@/components/Layout";
import { Search, ArrowRight, Tag } from "lucide-react";

import { getPublishedBooks, sanitizeData, resolveDocCoverImage } from "@/lib/content/server";

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */

type BookItem = {
  slug: string; // bare (may include nested segments)
  url: string;
  title: string;
  subtitle?: string | null;
  excerpt: string | null;
  date: string | null;
  dateIso: string | null;
  readTime: string | null;
  coverImage: string | null;
  tags: string[];
  author: string | null;
  featured?: boolean;

  coverAspect?: "wide" | "book" | "square" | string | null;
  coverFit?: "cover" | "contain" | "smart" | string | null;
  coverPosition?: "center" | string | null;
};

type BooksIndexProps = {
  items: BookItem[];
  totalBooks: number;
};

const DEFAULT_COVER = "/assets/images/blog/default-blog-cover.jpg";

/* -----------------------------------------------------------------------------
  SLUG HELPERS — preserve slashes, normalize segments (same as canon pattern)
----------------------------------------------------------------------------- */

function collapseSlashes(s: string): string {
  return String(s || "")
    .replace(/\\/g, "/")
    .replace(/\/{2,}/g, "/");
}

/** Books SSOT slug normalizer:
 * - keeps nested paths intact
 * - strips only known prefixes
 * - blocks traversal
 */
function booksBareSlug(input: unknown): string {
  let s = String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");

  if (!s || s.includes("..")) return "";

  // Strip prefixes repeatedly
  const stripOnce = (prefix: string) => {
    const p = prefix.replace(/^\/+/, "").replace(/\/+$/, "") + "/";
    if (s.toLowerCase().startsWith(p.toLowerCase())) {
      s = s.slice(p.length);
      s = s.replace(/^\/+/, "");
      return true;
    }
    return false;
  };

  let changed = true;
  while (changed) {
    changed = false;
    changed = stripOnce("content") || changed;
    changed = stripOnce("vault") || changed;
    changed = stripOnce("books") || changed;
  }

  s = s.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\/{2,}/g, "/");
  if (!s || s.includes("..")) return "";
  return s;
}

function aspectToStyle(a?: string | null): React.CSSProperties {
  const v = (a || "").toLowerCase();
  if (v === "wide") return { aspectRatio: "16 / 9" };
  if (v === "square") return { aspectRatio: "1 / 1" };
  // default "book"
  return { aspectRatio: "3 / 4" };
}

function objectPos(pos?: string | null): string {
  const p = (pos || "center").toLowerCase();
  if (p.includes("%")) return p;
  if (["top", "bottom", "left", "right", "center"].includes(p)) return p;
  return "center";
}

/**
 * CoverCard (premium no-crop foreground + blurred backdrop)
 */
const CoverCard: React.FC<{
  src: string;
  alt: string;
  aspect?: string | null;
  fit?: string | null;
  position?: string | null;
  priority?: boolean;
}> = ({ src, alt, aspect, fit, position, priority }) => {
  const fitMode = (fit || "cover").toLowerCase();
  const fgContain = true;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <div className="relative w-full" style={aspectToStyle(aspect)}>
        <Image
          src={src}
          alt=""
          fill
          priority={!!priority}
          className="object-cover scale-[1.08] blur-[10px] opacity-55"
          style={{ objectPosition: objectPos(position) }}
          sizes="(max-width: 768px) 100vw, 420px"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/25" />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.18),transparent_55%)]"
        />

        <div className="absolute inset-0 p-4">
          <div className="relative h-full w-full">
            <Image
              src={src}
              alt={alt}
              fill
              priority={!!priority}
              className={[
                "transition-transform duration-700 will-change-transform",
                fgContain ? "object-contain" : fitMode === "contain" ? "object-contain" : "object-cover",
                "drop-shadow-[0_18px_45px_rgba(0,0,0,0.55)]",
                "group-hover:scale-[1.02]",
              ].join(" ")}
              style={{ objectPosition: objectPos(position) }}
              sizes="(max-width: 768px) 100vw, 420px"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* -----------------------------------------------------------------------------
  PAGE
----------------------------------------------------------------------------- */

const BooksIndex: NextPage<BooksIndexProps> = ({ items, totalBooks }) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);

  const allTags = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const b of items) for (const t of b.tags || []) map.set(t, (map.get(t) || 0) + 1);
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14)
      .map(([t]) => t);
  }, [items]);

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((b) => {
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        (b.subtitle || "").toLowerCase().includes(q) ||
        (b.excerpt || "").toLowerCase().includes(q) ||
        (b.tags || []).some((t) => t.toLowerCase().includes(q));

      const matchesTag = !selectedTag || (b.tags || []).includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [items, searchQuery, selectedTag]);

  const featured = React.useMemo(() => filtered.filter((x) => !!x.featured).slice(0, 3), [filtered]);
  const rest = React.useMemo(() => filtered.filter((x) => !x.featured), [filtered]);

  const heroImage = items.find((p) => p.coverImage)?.coverImage || DEFAULT_COVER;

  return (
    <Layout
      title="Books // Abraham of London"
      canonicalUrl="/books"
      className="bg-black text-white"
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <title>Books // Abraham of London</title>
      </Head>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10" style={{ paddingTop: 80 }}>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-12 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/60">
                  Books & Manifestos
                </span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
                  {totalBooks} titles
                </span>
              </div>

              <h1 className="mt-6 font-serif text-4xl md:text-5xl tracking-tight text-white/95">Books</h1>
              <p className="mt-3 max-w-xl text-sm md:text-base text-white/50 leading-relaxed">
                Premium long-form work — built for builders who govern what they touch.
              </p>

              {/* Search */}
              <div className="mt-8">
                <div className="relative max-w-xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  <input
                    type="text"
                    placeholder="Search books, themes, tags…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white/85 placeholder:text-white/20 outline-none focus:border-amber-500/25 focus:bg-white/[0.05]"
                  />
                </div>

                {allTags.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTag(null)}
                      className={[
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 border text-[10px] font-mono uppercase tracking-[0.25em] transition-all",
                        !selectedTag
                          ? "border-amber-500/25 bg-amber-500/10 text-amber-100"
                          : "border-white/10 bg-white/[0.02] text-white/45 hover:text-white/70 hover:bg-white/[0.04]",
                      ].join(" ")}
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
                          className={[
                            "rounded-full px-4 py-2 border text-[10px] font-mono uppercase tracking-[0.25em] transition-all",
                            active
                              ? "border-amber-500/25 bg-amber-500/10 text-amber-100"
                              : "border-white/10 bg-white/[0.02] text-white/45 hover:text-white/70 hover:bg-white/[0.04]",
                          ].join(" ")}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right banner */}
            <div className="lg:col-span-7">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                <div className="relative w-full" style={{ aspectRatio: "21 / 9" }}>
                  <Image
                    src={heroImage}
                    alt=""
                    fill
                    priority
                    className="object-cover scale-[1.10] blur-[16px] opacity-55"
                    sizes="(max-width: 1024px) 100vw, 900px"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/62 via-black/16 to-black/42" />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(circle_at_22%_22%,rgba(245,158,11,0.18),transparent_55%)]"
                  />

                  <div className="absolute inset-0 flex items-center justify-end pr-6 md:pr-10 lg:pr-12">
                    <div
                      className={[
                        "relative",
                        "h-[86%]",
                        "w-[64%] md:w-[56%] lg:w-[52%]",
                        "max-w-[560px]",
                        "rounded-2xl md:rounded-3xl",
                        "border border-white/12",
                        "bg-black/18",
                        "backdrop-blur-xl",
                        "shadow-[0_34px_110px_-70px_rgba(245,158,11,0.40)]",
                        "overflow-hidden",
                      ].join(" ")}
                    >
                      <div className="absolute inset-3 rounded-2xl border border-white/10 pointer-events-none" />
                      <div className="absolute inset-[18px] rounded-xl border border-white/[0.06] pointer-events-none" />

                      <div className="absolute inset-0 p-5 md:p-6 lg:p-7">
                        <div className="relative h-full w-full">
                          <Image
                            src={heroImage}
                            alt="Books banner"
                            fill
                            priority
                            className="object-contain drop-shadow-[0_22px_70px_rgba(0,0,0,0.70)]"
                            sizes="(max-width: 1024px) 100vw, 900px"
                          />
                        </div>
                      </div>

                      <div
                        aria-hidden
                        className="absolute inset-0 opacity-60"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 38%, rgba(255,255,255,0.05) 70%, rgba(255,255,255,0.00) 100%)",
                        }}
                      />
                      <div aria-hidden className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/5" />
                    </div>
                  </div>

                  <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(0,0,0,0.10),_rgba(0,0,0,0.60)_70%)]" />
                </div>

                <div className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
                    long-form • scan-ready
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/55">
                    Browse ↓
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 lg:px-12 pt-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/60">Featured</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map((b, idx) => (
              <Link
                key={b.url}
                href={b.url}
                className="group block rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.03] transition-colors"
              >
                <article className="p-6">
                  <CoverCard
                    src={b.coverImage || DEFAULT_COVER}
                    alt={b.title}
                    aspect={b.coverAspect || "book"}
                    fit={b.coverFit || "cover"}
                    position={b.coverPosition || "center"}
                    priority={idx === 0}
                  />

                  <div className="mt-5">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/60">
                      {b.date ? <span>{b.date}</span> : null}
                      {b.readTime ? <span className="text-white/35">{b.readTime}</span> : null}
                      {b.tags?.[0] ? <span className="text-white/25">{b.tags[0]}</span> : null}
                    </div>

                    <h2 className="mt-4 font-serif text-2xl text-white/92 tracking-tight group-hover:text-amber-100 transition-colors">
                      {b.title}
                    </h2>

                    {b.subtitle ? (
                      <p className="mt-2 text-sm text-white/50 leading-relaxed line-clamp-2">{b.subtitle}</p>
                    ) : null}

                    {b.excerpt ? (
                      <p className="mt-3 text-sm text-white/45 leading-relaxed line-clamp-2">{b.excerpt}</p>
                    ) : null}

                    <div className="mt-5 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70">
                      Open
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* GRID */}
      <section className="mx-auto max-w-7xl px-6 lg:px-12 py-12">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">Library</div>
          <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
            showing {filtered.length} of {totalBooks}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rest.map((b) => (
            <Link
              key={b.url}
              href={b.url}
              className="group block rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.03] transition-colors"
            >
              <article className="p-6">
                <CoverCard
                  src={b.coverImage || DEFAULT_COVER}
                  alt={b.title}
                  aspect={b.coverAspect || "book"}
                  fit={b.coverFit || "cover"}
                  position={b.coverPosition || "center"}
                />

                <div className="mt-5">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/60">
                    {b.date ? <span>{b.date}</span> : null}
                    {b.readTime ? <span className="text-white/35">{b.readTime}</span> : null}
                    {b.tags?.[0] ? <span className="text-white/25">{b.tags[0]}</span> : null}
                  </div>

                  <h2 className="mt-4 font-serif text-2xl text-white/92 tracking-tight group-hover:text-amber-100 transition-colors line-clamp-2">
                    {b.title}
                  </h2>

                  {b.subtitle ? (
                    <p className="mt-2 text-sm text-white/50 leading-relaxed line-clamp-2">{b.subtitle}</p>
                  ) : null}

                  <div className="mt-5 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70">
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </article>
            </Link>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center lg:col-span-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">No matches</div>
              <div className="mt-3 text-white/70">Try a different keyword or clear the tag filter.</div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<BooksIndexProps> = async () => {
  try {
    const all = getPublishedBooks() || [];

    const items: BookItem[] = all
      .filter((doc: any) => !doc?.draft)
      .map((doc: any) => {
        // ✅ SSOT: flattenedPath is the truth
        const fp = String(doc?._raw?.flattenedPath || doc?.slug || "");
        const bare = booksBareSlug(fp);
        if (!bare) return null;

        const url = `/books/${bare}`;

        return {
          slug: bare,
          url,
          title: doc.title || "Untitled Book",
          subtitle: doc.subtitle || null,
          excerpt: doc.excerpt || doc.description || null,
          date: doc.date ? new Date(doc.date).toLocaleDateString("en-GB") : null,
          dateIso: doc.date ? new Date(doc.date).toISOString() : null,
          readTime: doc.readTime || null,
          coverImage: resolveDocCoverImage(doc),
          tags: Array.isArray(doc.tags) ? doc.tags : [],
          author: doc.author || "Abraham of London",
          featured: !!doc.featured,
          coverAspect: doc.coverAspect || null,
          coverFit: doc.coverFit || null,
          coverPosition: doc.coverPosition || null,
        };
      })
      .filter(Boolean) as BookItem[];

    // newest first
    items.sort((a, b) => (b.dateIso || "").localeCompare(a.dateIso || ""));

    return {
      props: sanitizeData({
        items,
        totalBooks: items.length,
      }),
      revalidate: 3600,
    };
  } catch {
    return { props: { items: [], totalBooks: 0 }, revalidate: 60 };
  }
};

export default BooksIndex;