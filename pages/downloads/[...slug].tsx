/* pages/downloads/[...slug].tsx — INSTITUTIONAL DOWNLOAD DETAIL (SSOT, SAFE UNLOCK)
   - Supports nested slugs (catch-all)
   - Uses filesystem MDX (mdx-collections) + next-mdx-remote compile
   - Preserves your premium UI structure
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Lock,
  Download as DownloadIcon,
  Calendar,
  FileText,
  AlertCircle,
  Shield,
} from "lucide-react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import mdxComponents from "@/components/mdx-components";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";
import { sanitizeData } from "@/lib/content/shared";

import { getMdxDocumentBySlug, type MdxDocument } from "@/lib/server/mdx-collections";

// next-mdx-remote (Pages Router)
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

type Props = {
  download: any;
  isPublic: boolean;
  requiredTier: AccessTier;
  slug: string;
  mdxSource: MDXRemoteSerializeResult | null;
};

function joinParamSlug(input: unknown): string {
  if (!input) return "";
  const raw = Array.isArray(input) ? input.join("/") : String(input);
  return raw
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function safeSlug(input: unknown): string {
  const s = joinParamSlug(input);
  if (!s) return "";
  // prevent traversal
  if (s.includes("..")) return "";
  // prevent protocol injection
  if (s.includes("://")) return "";
  return s;
}

function normalizeDownloadUrl(url: unknown): string | null {
  const u = typeof url === "string" ? url.trim() : "";
  if (!u) return null;
  if (u.includes("..")) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return u.startsWith("/") ? u : `/${u}`;
}

async function compileMdx(content: string): Promise<MDXRemoteSerializeResult> {
  // You can add remark/rehype plugins later if you want.
  return serialize(content, {
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
      format: "mdx",
    },
  });
}

const DownloadSlugPage: NextPage<Props> = ({ download, isPublic, requiredTier, mdxSource, slug }) => {
  const { data: session, status } = useSession();
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(mdxSource);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const required = tiers.normalizeRequired(requiredTier);
  const user = tiers.normalizeUser((session?.user as any)?.tier ?? "public");

  const needsAuth = required !== "public";
  const canRead = !needsAuth || (session?.user ? tiers.hasAccess(user, required) : false);

  const downloadHref =
    normalizeDownloadUrl(download?.downloadUrl) ||
    normalizeDownloadUrl(download?.fileUrl) ||
    normalizeDownloadUrl(download?.file);

  const handleUnlock = async () => {
    setBusy(true);
    setError(null);

    try {
      // ✅ Use the existing MDX API endpoint pattern (query-based) to avoid catch-all API work.
      // If you already have a different endpoint, change only this URL.
      const res = await fetch(`/api/downloads/mdx?slug=${encodeURIComponent(slug)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json().catch(() => ({}));

      // Expecting: { ok: true, content: string, meta: {...} } OR { ok: true, body: string }
      if (!res.ok || !json?.ok) {
        setError(json?.reason || json?.error?.message || "UNLOCK_FAILED");
        return;
      }

      const mdx = String(json?.content || json?.body || "");
      if (!mdx) {
        setError("UNLOCK_PAYLOAD_MISSING");
        return;
      }

      // Server already returned raw MDX => compile in browser? NO.
      // ✅ Compile on server? Better. But if this endpoint returns raw MDX only,
      // we can still compile client-side as a fallback using a dynamic import.
      // To keep it stable, we’ll just re-fetch a server-rendered page (hard refresh)
      // OR we can add a compiled payload later.
      //
      // For now: safest UX is: navigate to same URL (SSR will serve content)
      window.location.reload();
    } catch {
      setError("UNLOCK_NETWORK_FAILURE");
    } finally {
      setBusy(false);
    }
  };

  if (needsAuth && status === "loading") {
    return (
      <Layout title={download?.title || "Download"}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="text-amber-500 font-mono text-xs animate-pulse">Verifying clearance...</div>
        </div>
      </Layout>
    );
  }

  if (needsAuth && (!session?.user || !canRead)) {
    return (
      <Layout title={download?.title || "Download"}>
        <div className="min-h-screen bg-zinc-950">
          <div className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <Link
                href="/downloads"
                className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-amber-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Vault
              </Link>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
            <AccessGate
              title={download?.title || "Restricted Asset"}
              requiredTier={required}
              message={`This asset requires ${required} clearance.`}
              onUnlocked={handleUnlock}
              onGoToJoin={() => window.location.assign("/inner-circle")}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={download?.title || "Download"}>
      <Head>
        <title>{download?.title || "Download"} | Vault | Abraham of London</title>
        <meta name="robots" content={isPublic ? "index,follow" : "noindex,nofollow"} />
        <link rel="canonical" href={`https://www.abrahamoflondon.org/downloads/${slug}`} />
      </Head>

      <div className="min-h-screen bg-zinc-950 text-white selection:bg-amber-500/30">
        <div className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Link
              href="/downloads"
              className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-amber-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Vault
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-16">
            <main className="lg:col-span-8 space-y-12">
              <header>
                <div className="flex items-center gap-4 mb-6">
                  <span className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-mono uppercase tracking-widest">
                    {download?.classification || "Unclassified"}
                  </span>
                  <span className="text-zinc-600 text-[9px] font-mono uppercase tracking-widest">
                    {download?.readTime || download?.readTimeSafe || ""}
                  </span>
                  {required !== "public" && (
                    <span className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-mono uppercase tracking-widest">
                      <Lock className="inline w-3 h-3 mr-1" /> {required}
                    </span>
                  )}
                </div>

                <h1 className="text-4xl md:text-6xl font-serif italic font-bold leading-tight">
                  {download?.title || "Untitled Download"}
                </h1>

                {download?.excerpt && (
                  <p className="mt-8 text-xl text-zinc-400 font-light leading-relaxed border-l border-amber-500/30 pl-8">
                    {download.excerpt}
                  </p>
                )}
              </header>

              <section className="relative min-h-[220px]">
                {busy && (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm justify-center">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                {source ? (
                  <article className="prose prose-invert prose-amber max-w-none">
                    <MDXRemote {...source} components={mdxComponents as any} />
                  </article>
                ) : (
                  <div className="text-zinc-400 text-sm">
                    No content available.
                  </div>
                )}
              </section>
            </main>

            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-zinc-900/80 border border-white/5 rounded-3xl p-8 sticky top-32">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-8">Asset Intel</h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 flex items-center gap-2 uppercase tracking-tighter">
                      <Calendar className="w-4 h-4" /> Released
                    </span>
                    <span className="font-medium">{download?.date || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 flex items-center gap-2 uppercase tracking-tighter">
                      <FileText className="w-4 h-4" /> Version
                    </span>
                    <span className="font-medium">{download?.version || download?.volumeNumber || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 flex items-center gap-2 uppercase tracking-tighter">
                      <Shield className="w-4 h-4" /> Clearance
                    </span>
                    <span className="text-amber-500 font-mono uppercase">{required}</span>
                  </div>
                </div>

                {downloadHref ? (
                  <a
                    href={downloadHref}
                    className="mt-10 flex items-center justify-center gap-3 w-full py-4 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-black transition-all"
                  >
                    <DownloadIcon className="w-4 h-4" /> Obtain PDF Archive
                  </a>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = safeSlug((params as any)?.slug);
  if (!slug) return { notFound: true };

  // ✅ Reads from content/downloads/** via your filesystem loader
  const doc: MdxDocument | null = await getMdxDocumentBySlug("downloads", slug);
  if (!doc) return { notFound: true };

  // draft/published logic (tolerant)
  const isDraft = (doc as any).draft === true || (doc as any).published === false;
  if (isDraft) return { notFound: true };

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc as any));
  const isPublic = requiredTier === "public";

  // ✅ Compile raw MDX -> renderable payload for pages router
  const mdxSource = isPublic ? await compileMdx(String((doc as any).content || "")) : null;

  // Shape compatible with your UI expectations
  const download = {
    ...doc,
    title: (doc as any).title || "Untitled Download",
    excerpt: (doc as any).excerpt || (doc as any).description || null,
    classification: (doc as any).classification || (doc as any).category || null,
    readTimeSafe: (doc as any).readTimeSafe || (doc as any).readTime || null,
    downloadUrl: (doc as any).downloadUrl || (doc as any).fileUrl || (doc as any).file || null,
  };

  return {
    props: sanitizeData({
      download,
      isPublic,
      requiredTier,
      slug,
      mdxSource,
    }),
  };
};

export default DownloadSlugPage;