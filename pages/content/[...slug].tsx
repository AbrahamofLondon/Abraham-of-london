/* pages/content/[...slug].tsx — REIFIED FOR CONTENTLAYER2 */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react"; // ✅ CORRECT for pages router
import { ArrowLeft, Calendar, Loader2, Tag, FileText, Shield, Lock } from "lucide-react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";

import { useClientRouter } from "@/lib/router/useClientRouter";
import { getPublishedDocuments, getDocBySlug, normalizeSlug, sanitizeData } from "@/lib/content/server";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers"; // ✅ SSOT import
import type { AccessTier } from "@/lib/access/tiers";

interface Props {
  doc: any;
  initialLocked: boolean;
  requiredTier: AccessTier;
}

const ContentSlugPage: NextPage<Props> = ({ doc, initialLocked, requiredTier }) => {
  const router = useClientRouter();
  const { data: session, status } = useSession(); // ✅ useSession hook
  
  const [activeCode, setActiveCode] = React.useState<string>(doc.bodyCode || "");
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ FIX: Use correct normalizers
  const required = tiers.normalizeRequired(requiredTier);
  const user = tiers.normalizeUser(session?.user?.tier ?? "public");

  const needsAuth = required !== "public";
  const canAccess = tiers.hasAccess(user, required);

  const handleUnlock = async () => {
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

  if (!mounted || !router || status === "loading") {
    return (
      <Layout title={doc?.title || "Content"}>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-amber-500 font-mono text-xs animate-pulse">Verifying clearance...</div>
        </div>
      </Layout>
    );
  }

  if (needsAuth && (!session?.user || !canAccess)) {
    return (
      <Layout title={doc?.title || "Restricted Content"}>
        <div className="min-h-screen bg-black">
          <div className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="mx-auto max-w-7xl px-6 py-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors group text-sm"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                <span className="font-mono text-[10px] uppercase tracking-widest">Back</span>
              </button>
            </div>
          </div>
          <div className="mx-auto max-w-7xl px-6 py-12">
            <AccessGate
              title={doc?.title || "Restricted Content"}
              requiredTier={required}
              message="This content requires appropriate clearance."
              onUnlocked={handleUnlock}
              onGoToJoin={() => router.push("/inner-circle")}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={doc?.title || "Content"} description={doc?.description || ""}>
      <Head>
        <meta name="robots" content={initialLocked ? "noindex, nofollow" : "index, follow"} />
      </Head>

      <section className="min-h-screen bg-black text-white">
        {/* Navigation */}
        <div className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors group text-sm"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
              <span className="font-mono text-[10px] uppercase tracking-widest">Back</span>
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-12">
          {/* Header metadata */}
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="h-[1px] w-12 bg-amber-800/50" />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-700/80">
                {doc?.category || "CONTENT"} // {required}
              </span>
              {required !== "public" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 border border-amber-800/30 bg-amber-950/20 rounded-full text-amber-400/80 text-[8px] font-mono">
                  <Lock size={10} /> {required}
                </span>
              )}
            </div>
            <h1 className="font-serif text-4xl md:text-6xl text-white/95 leading-tight mb-4">
              {doc?.title || "Untitled"}
            </h1>
            {doc?.excerpt && (
              <p className="text-lg text-white/60 max-w-3xl border-l border-amber-900/40 pl-6">
                {doc.excerpt}
              </p>
            )}
            <div className="mt-6 flex items-center gap-6 text-[10px] font-mono text-white/30">
              {doc?.date && (
                <span className="flex items-center gap-2">
                  <Calendar size={12} /> {new Date(doc.date).toLocaleDateString()}
                </span>
              )}
              {doc?.readTime && (
                <span className="flex items-center gap-2">
                  <FileText size={12} /> {doc.readTime}
                </span>
              )}
              {Array.isArray(doc?.tags) && doc.tags.length > 0 && (
                <span className="flex items-center gap-2">
                  <Tag size={12} /> {doc.tags[0]}
                </span>
              )}
            </div>
          </header>

          <BriefSummaryCard classification={required} />
          
          <div className="mt-16">
            {loadingContent && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <span className="ml-3 text-amber-500 font-mono text-xs uppercase tracking-widest">
                  Decrypting content...
                </span>
              </div>
            )}
            
            <div className={loadingContent ? "opacity-20 blur-sm pointer-events-none" : "opacity-100 transition-all duration-700"}>
              <SafeMDXRenderer code={activeCode} />
            </div>

            {/* Footer */}
            <footer className="mt-20 pt-8 border-t border-white/5">
              <div className="text-center">
                <p className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.3em]">
                  ABRAHAM OF LONDON // INSTITUTIONAL CONTENT VAULT
                </p>
                {doc?.classification && (
                  <span className="mt-4 inline-block text-[8px] font-mono text-amber-900/60 border border-amber-900/30 px-3 py-1.5 rounded-full">
                    CLASSIFICATION: {String(doc.classification)}
                  </span>
                )}
              </div>
            </footer>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getPublishedDocuments() || [];
  
  const paths = docs
    .filter((d: any) => d && d.slug)
    .map((d: any) => {
      const slug = String(d.slug || "");
      const cleanSlug = slug.replace(/^content\//, "").split("/").filter(Boolean);
      return {
        params: { slug: cleanSlug }
      };
    });

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slugParts = Array.isArray(params?.slug) ? params.slug : [params?.slug];
  const incoming = slugParts.join("/");
  const rawDoc = getDocBySlug(`content/${incoming}`) || getDocBySlug(incoming);

  if (!rawDoc || rawDoc.draft) return { notFound: true };

  // ✅ FIX: Use normalizeRequired for content tiers
  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(rawDoc));
  const initialLocked = requiredTier !== "public";

  const doc = {
    ...rawDoc,
    slug: incoming,
    bodyCode: initialLocked ? "" : rawDoc.body?.code || "",
  };

  return {
    props: sanitizeData({ 
      doc, 
      initialLocked,
      requiredTier
    }),
    revalidate: 1800,
  };
};

export default ContentSlugPage;