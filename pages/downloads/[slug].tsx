// pages/downloads/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import {
  getAllDownloads,
  getDownloadBySlug,
  normalizeSlug,
  resolveDocDownloadHref,
  resolveDocDownloadUrl,
  resolveDocCoverImage,
} from "@/lib/contentlayer-helper";

import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { Download as DownloadIcon, FileText } from "lucide-react";

type Props = {
  download: {
    title: string;
    excerpt: string | null;
    description: string | null;
    category: string;
    fileUrl: string | null; // direct file URL (best effort)
    fileHref: string | null; // gated-aware href (public direct or /api/downloads/[slug])
    coverImage: string | null;
    slug: string;
    date: string | null;
    tags: string[];
  };
  source: MDXRemoteSerializeResult;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const downloads = getAllDownloads();

  const paths = downloads
    .filter((d: any) => d?.draft !== true)
    .map((d: any) => ({ params: { slug: normalizeSlug(d) } }))
    .filter((p: any) => Boolean(p?.params?.slug));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  if (!slug) return { notFound: true };

  // Prefer helper lookup (ensures published filtering & normalization)
  const doc = getDownloadBySlug(slug);
  if (!doc || (doc as any)?.draft === true) return { notFound: true };

  // MDX content: allow empty (don’t 404 just because body is blank)
  const mdxContent =
    typeof (doc as any).body?.raw === "string"
      ? String((doc as any).body.raw)
      : typeof (doc as any).content === "string"
      ? String((doc as any).content)
      : "";

  const download = {
    title: (doc as any).title || "Download",
    excerpt: (doc as any).excerpt ?? null,
    description: (doc as any).description ?? (doc as any).excerpt ?? null,
    category: (doc as any).category || "Vault Resource",
    fileUrl: resolveDocDownloadUrl(doc),
    fileHref: resolveDocDownloadHref(doc),
    coverImage: resolveDocCoverImage(doc),
    slug,
    date: (doc as any).date ?? null,
    tags: Array.isArray((doc as any).tags) ? (doc as any).tags : [],
  };

  const source = await serialize(mdxContent || " ", {
    // " " prevents next-mdx-remote edge-case when empty string is passed
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
    },
  });

  return { props: { download, source }, revalidate: 3600 };
};

const DownloadPage: NextPage<Props> = ({ download, source }) => {
  return (
    <Layout title={download.title}>
      <Head>
        <title>{download.title} | Downloads | Abraham of London</title>
        {download.description && <meta name="description" content={download.description} />}
        {download.coverImage && (
          <>
            <meta property="og:image" content={download.coverImage} />
            <meta name="twitter:image" content={download.coverImage} />
          </>
        )}
        <meta property="og:type" content="article" />
      </Head>

      <main className="mx-auto max-w-4xl px-6 py-20">
        <header className="mb-12 border-b border-gold/10 pb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/20">
              <FileText className="h-5 w-5 text-gold" aria-hidden="true" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold/70">
              {download.category}
            </p>
          </div>

          <h1 className="font-serif text-4xl font-semibold text-cream sm:text-5xl">
            {download.title}
          </h1>

          {download.excerpt && (
            <p className="mt-4 text-lg leading-relaxed text-gray-300">{download.excerpt}</p>
          )}

          {download.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {download.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium text-gold/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {download.fileHref && (
            <a
              href={download.fileHref}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-bold uppercase tracking-wider text-black transition-all hover:scale-105 hover:bg-amber-400 hover:shadow-lg hover:shadow-gold/20"
            >
              <DownloadIcon className="h-4 w-4" aria-hidden="true" />
              Download Document
            </a>
          )}

          {download.date && (
            <p className="mt-6 text-sm text-gold/60">
              Published:{" "}
              {new Date(download.date).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </header>

        <article className="prose prose-invert prose-lg max-w-none">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default DownloadPage;
