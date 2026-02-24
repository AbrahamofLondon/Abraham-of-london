/* pages/canon/[slug].tsx — REIFIED FOR CONTENTLAYER2 */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import CanonHero from "@/components/canon/CanonHero";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer"; // ✅ UPDATED

import { useAccess, type Tier } from "@/hooks/useAccess";
import { getDocBySlug, getAllCanons, sanitizeData } from "@/lib/content/server";
import { joinHref, normalizeSlug as normalizeSlugShared } from "@/lib/content/shared";
import { resolveDocCoverImage } from "@/lib/content/client-utils";

interface Props {
  doc: any;
  initialLocked: boolean;
}

const CanonSlugPage: NextPage<Props> = ({ doc, initialLocked }) => {
  const { hasClearance, verify, isValidating } = useAccess();
  const [mounted, setMounted] = React.useState(false);
  const [activeCode, setActiveCode] = React.useState<string>(doc.bodyCode);
  const [loadingContent, setLoadingContent] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  const isAuthorized = hasClearance(doc.accessLevel);

  const handleUnlock = async () => {
    verify();
    if (initialLocked) {
      setLoadingContent(true);
      try {
        const res = await fetch(`/api/canon/${encodeURIComponent(doc.slug)}`);
        const json = await res.json();
        if (res.ok && json.bodyCode) setActiveCode(json.bodyCode);
      } catch (err) {
        console.error("Transmission Error", err);
      } finally {
        setLoadingContent(false);
      }
    }
  };

  if (!mounted) return <div className="min-h-screen bg-black" />;

  return (
    <Layout title={doc.title} description={doc.description || ""}>
      <Head>
        <meta name="robots" content={initialLocked ? "noindex, nofollow" : "index, follow"} />
      </Head>

      <section className="min-h-screen bg-black text-white">
        <CanonHero title={doc.title} coverImage={doc.coverImage} />

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
                <div className={loadingContent ? "opacity-20" : "opacity-100"}>
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
  const canons = getAllCanons().filter((d: any) => !d.draft);
  const paths = canons.map((d: any) => ({
    params: { slug: d.slug.replace(/^canon\//, "") }
  }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const bare = String(params?.slug || "");
  const rawDoc = getDocBySlug(`canon/${bare}`) || getDocBySlug(bare);

  if (!rawDoc || rawDoc.draft) return { notFound: true };

  const accessLevel = (rawDoc.accessLevel || "inner-circle") as Tier;
  const initialLocked = accessLevel !== "public";

  const doc = {
    ...rawDoc,
    slug: bare,
    bodyCode: initialLocked ? "" : rawDoc.body.code,
    coverImage: resolveDocCoverImage(rawDoc),
  };

  return {
    props: sanitizeData({ doc, initialLocked }),
    revalidate: 1800,
  };
};

export default CanonSlugPage;