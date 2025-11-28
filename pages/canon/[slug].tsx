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
import LockClosedIcon from "@/components/icons/LockClosedIcon";

/* ------------------------------------------------------------------------------------
   TYPES
------------------------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------------------------
   PAGE
------------------------------------------------------------------------------------ */

const CanonPage: NextPage<CanonPageProps> = ({ meta, mdxSource }) => {
  const {
    title,
    subtitle,
    description,
    excerpt,
    coverImage,
    accessLevel,
    lockMessage,
    tags,
    readTime,
    slug,
    volumeNumber,
  } = meta;

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
      <article className="mx-auto max-w-3xl px-4 py-12">
        {/* HEADER */}
        <header className="mb-10">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-softGold">
            {label}
          </p>

          <h1 className="mt-3 font-serif text-3xl text-gray-900 dark:text-gray-100 sm:text-4xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {subtitle}
            </p>
          )}

          {displayDescription && (
            <p className="mt-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {displayDescription}
            </p>
          )}

          {/* META */}
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            {readTime && (
              <span className="rounded-full border border-gray-300 px-3 py-1 uppercase tracking-[0.16em] dark:border-gray-700">
                {readTime}
              </span>
            )}

            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-gray-300 px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.12em] dark:border-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {accessLevel === "inner-circle" && (
              <span
                className="
                  inline-flex items-center gap-1 rounded-full
                  border border-softGold/70 bg-softGold/10
                  px-3 py-1 text-[0.65rem] font-semibold uppercase
                  tracking-[0.12em] text-softGold
                "
              >
                <LockClosedIcon className="h-3.5 w-3.5" />
                Inner Circle Only
              </span>
            )}
          </div>
        </header>

        {/* COVER IMAGE */}
        {coverImage && (
          <figure className="mb-10 overflow-hidden rounded-2xl border border-gray-300 dark:border-gray-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt={title}
              className="h-auto w-full object-cover"
            />
          </figure>
        )}

        {/* MDX CONTENT – access is enforced by middleware */}
        <div
          className="
            prose prose-sm sm:prose-base
            max-w-none
            text-gray-800 dark:text-gray-100
            underline-offset-4
            prose-a:text-softGold
            prose-invert:prose-a:text-softGold
            prose-headings:font-serif
            prose-headings:text-gray-900 dark:prose-headings:text-gray-100
            prose-strong:text-gray-900 dark:prose-strong:text-gray-100
            prose-blockquote:border-softGold
          "
        >
          <MDXRemote
            {...mdxSource}
            components={
              mdxComponents as unknown as MDXRemoteProps["components"]
            }
          />
        </div>

        {/* OPTIONAL: footnote for locked volumes if you want */
        accessLevel === "inner-circle" && (
          <p className="mt-8 text-xs text-gray-500 dark:text-gray-400">
            This document is part of the Inner Circle Canon sequence. If you
            reached it via a direct link, you may be asked to authenticate on
            other devices.
          </p>
        )}
      </article>
    </SiteLayout>
  );
};

export default CanonPage;

/* ------------------------------------------------------------------------------------
   STATIC GENERATION
------------------------------------------------------------------------------------ */

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = allCanons.map((doc) => ({
    params: { slug: doc.slug },
  }));

  return { paths, fallback: false };
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
  if (!canon) return { notFound: true };

  const mdxSource = await serialize(canon.body.raw, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
    },
  });

  return {
    props: {
      meta: {
        title: canon.title,
        subtitle: canon.subtitle ?? null,
        description: canon.description ?? null,
        excerpt: canon.excerpt ?? null,
        slug: canon.slug,
        coverImage: canon.coverImage ?? null,
        volumeNumber: canon.volumeNumber ?? null,
        order: canon.order ?? null,
        featured: !!canon.featured,
        draft: !!canon.draft,
        tags: canon.tags ?? [],
        readTime: canon.readTime ?? null,
        accessLevel: canon.accessLevel ?? "public",
        lockMessage: canon.lockMessage ?? null,
      },
      mdxSource,
    },
    revalidate: 3600,
  };
};