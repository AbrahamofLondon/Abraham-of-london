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
import mdxComponents from "@/components/mdx-components";
import { MDXRemote } from "next-mdx-remote";

type Props = { 
  download: {
    title: string;
    excerpt: string | null;
    category: string;
    fileUrl: string | null;
    slug: string;
  }; 
  source: any; 
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllDownloads().map((d) => ({ 
    params: { slug: normalizeSlug(d) } 
  }));
  
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  const rawDoc = getAllDownloads().find((d) => normalizeSlug(d) === slug);

  if (!rawDoc) return { notFound: true };

  // 1. SURGICAL EXTRACTION: Explicitly define a plain object.
  // This is the ONLY way to guarantee no Proxy logic leaks into the Next.js export worker.
  const download = {
    title: rawDoc.title || "Download",
    excerpt: rawDoc.excerpt || null,
    category: rawDoc.category || "Vault Resource",
    fileUrl: resolveDocDownloadUrl(rawDoc),
    slug: slug,
  };

  try {
    const mdxSource = await serialize(rawDoc.body.raw, {
      mdxOptions: { 
        remarkPlugins: [remarkGfm], 
        rehypePlugins: [rehypeSlug] 
      },
    });

    return { 
      props: { 
        download, 
        // Force source to be a plain object to prevent serialization crashes
        source: JSON.parse(JSON.stringify(mdxSource)) 
      }, 
      revalidate: 1800 
    };
  } catch (e) {
    console.error(`[Build Error] Export failed for download slug: ${slug}`, e);
    return { notFound: true };
  }
};

const DownloadPage: NextPage<Props> = ({ download, source }) => {
  const title = download.title;

  return (
    <Layout title={title}>
      <Head>
        <title>{title} | Downloads | Abraham of London</title>
        {download.excerpt && <meta name="description" content={download.excerpt} />}
      </Head>

      <main className="mx-auto max-w-3xl px-6 py-20">
        <header className="mb-10 border-b border-gold/10 pb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gold/70">
            {download.category}
          </p>
          <h1 className="mt-2 font-serif text-4xl text-cream">{title}</h1>
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

        <article className="prose prose-invert max-w-none prose-gold prose-p:text-gray-300">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default DownloadPage;