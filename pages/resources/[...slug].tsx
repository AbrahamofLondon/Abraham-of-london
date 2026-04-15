/* pages/resources/[...slug].tsx */
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import ServerMDXRenderer from "@/components/mdx/ServerMDXRenderer";
import ClientUnlockRenderer from "@/components/content/ClientUnlockRenderer";

import { normalizeSlug } from "@/lib/content/shared";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type Props = {
  resource: {
    title: string;
    slug: string;
  };
  requiredTier: AccessTier;
  bodyCode: string | null;
};

function isResourceDoc(doc: any): boolean {
  if (!doc) return false;

  const docKind = String(doc?.docKind || "").toLowerCase();
  if (docKind === "lexicon") return false;
  if (docKind === "resource") return true;

  const kind = String(doc?.kind || doc?.type || "").toLowerCase();
  if (kind === "resource") return true;

  const flat = String(doc?._raw?.flattenedPath || "").toLowerCase();
  const dir = String(doc?._raw?.sourceFileDir || "").toLowerCase();
  const slug = String(doc?.slug || "").toLowerCase();

  return (
    dir.includes("resources") ||
    flat.startsWith("resources/") ||
    flat.startsWith("content/resources/") ||
    slug.startsWith("resources/")
  );
}

function cleanResourceSlug(input: unknown): string {
  const raw = Array.isArray(input) ? input.join("/") : String(input ?? "");
  const s = normalizeSlug(raw)
    .replace(/^content\//i, "")
    .replace(/^resources\//i, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  if (!s || s.includes("..")) return "";
  return s;
}

const Page: NextPage<Props> = ({ resource, requiredTier, bodyCode }) => {
  const isPublic = requiredTier === "public";

  return (
    <Layout title={resource.title}>
      <Head>
        <meta name="robots" content={isPublic ? "index,follow" : "noindex,nofollow"} />
      </Head>

      <main className="min-h-screen bg-black text-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-5xl font-serif mb-10">{resource.title}</h1>

          {isPublic ? (
            <ServerMDXRenderer code={bodyCode || ""} />
          ) : (
            <ClientUnlockRenderer
              slug={`resources/${resource.slug}`}
              requiredTier={requiredTier}
              initialCode={null}
            />
          )}
        </div>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  console.log("[BUILD_TRACE] START pages/resources/[...slug].tsx getStaticPaths");
  try {
  // Narrow: load only resource docs (~20) instead of the full 316-doc corpus.
  // isResourceDoc filter retained because the generic Resource helper may
  // include lexicon-shaped entries the UI filter still wants to exclude.
  const { getAllResources, isDraftContent } = await import(
    "@/lib/content/server"
  );
  const docs = getAllResources() || [];

  const paths = (
    docs
      .filter((d: any) => !isDraftContent(d))
      .filter(isResourceDoc)
      .map((d: any) => {
        const raw = d?.slug || d?._raw?.flattenedPath || "";
        const slug = cleanResourceSlug(raw);
        if (!slug) return null;
        return { params: { slug: slug.split("/") } };
      })
      .filter((entry): entry is { params: { slug: string[] } } => {
        if (!entry) return false;

        const segments = entry.params.slug;
        if (!segments.length) return false;

        if (segments[0] === "surrender-framework") return false;
        if (segments.length === 1 && segments[0] === "strategic-frameworks") {
          return false;
        }

        return true;
      })
  ) as Array<{ params: { slug: string[] } }>;

  return { paths, fallback: "blocking" };

  } finally {
    console.log("[BUILD_TRACE] END pages/resources/[...slug].tsx getStaticPaths");
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  console.log("[BUILD_TRACE] START pages/resources/[...slug].tsx getStaticProps");
  try {
  const slug = cleanResourceSlug(params?.slug);
  if (!slug) return { notFound: true };

  const { getDocBySlug, isDraftContent, sanitizeData } = await import(
    "@/lib/content/server"
  );

  const doc =
    getDocBySlug(`resources/${slug}`) ||
    getDocBySlug(`content/resources/${slug}`) ||
    getDocBySlug(slug);

  if (!doc || isDraftContent(doc) || !isResourceDoc(doc)) {
    return { notFound: true };
  }

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const isPublic = requiredTier === "public";

  return {
    props: sanitizeData({
      resource: {
        title: doc.title || "Untitled Resource",
        slug,
      },
      requiredTier,
      bodyCode: isPublic ? String(doc.body?.code || doc.bodyCode || "") : null,
    }),
    revalidate: 3600,
  };

  } finally {
    console.log("[BUILD_TRACE] END pages/resources/[...slug].tsx getStaticProps");
  }
};

export default Page;
