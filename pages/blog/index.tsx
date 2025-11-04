// pages/blog/index.tsx
import * as React from "react";
import { GetStaticProps } from "next"; 
import Head from "next/head";
import { useRouter } from "next/router";

import Layout from "@/components/Layout";
import Breadcrumb from "@/components/Breadcrumb";
import BlogPostCard from "@/components/BlogPostCard";
// Imports the correct named functions for data fetching
import { getAllPosts } from "@/lib/mdx"; 
import type { PostMeta } from "@/types/post";

type PostData = PostMeta & { content?: string | null };
type Props = { posts: PostData[] };

// CRITICAL FIX: Data Serialization and Coalescing in getStaticProps
export async function getStaticProps() {
  const allPosts = getAllPosts({});

  const posts = allPosts.map(p => {
    // Explicitly check and convert all serializable fields
    const safePost = {
        ...p,
        // Replace undefined fields with null/safe defaults before passing to props
        slug: p.slug ?? '',
        title: p.title ?? 'Untitled Post',
        excerpt: p.excerpt ?? '',
        date: p.date ?? null,
        coverImage: p.coverImage ?? null,
        readTime: p.readTime ?? null,
        category: p.category ?? null,
        author: p.author ?? null,
        tags: p.tags ?? null,
        summary: (p as any).summary ?? null, // Prevents serialization crash
        coverAspect: (p as any).coverAspect ?? null,
        coverFit: (p as any).coverFit ?? null,
        coverPosition: (p as any).coverPosition ?? null,
    };
    return safePost;
  });

  // Final JSON-safe operation. This ensures full data integrity for SSG.
  return { props: { posts: JSON.parse(JSON.stringify(posts)) }, revalidate: 60 };
}
// --------------------------------------------------------

export default function BlogIndex({ posts }: Props) {
  const router = useRouter();

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    // Guarding p.category against null/undefined, which is done by getStaticProps, but retained for safety
    posts.forEach((p) => (p.category && typeof p.category === 'string') && set.add(p.category));
    return ["All", ...Array.from(set)];
  }, [posts]);

  // Initial values setup
  const initialQ = typeof router.query.q === "string" ? router.query.q : "";
  const initialCat =
    typeof router.query.cat === "string" && categories.includes(router.query.cat)
      ? router.query.cat
      : "All";
  const initialSort =
    router.query.sort === "oldest" || router.query.sort === "newest"
      ? (router.query.sort as "newest" | "oldest")
      : "newest";

  const [q, setQ] = React.useState(initialQ);
  const [cat, setCat] = React.useState(initialCat);
  const [sort, setSort] = React.useState<"newest" | "oldest">(initialSort);

  // Keep URL in sync with search/filter/sort without full navigation
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat && cat !== "All") params.set("cat", cat);
    if (sort !== "newest") params.set("sort", sort);
    const href = params.toString() ? `/blog?${params}` : "/blog";
    if (router.asPath !== href) {
      router.replace(href, undefined, { shallow: true, scroll: false });
    }
  }, [q, cat, sort, router]);

  const filtered = React.useMemo(() => {
    let list = posts.filter((p) => {
      const matchesCat = cat === "All" || p.category === cat;
      const needle = q.trim().toLowerCase();
      
      // ✅ FIX: Ensure properties are strings (guaranteed by getStaticProps) before calling toLowerCase()
      const postTitle = p.title || '';
      const postExcerpt = p.excerpt || '';

      const matchesQ =
        !needle ||
        postTitle.toLowerCase().includes(needle) ||
        postExcerpt.toLowerCase().includes(needle);
      return matchesCat && matchesQ;
    });

    list.sort((a, b) => {
      const at = a.date ? Date.parse(a.date) : 0;
      const bt = b.date ? Date.parse(b.date) : 0;
      return sort === "newest" ? bt - at : at - bt;
    });

    return list;
  }, [posts, q, cat, sort]);

  return (
    <Layout pageTitle="Blog" hideCTA>
      <Head>
        <title>Blog | Abraham of London</title>
        <meta name="description" content="Latest articles and thoughts on leadership, family, and faith." />
      </Head>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <Breadcrumb items={[{ href: "/", label: "Home" }, { label: "Blog" }]} />
            <p className="text-xs text-[color:var(--color-on-secondary)/0.6]">
              {filtered.length} {filtered.length === 1 ? "post" : "posts"}
            </p>
          </div>

          <header className="mb-8">
            <h1 className="font-serif text-4xl font-semibold text-deepCharcoal">Featured Insights</h1>
            <p className="mt-2 text-sm text-[color:var(--color-on-secondary)/0.7]">
              A curated journal on standards, stewardship, and strategy.
            </p>
          </header>

          <div className="mb-8 grid gap-3 md:grid-cols-3">
            <input
              aria-label="Search posts"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search insights…"
              className="rounded-lg border border-lightGrey px-3 py-2 text-sm focus:border-deepCharcoal focus:outline-none"
            />
            <select
              aria-label="Filter by category"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="rounded-lg border border-lightGrey px-3 py-2 text-sm focus:border-deepCharcoal focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              aria-label="Sort order"
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
              className="rounded-lg border border-lightGrey px-3 py-2 text-sm focus:border-deepCharcoal focus:outline-none"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {/* Editorial “magazine” grid */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <article
                key={p.slug}
                className="group overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover"
              >
                <BlogPostCard
                  slug={p.slug}
                  title={p.title}
                  date={p.date ?? undefined}
                  excerpt={p.excerpt ?? undefined}
                  coverImage={p.coverImage ?? undefined}
                  author={p.author ?? undefined}
                  readTime={p.readTime ?? undefined}
                  category={p.category ?? undefined}
                  tags={p.tags ?? undefined}
                  coverAspect={(p.coverAspect as any) ?? "wide"}
                  coverFit={(p.coverFit as any) ?? "cover"}
                  coverPosition={(p.coverPosition as any) ?? "center"}
                />
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="mt-10 text-center text-sm text-[color:var(--color-on-secondary)/0.7]">
              Nothing matched your search. Try a different phrase or category.
            </p>
          )}
        </div>
      </section>
    </Layout>
  );
}



