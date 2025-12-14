// pages/resources/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import Layout from "@/components/Layout";
import {
  getAllContentlayerDocs,
  getDocKind,
  getDocHref,
  isDraft,
} from "@/lib/contentlayer-helper";

type ResourceMeta = {
  slug: string;
  title: string;
  description?: string | null;
  subtitle?: string | null;
  date?: string | null;
  readTime?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
  author?: string | null;
  href: string;
};

type Props = {
  resources: ResourceMeta[];
};

function slugOf(d: any): string {
  const s = typeof d?.slug === "string" ? d.slug.trim() : "";
  if (s) return s;

  const fp = typeof d?._raw?.flattenedPath === "string" ? d._raw.flattenedPath : "";
  if (fp) {
    const parts = fp.split("/");
    const last = parts[parts.length - 1];
    if (last && last !== "index") return last;
    return parts[parts.length - 2] ?? "";
  }
  return "";
}

const ResourcesIndexPage: NextPage<Props> = ({ resources }) => {
  const pageTitle = "Strategic Resources | Abraham of London";
  const pageDescription =
    "Curated frameworks and tools for fathers, founders, and institutional architects building for generations.";

  return (
    <Layout title={pageTitle} description={pageDescription}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.abrahamoflondon.org/resources" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main className="min-h-screen bg-charcoal text-cream">
        <section className="mx-auto max-w-5xl px-6 py-16 lg:py-24">
          <header className="mb-10 border-b border-softGold/20 pb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-softGold/30 bg-softGold/10 px-4 py-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-softGold">
                Strategic Resources · Abraham of London
              </span>
            </div>

            <h1 className="bg-gradient-to-b from-cream to-softGold bg-clip-text font-serif text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
              The Resource Vault
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-300 sm:text-lg">
              Curated tools, frameworks, and primers. Not pop-content. Not fluff.
              Structural assets for builders.
            </p>

            <p className="mt-6 text-sm text-gray-400">
              {resources.length} curated resources.
            </p>
          </header>

          {resources.length ? (
            <div className="grid gap-8 md:grid-cols-2">
              {resources.map((res) => (
                <article
                  key={res.slug}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-softGold/40 hover:shadow-softGold/20"
                >
                  {res.coverImage ? (
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                      <Image
                        src={res.coverImage}
                        alt={res.title}
                        width={800}
                        height={600}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>
                  ) : null}

                  <div className={`flex flex-1 flex-col p-6 ${res.coverImage ? "" : "pt-8"}`}>
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-softGold">
                          Resource
                        </span>
                        {res.readTime ? (
                          <span className="text-xs text-gray-500">• {res.readTime}</span>
                        ) : null}
                      </div>

                      <h2 className="mt-2 font-serif text-xl font-semibold tracking-tight text-cream">
                        {res.title}
                      </h2>
                    </div>

                    {res.subtitle ? (
                      <p className="mb-3 text-sm text-gray-300">{res.subtitle}</p>
                    ) : null}

                    {res.description ? (
                      <p className="mb-4 text-sm text-gray-400 line-clamp-2">{res.description}</p>
                    ) : null}

                    {res.tags?.length ? (
                      <div className="mb-4 mt-auto flex flex-wrap gap-2">
                        {res.tags.slice(0, 3).map((tag) => (
                          <span
                            key={`${res.slug}-${tag}`}
                            className="rounded-full bg-softGold/10 px-2.5 py-0.5 text-xs text-softGold"
                          >
                            {tag}
                          </span>
                        ))}
                        {res.tags.length > 3 ? (
                          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-gray-400">
                            +{res.tags.length - 3}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                      <div className="flex flex-col gap-1">
                        {res.author ? (
                          <span className="text-xs text-gray-300">By {res.author}</span>
                        ) : null}
                        {res.date ? (
                          <time dateTime={res.date} className="text-xs text-gray-500">
                            {new Date(res.date).toLocaleDateString("en-GB", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </time>
                        ) : null}
                      </div>

                      <Link
                        href={`/resources/${res.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-softGold/30 bg-softGold/10 px-4 py-1.5 text-xs font-semibold text-softGold transition-colors hover:bg-softGold/20"
                      >
                        Open
                        <span aria-hidden>→</span>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <h3 className="mb-2 font-serif text-2xl font-bold text-cream">Resources Coming Soon</h3>
              <p className="text-gray-400">Strategic frameworks are being prepared for publication.</p>
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const resourcesDocs = getAllContentlayerDocs()
      .filter((d: any) => !isDraft(d))
      .filter((d: any) => getDocKind(d) === "resource");

    const resources: ResourceMeta[] = resourcesDocs
      .map((r: any) => {
        const slug = slugOf(r);
        if (!slug) return null;

        return {
          slug,
          title: r.title ?? "Untitled Resource",
          description: r.description ?? r.excerpt ?? null,
          subtitle: r.subtitle ?? null,
          date: r.date ?? null,
          readTime: r.readTime ?? null,
          coverImage: r.coverImage ?? null,
          tags: Array.isArray(r.tags) ? r.tags : null,
          author: r.author ?? null,
          href: getDocHref(r),
        };
      })
      .filter(Boolean) as ResourceMeta[];

    resources.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      if (da !== db) return db - da;
      return (a.title || "").localeCompare(b.title || "");
    });

    return { props: { resources }, revalidate: 3600 };
  } catch (e) {
    console.error("[resources/index] getStaticProps failed:", e);
    return { props: { resources: [] }, revalidate: 600 };
  }
};

export default ResourcesIndexPage;