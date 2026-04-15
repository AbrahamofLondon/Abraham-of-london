/* pages/prints/[slug].tsx */
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import ServerMDXRenderer from "@/components/mdx/ServerMDXRenderer";

import { normalizeSlug } from "@/lib/content/shared";

type Props = {
  print: {
    title: string;
    slug: string;
  };
  bodyCode: string;
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

const Page: NextPage<Props> = ({ print, bodyCode }) => {
  return (
    <Layout title={print.title}>
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen bg-white text-black px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-5xl font-serif mb-10">{print.title}</h1>
          <ServerMDXRenderer code={bodyCode} />
        </div>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  console.log("[BUILD_TRACE] START pages/prints/[slug].tsx getStaticPaths");
  try {
  // Narrow: load only print docs (~6) instead of the full 316-doc corpus.
  const { getAllPrints, isDraftContent } = await import(
    "@/lib/content/server"
  );
  const docs = getAllPrints() || [];

  const paths = docs
    .filter((d: any) => !isDraftContent(d))
    .map((d: any) => {
      const slug = normalizeSlug(
        String(d?.slug || d?._raw?.flattenedPath || "").replace(/^prints\//i, ""),
      );
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as Array<{ params: { slug: string } }>;

  return { paths, fallback: "blocking" };

  } finally {
    console.log("[BUILD_TRACE] END pages/prints/[slug].tsx getStaticPaths");
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  console.log("[BUILD_TRACE] START pages/prints/[slug].tsx getStaticProps");
  try {
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

  return {
    props: sanitizeData({
      print: {
        title: doc.title || "Untitled Print",
        slug,
      },
      bodyCode: String(doc.body?.code || doc.bodyCode || ""),
    }),
    revalidate: 3600,
  };

  } finally {
    console.log("[BUILD_TRACE] END pages/prints/[slug].tsx getStaticProps");
  }
};

export default Page;