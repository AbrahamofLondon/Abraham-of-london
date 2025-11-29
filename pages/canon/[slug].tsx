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

  const isInnerCircle = accessLevel === "inner-circle";

  return (
    <SiteLayout pageTitle={pageTitle} metaDescription={displayDescription}>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <article className="relative mx-auto max-w-3xl">
          {/* DECORATIVE BACKPLATE */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-10 -top-10 -bottom-10 -z-10 opacity-60"
          >
            <div className="mx-auto h-full max-w-4xl bg-gradient-to-b from-deepCharcoal/90 via-deepCharcoal/95 to-black" />
          </div>

          {/* OUTER CARD */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl shadow-black/40 backdrop-blur-xl">
            {/* GRADIENT EDGE */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-softGold/80 to-transparent"
            />

            {/* HEADER BLOCK */}
            <header className="border-b border-white/10 px-5 pb-6 pt-5 sm:px-7 sm:pt-7">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-softGold/90">
                  {label}
                </p>

                {volumeNumber && (
                  <span className="inline-flex items-center rounded-full border border-softGold/40 bg-softGold/10 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-softGold">
                    Volume {volumeNumber}
                  </span>
                )}

                {readTime && (
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-gray-200">
                    {readTime}
                  </span>
                )}

                {isInnerCircle && (
                  <span
                    className="
                      ml-auto inline-flex items-center gap-1 rounded-full
                      border border-softGold/80 bg-softGold/15
                      px-3 py-1 text-[0.6rem] font-semibold uppercase
                      tracking-[0.16em] text-softGold
                    "
                  >
                    <LockClosedIcon className="h-3.5 w-3.5" />
                    Inner Circle
                  </span>
                )}
              </div>

              <h1 className="mt-4 font-serif text-3xl text-cream sm:text-4xl">
                {title}
              </h1>

              {subtitle && (
                <p className="mt-2 text-sm italic text-gray-300">
                  {subtitle}
                </p>
              )}

              {displayDescription && (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-300/90">
                  {displayDescription}
                </p>
              )}

              {/* TAGS */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {tags &&
                  tags.slice(0, 6).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/18 bg-white/5 px-3 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-gray-200"
                    >
                      {tag}
                    </span>
                  ))}
              </div>

              {lockMessage && isInnerCircle && (
                <p className="mt-4 text-[0.75rem] text-softGold/80">
                  {lockMessage}
                </p>
              )}
            </header>

            {/* COVER IMAGE (OPTIONAL) */}
            {coverImage && (
              <figure className="relative overflow-hidden border-b border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt={title}
                  className="h-64 w-full object-cover sm:h-80"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </figure>
            )}

            {/* BODY */}
            <div className="px-5 pb-8 pt-6 sm:px-7 sm:pb-10 sm:pt-7">
              <div
                className="
                  prose prose-sm sm:prose-base
                  max-w-none
                  text-gray-100
                  prose-headings:font-serif
                  prose-headings:text-cream
                  prose-strong:text-cream
                  prose-a:text-softGold prose-a:no-underline hover:prose-a:underline
                  prose-blockquote:border-softGold
                  prose-invert
                "
              >
                <MDXRemote
                  {...mdxSource}
                  components={
                    mdxComponents as unknown as MDXRemoteProps["components"]
                  }
                />
              </div>

              {isInnerCircle && (
                <p className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-gray-300">
                  This document sits within the Inner Circle Canon sequence. If
                  you reached it via a direct link, you may be asked to
                  authenticate again on other devices.
                </p>
              )}

              <footer className="mt-8 border-t border-white/10 pt-4 text-xs text-gray-300">
                <p>
                  Back to{" "}
                  <Link
                    href="/canon"
                    className="font-semibold text-softGold hover:underline"
                  >
                    Canon index
                  </Link>
                  .
                </p>
              </footer>
            </div>
          </div>
        </article>
      </div>
    </SiteLayout>
  );
};

export default CanonPage;

/* ------------------------------------------------------------------------------------
   STATIC GENERATION
------------------------------------------------------------------------------------ */

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = allCanons
    .filter((doc) => !doc.draft)
    .map((doc) => ({
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

  const canon = allCanons.find(
    (c: Canon) => c.slug === slug && !c.draft,
  );

  if (!canon) {
    return { notFound: true };
  }

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