import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getAllResources } from "@/lib/contentlayer-helper";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";

type Props = { resource: any; source: MDXRemoteSerializeResult };

function resourceSlugParts(d: any): string[] {
  // Prefer explicit slug which might already contain "a/b"
  const s = typeof d?.slug === "string" ? d.slug.trim() : "";
  if (s) return s.split("/").filter(Boolean);

  const fp = typeof d?._raw?.flattenedPath === "string" ? d._raw.flattenedPath : "";
  // content/resources/foo/bar -> we want ["foo","bar"]
  const cleaned = fp.replace(/^content\//, "").replace(/^resources\//, "").replace(/\/index$/, "");
  return cleaned.split("/").filter(Boolean);
}

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllResources();

  const paths = docs.map((d) => ({
    params: { slug: resourceSlugParts(d) },
  }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const parts = (params?.slug as string[] | string | undefined);
  const slugParts = Array.isArray(parts)
    ? parts.map((p) => String(p).trim()).filter(Boolean)
    : String(parts ?? "").split("/").map((p) => p.trim()).filter(Boolean);

  if (slugParts.length === 0) return { notFound: true };

  const wanted = slugParts.join("/");

  const docs = getAllResources();
  const resource = docs.find((d) => resourceSlugParts(d).join("/") === wanted);

  if (!resource) return { notFound: true };

  const raw = resource?.body?.raw ?? "";
  const source = await serialize(raw, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
    },
  });

  return { props: { resource, source }, revalidate: 1800 };
};

const ResourcePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  resource,
  source,
}) => {
  const title = resource.title ?? "Resource";

  return (
    <Layout title={title}>
      <Head>
        {resource.excerpt && <meta name="description" content={resource.excerpt} />}
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Resource
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            {title}
          </h1>
        </header>

        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default ResourcePage;