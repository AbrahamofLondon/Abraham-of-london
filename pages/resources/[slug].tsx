// pages/resources/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import * as React from "react";
import Head from "next/head";
import {
  MDXRemote,
  type MDXRemoteSerializeResult,
} from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import Image from "next/image";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getAllContent, getContentBySlug } from "@/lib/mdx";

interface ResourceMeta {
  slug: string;
  title: string;
  description?: string | null;
  date?: string | null;
  author?: string | null;
  readtime?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
  downloadUrl?: string | null;
}

interface ResourcePageProps {
  meta: ResourceMeta;
  mdxSource: MDXRemoteSerializeResult;
}

// Shape of what comes back from MDX for resources
interface RawResourceDoc {
  slug: string;
  title: string;
  description?: string | null;
  date?: string | null;
  author?: string | null;
  readtime?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
  downloadUrl?: string | null;
  content: string;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

export default function ResourcePage({ meta, mdxSource }: ResourcePageProps) {
  const {
    title,
    description,
    date,
    author,
    readtime,
    coverImage,
    tags,
    downloadUrl,
    slug,
  } = meta;

  const pageTitle = `${title} | Strategic Resource`;
  const url = `${SITE_URL}/resources/${slug}`;

  return (
    <Layout pageTitle={pageTitle}>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={description ?? "Strategic resource from Abraham of London."}
        />
        <meta property="og:title" content={pageTitle} />
        <meta
          property="og:description"
          content={description ?? "Strategic resource"}
        />
        {coverImage && <meta property="og:image" content={coverImage} />}
        <meta property="og:url" content={url} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main className="bg-charcoal text-cream">
        <article className="mx-auto max-w-4xl px-6 py-14 lg:py-16">
          {/* Header */}
          <header className="mb-8 border-b border-softGold/20 pb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-softGold">
              Strategic Resource
            </p>
            <h1 className="mb-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </h1>

            {description && (
              <p className="max-w-2xl text-sm text-gray-300">{description}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-400">
              {author && (
                <span>
                  By{" "}
                  <span className="font-semibold text-gray-200">{author}</span>
                </span>
              )}
              {date && (
                <>
                  <span className="h-1 w-1 rounded-full bg-gray-500" />
                  <time dateTime={date}>
                    {new Date(date).toLocaleDateString("en-GB", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </>
              )}
              {readtime && (
                <>
                  <span className="h-1 w-1 rounded-full bg-gray-500" />
                  <span>{readtime}</span>
                </>
              )}
            </div>

            {tags && tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-softGold/10 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.18em] text-softGold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Cover image */}
          {coverImage && (
            <div className="mb-10">
              <Image
                src={coverImage}
                alt={title}
                width={1200}
                height={800}
                className="mx-auto max-h-[480px] w-full rounded-2xl object-cover shadow-2xl"
              />
            </div>
          )}

          {/* CTA row: Download + Share */}
          <section className="mb-10 flex flex-col gap-4 rounded-2xl border border-softGold/25 bg-black/40 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold">
                Apply, Don&apos;t Just Consume
              </p>
              <p className="mt-1 text-sm text-gray-300">
                Use this resource in your team, circle, or family. Then share it
                with one person who is ready for alignment.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  className="inline-flex items-center justify-center rounded-full bg-softGold px-4 py-2 text-xs font-semibold text-black transition hover:bg-softGold/90"
                >
                  Download as PDF
                </a>
              )}

              {/* Simple share buttons */}
              <div className="flex gap-2 text-xs">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    url,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-gray-600 px-3 py-1 text-gray-200 hover:border-softGold hover:text-softGold"
                >
                  Share on LinkedIn
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `${title} · ${url}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-gray-600 px-3 py-1 text-gray-200 hover:border-softGold hover:text-softGold"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </section>

          {/* Content */}
          <section className="prose prose-invert prose-lg max-w-none">
            <MDXRemote {...mdxSource} components={mdxComponents} />
          </section>
        </article>
      </main>
    </Layout>
  );
}

/* ------------------------------------------
 *  STATIC GENERATION
 * ------------------------------------------ */

export const getStaticPaths: GetStaticPaths = async () => {
  const all = getAllContent("resources") as { slug: string }[];

  return {
    paths: all.map((r) => ({ params: { slug: r.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<ResourcePageProps> = async ({
  params,
}) => {
  const slug = String(params?.slug);

  const doc = getContentBySlug("resources", slug) as RawResourceDoc | null;

  if (!doc) {
    return { notFound: true };
  }

  const { content, ...rawMeta } = doc;

  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
    },
  });

  const typedMeta: ResourceMeta = {
    slug: rawMeta.slug,
    title: rawMeta.title,
    description: rawMeta.description ?? null,
    date: rawMeta.date ?? null,
    author: rawMeta.author ?? null,
    readtime: rawMeta.readtime ?? null,
    coverImage: rawMeta.coverImage ?? null,
    tags: rawMeta.tags ?? null,
    downloadUrl: rawMeta.downloadUrl ?? null,
  };

  return {
    props: {
      meta: typedMeta,
      mdxSource,
    },
    revalidate: 60,
  };
};