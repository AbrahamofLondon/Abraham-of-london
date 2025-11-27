import type { GetStaticPaths, GetStaticProps } from "next";
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
import { allCanons } from ".contentlayer/generated";

interface CanonPageProps {
  meta: {
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
  };
  mdxSource: MDXRemoteSerializeResult;
}

// ----------------------------------------------------------------------
// Page component
// ----------------------------------------------------------------------

export default function CanonPage({ meta, mdxSource }: CanonPageProps) {
  const {
    title,
    subtitle,
    excerpt,
    accessLevel = "public",
    lockMessage,
  } = meta;

  // TODO: plug in real membership check here
  const hasInnerCircleAccess = false;
  const isLocked = accessLevel !== "public" && !hasInnerCircleAccess;

  const displayDescription =
    excerpt || subtitle || "Canon volume from the Architecture of Human Purpose.";

  return (
    <SiteLayout pageTitle={title} metaDescription={displayDescription}>
      <article className="mx-auto max-w-3xl py-10">
        <header className="mb-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-softGold/80">
            Canon Volume
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-gray-50">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-300">{subtitle}</p>
          )}

          {accessLevel !== "public" && (
            <div className="mt-4 inline-flex items-center rounded-full border border-softGold/70 bg-softGold/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-softGold">
              Inner Circle Only
            </div>
          )}
        </header>

        {isLocked ? (
          <section className="mt-6 rounded-2xl border border-softGold/50 bg-black/70 p-6 text-sm text-gray-100">
            <p className="text-base font-medium text-softGold">
              {lockMessage ||
                "This volume is reserved for Inner Circle members."}
            </p>

            {excerpt && (
              <p className="mt-3 text-gray-200">
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
                Inner Circle members receive full access to all Canon volumes,
                private reflections, and strategy briefings.
              </p>
            </div>
          </section>
        ) : (
          <div className="prose prose-invert max-w-none">
            <MDXRemote
              {...mdxSource}
              components={mdxComponents as unknown as MDXRemoteProps["components"]}
            />
          </div>
        )}
      </article>
    </SiteLayout>
  );
}

// ----------------------------------------------------------------------
// Static generation
// ----------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: allCanons.map((canon) => ({
      params: { slug: canon.slug },
    })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<CanonPageProps> = async ({
  params,
}) => {
  const slug = params?.slug as string;

  const canon = allCanons.find((c) => c.slug === slug);

  if (!canon) {
    return { notFound: true };
  }

  // Serialize MDX body
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
  };
};