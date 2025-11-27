// pages/canon/[slug].tsx

import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import * as React from "react";
import Link from "next/link";
import {
  MDXRemote,
  type MDXRemoteSerializeResult,
  type MDXRemoteProps,
} from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import SiteLayout from "@/components/SiteLayout";
import mdxComponents from "@/components/mdx-components";
import { allCanons, type Canon } from "contentlayer/generated";

interface CanonPageMeta {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  slug: string;
  coverImage?: string | null;
  volumeNumber?: string | null;
  order?: number | null;
  featured?: boolean;
  draft?: boolean;
  tags?: string[];
  readTime?: string | null;
  accessLevel?: string | null;
  lockMessage?: string | null;
}

interface CanonPageProps {
  meta: CanonPageMeta;
  mdxSource: MDXRemoteSerializeResult;
}

// ----------------------------------------------------------------------
// Page component
// ----------------------------------------------------------------------

const CanonPage: NextPage<CanonPageProps> = ({ meta, mdxSource }) => {
  const {
    title,
    subtitle,
    description,
    excerpt,
    coverImage,
    accessLevel = "public",
    lockMessage,
    tags,
    readTime,
    slug,
    volumeNumber,
  } = meta;

  // TODO: plug in real membership check here when you wire auth
  const hasInnerCircleAccess = false;
  const isLocked = accessLevel === "inner-circle" && !hasInnerCircleAccess;

  const displayDescription =
    description ||
    excerpt ||
    subtitle ||
    "Canon volume from the Architecture of Human Purpose.";

  const pageTitle = `${title} | The Canon | Abraham of London`;

  const label = (() => {
    if (volumeNumber) return `Canon Volume ${volumeNumber}`;
    if (slug === "canon-master-index-preview") return "Canon Prelude";
    if (slug === "canon-campaign") return "Canon Campaign";
    return "Canon Document";
  })();

  return (
    <SiteLayout pageTitle={pageTitle} metaDescription={displayDescription}>
      <article className="mx-auto max-w-3xl py-10 text-gray-100">
        {/* HEADER */}
        <header className="mb-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-softGold/80">
            {label}
          </p>

          <h1 className="mt-2 font-serif text-3xl font-semibold text-gray-50 sm:text-4xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-sm text-gray-300">{subtitle}</p>
          )}

          {displayDescription && (
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              {displayDescription}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            {readTime && (
              <span className="rounded-full border border-white/10 px-3 py-1 uppercase tracking-[0.16em]">
                {readTime}
              </span>
            )}

            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.16em]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {accessLevel === "inner-circle" && (
              <span className="inline-flex items-center rounded-full border border-softGold/70 bg-softGold/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-softGold">
                Inner Circle Only
              </span>
            )}
          </div>
        </header>

        {/* COVER IMAGE (optional) */}
        {coverImage && (
          <figure className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt={title}
              className="h-auto w-full object-cover"
            />
          </figure>
        )}

        {/* LOCKED vs PUBLIC CONTENT */}
        {isLocked ? (
          <section className="mt-6 rounded-2xl border border-softGold/50 bg-black/70 p-6 text-sm text-gray-100">
            <p className="text-base font-medium text-softGold">
              {lockMessage ||
                "This volume is reserved for Inner Circle members."}
            </p>

            {excerpt && (
              <p className="mt-3 text-gray-200 leading-relaxed">
                {excerpt}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/inner-circle"
                className="inline-flex items-center rounded-full bg-softGold px-5 py-2 text-xs font-semibold text-deepCharcoal underline-offset-4 hover:bg-softGold/90"
              >
                Join the Inner Circle
              </Link>
              <p className="text-[0.75rem] text-gray-400">
                Inner Circle members receive full access to Canon volumes,
                private reflections, and strategy briefings.
              </p>
            </div>
          </section>
        ) : (
          <div
            className="
              prose prose-sm sm:prose-base
              prose-invert prose-slate max-w-none
              prose-headings:font-serif prose-headings:text-gray-50
              prose-a:text-softGold
              prose-strong:text-cream
              prose-p:leading-relaxed
              prose-li:leading-relaxed
            "
          >
            <MDXRemote
              {...mdxSource}
              components={
                mdxComponents as unknown as MDXRemoteProps["components"]
              }
            />
          </div>
        )}
      </article>
    </SiteLayout>
  );
};

export default CanonPage;

// ----------------------------------------------------------------------
// Static generation
// ----------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = allCanons.map((canon) => ({
    params: { slug: canon.slug },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<CanonPageProps> = async ({
  params,
}) => {
  const slugParam = params?.slug;
  const slug =
    typeof slugParam === "string"
      ? slugParam
      : Array.isArray(slugParam)
        ? slugParam[0]
        : "";

  const canon = allCanons.find((c: Canon) => c.slug === slug);

  if (!canon) {
    return { notFound: true };
  }

  const mdxSource = await serialize(canon.body.raw, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
    },
  });

  const {
    title,
    subtitle,
    description,
    excerpt,
    coverImage,
    volumeNumber,
    order,
    featured,
    draft,
    tags,
    readTime,
    accessLevel,
    lockMessage,
  } = canon;

  return {
    props: {
      meta: {
        title,
        subtitle: subtitle ?? null,
        description: description ?? null,
        excerpt: excerpt ?? null,
        slug: canon.slug,
        coverImage: coverImage ?? null,
        volumeNumber: volumeNumber ?? null,
        order: order ?? null,
        featured: !!featured,
        draft: !!draft,
        tags: tags ?? [],
        readTime: readTime ?? null,
        accessLevel: accessLevel ?? "public",
        lockMessage: lockMessage ?? null,
      },
      mdxSource,
    },
    revalidate: 3600,
  };
};