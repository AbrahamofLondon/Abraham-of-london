/* Optimized for Abraham of London Institutional Standards */
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
import { Download as DownloadIcon, FileText, Calendar, Tag } from "lucide-react";

type Props = {
  download: {
    title: string;
    excerpt: string | null;
    description: string | null;
    category: string;
    fileUrl: string | null;
    fileHref: string | null;
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

  const doc = getDownloadBySlug(slug);
  if (!doc || (doc as any)?.draft === true) return { notFound: true };

  const mdxContent = (doc as any).body?.raw || (doc as any).content || "";

  const download = {
    title: (doc as any).title || "Download",
    excerpt: (doc as any).excerpt ?? null,
    description: (doc as any).description ?? (doc as any).excerpt ?? null,
    category: (doc as any).category || "Strategic Resource",
    fileUrl: resolveDocDownloadUrl(doc),
    fileHref: resolveDocDownloadHref(doc),
    coverImage: resolveDocCoverImage(doc),
    slug,
    date: (doc as any).date ?? null,
    tags: Array.isArray((doc as any).tags) ? (doc as any).tags : [],
  };

  const source = await serialize(mdxContent || " ", {
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
        <title>{download.title} | Archive | Abraham of London</title>
        {download.description && <meta name="description" content={download.description} />}
        <meta property="og:type" content="article" />
      </Head>

      <main className="mx-auto max-w-4xl px-6 py-20">
        <header className="mb-12 border-b border-gold/10 pb-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 ring-1 ring-gold/20">
              <FileText className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/60">
                Institutional Asset
              </p>
              <p className="text-sm font-medium text-gold">{download.category}</p>
            </div>
          </div>

          <h1 className="font-serif text-4xl font-bold tracking-tight text-cream sm:text-6xl">
            {download.title}
          </h1>

          {download.excerpt && (
            <p className="mt-6 text-xl leading-relaxed text-gray-400 font-light italic">
              {download.excerpt}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-6">
            {download.fileHref && (
              <a
                href={download.fileHref}
                className="inline-flex items-center gap-3 rounded-full bg-gold px-10 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-amber-400 active:scale-95 shadow-xl shadow-gold/10"
              >
                <DownloadIcon className="h-4 w-4" />
                Download Publication
              </a>
            )}
            
            {download.date && (
              <div className="flex items-center gap-2 text-xs text-gold/50 font-mono uppercase">
                <Calendar className="h-3 w-3" />
                {new Date(download.date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </div>
            )}
          </div>
        </header>

        <article className="prose prose-invert prose-lg max-w-none prose-headings:font-serif prose-headings:text-gold/90 prose-p:text-gray-300 prose-strong:text-white prose-a:text-gold hover:prose-a:text-amber-400">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default DownloadPage;