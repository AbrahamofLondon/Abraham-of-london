/* pages/vault/briefs/[slug].tsx — COMPLETE FIXED VERSION */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMDXComponent } from "next-contentlayer2/hooks";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import BriefAlert from "@/components/BriefAlert";

import { prisma } from "@/lib/prisma";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";
import { allBriefs } from "@/lib/contentlayer";

/**
 * Extract the bare slug from the full path
 * Example: "content/vault/briefs/brief-001-modern-household.mdx" -> "brief-001-modern-household"
 */
function normalizeBriefSlug(input: string): string {
  if (!input) return "";
  
  const fullPath = String(input).trim();
  const fileName = fullPath.split(/[\\/]/).pop() || "";
  const baseName = fileName.replace(/\.mdx$/i, "");
  
  return baseName;
}

/**
 * Create proper href for brief pages
 */
function toVaultBriefHref(slug: string): string {
  const cleanSlug = normalizeBriefSlug(slug);
  return `/vault/briefs/${cleanSlug}`;
}

/**
 * Rewrite vault hrefs in MDX content
 */
function rewriteVaultHref(hrefRaw: any): string {
  const href = String(hrefRaw || "").trim();
  if (!href) return href;
  if (href.startsWith("#")) return href;

  // Handle full vault brief paths
  if (href.includes("/vault/briefs/")) {
    const parts = href.split("/vault/briefs/");
    const slug = parts[1]?.split(/[?#]/)[0] || "";
    return `/vault/briefs/${normalizeBriefSlug(slug)}`;
  }

  // Handle briefs paths
  if (href.includes("/briefs/")) {
    const parts = href.split("/briefs/");
    const slug = parts[1]?.split(/[?#]/)[0] || "";
    return `/vault/briefs/${normalizeBriefSlug(slug)}`;
  }

  // Handle relative brief links
  if (href.startsWith("brief-") || href.includes("brief-")) {
    return `/vault/briefs/${normalizeBriefSlug(href)}`;
  }

  return href;
}

// ✅ Define all MDX components that might be used in your briefs
const mdxComponents = {
  // Basic HTML elements with styling
  h1: ({ children, ...props }: any) => (
    <h1 className="text-3xl md:text-4xl font-serif text-white mt-8 mb-4" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-2xl md:text-3xl font-serif text-white/90 mt-6 mb-3" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-xl font-serif text-white/85 mt-5 mb-2" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: any) => (
    <p className="text-white/70 leading-relaxed mb-4" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-inside text-white/70 space-y-2 mb-4" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-inside text-white/70 space-y-2 mb-4" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-white/70" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-emerald-700/50 pl-4 italic text-white/60 my-4" {...props}>
      {children}
    </blockquote>
  ),
  hr: (props: any) => <hr className="my-8 border-t border-white/10" {...props} />,
  
  // ✅ BriefAlert component (imported)
  BriefAlert: (props: any) => <BriefAlert {...props} />,
  
  // ✅ DataNode component (defined inline)
  DataNode: ({ children, title, value, data, ...props }: any) => {
    // Handle different prop patterns
    const nodeTitle = title || props.label || "Data Node";
    const nodeValue = value || data || children;
    
    return (
      <div className="my-4 p-5 border border-emerald-800/30 bg-emerald-950/10 rounded-xl" {...props}>
        {nodeTitle && (
          <div className="text-emerald-400 font-mono text-xs uppercase tracking-wider mb-3 border-b border-emerald-800/30 pb-2">
            {nodeTitle}
          </div>
        )}
        <div className="text-white font-mono text-sm">
          {typeof nodeValue === 'object' ? JSON.stringify(nodeValue, null, 2) : nodeValue}
        </div>
      </div>
    );
  },
  
  // ✅ Note component - FIXED to map MDX "tone" to BriefAlert "level"
  Note: ({ children, title, tone, ...props }: any) => {
    // Map MDX tone to BriefAlert level
    const levelMap: Record<string, "info" | "warn" | "danger" | "success"> = {
      info: "info",
      note: "info",
      tip: "success",
      caution: "warn",
      warning: "warn",
      danger: "danger",
      error: "danger",
      success: "success",
    };
    
    const level = levelMap[tone] || "info";
    
    return (
      <BriefAlert level={level} title={title || "Note"}>
        {children}
      </BriefAlert>
    );
  },
  
  // ✅ Rule component
  Rule: ({ children, label, status, ...props }: any) => (
    <div className="my-8 relative" {...props}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-emerald-800/30"></div>
      </div>
      <div className="relative flex justify-between items-center">
        {label && (
          <span className="bg-black pr-4 text-emerald-500 font-mono text-xs uppercase tracking-wider">
            {label}
          </span>
        )}
        {status && (
          <span className="bg-black pl-4 text-white/30 font-mono text-[10px] uppercase tracking-widest">
            {status}
          </span>
        )}
      </div>
      {children && <div className="mt-6">{children}</div>}
    </div>
  ),
  
  // ✅ Verse component
  Verse: ({ children, ...props }: any) => (
    <div className="italic text-white/70 border-l-2 border-emerald-700/50 pl-6 my-6 py-2 font-serif text-lg" {...props}>
      {children}
    </div>
  ),
  
  // ✅ Table components
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full border-collapse border border-white/10" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-white/5" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }: any) => (
    <tr className="border-b border-white/10 hover:bg-white/5" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-4 py-3 text-left text-emerald-400 font-mono text-xs uppercase tracking-wider" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-4 py-3 text-white/70 text-sm" {...props}>
      {children}
    </td>
  ),
  
  // ✅ Link handling
  a: ({ href, children, className, ...props }: any) => {
    const nextHref = rewriteVaultHref(href);
    const isInternal = nextHref.startsWith("/") || nextHref.startsWith("#");

    if (isInternal) {
      return (
        <Link
          href={nextHref || "#"}
          className={
            className ||
            "text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors"
          }
          {...props}
        >
          {children}
        </Link>
      );
    }

    return (
      <a
        href={nextHref}
        target="_blank"
        rel="noopener noreferrer"
        className={
          className ||
          "text-emerald-300 hover:text-emerald-200 underline underline-offset-4 transition-colors"
        }
        {...props}
      >
        {children}
      </a>
    );
  },
};

type BriefPageProps = {
  brief: any;
  recommendations: any[];
  requiredTier: AccessTier;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = (allBriefs || [])
    .filter((b: any) => !b?.draft)
    .map((b: any) => {
      const rawSlug = b.slug || b._raw?.flattenedPath || "";
      const slug = normalizeBriefSlug(rawSlug);
      
      if (!slug) return null;
      
      return { params: { slug } };
    })
    .filter((p): p is { params: { slug: string } } => p !== null);

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<BriefPageProps> = async ({ params }) => {
  const slugParam = String(params?.slug || "").trim();
  if (!slugParam) return { notFound: true };

  // Find the document by matching the slug
  const doc = (allBriefs || []).find((b: any) => {
    const rawSlug = b.slug || b._raw?.flattenedPath || "";
    const normalized = normalizeBriefSlug(rawSlug);
    return normalized === slugParam;
  });

  if (!doc || doc?.draft) return { notFound: true };

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));

  // Try different slug formats for database lookup
  const dbSlugVariants = [
    `vault/briefs/${slugParam}`,
    `briefs/${slugParam}`,
    slugParam
  ];

  let vaultData = null;
  for (const dbSlug of dbSlugVariants) {
    vaultData = await prisma.contentMetadata.findUnique({
      where: { slug: dbSlug },
      include: { dependencies: { include: { targetBrief: true } } },
    });
    if (vaultData) break;
  }

  let recommendations: any[] = [];
  if (vaultData?.id) {
    try {
      recommendations = await prisma.$queryRawUnsafe(
        `
        SELECT slug, title, "contentType",
          1 - (embedding <=> (SELECT embedding FROM "ContentMetadata" WHERE id = $1)) as similarity
        FROM "ContentMetadata"
        WHERE id != $1 AND embedding IS NOT NULL
        ORDER BY similarity DESC
        LIMIT 3
      `,
        vaultData.id
      );
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    }
  }

  return {
    props: {
      brief: { ...doc, vault: vaultData },
      recommendations: JSON.parse(JSON.stringify(recommendations || [])),
      requiredTier,
    },
    revalidate: 3600,
  };
};

const BriefPage: NextPage<BriefPageProps> = ({ brief, recommendations, requiredTier }) => {
  const { data: session, status } = useSession();

  const required = tiers.normalizeRequired(requiredTier);
  const user = tiers.normalizeUser((session?.user as any)?.tier ?? "public");

  const needsAuth = required !== "public";
  const canAccess = !needsAuth || (session?.user ? tiers.hasAccess(user, required) : false);

  const bodyCode = String(brief?.body?.code || brief?.bodyCode || "");
  const MDXContent = useMDXComponent(bodyCode);

  if (needsAuth && status === "loading") {
    return (
      <Layout title={brief.title}>
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="text-amber-500 font-mono text-xs animate-pulse">Verifying clearance...</div>
        </div>
      </Layout>
    );
  }

  if (needsAuth && (!session?.user || !canAccess)) {
    return (
      <Layout title={brief.title}>
        <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
          <AccessGate
            title={brief.title}
            requiredTier={required}
            message="This intelligence brief requires appropriate clearance."
            onGoToJoin={() => (window.location.href = "/inner-circle")}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={brief.title}>
      <main className="min-h-screen bg-[#050505] pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10 border-b border-emerald-900/20 pb-8">
            <div className="flex flex-wrap items-center gap-3 text-emerald-600 font-mono text-[10px] uppercase tracking-widest mb-4">
              <span>Classification: {String(brief.vault?.classification || required)}</span>
              {required !== "public" && (
                <span className="px-2 py-1 bg-emerald-900/20 border border-emerald-800/30 rounded">
                  Required: {required}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-serif italic text-white">{brief.title}</h1>
          </header>

          <article className="prose prose-invert prose-emerald max-w-none mb-16">
            <MDXContent components={mdxComponents as any} />
          </article>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-white/5 pt-10">
            <div>
              <h3 className="text-emerald-500 font-mono text-[10px] uppercase tracking-[0.3em] mb-6">
                Strategic Dependencies
              </h3>
              <div className="space-y-4">
                {brief.vault?.dependencies?.length ? (
                  brief.vault.dependencies.map((dep: any) => {
                    const targetSlug = dep?.targetBrief?.slug || "";
                    const cleanSlug = targetSlug.replace(/^vault\/briefs\//, "").replace(/^briefs\//, "");
                    return (
                      <Link
                        key={targetSlug || dep?.id}
                        href={toVaultBriefHref(cleanSlug)}
                        className="block p-4 bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all rounded-xl"
                      >
                        <span className="text-zinc-200 text-sm">
                          {dep?.targetBrief?.title || cleanSlug || "Dependency"}
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-zinc-700 font-mono text-[9px] uppercase tracking-widest">
                    No dependencies recorded.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-emerald-500 font-mono text-[10px] uppercase tracking-[0.3em] mb-6">
                Semantic Discovery
              </h3>
              <div className="space-y-4">
                {(recommendations || []).map((rec: any) => {
                  const recSlug = String(rec.slug || "").replace(/^vault\/briefs\//, "").replace(/^briefs\//, "");
                  return (
                    <Link
                      key={rec.slug}
                      href={toVaultBriefHref(recSlug)}
                      className="block p-4 bg-emerald-950/5 border border-emerald-900/20 hover:border-emerald-500/50 transition-all rounded-xl"
                    >
                      <span className="text-zinc-400 text-[9px] uppercase block mb-1">
                        {String(rec.contentType || "Brief")}
                      </span>
                      <span className="text-zinc-200 text-sm">{String(rec.title || rec.slug)}</span>
                    </Link>
                  );
                })}
                {(!recommendations || recommendations.length === 0) && (
                  <div className="text-zinc-700 font-mono text-[9px] uppercase tracking-widest">
                    No recommendations available.
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="mt-14 flex items-center justify-between border-t border-white/5 pt-8">
            <Link
              href="/vault"
              className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/45 hover:text-emerald-300 transition-colors"
            >
              ← Back to Vault
            </Link>

            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/25">
              Abraham of London • Vault Briefs
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default BriefPage;