import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getAllDownloads } from "@/lib/contentlayer-helper";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";

type Props = { download: any; source: MDXRemoteSerializeResult };

function docSlug(d: any): string {
  return d?.slug ?? d?._raw?.flattenedPath?.split("/").pop() ?? "";
}

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllDownloads();
  const paths = docs.map((d) => ({ params: { slug: docSlug(d) } }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const docs = getAllDownloads();
  const download = docs.find((d) => docSlug(d) === slug);
  if (!download) return { notFound: true };

  const raw = download?.body?.raw ?? "";
  const source = await serialize(raw, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
    },
  });

  return { props: { download, source }, revalidate: 1800 };
};

const DownloadPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  download,
  source,
}) => {
  const title = download.title ?? "Download";

  const fileUrl =
    download.downloadUrl ?? download.fileUrl ?? download.pdfPath ?? download.file ?? null;

  return (
    <Layout title={title}>
      <Head>
        {download.excerpt && <meta name="description" content={download.excerpt} />}
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Download
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            {title}
          </h1>
          {download.excerpt ? <p className="text-sm text-gray-300">{download.excerpt}</p> : null}

          {fileUrl ? (
            <div className="pt-2">
              <a
                href={fileUrl}
                className="inline-flex items-center justify-center rounded-full bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-gold/90"
              >
                Download
              </a>
            </div>
          ) : null}
        </header>

        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default DownloadPage;