import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Breadcrumb from "@/components/Breadcrumb";
import BlogPostCard from "@/components/BlogPostCard";
import { getAllPosts } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

type Props = { posts: PostMeta[] };

export default function BlogIndex({ posts }: Props) {
  const router = useRouter();

  // derive facets
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.category && set.add(p.category));
    return ["All", ...Array.from(set)];
  }, [posts]);

  // init from URL
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

  // keep URL in sync (shallow)
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat && cat !== "All") params.set("cat", cat);
    if (sort !== "newest") params.set("sort", sort);
    const search = params.toString();
    const href = search ? `/blog?${search}` : "/blog";
    router.replace(href, undefined, { shallow: true });
  }, [q, cat, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = React.useMemo(() => {
    let list = posts.filter((p) => {
      const matchesCat = cat === "All" || p.category === cat;
      const needle = q.trim().toLowerCase();
      const matchesQ =
        !needle ||
        p.title.toLowerCase().includes(needle) ||
        (p.excerpt ?? "").toLowerCase().includes(needle);
      return matchesCat && matchesQ;
    });

    list = list.sort((a, b) => {
      const at = a.date ? Date.parse(a.date) : 0;
      const bt = b.date ? Date.parse(b.date) : 0;
      return sort === "newest" ? bt - at : at - bt;
    });

    return list;
  }, [posts, q, cat, sort]);

  return (
    {/* ⬇️ Hide the floating StickyCTA on the blog list */}
    <Layout pageTitle="Blog" hideCTA>
      <Head>
        <meta
          name="description"
          content="Featured insights by Abraham of London — fatherhood, enterprise, society."
        />
      </Head>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          {/* Page header bar with breadcrumb & count */}
          <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <Breadcrumb items={[{ href: "/", label: "Home" }, { label: "Blog" }]} />
            <p className="text-xs text-deepCharcoal/60">
              {filtered.length} {filtered.length === 1 ? "post" : "posts"}
            </p>
          </div>

          <header className="mb-8">
            <h1 className="font-serif text-4xl font-semibold text-deepCharcoal">Featured Insights</h1>
            <p className="mt-2 text-sm text-deepCharcoal/70">
              A curated journal on standards, stewardship, and strategy.
            </p>
          </header>

          {/* Controls */}
          <div className="mb-8 grid gap-3 md:grid-cols-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search insights…"
              className="rounded-lg border border-lightGrey px-3 py-2 text-sm focus:border-deepCharcoal focus:outline-none"
            />
            <select
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
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
              className="rounded-lg border border-lightGrey px-3 py-2 text-sm focus:border-deepCharcoal focus:outline-none"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {/* Grid */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <BlogPostCard key={post.slug} {...post} />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="mt-10 text-center text-sm text-deepCharcoal/70">
              Nothing matched your search. Try a different phrase or category.
            </p>
          )}
        </div>
      </section>
    </Layout>
  );
}

export async function getStaticProps() {
  const posts = getAllPosts();

  // Normalize undefined to null for JSON serialization
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

  return { props: { posts: safe }, revalidate: 60 };
}
