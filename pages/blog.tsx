// pages/blog.tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import BlogPostCard from "@/components/BlogPostCard";
import { getAllPosts } from "@/lib/mdx";
import { absUrl, siteConfig } from "@/lib/siteConfig";
import type { PostMeta } from "@/types/post";
import type { ReactElement } from "react";
import { useMemo } from "react";

// ------- Helpers -------
const toDate = (d?: string | null) => (d ? new Date(d) : new Date(0));
const norm = (v: unknown) => String(v ?? "").toLowerCase();

const PER_PAGE = 9; // tweak to taste

type BlogProps = { posts: PostMeta[] };

export default function BlogPage({ posts }: BlogProps): ReactElement {
  const router = useRouter();
  const q = typeof router.query.q === "string" ? router.query.q.trim() : "";
  const category = typeof router.query.category === "string" ? router.query.category.trim() : "All";
  const sort = typeof router.query.sort === "string" ? router.query.sort.trim() : "newest";
  const page = Math.max(1, parseInt(String(router.query.page || "1"), 10) || 1);

  // Derive categories from content (fallback to simple defaults if none)
  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      const c = (p.category ?? "").trim();
      if (c) set.add(c);
    });
    const out = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ["All", ...out];
  }, [posts]);

  // Apply search + category + sort
  const filteredSorted = useMemo(() => {
    let out = posts.filter((p) => {
      const passQ =
        !q ||
        norm(p.title).includes(q.toLowerCase()) ||
        norm(p.excerpt).includes(q.toLowerCase()) ||
        norm(p.author).includes(q.toLowerCase()) ||
        (Array.isArray(p.tags) && p.tags.some((t) => norm(t).includes(q.toLowerCase())));
      const passCat = category === "All" || norm(p.category) === category.toLowerCase();
      return passQ && passCat;
    });

    if (sort === "oldest") {
      out = out.sort((a, b) => +toDate(a.date ?? null) - +toDate(b.date ?? null));
    } else if (sort === "title") {
      out = out.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // newest (default)
      out = out.sort((a, b) => +toDate(b.date ?? null) - +toDate(a.date ?? null));
    }
    return out;
  }, [posts, q, category, sort]);

  // Pagination
  const total = filteredSorted.length;
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PER_PAGE;
  const current = filteredSorted.slice(start, start + PER_PAGE);

  // Build canonical (no query params)
  const CANONICAL = absUrl("/blog");

  // SEO assets
  const ogImageAbs = siteConfig.ogImage?.startsWith("/")
    ? absUrl(siteConfig.ogImage)
    : siteConfig.ogImage;
  const twitterImageAbs = siteConfig.twitterImage?.startsWith("/")
    ? absUrl(siteConfig.twitterImage)
    : siteConfig.twitterImage;

  const pageTitle = `Featured Insights | ${siteConfig.author}`;
  const pageDesc =
    "Featured insights from Abraham of London — principled strategy, fatherhood, and cultural commentary.";

  // JSON-LD: Breadcrumb + ItemList for current page
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absUrl("/") },
      { "@type": "ListItem", position: 2, name: "Blog", item: CANONICAL },
    ],
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: current.map((p, i) => ({
      "@type": "ListItem",
      position: start + i + 1,
      // Minimal BlogPosting shape for list
      item: {
        "@type": "BlogPosting",
        headline: p.title,
        datePublished: p.date || undefined,
        author: p.author ? { "@type": "Person", name: p.author } : undefined,
        url: absUrl(`/blog/${p.slug}`),
        image: p.coverImage ? (p.coverImage.startsWith("/") ? absUrl(p.coverImage) : p.coverImage) : undefined,
        description: p.excerpt || undefined,
      },
    })),
  };

  // Preserve q/category/sort when building links
  const buildHref = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category && category !== "All") params.set("category", category);
    if (sort && sort !== "newest") params.set("sort", sort);
    if (overrides.page) params.set("page", String(overrides.page));
    if (overrides.category !== undefined) {
      if (overrides.category && overrides.category !== "All") params.set("category", String(overrides.category));
      else params.delete("category");
      // reset page when category changes
      params.delete("page");
    }
    if (overrides.sort !== undefined) {
      if (overrides.sort && overrides.sort !== "newest") params.set("sort", String(overrides.sort));
      else params.delete("sort");
      params.delete("page");
    }
    if (overrides.q !== undefined) {
      if (overrides.q) params.set("q", String(overrides.q));
      else params.delete("q");
      params.delete("page");
    }
    const qs = params.toString();
    return qs ? `/blog?${qs}` : `/blog`;
  };

  return (
    <Layout pageTitle="Blog">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={CANONICAL} />
        <meta name="robots" content="index,follow" />

        {/* Open Graph / X */}
        <meta property="og:site_name" content={siteConfig.title} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />
        {ogImageAbs ? (
          <>
            <meta property="og:image" content={ogImageAbs} />
            <meta property="og:image:alt" content="Abraham of London — featured insights" />
          </>
        ) : null}
        <meta name="twitter:card" content="summary_large_image" />
        {twitterImageAbs ? <meta name="twitter:image" content={twitterImageAbs} /> : null}

        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      </Head>

      <section className="bg-warmWhite px-4 py-20">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <header className="mb-10 text-center">
            <h1 className="font-serif text-4xl font-bold text-deepCharcoal sm:text-5xl">
              Featured Insights
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-deepCharcoal/70">
              Essays, reflections, and commentary — crafted with clarity and
              standards that endure.
            </p>
            <div className="mx-auto mt-5 h-0.5 w-20 bg-softGold/60" />
          </header>

          {/* Controls */}
          <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* Search */}
            <form
              action="/blog"
              method="get"
              className="flex w-full max-w-md items-center gap-2"
            >
              <input
                name="q"
                defaultValue={q}
                placeholder="Search posts…"
                className="w-full rounded-lg border border-lightGrey bg-white px-3 py-2 text-sm"
                aria-label="Search posts"
              />
              {/* Preserve category & sort on submit */}
              {category && category !== "All" ? <input type="hidden" name="category" value={category} /> : null}
              {sort && sort !== "newest" ? <input type="hidden" name="sort" value={sort} /> : null}
              <button className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream">Search</button>
            </form>

            {/* Sort */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-deepCharcoal/70">Sort:</span>
              {[
                { key: "newest", label: "Newest" },
                { key: "oldest", label: "Oldest" },
                { key: "title", label: "Title" },
              ].map((opt) => (
                <Link
                  key={opt.key}
                  href={buildHref({ sort: opt.key })}
                  className={`rounded-full border px-3 py-1 ${
                    sort === opt.key ? "border-forest bg-forest text-cream" : "border-lightGrey bg-white text-deepCharcoal"
                  }`}
                  prefetch={false}
                  aria-current={sort === opt.key ? "page" : undefined}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div className="mb-10 flex flex-wrap justify-center gap-3 text-sm">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={buildHref({ category: cat })}
                prefetch={false}
                className={`rounded-full border px-4 py-2 transition ${
                  category === cat ? "border-forest bg-forest text-cream" : "border-lightGrey bg-white text-deepCharcoal"
                }`}
                aria-current={category === cat ? "page" : undefined}
              >
                {cat}
              </Link>
            ))}
          </div>

          {/* Results summary */}
          <p className="mb-6 text-center text-sm text-deepCharcoal/70">
            {total} result{total === 1 ? "" : "s"}
            {q ? ` for “${q}”` : ""}{category !== "All" ? ` in ${category}` : ""}
            {pageCount > 1 ? ` — page ${safePage} of ${pageCount}` : ""}
          </p>

          {/* Grid */}
          {current.length === 0 ? (
            <p className="text-center text-deepCharcoal/70">No posts match your criteria.</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {current.map((post) => (
                <BlogPostCard key={post.slug} {...post} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <nav className="mt-10 flex justify-center gap-2" aria-label="Pagination">
              <Link
                href={buildHref({ page: Math.max(1, safePage - 1) })}
                className="rounded-full border border-lightGrey bg-white px-3 py-1 text-sm disabled:opacity-50"
                prefetch={false}
                aria-disabled={safePage === 1}
              >
                Prev
              </Link>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={buildHref({ page: n })}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    n === safePage ? "border-forest bg-forest text-cream" : "border-lightGrey bg-white text-deepCharcoal"
                  }`}
                  prefetch={false}
                  aria-current={n === safePage ? "page" : undefined}
                >
                  {n}
                </Link>
              ))}
              <Link
                href={buildHref({ page: Math.min(pageCount, safePage + 1) })}
                className="rounded-full border border-lightGrey bg-white px-3 py-1 text-sm disabled:opacity-50"
                prefetch={false}
                aria-disabled={safePage === pageCount}
              >
                Next
              </Link>
            </nav>
          )}
        </div>
      </section>
    </Layout>
  );
}

// SSG + ISR
export async function getStaticProps() {
  const posts = getAllPosts();

  // Normalize optionals to null for JSON serialization
  const safe = posts.map((p) => ({
    ...p,
    excerpt: p.excerpt ?? null,
    date: p.date ?? null,
    coverImage: p.coverImage ?? null,
    readTime: p.readTime ?? null,
    category: p.category ?? null,
    author: p.author ?? null,
    tags: p.tags ?? null,
  }));

  return {
    props: { posts: safe },
    revalidate: 3600, // hourly refresh
  };
}
