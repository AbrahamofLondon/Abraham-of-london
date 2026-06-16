/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/vault/briefs/[slug].tsx

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronLeft, ShieldCheck, Terminal, Loader2 } from "lucide-react";

import dynamic from "next/dynamic";
import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
const ClientOnlyMDXRenderer = dynamic(() => import("@/components/mdx/ClientOnlyMDXRenderer"), { ssr: false });
import ReaderFrame from "@/components/reader/ReaderFrame";
import ReaderHeader from "@/components/reader/ReaderHeader";
import ReaderBody from "@/components/reader/ReaderBody";
import Note from "@/components/mdx/Note";
import BriefAlert from "@/components/mdx/BriefAlert";
import DocumentFooter from "@/components/mdx/DocumentFooter";
import DocumentHeader from "@/components/mdx/DocumentHeader";
import Callout from "@/components/mdx/Callout";
import Quote from "@/components/mdx/Quote";
import DataTable from "@/components/mdx/DataTable";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";

import { normalizeSlug as normalizeContentSlug } from "@/lib/content/shared";
import { getRenderableBody } from "@/lib/content/render-body";
import { decodeBodyCodePayload } from "@/lib/content/client-codec";
import {
  absoluteBriefCoverForVaultSlug,
  briefCoverAltForVaultSlug,
  briefCoverPathForVaultSlug,
  getVaultBriefHref,
  getVaultBriefSlug,
  isVaultBriefSource,
  resolveVaultAliasRedirect,
  vaultBriefSlugForDoc,
} from "@/lib/content/brief-routes";

import type { TierDirective } from "@/lib/resources/tier-metadata";
import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

type BriefRecommendation = {
  slug: string;
  title: string;
  href: string;
};

type Props = {
  brief: any;
  recommendations: BriefRecommendation[];
  requiredTier: AccessTier;
  bareSlug: string;
  bodyEmpty?: boolean;
};

function safeString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  return String(v);
}

function safeArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function cleanPathish(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function stripPrefixOnce(source: string, prefix: string): string {
  const normalizedPrefix = `${prefix.toLowerCase()}/`;
  if (source.toLowerCase().startsWith(normalizedPrefix)) {
    return source.slice(normalizedPrefix.length).replace(/^\/+/, "");
  }
  return source;
}

function briefsBareSlug(input: unknown): string {
  return getVaultBriefSlug(normalizeContentSlug(safeString(input)));
}

function isBriefDoc(doc: any): boolean {
  return isVaultBriefSource(doc);
}

function readGeneratedIndexJson(typeDir: string): any[] {
  try {
    const req = eval("require") as NodeRequire;
    const fs = req("fs") as typeof import("fs");
    const path = req("path") as typeof import("path");
    const indexPath = path.join(
      process.cwd(),
      ".contentlayer",
      "generated",
      typeDir,
      "_index.json",
    );

    if (!fs.existsSync(indexPath)) return [];

    const parsed = JSON.parse(fs.readFileSync(indexPath, "utf8")) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getVaultBriefDocs(): any[] {
  const seen = new Set<string>();

  return readGeneratedIndexJson("VaultBrief")
    .filter((doc: any) => doc && typeof doc === "object" && !doc?.draft)
    .filter(isBriefDoc)
    .filter((doc: any) => {
      const key = safeString(
        doc?._id || doc?._raw?.flattenedPath || doc?.slug,
      ).toLowerCase();

      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function getCombinedBriefs(): Promise<any[]> {
  return getVaultBriefDocs();
}

function looksLikeLeakedModuleCode(code: string): boolean {
  const s = safeString(code).trim();
  if (!s) return false;

  return (
    /\bObject\.defineProperty\s*\(\s*exports\b/.test(s) ||
    /\bmodule\.exports\b/.test(s) ||
    /\bexports\.[A-Za-z_$]/.test(s) ||
    /\b__esModule\b/.test(s) ||
    /\brequire\s*\(/.test(s) ||
    /\bjsx_runtime\b/.test(s) ||
    /\bvar\s+\w+\s*=\s*Object\.create/.test(s)
  );
}

// Retained wrapper: prefers getRenderableBody result, falls back to direct
// access only as last resort. Called from getStaticProps with renderBody
// from getRenderableBody(). Safe because SafeMDXRenderer governs downstream.
function pickRenderableBriefCode(doc: any, renderBody?: any): string {
  const compiled =
    safeString(renderBody?.code) ||
    safeString(doc?.body?.code) ||
    safeString(doc?.bodyCode);

  const raw =
    safeString(renderBody?.raw) ||
    safeString(doc?.body?.raw) ||
    safeString(doc?.content);

  if (compiled && !looksLikeLeakedModuleCode(compiled)) {
    return compiled;
  }

  if (raw) {
    return raw;
  }

  return compiled || "";
}

function getMdxComponents(directive?: TierDirective) {
  // Vault reader: typography is controlled by .vault-reader CSS class.
  // Only override structural/custom MDX components and link routing here.
  return {
    a: ({ href, children, ...props }: any) => {
      const rawHref = safeString(href);
      const normalizedHref = rawHref.includes("brief")
        ? `/vault/briefs/${briefsBareSlug(rawHref)}`
        : rawHref;

      return (
        <Link
          href={normalizedHref || "#"}
          {...props}
        >
          {children}
        </Link>
      );
    },
    Note: (p: any) => <Note {...p} />,
    BriefAlert: (p: any) => <BriefAlert {...p} />,
    Callout: (p: any) => <Callout {...p} />,
    Quote: (p: any) => <Quote {...p} />,
    DataTable: (p: any) => <DataTable {...p} />,
    DocumentHeader: (p: any) => <DocumentHeader {...p} />,
    DocumentFooter: (p: any) => <DocumentFooter {...p} directive={directive} />,
  };
}

const BriefPage: NextPage<Props> = ({
  brief,
  recommendations,
  requiredTier,
  bareSlug,
  bodyEmpty,
}) => {
  const { data: session, status } = useSession();

  const title = safeString(brief?.title) || "Untitled Brief";
  const summary =
    safeString(brief?.summary) ||
    safeString(brief?.abstract) ||
    safeString(brief?.excerpt);
  const coverImage = safeString(brief?.coverImage) || briefCoverPathForVaultSlug(bareSlug);
  const coverUrl = absoluteBriefCoverForVaultSlug(bareSlug);
  const coverAlt = briefCoverAltForVaultSlug(bareSlug);

  const required = normalizeRequiredTier(requiredTier);
  const needsAuth = required !== "public";

  const userTier = normalizeUserTier(
    (session?.user as any)?.tier ??
      (session as any)?.aol?.tier ??
      "public",
  );

  const canRead = !needsAuth || (!!session?.user && hasAccess(userTier, required));
  const directive = (session?.user as any)?.directive as TierDirective | undefined;

  const [activeCode, setActiveCode] = React.useState<string>(
    requiredTier === "public" ? safeString(brief?.bodyCode) : "",
  );
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  // Guards the one-shot auto-unlock below so a failed fetch cannot re-fire.
  const autoUnlockAttempted = React.useRef(false);

  const mdxComponents = React.useMemo(
    () => getMdxComponents(directive),
    [directive],
  );

  const handleUnlock = React.useCallback(async () => {
    if (!needsAuth || !bareSlug) return;

    setUnlockError(null);
    setLoadingContent(true);

    try {
      const res = await fetch(`/api/briefs/${encodeURIComponent(bareSlug)}`, {
        method: "GET",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setUnlockError(json?.reason || "UNLOCK_FAILED");
        return;
      }

      const decoded = decodeBodyCodePayload(json);
      const raw = safeString((json as any)?.body?.raw || (json as any)?.content);
      const nextCode =
        decoded.trim() && !looksLikeLeakedModuleCode(decoded) ? decoded : raw;

      if (nextCode.trim()) {
        setActiveCode(nextCode);
      } else {
        setUnlockError("UNLOCK_PAYLOAD_MISSING");
      }
    } catch {
      setUnlockError("UNLOCK_NETWORK_FAILURE");
    } finally {
      setLoadingContent(false);
    }
  }, [bareSlug, needsAuth]);

  // Pre-authorized readers bypass <AccessGate>, but gated bodyCode was stripped
  // in getStaticProps — without this, activeCode stays "" and the reader renders
  // empty. Fetch the secured payload exactly once when authenticated + cleared.
  React.useEffect(() => {
    if (
      needsAuth &&
      session?.user &&
      canRead &&
      !activeCode &&
      !autoUnlockAttempted.current
    ) {
      autoUnlockAttempted.current = true;
      void handleUnlock();
    }
  }, [needsAuth, session?.user, canRead, activeCode, handleUnlock]);

  if (needsAuth && status === "loading") {
    return (
      <Layout title={title}>
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="animate-pulse font-mono text-xs text-amber-500">
            Verifying clearance...
          </div>
        </div>
      </Layout>
    );
  }

  if (bodyEmpty && !needsAuth) {
    return (
      <Layout title={title} description="This record is under institutional review.">
        <div className="flex min-h-screen items-center justify-center bg-black px-6">
          <div className="max-w-md text-center">
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-amber-500/60">
              Abraham of London · Vault
            </p>
            <h1 className="mt-4 font-serif text-3xl italic text-white/80">{title}</h1>
            <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
              Under Institutional Review
            </p>
            <p className="mt-3 text-xs leading-relaxed text-white/20">
              This record exists in the governed estate but its body has not been
              cleared for public rendering. Contact the administration if you believe
              this is in error.
            </p>
            <Link
              href="/vault/briefs"
              className="mt-8 inline-block font-mono text-[9px] uppercase tracking-[0.3em] text-amber-500/50 transition-colors hover:text-amber-500"
            >
              ← Return to Index
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (needsAuth && (!session?.user || !canRead)) {
    return (
      <Layout title={title}>
        <div className="min-h-screen bg-black text-white">
          <section className="mx-auto max-w-7xl px-6 pb-24 pt-24">
            <div className="mb-12 flex items-center justify-between border-b border-white/5 pb-8">
              <Link
                href="/vault/briefs"
                className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-white/50 transition-all hover:text-white"
              >
                <ChevronLeft size={12} /> Return to Index
              </Link>

              <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1">
                <ShieldCheck size={10} className="text-amber-500" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-amber-500/80">
                  {required} Clearance
                </span>
              </div>
            </div>

            <header className="mb-16">
              <div className="mb-6 flex items-center gap-3">
                <Terminal size={14} className="text-amber-500" />
                <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/56">
                  Intelligence Dossier
                </span>
              </div>

              <h1 className="mb-8 font-serif text-5xl italic leading-tight md:text-7xl">
                {title}
              </h1>

              {summary ? (
                <p className="max-w-3xl border-l-2 border-amber-500/20 pl-8 text-xl font-light italic leading-relaxed text-white/65">
                  {summary}
                </p>
              ) : null}
            </header>

            <BriefSummaryCard classification={required} />

            <div className="mt-16">
              <AccessGate
                title={title}
                requiredTier={required}
                isAuthenticated={!!session?.user}
                onUnlocked={handleUnlock}
                message={
                  safeString(brief?.lockMessage) ||
                  "This briefing requires appropriate access."
                }
              />

              {unlockError ? (
                <div className="mt-6 text-center text-[10px] font-mono uppercase tracking-widest text-red-400/90">
                  {unlockError}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${title} // Briefing`} className="bg-black text-white">
      <Head>
        <title>{title} // Briefing</title>
        {summary ? <meta name="description" content={summary} /> : null}
        <meta
          name="robots"
          content={required === "public" ? "index, follow" : "noindex, nofollow"}
        />
        <meta property="og:image" content={coverUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={coverAlt} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={coverUrl} />
        <meta name="twitter:image:alt" content={coverAlt} />
      </Head>

      <ReaderFrame surface="vault">
        {/* Nav bar */}
        <div className="mx-auto max-w-5xl px-6 pt-32">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-white/5 pb-6 md:flex-row md:items-center">
            <Link
              href="/vault/briefs"
              className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-white/50 transition-all hover:text-white"
            >
              <ChevronLeft size={12} /> Return to Index
            </Link>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">
                <ShieldCheck size={10} className="text-emerald-500" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-500/80">
                  {required} Clearance
                </span>
              </div>
              <div className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-white/44 md:block">
                REF_ID: {bareSlug.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <ReaderHeader
          surface="vault"
          title={title}
          subtitle={summary || undefined}
        />

        {coverImage ? (
          <div className="mx-auto mb-8 max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/40 px-6">
            <img
              src={coverImage}
              alt={title}
              className="h-auto w-full rounded-2xl object-cover"
            />
          </div>
        ) : null}

        <div className="relative min-h-[400px] pb-24">
          {loadingContent ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : null}

          <div className={loadingContent ? "pointer-events-none opacity-20" : "opacity-100"}>
            <ReaderBody surface="vault">
              <ClientOnlyMDXRenderer
                code={activeCode}
                components={mdxComponents as any}
                directive={directive}
              />
            </ReaderBody>
          </div>
        </div>

        {safeArray(recommendations).length > 0 ? (
          <div className="mx-auto mt-24 max-w-5xl border-t border-white/5 px-6 pt-12">
            <h3 className="mb-6 text-[10px] font-mono uppercase tracking-[0.3em] text-white/56">
              Related Briefs
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              {recommendations.map((item) => (
                <Link
                  key={item.slug}
                  href={item.href}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="text-[10px] font-mono uppercase tracking-widest text-amber-500/70">
                    Recommendation
                  </div>
                  <div className="mt-3 font-serif text-lg italic text-white">
                    {item.title}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {/* P1 — Canon-to-diagnostic CTA: Rise-Decay Scorecard */}
        {bareSlug.startsWith("brief-") ? (
          <div className="mx-auto mt-12 max-w-5xl border-t border-white/5 px-6 pt-12">
            <div className="border px-5 py-4" style={{ borderColor: "rgba(201,169,110,0.22)", backgroundColor: "rgba(201,169,110,0.06)" }}>
              <p className="font-mono text-[8px] uppercase tracking-[0.2em]" style={{ color: "#C9A96E" }}>
                Measure Your Institution Against This Standard
              </p>
              <p className="mt-2 text-sm leading-7 text-white/50">
                The Rise-Decay Scorecard measures structural drift across authority, capital, culture, and recovery readiness against the Canon standard.
              </p>
              <Link
                href="/inner-circle/tools/rise-decay-scorecard"
                className="mt-4 inline-flex min-h-10 items-center gap-2 border px-5 py-2.5 text-[9px] uppercase tracking-[0.15em] transition hover:-translate-y-0.5"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", borderColor: "rgba(201,169,110,0.27)", color: "white", backgroundColor: "rgba(201,169,110,0.08)" }}
              >
                Start Rise-Decay Scorecard →
              </Link>
            </div>
          </div>
        ) : null}

        {/* P2 — Related and Next Brief navigation */}
        <div className="mx-auto mt-12 max-w-5xl border-t border-white/5 px-6 pt-12">
          <div className="grid gap-4 md:grid-cols-2">
            {(() => {
              const href = getVaultBriefHref(brief?.nextBrief);
              return href ? (
              <Link
                href={href}
                className="border p-5 transition-colors hover:bg-white/[0.02]"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              >
                <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/30">Next Brief</p>
                <p className="mt-2 font-serif text-lg italic text-white/70">{brief.nextBriefTitle || briefsBareSlug(brief.nextBrief).replace(/-/g, " ")}</p>
              </Link>
              ) : null;
            })()}
            {brief?.relatedBriefs && brief.relatedBriefs.length > 0 ? (
              <div className="border p-5" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/30">Related Briefs</p>
                <div className="mt-2 space-y-2">
                  {brief.relatedBriefs.slice(0, 3).map((rb: string) => {
                    const href = getVaultBriefHref(rb);
                    if (!href) return null;
                    return (
                      <Link
                        key={rb}
                        href={href}
                        className="block font-serif text-base italic text-white/60 transition hover:text-white/80"
                      >
                        {briefsBareSlug(rb).replace(/-/g, " ")}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mx-auto mt-24 flex max-w-5xl flex-col gap-12 border-t border-white/5 px-6 pb-24 pt-12 text-white/44 md:flex-row">
          <div className="flex-1">
            <h4 className="mb-4 text-[10px] font-mono uppercase tracking-widest text-white/56">
              Metadata Verification
            </h4>
            <p className="font-mono text-[9px] leading-relaxed">
              Source: {safeString(brief?.series) || "Abraham of London Intelligence"}
              <br />
              Protocol: Secure SSG Hydration
              <br />
              Timestamp: {new Date().toISOString()}
            </p>
          </div>
          <div className="flex-1 text-right">
            <span className="text-[8px] font-mono uppercase tracking-tighter opacity-50">
              All Rights Reserved // Abraham of London // 2026
            </span>
          </div>
        </div>
      </ReaderFrame>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const briefs = await getCombinedBriefs();

  const paths = briefs
    .map((doc: any) => {
      const bare = vaultBriefSlugForDoc(doc);
      if (!bare) return null;
      return { params: { slug: bare } };
    })
    .filter(Boolean) as Array<{ params: { slug: string } }>;

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const requestedBare = briefsBareSlug(params?.slug);
  if (!requestedBare) return { notFound: true };

  const aliasResolution = resolveVaultAliasRedirect(requestedBare);
  if (aliasResolution.shouldRedirect) {
    return {
      redirect: {
        destination: getVaultBriefHref(aliasResolution.canonicalSlug) || "/vault/briefs",
        permanent: true,
      },
    };
  }

  const bare = aliasResolution.canonicalSlug;

  const { sanitizeData } = await import("@/lib/content/server");
  const docs = await getCombinedBriefs();

  const rawDoc =
    docs.find((doc: any) => {
      const flattened = vaultBriefSlugForDoc(doc);
      const slug = vaultBriefSlugForDoc({ slug: doc?.slug });
      return flattened === bare || slug === bare;
    }) || null;

  if (!rawDoc || rawDoc?.draft) {
    return { notFound: true };
  }

  const requiredTier = normalizeRequiredTier(requiredTierFromDoc(rawDoc));
  const locked = requiredTier !== "public";

  const renderBody = getRenderableBody(rawDoc);
  const bodyCode = locked ? "" : pickRenderableBriefCode(rawDoc, renderBody);
  const bodyEmpty = !locked && (renderBody.mode === "empty" || renderBody.mode === "suspicious" || !bodyCode.trim());

  const recommendations: BriefRecommendation[] = docs
    .filter((doc: any) => {
      const docBare = vaultBriefSlugForDoc(doc);
      return docBare && docBare !== bare;
    })
    .slice(0, 3)
    .map((doc: any) => {
      const slug = vaultBriefSlugForDoc(doc);
      const href = getVaultBriefHref(slug);
      if (!slug || !href) return null;
      return {
      slug,
      href,
      title: safeString(doc?.title) || "Untitled Brief",
      };
    })
    .filter((item): item is BriefRecommendation => item !== null);

  // Strip body (raw MDX source + compiled code) before serialising into page
  // props. Locked briefs set bodyCode="" above; rawDoc.body would still leak
  // body.raw and body.code into __NEXT_DATA__ if spread unchecked.
  const { body: _body, ...safeRawDoc } = rawDoc as any;

  const brief = {
    ...safeRawDoc,
    slug: bare,
    bodyCode,
    coverImage: briefCoverPathForVaultSlug(bare),
  };

  return {
    props: sanitizeData({
      brief,
      recommendations,
      requiredTier,
      bareSlug: bare,
      bodyEmpty,
    }),
  };


};

export default BriefPage;
