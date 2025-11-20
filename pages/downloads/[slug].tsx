// pages/downloads/[slug].tsx

import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import mdxComponents from "@/components/mdx-components";

import {
  getDownloadBySlug,
  getDownloadSlugs,
} from "@/lib/downloads";

type DownloadPageProps = {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category?: string | null;
  tags?: string[] | null;
  readTime?: string | null;
  fileUrl?: string | null;
  fileSize?: string | null;
  mdxSource: MDXRemoteSerializeResult;
};

/**
 * Defensive normaliser around whatever downloads-data returns.
 */
function normaliseDownload(raw: any, slugFallback: string) {
  const safeSlug = String(raw?.slug ?? slugFallback);
  const title = String(raw?.title ?? "Untitled download");

  const coverImage =
    typeof raw?.coverImage === "string" && raw.coverImage.trim().length
      ? raw.coverImage
      : typeof raw?.heroImage === "string" && raw.heroImage.trim().length
      ? raw.heroImage
      : null;

  const fileUrl =
    typeof raw?.fileUrl === "string" && raw.fileUrl.trim().length
      ? raw.fileUrl
      : null;

  const fileSize =
    typeof raw?.fileSize === "string" && raw.fileSize.trim().length
      ? raw.fileSize
      : null;

  return {
    slug: safeSlug,
    title,
    excerpt: raw?.excerpt ?? raw?.description ?? null,
    coverImage,
    category: raw?.category ?? null,
    tags: Array.isArray(raw?.tags) ? raw.tags : null,
    readTime: raw?.readTime ?? null,
    fileUrl,
    fileSize,
    body:
      typeof raw?.content === "string"
        ? raw.content
        : typeof raw?.body === "string"
        ? raw.body
        : "",
  };
}

/* -------------------------------------------------------------------------- */
/*  Next.js data functions                                                    */
/* -------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getDownloadSlugs();

  const paths =
    slugs?.map((slug) => ({
      params: { slug },
    })) ?? [];

  return {
    paths,
    // Still allow new downloads to be added without a full rebuild
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<DownloadPageProps> = async (
  ctx,
) => {
  const slugParam = ctx.params?.slug;
  const slug = Array.isArray(slugParam)
    ? slugParam[0]
    : (slugParam as string | undefined) ?? "";

  if (!slug) {
    return { notFound: true };
  }

  // getDownloadBySlug is exposed via lib/downloads, sync or async.
  const raw = (await Promise.resolve(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getDownloadBySlug as any)(slug),
  )) as any;

  if (!raw) {
    return { notFound: true };
  }

  const normalised = normaliseDownload(raw, slug);
  const mdxSource = await serialize(normalised.body ?? "");

  return {
    props: {
      slug: normalised.slug,
      title: normalised.title,
      excerpt: normalised.excerpt,
      coverImage: normalised.coverImage,
      category: normalised.category,
      tags: normalised.tags,
      readTime: normalised.readTime,
      fileUrl: normalised.fileUrl,
      fileSize: normalised.fileSize,
      mdxSource,
    },
    revalidate: 3600, // 1 hour
  };
};

/* -------------------------------------------------------------------------- */
/*  Page component                                                            */
/* -------------------------------------------------------------------------- */

export default function DownloadPage(
  props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const pageTitle = props.title || "Download";

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{pageTitle} | Abraham of London</title>
        {props.excerpt && <meta name="description" content={props.excerpt} />}
      </Head>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8 border-b border-lightGrey pb-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Strategic Download
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-deepCharcoal sm:text-4xl">
            {props.title}
          </h1>

          {(props.category || props.readTime || props.tags?.length) && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
              {props.category && (
                <span className="rounded-full bg-forest/5 px-3 py-1 text-forest">
                  {props.category}
                </span>
              )}
              {props.readTime && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  {props.readTime}
                </span>
              )}
              {props.tags?.length ? (
                <span className="flex flex-wrap gap-1">
                  {props.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-gray-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </span>
              ) : null}
            </div>
          )}

          {props.excerpt && (
            <p className="mt-4 max-w-2xl text-sm text-gray-700">
              {props.excerpt}
            </p>
          )}

          {props.fileUrl && (
            <div className="mt-5">
              <a
                href={props.fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-deepCharcoal"
              >
                Download PDF
                {props.fileSize ? ` (${props.fileSize})` : ""}
              </a>
            </div>
          )}
        </header>

        <article className="prose prose-sm max-w-none text-gray-900 prose-headings:font-serif prose-a:text-forest">
          <MDXRemote {...props.mdxSource} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
}