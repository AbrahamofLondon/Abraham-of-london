/* pages/content/[...slug].tsx — REIFIED FOR CONTENTLAYER2 */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Calendar, Loader2, Tag, FileText, Shield } from "lucide-react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";

import { useAccess } from "@/hooks/useAccess";
import { useClientRouter } from "@/lib/router/useClientRouter";
import { getPublishedDocuments, getDocBySlug, normalizeSlug, sanitizeData } from "@/lib/content/server";

type Tier = "public" | "inner-circle" | "private";

interface Props {
  doc: any;
  initialLocked: boolean;
}

const ContentSlugPage: NextPage<Props> = ({ doc, initialLocked }) => {
  const router = useClientRouter();
  const { hasClearance, verify, isValidating } = useAccess();
  const [activeCode, setActiveCode] = React.useState<string>(doc.bodyCode || "");
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isAuthorized = hasClearance(doc.accessLevel);

  const handleUnlock = async () => {
    verify();
    if (initialLocked) {
      setLoadingContent(true);
      try {
        const res = await fetch(`/api/content/${encodeURIComponent(doc.slug)}`);
        const json = await res.json();
        if (res.ok && json.bodyCode) setActiveCode(json.bodyCode);
      } catch (err) {
        console.error("[DECRYPTION_ERROR]", err);
      } finally {
        setLoadingContent(false);
      }
    }
  };

  if (!mounted || !router) return <Layout title={doc.title}><div className="min-h-screen bg-black" /></Layout>;

  return (
    <Layout title={doc.title} description={doc.description || ""}>
      <Head>
        <meta name="robots" content={initialLocked ? "noindex, nofollow" : "index, follow"} />
      </Head>

      <section className="min-h-screen bg-black text-white">
        {/* Header Logic Simplified for brevity - Keep your existing styling */}
        <div className="mx-auto max-w-7xl px-6 py-12">
          <BriefSummaryCard classification={doc.accessLevel} />
          
          <div className="mt-16">
            {!isAuthorized && !isValidating && initialLocked ? (
              <AccessGate
                title={doc.title}
                requiredTier={doc.accessLevel}
                onUnlocked={handleUnlock}
              />
            ) : (
              <div className="relative min-h-[400px]">
                {loadingContent && <Loader2 className="animate-spin text-amber-500 mx-auto" />}
                <div className={loadingContent ? "opacity-20 blur-sm" : "opacity-100 transition-all duration-700"}>
                  <SafeMDXRenderer code={activeCode} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getPublishedDocuments() || [];
  const paths = docs.map((d: any) => ({
    params: { slug: d.slug.replace(/^content\//, "").split("/").filter(Boolean) }
  }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slugParts = Array.isArray(params?.slug) ? params.slug : [params?.slug];
  const incoming = slugParts.join("/");
  const rawDoc = getDocBySlug(`content/${incoming}`) || getDocBySlug(incoming);

  if (!rawDoc || rawDoc.draft) return { notFound: true };

  const accessLevel = (rawDoc.accessLevel || "inner-circle") as Tier;
  const initialLocked = accessLevel !== "public";

  const doc = {
    ...rawDoc,
    slug: incoming,
    bodyCode: initialLocked ? "" : rawDoc.body.code, // ✅ Pre-compiled
  };

  return {
    props: sanitizeData({ doc, initialLocked }),
    revalidate: 1800,
  };
};

export default ContentSlugPage;