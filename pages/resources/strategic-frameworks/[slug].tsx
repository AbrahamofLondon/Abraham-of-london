/* pages/resources/strategic-frameworks/[slug].tsx */
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import ClientUnlockRenderer from "@/components/content/ClientUnlockRenderer";

import {
  getAllFrameworkSlugs,
  getFrameworkBySlug,
  type Framework,
} from "@/lib/resources/strategic-frameworks";

import tiers from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type Props = {
  slug: string;
  title: string;
  requiredTier: AccessTier;
};

function cleanSlug(input: unknown): string {
  const s = String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");

  if (!s || s.includes("..")) return "";
  return s.split("/").filter(Boolean).pop() || "";
}

function requiredTierFromFramework(fw: Framework): AccessTier {
  const labels = (fw?.tier || []).map((x) => String(x).toLowerCase().trim());
  const set = new Set(labels);

  if (set.has("owner")) return "owner";
  if (set.has("architect") || set.has("founder") || set.has("board")) return "architect";
  if (set.has("legacy")) return "legacy";
  if (set.has("client")) return "client";
  if (set.has("inner-circle") || set.has("inner circle")) return "inner_circle";
  if (set.has("member")) return "member";
  return "public";
}

const Page: NextPage<Props> = ({ slug, title, requiredTier }) => {
  return (
    <Layout title={title}>
      <Head>
        <meta
          name="robots"
          content={requiredTier === "public" ? "index,follow" : "noindex,nofollow"}
        />
      </Head>

      <main className="min-h-screen bg-black text-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-5xl font-serif mb-10">{title}</h1>

          <ClientUnlockRenderer
            slug={`resources/strategic-frameworks/${slug}`}
            requiredTier={requiredTier}
            initialCode={null}
          />
        </div>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getAllFrameworkSlugs() || [];

  return {
    paths: slugs
      .map((slug) => cleanSlug(slug))
      .filter(Boolean)
      .map((slug) => ({ params: { slug } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = cleanSlug(params?.slug);
  if (!slug) return { notFound: true };

  const framework = getFrameworkBySlug(slug);
  if (!framework) return { notFound: true };

  const requiredTier = tiers.normalizeRequired(requiredTierFromFramework(framework));

  return {
    props: {
      slug,
      title: framework.title || "Strategic Framework",
      requiredTier,
    },
    revalidate: 3600,
  };
};

export default Page;
