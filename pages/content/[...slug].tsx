/* pages/content/[...slug].tsx */
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import { StaticMDXRenderer, renderDocBodyToStaticHtml } from "@/lib/mdx/static-mdx-runtime";
import ClientUnlockRenderer from "@/components/content/ClientUnlockRenderer";

import { normalizeSlug } from "@/lib/content/shared";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type Props = {
  doc: {
    title: string;
    slug: string;
  };
  requiredTier: AccessTier;
  staticHtml: string;
};

function cleanSlug(input: unknown): string {
  const raw = Array.isArray(input) ? input.join("/") : String(input ?? "");
  const s = normalizeSlug(raw).replace(/^content\//i, "");
  if (!s || s.includes("..")) return "";
  return s;
}

const Page: NextPage<Props> = ({ doc, requiredTier, staticHtml }) => {
  const isPublic = requiredTier === "public";

  return (
    <Layout title={doc?.title || "Content"}>
      <Head>
        <meta
          name="robots"
          content={isPublic ? "index,follow" : "noindex,nofollow"}
        />
      </Head>

      <main className="min-h-screen bg-black text-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-serif mb-8">{doc?.title}</h1>

          {isPublic ? (
            <StaticMDXRenderer html={staticHtml} />
          ) : (
            <ClientUnlockRenderer
              slug={`content/${doc.slug}`}
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
  // Catch-all /content/* route. Pre-generating paths here requires a
  // full-corpus scan across every published document just to enumerate
  // routes that getDocBySlug already resolves at request time. With
  // fallback: "blocking", every valid slug still renders via getStaticProps
  // below, so we skip the pre-generation pass entirely.
  return { paths: [], fallback: "blocking" };


};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = cleanSlug(params?.slug);
  if (!slug) return { notFound: true };

  const { getDocBySlug, sanitizeData } = await import("@/lib/content/server");

  const doc =
    getDocBySlug(`content/${slug}`) ||
    getDocBySlug(slug);

  if (!doc || doc.draft) return { notFound: true };

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const isPublic = requiredTier === "public";
  return {
    props: sanitizeData({
      doc: {
        title: doc.title || "Content",
        slug,
      },
      requiredTier,
      staticHtml: isPublic ? renderDocBodyToStaticHtml(doc).html : "",
    }),
    revalidate: 1800,
  };


};

export default Page;