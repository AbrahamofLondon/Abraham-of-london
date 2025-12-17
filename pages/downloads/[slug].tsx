import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { 
  getAllDownloads, 
  normalizeSlug, 
  resolveDocDownloadUrl 
} from "@/lib/contentlayer-helper";

import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import SafeMDXRemote from "@/components/SafeMDXRemote";

type Props = { download: any; source: any };

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllDownloads();
  const paths = docs
    .map((d) => ({ params: { slug: normalizeSlug(d) } }))
    .filter((p) => p.params.slug !== "");

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  if (!slug) return { notFound: true };

  const docs = getAllDownloads();
  const download = docs.find((d) => normalizeSlug(d) === slug);
  if (!download) return { notFound: true };

  const raw = download?.body?.raw ?? "";
  let source;
  try {
    source = await serialize(raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });
  } catch (e) {
    console.error(`[Download Serialize Error] ${slug}:`, e);
    source = await serialize("This download information is being prepared.");
  }

  return { props: { download, source }, revalidate: 1800 };
};

const DownloadPage: NextPage<Props> = ({ download, source }) => {
  const title = download.title ?? "Download";
  const fileUrl = resolveDocDownloadUrl(download);

  return (
    <Layout title={title}>
      <Head>
        {download.excerpt && <meta name="description" content={download.excerpt} />}
        <title>{title} | Downloads | Abraham of London</title>
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-10 space-y-4 border-b border-gold/10 pb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">Vault Resource</p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">{title}</h1>
          
          {fileUrl && (
            <div className="pt-4">
              <a
                href={fileUrl}
                download
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80 hover:scale-105"
              >
                <span>Download Document</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            </div>
          )}
        </header>

        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold">
          <SafeMDXRemote source={source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default DownloadPage;