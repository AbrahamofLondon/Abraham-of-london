// pages/resources/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import type { ParsedUrlQuery } from "querystring";
import * as React from "react";
import {
  MDXRemote,
  type MDXRemoteSerializeResult,
} from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getAllContent, getContentBySlug } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

interface Params extends ParsedUrlQuery {
  slug: string;
}

interface ResourceEntry extends PostMeta {
  content?: string | null;
}

type ResourceMdxSource = MDXRemoteSerializeResult<Record<string, unknown>>;

interface ResourcePageProps {
  meta: PostMeta;
  mdxSource: ResourceMdxSource;
}

// ----------------------------------------------------------------------
// Page component
// ----------------------------------------------------------------------

export default function ResourcePage({
  meta,
  mdxSource,
}: ResourcePageProps): JSX.Element {
  const { title, excerpt, coverImage, date } = meta;

  const displayDate =
    date && !Number.isNaN(new Date(date).valueOf())
      ? new Date(date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";

  const pageTitle = title ?? "Resource";
  const description = excerpt ?? meta.description ?? "";

  return (
    <Layout title={pageTitle} className="bg-charcoal">
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 lg:px-0">
        <header className="mb-8">
          {displayDate && (
            <p className="text-sm text-gray-400">{displayDate}</p>
          )}
          <h1 className="mt-2 font-serif text-3xl font-light text-cream sm:text-4xl">
            {pageTitle}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-base text-gray-300">
              {description}
            </p>
          )}
          {coverImage && typeof coverImage === "string" && (
            <div className="mt-6" />
            // If/when you want a framed cover here, we can drop in
            // the same brand frame pattern as the article hero.
          )}
        </header>

        <div
          className="
            prose prose-lg max-w-none
            prose-headings:font-serif prose-headings:text-cream
            prose-p:text-gray-200 prose-p:leading-relaxed
            prose-strong:text-cream prose-strong:font-semibold
            prose-a:text-softGold prose-a:no-underline hover:prose-a:underline
            prose-ul:text-gray-200 prose-ol:text-gray-200
            prose-blockquote:border-l-softGold prose-blockquote:text-gray-100
            prose-hr:border-t border-white/10
            prose-img:rounded-xl prose-img:shadow-lg
          "
        >
          <MDXRemote {...mdxSource} components={mdxComponents} />
        </div>
      </main>
    </Layout>
  );
}

// ----------------------------------------------------------------------
// getStaticPaths
// ----------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  try {
    const resources = getAllContent("resources") as Array<
      PostMeta & { slug: string }
    >;

    const paths =
      resources?.map((item) => ({
        params: { slug: String(item.slug) },
      })) ?? [];

    return {
      paths,
      fallback: false,
    };
  } catch (error) {
    console.error("Error generating static paths for resources:", error);
    return {
      paths: [],
      fallback: false,
    };
  }
};

// ----------------------------------------------------------------------
// getStaticProps
// ----------------------------------------------------------------------

export const getStaticProps: GetStaticProps<ResourcePageProps, Params> = async (
  context,
) => {
  const slug = context.params?.slug;

  if (!slug || typeof slug !== "string") {
    return { notFound: true };
  }

  try {
    const entry = getContentBySlug("resources", slug, {
      withContent: true,
    }) as ResourceEntry | null;

    if (!entry || !entry.title) {
      return { notFound: true };
    }

    const { content, ...meta } = entry;

    const mdxSource: ResourceMdxSource = await serialize(content || "", {
      parseFrontmatter: false,
      scope: meta,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    });

    return {
      props: {
        meta,
        mdxSource,
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error(`Error generating resource page for slug: ${slug}`, error);
    return { notFound: true };
  }
};