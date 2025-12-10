// pages/content/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

import Layout from "@/components/Layout";
import {
  buildSearchIndex,
  type SearchDoc,
  type SearchDocType,
} from "@/lib/searchIndex";

type ContentPageProps = {
  docs: SearchDoc[];
};

const typeLabel: Record<SearchDocType, string> = {
  post: "Insight",
  book: "Book",
  download: "Download",
  print: "Print",
  resource: "Resource",
  canon: "Canon",
};

const typeAccent: Record<SearchDocType, string> = {
  post: "bg-blue-500/10 text-blue-400 border-blue-500/40",
  book: "bg-amber-500/10 text-amber-400 border-amber-500/40",
  download: "bg-emerald-500/10 text-emerald-400 border-emerald-500/40",
  print: "bg-purple-500/10 text-purple-300 border-purple-500/40",
  resource: "bg-sky-500/10 text-sky-300 border-sky-500/40",
  canon: "bg-rose-500/10 text-rose-300 border-rose-500/40",
};

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  // ✅ Build the search index on the server at build-time
  const docs = buildSearchIndex();

  return {
    props: { docs },
    revalidate: 3600,
  };
};

const ContentPage: NextPage<ContentPageProps> = ({ docs }) => {
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [activeType, setActiveType] = React.useState<SearchDocType | "all">(
    "all",
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return docs.filter((doc) => {
      if (activeType !== "all" && doc.type !== activeType) return false;

      if (!q) return true;

      const haystack = [
        doc.title,
        doc.excerpt,
        doc.tags?.join(" "),
        typeLabel[doc.type],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [docs, query, activeType]);

  const title = "Content Library";
  const description =
    "A well-organized collection of essays, frameworks, volumes, and tools for builders who think in systems, not slogans.";

  return (
    <Layout title={title} description={description}>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
      </Head>

      <main className="bg-gradient-to-b from-gray-950 via-gray-900 to-black text-cream">
        <section className="border-b border-amber-500/20 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <header className="space-y-4 text-center">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-cream">
                Content Library
              </h1>
              <p className="mx-auto max-w-3xl text-sm sm:text-base text-gray-300">
                A well-organized collection of essays, frameworks, volumes, and
                tools for builders who think in systems, not slogans.
              </p>
            </header>

            {/* Search + controls */}
            <div className="mt-10 space-y-4 rounded-2xl border border-amber-500/20 bg-gray-900/60 p-4 sm:p-5 shadow-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Search input */}
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
                    🔎
                  </span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search content…"
                    className="w-full rounded-full border border-amber-500/30 bg-black/40 py-2.5 pl-9 pr-4 text-sm text-cream placeholder:text-gray-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                {/* View toggle */}
                <div className="flex items-center justify-end gap-2 text-xs text-gray-400">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={`rounded-full px-3 py-1 font-semibold ${
                      view === "grid"
                        ? "bg-amber-500 text-black"
                        : "border border-amber-500/30 text-gray-300 hover:border-amber-400"
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={`rounded-full px-3 py-1 font-semibold ${
                      view === "list"
                        ? "bg-amber-500 text-black"
                        : "border border-amber-500/30 text-gray-300 hover:border-amber-400"
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>

              {/* Type filter pills */}
              <div className="flex flex-wrap gap-2 text-[0.7rem]">
                <button
                  type="button"
                  onClick={() => setActiveType("all")}
                  className={`rounded-full border px-3 py-1 font-semibold uppercase tracking-[0.16em] ${
                    activeType === "all"
                      ? "border-amber-500 bg-amber-500 text-black"
                      : "border-amber-500/30 text-gray-300 hover:border-amber-400"
                  }`}
                >
                  All ({docs.length})
                </button>
                {(Object.keys(typeLabel) as SearchDocType[]).map((t) => {
                  const count = docs.filter((d) => d.type === t).length;
                  if (!count) return null;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setActiveType(t)}
                      className={`rounded-full border px-3 py-1 font-semibold uppercase tracking-[0.16em] ${
                        activeType === t
                          ? "border-amber-500 bg-amber-500 text-black"
                          : "border-amber-500/30 text-gray-300 hover:border-amber-400"
                      }`}
                    >
                      {typeLabel[t]} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="py-10 sm:py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-amber-500/30 bg-gray-900/60 p-8 text-center text-sm text-gray-300">
                No matching content yet. Try a different search term or switch
                the type filter.
              </div>
            ) : view === "grid" ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((doc) => (
                  <Link key={`${doc.type}:${doc.slug}`} href={doc.href}>
                    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/70 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400/60 hover:shadow-lg">
                      {doc.coverImage && (
                        <div className="relative h-40 w-full overflow-hidden border-b border-gray-800">
                          <Image
                            src={doc.coverImage}
                            alt={doc.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover object-center"
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col gap-3 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={[
                              "rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em]",
                              typeAccent[doc.type],
                            ].join(" ")}
                          >
                            {typeLabel[doc.type]}
                          </span>
                          {doc.date && (
                            <span className="text-[0.7rem] text-gray-400">
                              {new Date(doc.date).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                        <h2 className="line-clamp-2 font-serif text-base font-semibold text-cream">
                          {doc.title}
                        </h2>
                        {doc.excerpt && (
                          <p className="line-clamp-3 text-sm text-gray-300">
                            {doc.excerpt}
                          </p>
                        )}
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="mt-auto flex flex-wrap gap-1">
                            {doc.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-gray-800 px-2 py-0.5 text-[0.65rem] text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((doc) => (
                  <Link key={`${doc.type}:${doc.slug}`} href={doc.href}>
                    <article className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-950/70 p-4 transition hover:border-amber-400/60 hover:bg-gray-900">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={[
                            "rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em]",
                            typeAccent[doc.type],
                          ].join(" ")}
                        >
                          {typeLabel[doc.type]}
                        </span>
                        {doc.date && (
                          <span className="text-[0.7rem] text-gray-400">
                            {new Date(doc.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h2 className="font-serif text-base font-semibold text-cream">
                          {doc.title}
                        </h2>
                        {doc.excerpt && (
                          <p className="text-sm text-gray-300">
                            {doc.excerpt}
                          </p>
                        )}
                      </div>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 text-[0.65rem]">
                          {doc.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-gray-800 px-2 py-0.5 text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default ContentPage;