// pages/downloads/[slug].tsx
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
import mdxComponents from "@/components/mdx-components";
import { getAllContent, getContentBySlug } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

interface Params extends ParsedUrlQuery {
  slug: string;
}

interface DownloadMeta extends PostMeta {
  /** Optional direct link to PDF or file */
  pdfPath?: string;
  downloadUrl?: string;
}

interface DownloadPageProps {
  meta: DownloadMeta;
  mdxSource: MDXRemoteSerializeResult;
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

const isDateOnly = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s);

function formatPretty(
  isoish: string | null | undefined,
  tz = "Europe/London"
): string {
  if (!isoish || typeof isoish !== "string") return "";
  if (isDateOnly(isoish)) {
    const d = new Date(`${isoish}T00:00:00Z`);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  }
  const d = new Date(isoish);
  if (Number.isNaN(d.valueOf())) return isoish;
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${date}, ${time}`;
}

// ----------------------------------------------------------------------
// Page component
// ----------------------------------------------------------------------

export default function DownloadPage({ meta, mdxSource }: DownloadPageProps) {
  const {
    title,
    excerpt,
    coverImage,
    date,
    category,
    tags,
    pdfPath,
    downloadUrl,
  } = meta;

  const displayDate = formatPretty(date ?? null);

  const primaryDownloadUrl =
    pdfPath || downloadUrl || null;

  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.abrahamoflondon.org";

  const relImage =
    typeof coverImage === "string" ? coverImage : undefined;
  const absImage = relImage
    ? new URL(relImage, site).toString()
    : undefined;

  const displayDescription = excerpt || meta.description || "";

  return (
    <SiteLayout
      pageTitle={title}
      metaDescription={displayDescription || undefined}
      ogImage={relImage}
      ogType="article"
    >
      <article className="mx-auto max-w-3xl px-4 py-12 prose prose-slate dark:prose-invert">
        <header className="mb-8">
          {displayDate && (
            <p className="text-sm text-gray-500">
              {displayDate}
            </p>
          )}

          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {title}
          </h1>

          {displayDescription && (
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              {displayDescription}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {category && (
              <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1">
                <span className="font-medium mr-1">Category:</span>
                <span>{category}</span>
              </span>
            )}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs"
                  >
                    {String(tag)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {primaryDownloadUrl && (
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={primaryDownloadUrl}
                download
                className="inline-flex items-center rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest/90 transition-colors"
              >
                Download PDF
              </a>
              <a
                href={primaryDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Open in Browser
              </a>
            </div>
          )}

          {absImage && (
            <div className="mt-8">
              {/* If you want, you can swap this for <Image /> for optimisation */}
              {/* Keeping it simple and safe for now */}
              <img
                src={relImage}
                alt={title}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700"
              />
            </div>
          )}
        </header>

        <section className="mt-8">
          <MDXRemote {...mdxSource} components={mdxComponents} />
        </section>
      </article>
    </SiteLayout>
  );
}

// ----------------------------------------------------------------------
// getStaticPaths
// ----------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  try {
    const downloads = getAllContent("downloads");
    const paths =
      downloads?.map((item: any) => ({
        params: { slug: String(item.slug) },
      })) ?? [];

    return {
      paths,
      fallback: false, // all downloads known at build time
    };
  } catch (error) {
    console.error("Error generating static paths for downloads:", error);
    return {
      paths: [],
      fallback: false,
    };
  }
};

// ----------------------------------------------------------------------
// getStaticProps
// ----------------------------------------------------------------------

export const getStaticProps: GetStaticProps<
  DownloadPageProps,
  Params
> = async (context) => {
  const slug = context.params?.slug;

  if (!slug || typeof slug !== "string") {
    return { notFound: true };
  }

  try {
    const { content, ...meta } = getContentBySlug(
      "downloads",
      slug,
      { withContent: true }
    );

    if (!meta || !(meta as PostMeta).title) {
      return { notFound: true };
    }

    const mdxSource = await serialize(content || "", {
      parseFrontmatter: false,
      scope: meta,
      mdxOptions: {
        remarkPlugins: [remarkGfm as any],
      },
    });

    return {
      props: {
        meta: meta as DownloadMeta,
        mdxSource,
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error(
      `Error generating download page for slug: ${slug}`,
      error
    );
    return { notFound: true };
  }
};