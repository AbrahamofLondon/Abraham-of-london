/* pages/content/[...slug].tsx */
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import ServerMDXRenderer from "@/components/mdx/ServerMDXRenderer";
import ClientUnlockRenderer from "@/components/content/ClientUnlockRenderer";

import { normalizeSlug } from "@/lib/content/shared";
import { getRenderableBody } from "@/lib/content/render-body";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type Props = {
  doc: {
    title: string;
    slug: string;
  };
  requiredTier: AccessTier;
  bodyCode: string | null;
};

function cleanSlug(input: unknown): string {
  const raw = Array.isArray(input) ? input.join("/") : String(input ?? "");
  const s = normalizeSlug(raw).replace(/^content\//i, "");
  if (!s || s.includes("..")) return "";
  return s;
}

const Page: NextPage<Props> = ({ doc, requiredTier, bodyCode }) => {
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
            <ServerMDXRenderer code={bodyCode || ""} />
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
  console.log("[BUILD_TRACE] START pages/content/[...slug].tsx getStaticPaths");
  try {
  // Catch-all /content/* route. Pre-generating paths here requires a
  // full-corpus scan across every published document just to enumerate
  // routes that getDocBySlug already resolves at request time. With
  // fallback: "blocking", every valid slug still renders via getStaticProps
  // below, so we skip the pre-generation pass entirely.
  return { paths: [], fallback: "blocking" };

  } finally {
    console.log("[BUILD_TRACE] END pages/content/[...slug].tsx getStaticPaths");
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  console.log("[BUILD_TRACE] START pages/content/[...slug].tsx getStaticProps");
  try {
  const slug = cleanSlug(params?.slug);
  if (!slug) return { notFound: true };

  const { getDocBySlug, sanitizeData } = await import("@/lib/content/server");

  const doc =
    getDocBySlug(`content/${slug}`) ||
    getDocBySlug(slug);

  if (!doc || doc.draft) return { notFound: true };

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const isPublic = requiredTier === "public";
  const renderBody = getRenderableBody(doc);

  return {
    props: sanitizeData({
      doc: {
        title: doc.title || "Content",
        slug,
      },
      requiredTier,
      bodyCode: isPublic ? renderBody.code : null,
    }),
    revalidate: 1800,
  };

  } finally {
    console.log("[BUILD_TRACE] END pages/content/[...slug].tsx getStaticProps");
  }
};

export default Page;