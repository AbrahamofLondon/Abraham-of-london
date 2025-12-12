// pages/resources/index.tsx - FIXED VERSION
import type { GetStaticProps, NextPage } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import Layout from "@/components/Layout";
// Import from the correct place
import { getAllResources, type Resource as ResourceType } from "@/lib/content";

interface ResourceMeta {
  slug: string;
  title: string;
  description?: string | null;
  subtitle?: string | null;
  date?: string | null;
  readTime?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
  author?: string | null;
  draft?: boolean;
  resourceType?: string | null;
  excerpt?: string | null;
}

interface ResourcesPageProps {
  resources: ResourceMeta[];
}

const ResourcesIndexPage: NextPage<ResourcesPageProps> = ({ resources }) => {
  const pageTitle = "Strategic Resources | Abraham of London";
  const pageDescription =
    "Curated frameworks and tools for fathers, founders, and institutional architects who are building for generations.";

  // Filter out drafts and sort by date (newest first)
  const publishedResources = resources
    .filter(r => !r.draft)
    .sort((a, b) => {
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return (a.title || "").localeCompare(b.title || "");
    });

  return (
    <Layout pageTitle={pageTitle}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://www.abrahamoflondon.org/resources"
        />
        <meta name="twitter:card" content="summary_large_image" />
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

            <div className="mt-6 flex justify-center">
              <p className="max-w-2xl text-sm text-gray-400">
                {publishedResources.length} curated resources for builders,
                leaders, and legacy architects.
              </p>
            </div>
          </header>

          {/* Resources Grid */}
          {publishedResources.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
              {publishedResources.map((res) => {
                const href = `/resources/${res.slug}`;
                return (
                  <article
                    key={res.slug}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-softGold/40 hover:shadow-softGold/20"
                  >
                    {res.coverImage && (
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                        <Image
                          src={res.coverImage}
                          alt={res.title}
                          width={800}
                          height={600}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          priority={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      </div>
                    )}

                    <div
                      className={`flex flex-1 flex-col p-6 ${res.coverImage ? "" : "pt-8"}`}
                    >
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-softGold">
                            {res.resourceType || "Resource"}
                          </span>
                          {res.readTime && (
                            <span className="text-xs text-gray-500">
                              • {res.readTime}
                            </span>
                          )}
                        </div>
                        <h2 className="mt-2 font-serif text-xl font-semibold tracking-tight text-cream">
                          {res.title}
                        </h2>
                      </div>

                      {res.subtitle && (
                        <p className="mb-3 text-sm text-gray-300">
                          {res.subtitle}
                        </p>
                      )}

                      {res.description && (
                        <p className="mb-4 text-sm text-gray-400 line-clamp-2">
                          {res.description}
                        </p>
                      )}

                      <div className="mb-4 mt-auto">
                        {res.tags && res.tags.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-2">
                            {res.tags.slice(0, 3).map((tag) => (
                              <span
                                key={`${res.slug}-${tag}`}
                                className="rounded-full bg-softGold/10 px-2.5 py-0.5 text-xs text-softGold"
                              >
                                {tag}
                              </span>
                            ))}
                            {res.tags.length > 3 && (
                              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-gray-400">
                                +{res.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-white/10 pt-4">
                          <div className="flex flex-col gap-1">
                            {res.author && (
                              <span className="text-xs text-gray-300">
                                By {res.author}
                              </span>
                            )}
                            {res.date && (
                              <time
                                dateTime={res.date}
                                className="text-xs text-gray-500"
                              >
                                {new Date(res.date).toLocaleDateString(
                                  "en-GB",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </time>
                            )}
                          </div>

                          <Link
                            href={href}
                            className="inline-flex items-center gap-1.5 rounded-full border border-softGold/30 bg-softGold/10 px-4 py-1.5 text-xs font-semibold text-softGold transition-colors hover:bg-softGold/20"
                          >
                            Open
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="mx-auto max-w-md">
                <div className="mb-6 inline-flex items-center justify-center rounded-full border border-softGold/20 bg-softGold/10 p-4">
                  <svg
                    className="h-8 w-8 text-softGold"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 font-serif text-2xl font-bold text-cream">
                  Resources Coming Soon
                </h3>
                <p className="text-gray-400">
                  Strategic frameworks and tools are being prepared for
                  publication.
                </p>
              </div>
            </div>
          )}

          {/* Footer Note */}
          {publishedResources.length > 0 && (
            <div className="mt-16 border-t border-white/10 pt-10 text-center">
              <p className="text-sm text-gray-400">
                These resources are designed for practical application, not
                passive consumption.
                <br />
                Each has been tested in real-world contexts of leadership,
                family, and institutional building.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-softGold">
                  Pedigree · Not Pop-Content
                </span>
              </div>
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<ResourcesPageProps> = async () => {
  try {
    let resourcesData;
    
    // Try main import
    try {
      const contentModule = await import("@/lib/content");
      if (contentModule.getAllResources && typeof contentModule.getAllResources === 'function') {
        resourcesData = contentModule.getAllResources();
      } else {
        // Try fallback
        const fallbackModule = await import("@/lib/content-fallback");
        resourcesData = fallbackModule.getAllResourcesDirect();
      }
    } catch (error) {
      console.log("Trying direct import from contentlayer...");
      // Last resort: direct import
      const { allResources } = await import('contentlayer/generated');
      resourcesData = allResources.filter(r => !r.draft);
    }
    
    const resources: ResourceMeta[] = resourcesData.map((r: any) => ({
      slug: r.slug || r._raw?.flattenedPath?.split('/').pop() || '',
      title: r.title || "Untitled Resource",
      description: r.description ?? null,
      subtitle: r.subtitle ?? null,
      date: r.date ?? null,
      readTime: r.readTime ?? r.readtime ?? null,
      coverImage: r.coverImage ?? null,
      tags: r.tags ?? null,
      author: r.author ?? null,
      draft: r.draft ?? false,
      resourceType: r.resourceType ?? null,
      excerpt: r.excerpt ?? null,
    }));

    return {
      props: {
        resources,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error loading resources:", error);
    return {
      props: {
        resources: [],
      },
      revalidate: 60,
    };
  }
};

export default ResourcesIndexPage;