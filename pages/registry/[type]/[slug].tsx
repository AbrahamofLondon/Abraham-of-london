/* pages/registry/[type]/[slug].tsx — UNIVERSAL REGISTRY DISPATCH (SSOT, BUILD-SAFE, NO PROP MUTATION) */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";

import RegistryLayout from "@/components/layout/RegistryLayout";
import AccessGate from "@/components/AccessGate";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";

import { allPosts, allShorts } from "@/lib/contentlayer";
import { getDocBySlug } from "@/lib/content/unified-router";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type RegistryType = "dispatches" | "shorts";

interface UniversalPageProps {
  metadata: {
    title: string;
    subtitle?: string | null;
    date: string;
    description?: string | null;
    type: RegistryType;
    slug: string; // bare param slug
  };
  requiredTier: AccessTier;
  // Compiled MDX code only for public at build time
  initialBodyCode: string;
}

function normalizeParamSlug(input: unknown): string {
  const s = String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
  if (!s) return "";
  if (s.includes("..")) return "";
  return s.split("/").filter(Boolean).pop() || "";
}

function isRegistryType(v: any): v is RegistryType {
  return v === "dispatches" || v === "shorts";
}

function apiEndpointFor(type: RegistryType, slug: string): string {
  // Your existing convention: /api/<type>/<slug>
  return `/api/${type}/${encodeURIComponent(slug)}`;
}

const UniversalDispatchPage: NextPage<UniversalPageProps> = ({ metadata, requiredTier, initialBodyCode }) => {
  const { data: session, status } = useSession();

  const [bodyCode, setBodyCode] = React.useState<string>(initialBodyCode);
  const [busy, setBusy] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  const required = tiers.normalizeRequired(requiredTier);
  const user = tiers.normalizeUser((session?.user as any)?.tier ?? "public");

  const needsAuth = required !== "public";
  const canAccess = !needsAuth || (session?.user ? tiers.hasAccess(user, required) : false);

  const canonical = `https://www.abrahamoflondon.org/registry/${metadata.type}/${metadata.slug}`;

  const handleUnlock = async () => {
    if (!needsAuth) return;
    setBusy(true);
    setUnlockError(null);

    try {
      const res = await fetch(apiEndpointFor(metadata.type, metadata.slug), { method: "GET" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setUnlockError(json?.reason || "UNLOCK_FAILED");
        return;
      }

      const code = String(json?.bodyCode || "");
      if (!code) {
        setUnlockError("UNLOCK_PAYLOAD_MISSING");
        return;
      }

      // ✅ bodyCode is compiled MDX code: render via SafeMDXRenderer.
      setBodyCode(code);
    } catch {
      setUnlockError("UNLOCK_NETWORK_FAILURE");
    } finally {
      setBusy(false);
    }
  };

  // Only show session loading screen if content is restricted.
  if (needsAuth && status === "loading") {
    return (
      <RegistryLayout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-amber-500 font-mono text-xs animate-pulse">Verifying clearance...</div>
        </div>
      </RegistryLayout>
    );
  }

  if (needsAuth && (!session?.user || !canAccess)) {
    return (
      <RegistryLayout>
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
          <AccessGate
            title={metadata.title}
            requiredTier={required}
            message="This content requires appropriate clearance."
            onUnlocked={() => handleUnlock()}
            onGoToJoin={() => window.location.assign("/inner-circle")}
          />
        </div>
      </RegistryLayout>
    );
  }

  return (
    <RegistryLayout>
      <Head>
        <title>{metadata.title} | Abraham of London</title>
        {metadata.description ? <meta name="description" content={metadata.description} /> : null}
        <meta property="og:title" content={metadata.title} />
        {metadata.description ? <meta property="og:description" content={metadata.description} /> : null}
        <meta property="og:type" content="article" />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content={required === "public" ? "index, follow" : "noindex, nofollow"} />
      </Head>

      <article className="prose prose-invert max-w-none">
        <header className="mb-12 border-b border-white/10 pb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="font-serif text-4xl italic text-white md:text-5xl">{metadata.title}</h1>
            {required !== "public" && (
              <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400">
                {required}
              </span>
            )}
          </div>

          {metadata.subtitle ? (
            <p className="mt-4 font-mono text-lg uppercase tracking-widest text-amber-500/80">{metadata.subtitle}</p>
          ) : null}

          <div className="mt-6 flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            <span>Date: {new Date(metadata.date).toLocaleDateString("en-GB")}</span>
            <span className="h-1 w-1 rounded-full bg-zinc-800" />
            <span>Status: Verified</span>
          </div>
        </header>

        {busy ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}

        {unlockError ? (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {unlockError}
          </div>
        ) : null}

        {bodyCode ? (
          <div className="text-zinc-300">
            <SafeMDXRenderer code={bodyCode} />
          </div>
        ) : (
          <div className="text-center py-12 text-white/30 font-mono text-xs uppercase tracking-widest">
            No content available
          </div>
        )}
      </article>
    </RegistryLayout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const dispatches = allPosts
    .filter((p: any) => !p.draft)
    .map((p: any) => ({
      params: {
        type: "dispatches",
        slug: normalizeParamSlug(p.slugAsParams || p._raw?.flattenedPath?.split("/").pop()),
      },
    }))
    .filter((p: any) => p.params.slug);

  const shorts = allShorts
    .filter((s: any) => !s.draft)
    .map((s: any) => ({
      params: {
        type: "shorts",
        slug: normalizeParamSlug(s.slugAsParams || s._raw?.flattenedPath?.split("/").pop()),
      },
    }))
    .filter((p: any) => p.params.slug);

  return { paths: [...dispatches, ...shorts], fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<UniversalPageProps> = async ({ params }) => {
  const typeRaw = String(params?.type ?? "");
  const slugRaw = normalizeParamSlug(params?.slug);

  if (!isRegistryType(typeRaw) || !slugRaw) return { notFound: true, revalidate: 60 };

  // IMPORTANT: your unified-router must resolve correctly using type + slug.
  // If it needs a prefix, do it here.
  const docRaw: any = getDocBySlug(`${typeRaw}/${slugRaw}`) || getDocBySlug(slugRaw);

  if (!docRaw || docRaw.draft) return { notFound: true, revalidate: 60 };

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(docRaw));
  const isPublic = requiredTier === "public";

  // Only include compiled code at build time for public docs
  const initialBodyCode = isPublic ? String(docRaw?.body?.code || docRaw?.bodyCode || "") : "";

  return {
    props: {
      metadata: {
        title: String(docRaw?.title || "Untitled Intelligence"),
        subtitle: docRaw?.subtitle ? String(docRaw.subtitle) : null,
        date: String(docRaw?.date || new Date().toISOString()),
        description: docRaw?.description ? String(docRaw.description) : null,
        type: typeRaw,
        slug: slugRaw,
      },
      requiredTier,
      initialBodyCode,
    },
    revalidate: 1800,
  };
};

export default UniversalDispatchPage;