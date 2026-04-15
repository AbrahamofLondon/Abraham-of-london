/* pages/resources/surrender-framework/[slug].tsx */
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import ServerMDXRenderer from "@/components/mdx/ServerMDXRenderer";
import ClientUnlockRenderer from "@/components/content/ClientUnlockRenderer";

import { normalizeSlug } from "@/lib/content/shared";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type Props = {
  title: string;
  slug: string;
  requiredTier: AccessTier;
  bodyCode: string | null;
};

function isSurrenderFrameworkDoc(doc: any): boolean {
  const dir = String(doc?._raw?.sourceFileDir || "").toLowerCase().replace(/\\/g, "/");
  const flat = String(doc?._raw?.flattenedPath || "").toLowerCase().replace(/\\/g, "/");
  const slug = String(doc?.slug || "").toLowerCase().replace(/\\/g, "/");

  return (
    dir.includes("resources/surrender-framework") ||
    flat.startsWith("resources/surrender-framework/") ||
    flat.startsWith("content/resources/surrender-framework/") ||
    slug.startsWith("resources/surrender-framework/")
  );
}

function cleanSlug(input: unknown): string {
  const s = normalizeSlug(String(input ?? ""));
  if (!s || s.includes("..")) return "";
  return s.split("/").filter(Boolean).pop() || "";
}

const Page: NextPage<Props> = ({ title, slug, requiredTier, bodyCode }) => {
  const isPublic = requiredTier === "public";

  return (
    <Layout title={title}>
      <Head>
        <meta name="robots" content={isPublic ? "index,follow" : "noindex,nofollow"} />
      </Head>

      <main className="min-h-screen bg-black text-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-5xl font-serif mb-10">{title}</h1>

          {isPublic ? (
            <ServerMDXRenderer code={bodyCode || ""} />
          ) : (
            <ClientUnlockRenderer
              slug={`frameworks/surrender/${slug}`}
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
  console.log("[BUILD_TRACE] START pages/resources/surrender-framework/[slug].tsx getStaticPaths");
  try {
  // Narrow: load only resource docs (~20) instead of the full 316-doc corpus,
  // then filter to the surrender-framework subset.
  const { getAllResources, isDraftContent } = await import(
    "@/lib/content/server"
  );
  const docs = getAllResources() || [];

  const paths = docs
    .filter((d: any) => !isDraftContent(d))
    .filter(isSurrenderFrameworkDoc)
    .map((d: any) => {
      const raw =
        d?.slug ||
        d?._raw?.flattenedPath ||
        d?._raw?.sourceFilePath ||
        "";
      const slug = cleanSlug(raw);
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as Array<{ params: { slug: string } }>;

  return { paths, fallback: "blocking" };

  } finally {
    console.log("[BUILD_TRACE] END pages/resources/surrender-framework/[slug].tsx getStaticPaths");
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  console.log("[BUILD_TRACE] START pages/resources/surrender-framework/[slug].tsx getStaticProps");
  try {
  const slug = cleanSlug(params?.slug);
  if (!slug) return { notFound: true };

  const { getDocBySlug, isDraftContent, sanitizeData } = await import(
    "@/lib/content/server"
  );

  const doc =
    getDocBySlug(`resources/surrender-framework/${slug}`) ||
    getDocBySlug(`content/resources/surrender-framework/${slug}`) ||
    getDocBySlug(slug);

  if (!doc || isDraftContent(doc) || !isSurrenderFrameworkDoc(doc)) {
    return { notFound: true };
  }

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const isPublic = requiredTier === "public";

  return {
    props: sanitizeData({
      title: doc.title || "Surrender Framework",
      slug,
      requiredTier,
      bodyCode: isPublic ? String(doc.body?.code || doc.bodyCode || "") : null,
    }),
    revalidate: 3600,
  };

  } finally {
    console.log("[BUILD_TRACE] END pages/resources/surrender-framework/[slug].tsx getStaticProps");
  }
};

export default Page;