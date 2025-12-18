import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getAllResources, getResourceBySlug, normalizeSlug } from "@/lib/contentlayer-helper";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote } from "next-mdx-remote";

type Props = { 
  resource: {
    title: string;
    excerpt: string | null;
    slug: string;
  }; 
  source: any; 
};

export const getStaticPaths: GetStaticPaths = async () => {
  const resources = getAllResources();
  
  const paths = resources.map((r) => {
    const slug = normalizeSlug(r);
    // FIX: Catch-all routes [...slug] REQUIRE an array of strings
    return {
      params: { slug: slug.split("/") }
    };
  });

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  // FIX: For catch-all routes, params.slug is an array. Join it to find the doc.
  const slugArray = params?.slug as string[];
  const fullSlug = slugArray.join("/");
  
  const rawDoc = getResourceBySlug(fullSlug);

  if (!rawDoc) return { notFound: true };

  // SURGICAL EXTRACTION
  const resource = {
    title: rawDoc.title || "Vault Resource",
    excerpt: rawDoc.excerpt || null,
    slug: fullSlug,
  };

  try {
    const mdxSource = await serialize(rawDoc.body.raw, {
      mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] },
    });

    return { 
      props: { 
        resource, 
        source: JSON.parse(JSON.stringify(mdxSource)) 
      }, 
      revalidate: 1800 
    };
  } catch (err) {
    console.error(`[Build Error] Resource Serialization failed: ${fullSlug}`);
    return { notFound: true };
  }
};

const ResourcePage: NextPage<Props> = ({ resource, source }) => (
  <Layout title={resource.title}>
    <Head>
      <title>{resource.title} | Kingdom Resources | Abraham of London</title>
      {resource.excerpt && <meta name="description" content={resource.excerpt} />}
    </Head>

    <main className="mx-auto max-w-3xl px-6 py-20">
      <header className="mb-10 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/60">
          Vault Library
        </p>
        <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
          {resource.title}
        </h1>
        <div className="h-1 w-20 bg-gold/30" />
      </header>

      <article className="prose prose-invert max-w-none prose-gold prose-p:text-gray-300">
        <MDXRemote {...source} components={mdxComponents} />
      </article>
    </main>
  </Layout>
);

export default ResourcePage;