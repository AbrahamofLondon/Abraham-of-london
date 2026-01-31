/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";
import { getAllCombinedDocs, getDocBySlug, normalizeSlug, isDraftContent, isPublished } from "@/lib/contentlayer-helper";
import { getDocKind, getDocHref, resolveDocCoverImage, sanitizeData } from "@/lib/content/shared";

interface Props {
  doc: any;
  source: MDXRemoteSerializeResult | null;
  mdxRaw: string;
}

const GenericContentPage: NextPage<Props> = ({ doc, source, mdxRaw }) => {
  const router = useRouter();
  
  const safeComponents = React.useMemo(
    () => createSeededSafeMdxComponents(mdxComponents, mdxRaw, {
      warnOnFallback: process.env.NODE_ENV === "development",
    }),
    [mdxRaw]
  );

  if (router.isFallback) return <Layout title="Loading...">...</Layout>;
  if (!doc) return <Layout title="404">Not Found</Layout>;

  return (
    <Layout title={doc.title}>
      <Head>
        <title>{`${doc.title} | Abraham of London`}</title>
        <meta name="description" content={doc.excerpt} />
      </Head>

      <article className="relative min-h-screen bg-black pt-24 pb-32">
        {/* Institutional Header */}
        <header className="mx-auto max-w-3xl px-6 text-center mb-16">
          <div className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-500/60 border border-amber-500/20 px-4 py-1.5 rounded-full">
            {doc.kind} // Protocol v2.6
          </div>
          <h1 className="font-serif text-5xl md:text-7xl text-white tracking-tight mb-8">
            {doc.title}
          </h1>
          <div className="flex justify-center items-center gap-6 font-mono text-[10px] uppercase text-white/30 tracking-widest border-y border-white/5 py-4">
            <span>{doc.date}</span>
            <span className="h-1 w-1 bg-white/20 rounded-full" />
            <span>{doc.readTime || "5 MIN READ"}</span>
          </div>
        </header>

        {/* Content Body: Focused for elite readability */}
        <div className="mx-auto max-w-2xl px-6">
          <div className="prose prose-invert max-w-none">
            {source && <MDXRemote {...source} components={safeComponents as any} />}
          </div>
        </div>
      </article>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllCombinedDocs().filter(d => !isDraftContent(d) && isPublished(d));
  const paths = docs.map(d => ({ params: { slug: normalizeSlug(d.slug) } }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = String(params?.slug || "");
  const rawDoc = getDocBySlug(slug);

  if (!rawDoc || isDraftContent(rawDoc)) return { notFound: true };

  const mdxRaw = rawDoc.body?.raw || "";
  const source = await serialize(mdxRaw, {
    mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] }
  });

  const doc = sanitizeData({
    title: rawDoc.title,
    kind: getDocKind(rawDoc),
    date: rawDoc.date ? new Date(rawDoc.date).toLocaleDateString("en-GB") : null,
    excerpt: rawDoc.excerpt || rawDoc.description || "",
    readTime: rawDoc.readTime,
  });

  return { props: { doc, source, mdxRaw }, revalidate: 3600 };
};

export default GenericContentPage;