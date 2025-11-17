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

import SiteLayout from "@/components/SiteLayout";
import { mdxComponents } from "@/components/mdx-components";
import { getAllContent, getContentBySlug } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

interface Params extends ParsedUrlQuery {
  slug: string;
}

interface ResourcePageProps {
  meta: PostMeta;
  mdxSource: MDXRemoteSerializeResult;
}

// ----------------------------------------------------------------------
// Page component
// ----------------------------------------------------------------------

export default function ResourcePage({ meta, mdxSource }: ResourcePageProps) {
  const { title, excerpt, coverImage, date } = meta;

  const displayDate =
    date && !Number.isNaN(new Date(date).valueOf())
      ? new Date(date).toLocaleDateString("en-GB")
      : "";

  return (
    <SiteLayout
      pageTitle={title}
      metaDescription={excerpt || undefined}
      ogImage={typeof coverImage === "string" ? coverImage : undefined}
      ogType="article"
    >
      <article className="mx-auto max-w-3xl px-4 py-12 prose prose-slate dark:prose-invert">
        <header className="mb-8">
          {displayDate && (
            <p className="text-sm text-gray-500">
              {displayDate}
            </p>
          )}
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          {excerpt && (
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              {excerpt}
            </p>
          )}
          {coverImage && (
            <div className="mt-6">
              {/* Optional: add <Image /> if you want visual covers */}
            </div>
          )}
        </header>

        <div className="mt-8">
          <MDXRemote {...mdxSource} components={mdxComponents} />
        </div>
      </article>
    </SiteLayout>
  );
}

// ----------------------------------------------------------------------
// getStaticPaths
// ----------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  try {
    const resources = getAllContent("resources");
    const paths =
      resources?.map((item: any) => ({
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
  context
) => {
  const slug = context.params?.slug;

  if (!slug || typeof slug !== "string") {
    return { notFound: true };
  }

  try {
    const { content, ...meta } = getContentBySlug("resources", slug, {
      withContent: true,
    });

    if (!meta || !(meta as PostMeta).title) {
      return { notFound: true };
    }

    // Always serialize something (even empty string) to avoid MDXRemote runtime errors
    const mdxSource = await serialize(content || "", {
      parseFrontmatter: false,
      scope: meta,
      mdxOptions: {
        remarkPlugins: [remarkGfm as any],
      },
    });

    return {
      props: {
        meta: meta as PostMeta,
        mdxSource,
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error(`Error generating resource page for slug: ${slug}`, error);
    return { notFound: true };
  }
};