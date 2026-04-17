/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/books/index.tsx — BOOKS ARCHIVE (Premium, scan-ready, SSOT-safe slugs) */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";

import Layout from "@/components/Layout";
import BookListCard from "@/components/books/BookListCard";
import { Search, Tag } from "lucide-react";
import { resolveDocCoverImage } from "@/lib/content/shared";


/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */

type BookItem = {
  slug: string;
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

const DEFAULT_COVER = "/assets/images/books/the-architecture-of-human-purpose.jpg";

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
    .replace(/\/{2,}/g, "/")
    .replace(/\.(md|mdx)$/i, "");

  if (!s || s.includes("..")) return "";

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

function pickBookBareSlug(doc: any): string {
  return (
    booksBareSlug(doc?.urlSlug) ||
    booksBareSlug(doc?.collectionSlug) ||
    booksBareSlug(doc?.slug) ||
    booksBareSlug(doc?._raw?.flattenedPath) ||
    booksBareSlug(doc?._raw?.sourceFilePath) ||
    ""
  );
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
  PAGE
----------------------------------------------------------------------------- */

const BooksIndex: NextPage<BooksIndexProps> = ({ items, totalBooks }) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);

  const allTags = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const b of items) {
      for (const t of b.tags || []) {
        map.set(t, (map.get(t) || 0) + 1);
      }
    }
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
      className="ds-surface-books bg-black text-white"
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <title>Books // Abraham of London</title>
      </Head>

      <section className="relative overflow-hidden border-b" style={{ paddingTop: 80, borderColor: "var(--ds-border)" }}>
        <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2" style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)" }}>
                <span className="text-[10px] font-mono uppercase tracking-[0.35em]" style={{ color: "var(--ds-accent)" }}>
                  Books & Manifestos
                </span>
                <span className="h-1 w-1 rounded-full" style={{ backgroundColor: "var(--ds-text-subtle)" }} />
                <span className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: "var(--ds-text-subtle)" }}>
                  {totalBooks} titles
                </span>
              </div>

              <h1 className="mt-6 font-serif text-4xl tracking-tight md:text-5xl" style={{ color: "var(--ds-text)" }}>
                Books
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed md:text-base" style={{ color: "var(--ds-text-muted)" }}>
                Premium long-form work — built for builders who govern what they touch.
              </p>

              <div className="mt-8">
                <div className="relative max-w-xl">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--ds-text-subtle)" }} />
                  <input
                    type="text"
                    placeholder="Search books, themes, tags…"
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
                        selectedTag ? "hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--ds-text)]" : "",
                      ].join(" ")}
                      style={!selectedTag
                        ? { borderColor: "var(--ds-accent-soft)", backgroundColor: "var(--ds-accent-soft)", color: "var(--ds-accent)" }
                        : { borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)", color: "var(--ds-text-muted)" }
                      }
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
                            "rounded-full border px-4 py-2 text-[10px] font-mono uppercase tracking-[0.25em] transition-all",
                            !active ? "hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--ds-text)]" : "",
                          ].join(" ")}
                          style={active
                            ? { borderColor: "var(--ds-accent-soft)", backgroundColor: "var(--ds-accent-soft)", color: "var(--ds-accent)" }
                            : { borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)", color: "var(--ds-text-muted)" }
                          }
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="relative overflow-hidden rounded-3xl border" style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)" }}>
                <div className="relative w-full" style={{ aspectRatio: "21 / 9" }}>
                  <Image
                    src={heroImage}
                    alt=""
                    fill
                    priority
                    className="object-cover scale-[1.10] blur-[16px] opacity-55"
                    sizes="(max-width: 1024px) 100vw, 900px"
                  />
                  {/* Improved scrim for better text readability */}
                  <div aria-hidden className="absolute inset-0" style={{ background: "var(--ds-hero-scrim)" }} />
                  <div aria-hidden className="absolute inset-0" style={{ background: "var(--ds-hero-wash)" }} />
                  
                  <div className="absolute inset-0 flex items-center justify-end pr-6 md:pr-10 lg:pr-12">
                    <div
                      className="relative h-[86%] w-[64%] max-w-[560px] overflow-hidden rounded-2xl border backdrop-blur-xl md:w-[56%] md:rounded-3xl lg:w-[52%]"
                      style={{ 
                        borderColor: "var(--ds-border-strong)", 
                        backgroundColor: "var(--ds-panel-alt)",
                        boxShadow: "var(--ds-shadow-xl)"
                      }}
                    >
                      <div className="pointer-events-none absolute inset-3 rounded-2xl border" style={{ borderColor: "var(--ds-border)" }} />
                      <div className="pointer-events-none absolute inset-[18px] rounded-xl border" style={{ borderColor: "var(--ds-border)" }} />

                      <div className="absolute inset-0 p-5 md:p-6 lg:p-7">
                        <div className="relative h-full w-full">
                          <Image
                            src={heroImage}
                            alt="Books banner"
                            fill
                            priority
                            className="object-contain"
                            style={{ filter: "drop-shadow(0 22px 70px rgba(0,0,0,0.70))" }}
                            sizes="(max-width: 1024px) 100vw, 900px"
                          />
                        </div>
                      </div>

                      <div
                        aria-hidden
                        className="absolute inset-0 opacity-60"
                        style={{
                          background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 38%, rgba(255,255,255,0.05) 70%, rgba(255,255,255,0.00) 100%)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.35em]" style={{ color: "var(--ds-text-subtle)" }}>
                    long-form • scan-ready
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.35em]" style={{ color: "var(--ds-accent)" }}>
                    Browse ↓
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pt-12 lg:px-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="text-[10px] font-mono uppercase tracking-[0.35em]" style={{ color: "var(--ds-accent)" }}>
              Featured
            </div>
          </div>

          <div className="ds-surface-books grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((b, idx) => (
              <BookListCard
                key={b.url}
                book={{
                  ...b,
                  coverImage: resolveDocCoverImage(b, { contentType: 'BOOK' }),
                  featured: true,
                }}
                priority={idx === 0}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-[10px] font-mono uppercase tracking-[0.35em]" style={{ color: "var(--ds-text-subtle)" }}>Library</div>
          <div className="text-[10px] font-mono uppercase tracking-[0.35em]" style={{ color: "var(--ds-text-subtle)" }}>
            showing {filtered.length} of {totalBooks}
          </div>
        </div>

        <div className="ds-surface-books grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((b) => (
            <BookListCard
              key={b.url}
              book={{
                ...b,
                coverImage: resolveDocCoverImage(b, { contentType: 'BOOK' }),
              }}
            />
          ))}

          {filtered.length === 0 && (
            <div className="lg:col-span-3 rounded-3xl border p-10 text-center" style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)" }}>
              <div className="text-[10px] font-mono uppercase tracking-[0.35em]" style={{ color: "var(--ds-text-subtle)" }}>No matches</div>
              <div className="mt-3" style={{ color: "var(--ds-text-muted)" }}>Try a different keyword or clear the tag filter.</div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<BooksIndexProps> = async () => {
  try {
    const { getPublishedBooks, resolveDocCoverImage } = await import(
      "@/lib/content/server"
    );
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