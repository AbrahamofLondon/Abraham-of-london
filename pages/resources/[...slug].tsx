import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import {
  assertContentlayerHasDocs,
  getAllResources,
  resolveDocCoverImage,
  getDocHref,
} from "@/lib/contentlayer-helper";

import { serializeMDX } from "@/lib/mdx-utils";

type Props = {
  resource: {
    title: string;
    excerpt: string | null;
    description: string | null;
    date: string | null;
    coverImage: string | null;
    tags: string[];
    author: string | null;
    url: string;
    slugPath: string;
  };
  source: MDXRemoteSerializeResult;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://www.abrahamoflondon.org";

function cleanResourcesPath(href: string): string | null {
  if (!href || typeof href !== "string") return null;
  const rest = href.replace(/^\/resources\/?/, "").replace(/^\/+|\/+$/g, "");
  return rest || null;
}

const ResourcesCatchAllPage: NextPage<Props> = ({ resource, source }) => {
  const canonical = `${SITE_URL}${resource.url}`;

  return (
    <Layout title={resource.title}>
      <Head>
        <title>{resource.title} | Resources | Abraham of London</title>
        <link rel="canonical" href={canonical} />
        <meta name="description" content={resource.description || resource.excerpt || ""} />
        {resource.coverImage && (
          <>
            <meta property="og:image" content={resource.coverImage} />
            <meta name="twitter:image" content={resource.coverImage} />
          </>
        )}
      </Head>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <header className="mb-12 border-b border-gold/10 pb-10">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.4em] text-gold/60">
            Institutional Resource
          </p>

          <h1 className="font-serif text-4xl font-bold tracking-tight text-cream sm:text-5xl lg:text-6xl">
            {resource.title}
          </h1>

          {resource.excerpt && (
            <p className="mt-6 text-xl leading-relaxed text-gray-400 font-light italic">
              {resource.excerpt}
            </p>
          )}

          {resource.tags?.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {resource.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-gold/20 bg-gold/5 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-gold/80">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <article className="prose prose-invert prose-lg max-w-none prose-headings:font-serif prose-headings:text-gold/90 prose-p:text-gray-300">
          <MDXRemote {...source} components={mdxComponents} />
        </article>

        {resource.date && (
          <footer className="mt-16 border-t border-gold/10 pt-8">
            <p className="text-xs font-mono uppercase tracking-widest text-gold/40">
              Publication Checkpoint: {new Date(resource.date).toLocaleDateString("en-GB", {
                year: "numeric", month: "long", day: "numeric"
              })}
            </p>
          </footer>
        )}
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // FIXED: Removed argument to resolve Type error: Expected 0 arguments, but got 1.
  assertContentlayerHasDocs();

  const resources = getAllResources();

  const paths = resources
    .filter((r: any) => r?.draft !== true)
    .map((r: any) => {
      const href = getDocHref(r);
      const slugPath = cleanResourcesPath(href);
      if (!slugPath) return null;

      const reservedPaths = ["strategic-frameworks", "archive"];
      if (reservedPaths.includes(slugPath)) return null;

      return { params: { slug: slugPath.split("/").filter(Boolean) } };
    })
    .filter(Boolean) as Array<{ params: { slug: string[] } }>;

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const slugArray = (ctx.params?.slug as string[]) || [];
  if (!slugArray.length) return { notFound: true };

  const urlPath = `/resources/${slugArray.join("/")}`;
  const resources = getAllResources();
  const doc = resources.find((r: any) => getDocHref(r) === urlPath);

  if (!doc || (doc as any)?.draft === true) return { notFound: true };

  const content = (doc as any).body?.raw || (doc as any).content || "";
  if (!content.trim()) return { notFound: true };

  const source = await serializeMDX(content);

  return {
    props: {
      resource: {
        title: (doc as any).title || "Untitled Resource",
        excerpt: (doc as any).excerpt ?? (doc as any).description ?? null,
        description: (doc as any).description ?? (doc as any).excerpt ?? null,
        date: (doc as any).date ?? null,
        coverImage: resolveDocCoverImage(doc),
        tags: Array.isArray((doc as any).tags) ? (doc as any).tags : [],
        author: (doc as any).author ?? null,
        url: urlPath,
        slugPath: slugArray.join("/"),
      },
      source,
    },
    revalidate: 3600,
  };
};

export default ResourcesCatchAllPage;