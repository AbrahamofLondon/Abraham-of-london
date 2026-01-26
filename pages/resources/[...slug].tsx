// pages/resources/[...slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import AccessGate from "@/components/AccessGate";

import {
  getAllCombinedDocs,
  getDocBySlug,
  normalizeSlug,
  isDraftContent,
  sanitizeData,
} from "@/lib/content/server";

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

type ApiOk = {
  ok: true;
  tier: AccessLevel;
  requiredTier: AccessLevel;
  source: MDXRemoteSerializeResult;
};

type ApiFail = {
  ok: false;
  reason: string;
};

function toAccessLevel(v: unknown): AccessLevel {
  const n = String(v || "").toLowerCase().trim();
  if (n === "private" || n === "restricted") return "private";
  if (n === "inner-circle" || n === "inner circle" || n === "member" || n === "members" || n === "basic" || n === "premium" || n === "enterprise") {
    return "inner-circle";
  }
  return "public";
}

function isResourceDoc(d: any): boolean {
  const kind = String(d?.kind || d?.type || "").toLowerCase();
  if (kind === "resource") return true;

  const dir = String(d?._raw?.sourceFileDir || "").toLowerCase();
  const flat = String(d?._raw?.flattenedPath || "").toLowerCase();
  return dir.includes("resources") || flat.startsWith("resources/");
}

function stripMdxExt(s: string): string {
  return String(s || "").replace(/\.(md|mdx)$/, "");
}

function stripResourcesPrefix(input: string): string {
  return normalizeSlug(input).replace(/^resources\//, "");
}

function resourceSlugFromDoc(d: any): string {
  const raw =
    normalizeSlug(String(d?.slug || "")) ||
    normalizeSlug(String(d?._raw?.flattenedPath || "")) ||
    normalizeSlug(String(d?.href || "").replace(/^\/resources\//, ""));

  const noExt = stripMdxExt(raw);
  return stripResourcesPrefix(noExt);
}

function getRawBody(d: any): string {
  return d?.body?.raw || (typeof d?.bodyRaw === "string" ? d.bodyRaw : "") || "";
}

// 🔒 Prevent conflicts with real, concrete routes under /resources
const RESERVED_RESOURCE_ROUTES = new Set<string>([
  "strategic-frameworks", // pages/resources/strategic-frameworks(.tsx) or /index.tsx
]);

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const docs = getAllCombinedDocs();
    const resources = docs.filter(isResourceDoc).filter((d: any) => !isDraftContent(d));

    const slugPaths = resources
      .map(resourceSlugFromDoc)
      .filter(Boolean)
      .map((p) => normalizeSlug(p));

    // ✅ De-dupe + exclude reserved to avoid Next "conflicting paths"
    const unique = Array.from(new Set(slugPaths)).filter((p) => {
      const head = p.split("/")[0] || "";
      return head && !RESERVED_RESOURCE_ROUTES.has(head);
    });

    const paths = unique.map((slugPath) => ({
      params: { slug: slugPath.split("/").filter(Boolean) },
    }));

    return { paths, fallback: "blocking" };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Error generating static paths:", e);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const slugParam = ctx.params?.slug;

  const slugPath =
    typeof slugParam === "string"
      ? stripResourcesPrefix(slugParam)
      : Array.isArray(slugParam)
        ? stripResourcesPrefix(slugParam.join("/"))
        : "";

  if (!slugPath) return { notFound: true };

  // ✅ safety: never allow this catch-all to resolve reserved routes
  const head = normalizeSlug(slugPath).split("/")[0] || "";
  if (RESERVED_RESOURCE_ROUTES.has(head)) return { notFound: true };

  const keyA = `resources/${slugPath}`;
  const keyB = slugPath;

  const doc = getDocBySlug(keyA) || getDocBySlug(keyB);
  if (!doc || !isResourceDoc(doc) || isDraftContent(doc)) return { notFound: true };

  const accessLevel = toAccessLevel((doc as any).accessLevel ?? (doc as any).tier);
  const locked = accessLevel !== "public";

  let initialSource: MDXRemoteSerializeResult | null = null;
  if (!locked) {
    const raw = getRawBody(doc);
    initialSource = await serialize(raw);
  }

  const resource: ResourceMeta = {
    title: (doc as any).title || "Untitled Resource",
    excerpt: (doc as any).excerpt || null,
    description: (doc as any).description || null,
    slugPath,
    accessLevel,
    date: (doc as any).date || null,
    tags: Array.isArray((doc as any).tags) ? (doc as any).tags : [],
    author: (doc as any).author || null,
    coverImage: (doc as any).coverImage || null,
  };

  return {
    props: { resource: sanitizeData(resource), locked, initialSource },
    revalidate: 3600,
  };
};

const ResourceSlugPage: NextPage<Props> = ({ resource, locked, initialSource }) => {
  const router = useRouter();
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loading, setLoading] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  async function loadLockedContent(): Promise<boolean> {
    setErrMsg(null);
    setLoading(true);
    try {
      const slug = stripResourcesPrefix(resource.slugPath);

      const res = await fetch(`/api/resources/${encodeURIComponent(slug)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const json = (await res.json()) as ApiOk | ApiFail;

      if (!res.ok || !json || (json as ApiFail).ok === false) {
        setErrMsg((json as ApiFail)?.reason || "Access denied");
        return false;
      }

      const ok = json as ApiOk;
      if (!ok.source?.compiledSource) {
        setErrMsg("Invalid payload");
        return false;
      }

      setSource(ok.source);
      return true;
    } catch {
      setErrMsg("Failed to unlock content");
      return false;
    } finally {
      setLoading(false);
    }
  }

  const requiredTier: AccessLevel = resource.accessLevel === "private" ? "private" : "inner-circle";

  return (
    <Layout title={resource.title} description={resource.description || resource.excerpt || undefined}>
      <Head>
        <meta property="og:title" content={resource.title} />
        <meta property="og:description" content={resource.description || resource.excerpt || ""} />
        {resource.coverImage ? <meta property="og:image" content={resource.coverImage} /> : null}
        <meta name="robots" content={locked ? "noindex, nofollow" : "index, follow"} />
        <link rel="canonical" href={`https://www.abrahamoflondon.org/resources/${resource.slugPath}`} />
      </Head>

      <div className="mx-auto max-w-4xl px-4 py-16">
        <button
          onClick={() => router.push("/resources")}
          className="text-sm text-gray-400 hover:text-white transition-colors"
          type="button"
        >
          ← Back to Resources
        </button>

        <h1 className="mt-6 text-4xl font-bold text-white">{resource.title}</h1>

        {(resource.description || resource.excerpt) ? (
          <p className="mt-4 text-gray-300">{resource.description || resource.excerpt}</p>
        ) : null}

        {locked && !source ? (
          <div className="mt-10">
            <AccessGate
              title={resource.title}
              message={resource.accessLevel === "private" ? "This resource is restricted." : "This resource is for Inner Circle members."}
              requiredTier={requiredTier}
              onUnlocked={() => { void loadLockedContent(); }}
              onGoToJoin={() => router.push("/inner-circle")}
            />
          </div>
        ) : null}

        {loading ? <div className="mt-10 text-gray-400">Verifying credentials & decrypting resource…</div> : null}

        {errMsg ? (
          <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errMsg}
          </div>
        ) : null}

        {source ? (
          <div className="prose prose-invert mt-10 max-w-none">
            <MDXRemote {...source} components={mdxComponents} />
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default ResourceSlugPage;