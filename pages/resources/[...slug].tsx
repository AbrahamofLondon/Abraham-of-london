// pages/resources/[...slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

// ✅ IMPORTANT: normalize Contentlayer exports in one place
import { getAllResources, getResourceByUrlPath } from "@/lib/server/content";

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
  };
  source: MDXRemoteSerializeResult;
};

const ResourcesCatchAllPage: NextPage<Props> = ({ resource, source }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout title="Loading...">
        <main className="mx-auto max-w-3xl px-4 py-12">Loading…</main>
      </Layout>
    );
  }

  return (
    <Layout title={resource.title}>
      <Head>
        <link rel="canonical" href={resource.url} />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Resources
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            {resource.title}
          </h1>
          {resource.excerpt ? (
            <p className="text-sm text-gray-200">{resource.excerpt}</p>
          ) : null}
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
    .map((r) => r.url || r.href)
    .filter((u): u is string => typeof u === "string" && u.startsWith("/resources/"))
    // ✅ Avoid generating "/resources" from catch-all. Index should be a separate page.
    .filter((u) => u !== "/resources")
    .map((u) => {
      const slugParts = u.replace(/^\/resources\/?/, "").split("/").filter(Boolean);
      return { params: { slug: slugParts } };
    });

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const slug = (ctx.params?.slug as string[]) || [];
  const urlPath = "/resources/" + slug.join("/");

  const doc = await getResourceByUrlPath(urlPath);
  if (!doc) {
    return { notFound: true };
  }

  const source = await serialize(doc.body.raw, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
    },
    parseFrontmatter: false,
  });

  return {
    props: {
      resource: {
        title: doc.title,
        excerpt: doc.excerpt ?? null,
        description: doc.description ?? null,
        date: doc.date ?? null,
        coverImage: doc.coverImage ?? null,
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        author: (doc.author as any) ?? null,
        url: doc.url || doc.href || urlPath,
      },
      source,
    },
  };
};

export default ResourcesCatchAllPage;