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
    url: string; // canonical route (computed)
    slugPath: string; // path after /resources/
  };
  source: MDXRemoteSerializeResult;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://www.abrahamoflondon.org";

function cleanResourcesPath(href: string): string | null {
  if (!href || typeof href !== "string") return null;
  if (!href.startsWith("/resources")) return null;

  // normalize "/resources" -> null, "/resources/foo/bar" -> "foo/bar"
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
        <meta property="og:type" content="article" />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Resources
          </p>

          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
            {resource.title}
          </h1>

          {resource.excerpt && (
            <p className="text-base leading-relaxed text-gray-200 sm:text-lg">{resource.excerpt}</p>
          )}

          {resource.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium text-gold/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <article className="prose prose-invert prose-lg max-w-none">
          <MDXRemote {...source} components={mdxComponents} />
        </article>

        {resource.date && (
          <footer className="mt-12 border-t border-gold/10 pt-6">
            <p className="text-sm text-gold/60">
              Last updated:{" "}
              {new Date(resource.date).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </footer>
        )}
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  assertContentlayerHasDocs("pages/resources/[...slug].tsx getStaticPaths");

  const resources = getAllResources();

  const paths = resources
    .filter((r: any) => r?.draft !== true)
    .map((r: any) => {
      const href = getDocHref(r); // prefers computed doc.url
      const slugPath = cleanResourcesPath(href);
      if (!slugPath) return null;

      // --- CRITICAL FIX START ---
      // We must exclude paths that already exist as physical files in pages/resources/
      // to prevent "Conflicting paths" build error.
      if (slugPath === "strategic-frameworks") return null;
      // --- CRITICAL FIX END ---

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

  const content =
    typeof (doc as any).body?.raw === "string"
      ? String((doc as any).body.raw)
      : typeof (doc as any).content === "string"
      ? String((doc as any).content)
      : "";

  if (!content.trim()) {
    // resources should contain content; but don’t hard-crash builds: 404 cleanly
    return { notFound: true };
  }

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