import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import {
  getAllDownloads,
  normalizeSlug,
  resolveDocDownloadUrl,
} from "@/lib/contentlayer-helper";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

type Props = {
  download: {
    title: string;
    excerpt: string | null;
    category: string;
    fileUrl: string | null;
    slug: string;
  };
  source: MDXRemoteSerializeResult;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllDownloads().map((d) => ({
    params: { slug: normalizeSlug(d) },
  }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  const rawDoc = getAllDownloads().find(
    (d) => normalizeSlug(d) === slug
  );

  if (!rawDoc) return { notFound: true };

  // ✅ Extract ONLY primitives — NO proxies
  const mdxContent =
    typeof rawDoc.body?.raw === "string"
      ? rawDoc.body.raw
      : "";

  if (!mdxContent) {
    console.warn(`[downloads] Empty body for slug: ${slug}`);
    return { notFound: true };
  }

  const download = {
    title: rawDoc.title || "Download",
    excerpt: rawDoc.excerpt || null,
    category: rawDoc.category || "Vault Resource",
    fileUrl: resolveDocDownloadUrl(rawDoc),
    slug,
  };

  try {
    const mdxSource = await serialize(mdxContent, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    });

    return {
      props: {
        download,
        source: mdxSource, // already serialisable
      },
    };
  } catch (error) {
    console.error(`[downloads] MDX serialize failed for ${slug}`, error);
    return { notFound: true };
  }
};

const DownloadPage: NextPage<Props> = ({ download, source }) => {
  return (
    <Layout title={download.title}>
      <Head>
        <title>{download.title} | Downloads | Abraham of London</title>
        {download.excerpt && (
          <meta name="description" content={download.excerpt} />
        )}
      </Head>

      <main className="mx-auto max-w-3xl px-6 py-20">
        <header className="mb-10 border-b border-gold/10 pb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gold/70">
            {download.category}
          </p>
          <h1 className="mt-2 font-serif text-4xl text-cream">
            {download.title}
          </h1>

          {download.fileUrl && (
            <a
              href={download.fileUrl}
              download
              className="mt-6 inline-block rounded-full bg-gold px-8 py-3 text-xs font-bold uppercase text-black transition-transform hover:scale-105"
            >
              Download Document
            </a>
          )}
        </header>

        <article className="prose prose-invert max-w-none prose-gold">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default DownloadPage;