// pages/resources/[...slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { getAllResources, getResourceByUrlPath, type ResourceDoc } from "@/lib/server/content";
import { serializeMDX } from "@/lib/mdx-utils";

type Props = {
  resource: {
    title: string;
    excerpt?: string | null;
    description?: string | null;
    date?: string | null;
    coverImage?: string | null;
    tags?: string[];
    author?: string | null;
    url: string;
    body: { raw: string };
  };
  source: MDXRemoteSerializeResult;
};

const ResourcesCatchAllPage: NextPage<Props> = ({ resource, source }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout title="Loading...">
        <main className="mx-auto max-w-3xl px-4 py-12">Loading...</main>
      </Layout>
    );
  }

  return (
    <Layout title={resource.title} description={resource.description ?? resource.excerpt ?? undefined}>
      <Head>
        <link rel="canonical" href={resource.url} />
        <meta property="og:title" content={resource.title} />
        {resource.description ? <meta property="og:description" content={resource.description} /> : null}
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">Resources</p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">{resource.title}</h1>
          {resource.excerpt ? <p className="text-sm text-gray-200">{resource.excerpt}</p> : null}
        </header>

        <article className="prose prose-invert max-w-none">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const resources = await getAllResources();

  const paths = resources
    .map((r) => r.url)
    .filter((u): u is string => typeof u === "string" && u.startsWith("/resources/") && u !== "/resources")
    // explicit route owns this subtree
    .filter((u) => !u.startsWith("/resources/strategic-frameworks"))
    .map((u) => {
      const slugParts = u.replace(/^\/resources\/?/, "").split("/").filter(Boolean);
      return { params: { slug: slugParts } };
    });

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const slugParts = (ctx.params?.slug as string[]) || [];
  const urlPath = "/resources/" + slugParts.join("/");

  const doc = (await getResourceByUrlPath(urlPath)) as ResourceDoc | null;
  if (!doc) return { notFound: true };

  const content = doc.body?.raw || "";
  if (!content.trim()) return { notFound: true };

  const source = await serializeMDX(content);

  return {
    props: {
      resource: {
        title: doc.title || "Untitled Resource",
        excerpt: doc.excerpt ?? doc.description ?? null,
        description: doc.description ?? null,
        date: doc.date ?? null,
        coverImage: doc.coverImage ?? null,
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        author: doc.author ?? null,
        url: doc.url || urlPath,
        body: { raw: content },
      },
      source,
    },
    revalidate: 3600,
  };
};

export default ResourcesCatchAllPage;