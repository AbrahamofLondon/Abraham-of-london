import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import AccessGate from "@/components/AccessGate";

import { getContentlayerData, normalizeSlug, isDraftContent } from "@/lib/contentlayer-compat";

type AccessLevel = "public" | "inner-circle" | "private";

type ResourceMeta = {
  title: string;
  excerpt: string | null;
  description: string | null;
  slugPath: string;
  accessLevel: AccessLevel;
  date: string | null;
  tags: string[];
  author: string | null;
  coverImage: string | null;
};

type Props = {
  resource: ResourceMeta;
  locked: boolean;
  initialSource: MDXRemoteSerializeResult | null;
};

function toAccessLevel(v: unknown): AccessLevel {
  const n = String(v || "").toLowerCase();
  if (n === "inner-circle" || n === "members") return "inner-circle";
  if (n === "private" || n === "restricted") return "private";
  return "public";
}

export const getStaticPaths: GetStaticPaths = async () => {
  const data = getContentlayerData();
  const resources = Array.isArray(data.allResources) ? data.allResources : [];

  const paths = resources
    .filter((r: any) => r && !isDraftContent(r))
    .map((r: any) => {
      const slug = normalizeSlug(r.slug || r._raw?.flattenedPath || r.url?.replace(/^\/resources\//, ""));
      return { params: { slug: slug.split("/").filter(Boolean) } };
    });

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const slugArray = ctx.params?.slug as string[] | undefined;
  const slugPath = normalizeSlug((slugArray || []).join("/"));
  if (!slugPath) return { notFound: true };

  const data = getContentlayerData();
  const doc = (data.allResources || []).find((r: any) => {
    const s = normalizeSlug(r.slug || r._raw?.flattenedPath || r.url?.replace(/^\/resources\//, ""));
    return s === slugPath;
  });

  if (!doc || isDraftContent(doc)) return { notFound: true };

  const accessLevel = toAccessLevel(doc.accessLevel);
  const locked = accessLevel !== "public";

  let initialSource: MDXRemoteSerializeResult | null = null;
  if (!locked) {
    initialSource = await serialize(doc.body?.raw ?? "");
  }

  const resource: ResourceMeta = {
    title: doc.title || "Untitled Resource",
    excerpt: doc.excerpt || null,
    description: doc.description || null,
    slugPath,
    accessLevel,
    date: doc.date || null,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    author: doc.author || null,
    coverImage: doc.coverImage || null,
  };

  return {
    props: { resource, locked, initialSource },
    revalidate: 3600,
  };
};

const ResourceSlugPage: NextPage<Props> = ({ resource, locked, initialSource }) => {
  const router = useRouter();
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loading, setLoading] = React.useState(false);

  async function loadLockedContent() {
    setLoading(true);
    try {
      const res = await fetch(`/api/resources/mdx?slug=${encodeURIComponent(resource.slugPath)}`);
      const json = await res.json();
      if (!res.ok || !json?.ok || !json?.source) return false;
      setSource(json.source);
      return true;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title={resource.title} description={resource.description || resource.excerpt || undefined}>
      <Head>
        <meta property="og:title" content={resource.title} />
        <meta property="og:description" content={resource.description || resource.excerpt || ""} />
        {resource.coverImage && <meta property="og:image" content={resource.coverImage} />}
      </Head>

      <div className="mx-auto max-w-4xl px-4 py-16">
        <button onClick={() => router.push("/resources")} className="text-sm text-gray-400 hover:text-white">
          ← Back to Resources
        </button>

        <h1 className="mt-6 text-4xl font-bold text-white">{resource.title}</h1>
        {(resource.description || resource.excerpt) && (
          <p className="mt-4 text-gray-300">{resource.description || resource.excerpt}</p>
        )}

        {locked && !source && (
          <div className="mt-10">
            <AccessGate
              title={resource.title}
              message={
                resource.accessLevel === "private"
                  ? "This resource is restricted."
                  : "This resource is for Inner Circle members."
              }
              requiredTier={resource.accessLevel === "private" ? "private" : "inner-circle"}
              onUnlocked={() => { void loadLockedContent(); }}
              onGoToJoin={() => router.push("/inner-circle")}
            />
          </div>
        )}

        {loading && <div className="mt-10 text-gray-400">Loading protected content…</div>}

        {source && (
          <div className="prose prose-invert mt-10 max-w-none">
            <MDXRemote {...source} components={mdxComponents} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ResourceSlugPage;