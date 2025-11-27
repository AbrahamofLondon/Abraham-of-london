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
import { Lock } from "lucide-react";

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
   ACCESS CONTROL (stub)
------------------------------------------------------------------------------------ */

// TODO: replace this with real auth / membership logic when you wire Inner Circle
const hasInnerCircleAccess = false;

const isLockedDoc = (level?: string | null): boolean =>
  level === "inner-circle" && !hasInnerCircleAccess;

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

  const locked = isLockedDoc(accessLevel ?? "public");

  const displayDescription =
    description ||
    excerpt ||
    subtitle ||
    "Canon volume from the Architecture of Human Purpose.";

  const pageTitle = `${title} | The Canon | Abraham of London`;

  const label = (() => {
    if (volumeNumber) return `Canon Volume ${volumeNumber}`;
    if (slug === "canon-master-index-preview") return "Canon Master Index";
    if (slug === "canon-campaign") return "Canon Campaign Prelude";
    return "Canon Document";
  })();

  return (
    <SiteLayout pageTitle={pageTitle} metaDescription={displayDescription}>
      <article className="mx-auto max-w-3xl px-4 py-12 text-gray-100">
        {/* HEADER */}
        <header className="mb-10">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-softGold">
            {label}
          </p>

          <h1 className="mt-3 font-serif text-3xl text-gray-100 sm:text-4xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-sm text-gray-300">{subtitle}</p>
          )}

          {displayDescription && (
            <p className="mt-4 text-sm leading-relaxed text-gray-300">
              {displayDescription}
            </p>
          )}

          {/* META */}
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            {readTime && (
              <span className="rounded-full border border-white/15 px-3 py-1 uppercase tracking-[0.16em]">
                {readTime}
              </span>
            )}

            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.12em]"
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
                <Lock className="h-3.5 w-3.5" />
                Inner Circle Only
              </span>
            )}
          </div>
        </header>

        {/* COVER IMAGE */}
        {coverImage && (
          <figure className="mb-10 overflow-hidden rounded-2xl border border-white/15 bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt={title}
              className="h-auto w-full object-cover"
            />
          </figure>
        )}

        {/* LOCKED VIEW */}
        {locked ? (
          <section
            className="
              mt-8 rounded-2xl border border-softGold/50
              bg-black/70 backdrop-blur
              p-6 text-sm text-gray-100
            "
          >
            <p className="text-base font-semibold text-softGold">
              {lockMessage ||
                "This volume is reserved for Inner Circle members."}
            </p>

            {excerpt && (
              <p className="mt-4 leading-relaxed text-gray-200">
                {excerpt}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/subscribe"
                className="
                  inline-flex items-center rounded-full bg-softGold
                  px-5 py-2 text-xs font-semibold text-deepCharcoal
                  transition hover:bg-softGold/90
                "
              >
                Join the Inner Circle
              </Link>

              <p className="text-xs text-gray-400">
                Inner Circle access will initially be managed manually. After
                subscribing, watch your email for private access instructions.
              </p>
            </div>
          </section>
        ) : (
          /* PUBLIC MDX CONTENT */
          <div
            className="
              prose prose-base sm:prose-lg prose-invert
              max-w-none
              text-gray-100
              prose-headings:font-serif
              prose-headings:text-gray-50
              prose-a:text-softGold
              prose-strong:text-gray-50
              prose-p:leading-relaxed
              prose-li:leading-relaxed
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