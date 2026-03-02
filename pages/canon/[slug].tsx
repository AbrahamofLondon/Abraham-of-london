// pages/canon/[slug].tsx — CORRECTED WITH SSOT TIER FUNCTIONS
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import CanonHero from "@/components/canon/CanonHero";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";

import { getDocBySlug, getAllCanons, sanitizeData } from "@/lib/content/server";
import { resolveDocCoverImage } from "@/lib/content/client-utils";

import tiers, { requiredTierFromDoc, type AccessTier } from "@/lib/access/tiers";

interface Props {
  doc: any;
  requiredTier: AccessTier;
}

function toBareCanonSlug(input: string) {
  const s = String(input || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  // strip canon/ and vault/canon/ repeatedly
  let out = s;
  while (out.toLowerCase().startsWith("canon/")) out = out.slice("canon/".length);
  while (out.toLowerCase().startsWith("vault/canon/")) out = out.slice("vault/canon/".length);
  return out.replace(/^\/+/, "");
}

const CanonSlugPage: NextPage<Props> = ({ doc, requiredTier }) => {
  const { data: session, status } = useSession();

  const [activeCode, setActiveCode] = React.useState<string>(doc.bodyCode || "");
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  // ✅ SSOT: Required tier normalized in REQUIRED context
  const required = tiers.normalizeRequired(requiredTier);
  const needsAuth = required !== "public";

  // ✅ SSOT: User tier normalized in USER context
  const user = tiers.normalizeUser((session?.user as any)?.tier ?? "public");
  const canRead = !needsAuth || (!!session?.user && tiers.hasAccess(user, required));

  const bareSlug = toBareCanonSlug(doc.slug || "");
  const coverImage = doc.coverImage;

  const handleUnlock = async () => {
    if (!needsAuth) return;
    if (!bareSlug) return;

    setUnlockError(null);
    setLoadingContent(true);
    try {
      const res = await fetch(`/api/canon/${encodeURIComponent(bareSlug)}`, { method: "GET" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setUnlockError(json?.reason || "UNLOCK_FAILED");
        return;
      }

      if (typeof json?.bodyCode === "string") {
        setActiveCode(json.bodyCode);
      } else {
        setUnlockError("UNLOCK_PAYLOAD_MISSING");
      }
    } catch {
      setUnlockError("UNLOCK_NETWORK_FAILURE");
    } finally {
      setLoadingContent(false);
    }
  };

  // Only show auth loading for restricted content
  if (needsAuth && status === "loading") {
    return (
      <Layout title={doc.title}>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-amber-500 font-mono text-xs animate-pulse">
            Verifying clearance...
          </div>
        </div>
      </Layout>
    );
  }

  // Gate only when restricted and lacking access
  if (needsAuth && (!session?.user || !canRead)) {
    return (
      <Layout title={doc.title}>
        <div className="min-h-screen bg-black">
          <CanonHero title={doc.title} coverImage={coverImage} />
          <div className="mx-auto max-w-7xl px-6 py-12">
            <BriefSummaryCard classification={required} />
            <div className="mt-16">
              <AccessGate
                title={doc.title}
                requiredTier={required}
                onUnlocked={() => handleUnlock()}
                message={doc.lockMessage || "This canon volume is restricted to members of the appropriate clearance level."}
                onGoToJoin={() => window.location.assign("/inner-circle")}
              />
              {unlockError ? (
                <div className="mt-6 text-center text-[10px] font-mono uppercase tracking-widest text-red-400/90">
                  {unlockError}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Render content (public or authorized)
  return (
    <Layout title={doc.title} description={doc.description || ""}>
      <Head>
        <meta name="robots" content={required === "public" ? "index, follow" : "noindex, nofollow"} />
      </Head>

      <section className="min-h-screen bg-black text-white">
        <CanonHero title={doc.title} coverImage={coverImage} />

        <div className="mx-auto max-w-7xl px-6 py-12">
          <BriefSummaryCard classification={required} />

          <div className="mt-16">
            <div className="relative min-h-[400px]">
              {loadingContent ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="animate-spin text-amber-500 h-8 w-8" />
                </div>
              ) : null}
              <div className={loadingContent ? "opacity-20 pointer-events-none" : "opacity-100"}>
                <SafeMDXRenderer code={activeCode} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const canons = (getAllCanons() || []).filter((d: any) => !d.draft);

  const paths = canons
    .map((d: any) => {
      const raw = String(d.slug || d?._raw?.flattenedPath || "").replace(/^\/+/, "");
      const bare = toBareCanonSlug(raw);
      if (!bare) return null;
      return { params: { slug: bare } };
    })
    .filter(Boolean) as Array<{ params: { slug: string } }>;

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const bare = String(params?.slug || "").trim();
  if (!bare) return { notFound: true };

  // Try all plausible lookups
  const rawDoc =
    getDocBySlug(`canon/${bare}`) ||
    getDocBySlug(`vault/canon/${bare}`) ||
    getDocBySlug(bare);

  if (!rawDoc || rawDoc.draft) return { notFound: true };

  // ✅ SSOT: Use normalizeRequired for document's required tier
  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(rawDoc));
  const locked = requiredTier !== "public";

  const doc = {
    ...rawDoc,
    slug: bare, // keep bare for route + api fetch
    bodyCode: locked ? "" : (rawDoc?.body?.code || rawDoc?.bodyCode || ""),
    coverImage: resolveDocCoverImage(rawDoc),
  };

  return {
    props: sanitizeData({
      doc,
      requiredTier,
    }),
    revalidate: 1800,
  };
};

export default CanonSlugPage;