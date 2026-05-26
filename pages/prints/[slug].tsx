/* pages/prints/[slug].tsx */
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import { StaticMDXRenderer, renderDocBodyToStaticHtml } from "@/lib/mdx/static-mdx-runtime";
import ClientUnlockRenderer from "@/components/content/ClientUnlockRenderer";

import { normalizeSlug } from "@/lib/content/shared";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type Props = {
  print: {
    title: string;
    slug: string;
  };
  requiredTier: AccessTier;
  staticHtml: string;
};

function isPrintDoc(doc: any): boolean {
  const flat = String(doc?._raw?.flattenedPath || "").toLowerCase();
  const dir = String(doc?._raw?.sourceFileDir || "").toLowerCase();
  const slug = String(doc?.slug || "").toLowerCase();
  const kind = String(doc?.type || doc?.docKind || doc?.kind || "").toLowerCase();

  return (
    kind === "print" ||
    dir.includes("prints") ||
    flat.startsWith("prints/") ||
    flat.startsWith("content/prints/") ||
    slug.startsWith("prints/")
  );
}

const Page: NextPage<Props> = ({ print, requiredTier, staticHtml }) => {
  const isPublic = requiredTier === "public";

  return (
    <Layout title={print.title}>
      <Head>
        <meta name="robots" content={isPublic ? "index,follow" : "noindex,nofollow"} />
      </Head>

      <main className="min-h-screen bg-white text-black px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-5xl font-serif mb-10">{print.title}</h1>
          {isPublic ? (
            <StaticMDXRenderer html={staticHtml} />
          ) : !isPublic ? (
            <ClientUnlockRenderer
              slug={`prints/${print.slug}`}
              requiredTier={requiredTier}
              initialCode={null}
              title={print.title}
              message="This print requires appropriate access."
            />
          ) : null}
        </div>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Narrow: load only print docs (~6) instead of the full 316-doc corpus.
  const { getAllPrints, isDraftContent } = await import(
    "@/lib/content/server"
  );
  const docs = getAllPrints() || [];

  // Cap prebuild to the 5 most recent prints; rest render via blocking.
  const paths = [...docs]
    .filter((d: any) => !isDraftContent(d))
    .sort(
      (a: any, b: any) =>
        new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime(),
    )
    .slice(0, 5)
    .map((d: any) => {
      const slug = normalizeSlug(
        String(d?.slug || d?._raw?.flattenedPath || "").replace(/^prints\//i, ""),
      );
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as Array<{ params: { slug: string } }>;

  return { paths, fallback: "blocking" };


};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");

  const { getDocBySlug, isDraftContent, sanitizeData } = await import(
    "@/lib/content/server"
  );

  const doc =
    getDocBySlug(`prints/${slug}`) ||
    getDocBySlug(`content/prints/${slug}`) ||
    getDocBySlug(slug);

  if (!doc || isDraftContent(doc) || !isPrintDoc(doc)) {
    return { notFound: true };
  }

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const isPublic = requiredTier === "public";

  return {
    props: sanitizeData({
      print: {
        title: doc.title || "Untitled Print",
        slug,
      },
      requiredTier,
      staticHtml: isPublic ? renderDocBodyToStaticHtml(doc).html : "",
    }),
    revalidate: 3600,
  };


};

export default Page;