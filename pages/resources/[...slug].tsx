import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getAllResources, normalizeSlug } from "@/lib/contentlayer-helper";

import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import SafeMDXRemote from "@/components/SafeMDXRemote";

type Props = { resource: any; source: any };

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllResources();
  const paths = docs
    .map((d) => {
      const slug = normalizeSlug(d);
      return slug ? { params: { slug: slug.split("/") } } : null;
    })
    .filter(Boolean) as any[];

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const parts = params?.slug as string[] | undefined;
  if (!parts || parts.length === 0) return { notFound: true };

  const fullSlug = parts.join("/");
  const docs = getAllResources();
  const resource = docs.find((d) => normalizeSlug(d) === fullSlug);

  if (!resource) return { notFound: true };

  const raw = resource?.body?.raw ?? "";
  let source;
  try {
    source = await serialize(raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });
  } catch (e) {
    console.error(`[Resource Serialize Error] ${fullSlug}:`, e);
    source = await serialize("This resource is being prepared.");
  }

  return { props: { resource, source }, revalidate: 1800 };
};

const ResourcePage: NextPage<Props> = ({ resource, source }) => {
  const title = resource.title ?? "Resource";

  return (
    <Layout title={title}>
      <Head>
        {resource.excerpt && <meta name="description" content={resource.excerpt} />}
        <title>{title} | Kingdom Resources | Abraham of London</title>
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-10 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/60">
            Vault Library
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <div className="h-1 w-20 bg-gold/30" />
        </header>

        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold prose-li:text-gray-300">
          <SafeMDXRemote source={source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default ResourcePage;