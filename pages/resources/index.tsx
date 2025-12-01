// pages/resources/index.tsx
import type { GetStaticProps, NextPage } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import Layout from "@/components/Layout";
import { getAllContent } from "@/lib/mdx";

interface ResourceMeta {
  slug: string;
  title: string;
  description?: string | null;
  date?: string | null;
  readtime?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
}

interface ResourcesPageProps {
  resources: ResourceMeta[];
}

// Shape of MDX content for resources
interface RawResourceMeta {
  slug: string;
  title: string;
  description?: string | null;
  date?: string | null;
  readtime?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
}

const ResourcesIndexPage: NextPage<ResourcesPageProps> = ({ resources }) => {
  const pageTitle = "Strategic Resources | Abraham of London";
  const pageDescription =
    "Curated frameworks and tools for fathers, founders, and institutional architects who are building for generations.";

  return (
    <Layout pageTitle={pageTitle}>
      <Head>
        <meta name="description" content={pageDescription} />
      </Head>

      <main className="min-h-screen bg-charcoal text-cream">
        <section className="mx-auto max-w-5xl px-6 py-16 lg:py-24">
          {/* Header */}
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
              Signals of a serious house: curated tools, frameworks, and primers
              for men and women who refuse to drift. These are not feel-good
              downloads. They are structural.
            </p>
          </header>

          {/* Grid */}
          <div className="grid gap-8 md:grid-cols-2">
            {resources.map((res) => {
              const href = `/resources/${res.slug}`;
              return (
                <article
                  key={res.slug}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-lg transition hover:-translate-y-1 hover:border-softGold/40 hover:shadow-softGold/20"
                >
                  {res.coverImage && (
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                      <Image
                        src={res.coverImage}
                        alt={res.title}
                        width={800}
                        height={600}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div
                    className={`flex flex-1 flex-col p-6 ${res.coverImage ? "" : "pt-8"}`}
                  >
                    <h2 className="mb-2 font-serif text-xl font-semibold tracking-tight text-cream">
                      {res.title}
                    </h2>

                    {res.description && (
                      <p className="mb-3 text-sm text-gray-300">
                        {res.description}
                      </p>
                    )}

                    <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      {res.date && (
                        <time dateTime={res.date}>
                          {new Date(res.date).toLocaleDateString("en-GB", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      )}
                      {res.readtime && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-gray-500" />
                          <span>{res.readtime}</span>
                        </>
                      )}
                    </div>

                    {res.tags && res.tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {res.tags.slice(0, 4).map((tag) => (
                          <span
                            key={`${res.slug}-${tag}`}
                            className="rounded-full bg-softGold/10 px-2.5 py-0.5 text-xs text-softGold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <Link
                        href={href}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-softGold transition hover:text-softGold/80"
                      >
                        Open resource
                        <span aria-hidden>↗</span>
                      </Link>

                      <span className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                        Pedigree · Not Pop-Content
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<ResourcesPageProps> = async () => {
  const all = getAllContent("resources") as unknown as RawResourceMeta[];

  const resources: ResourceMeta[] = all.map((r) => ({
    slug: r.slug,
    title: r.title,
    description: r.description ?? null,
    date: r.date ?? null,
    readtime: r.readtime ?? null,
    coverImage: r.coverImage ?? null,
    tags: r.tags ?? null,
  }));

  return {
    props: {
      resources,
    },
    revalidate: 60,
  };
};

export default ResourcesIndexPage;
