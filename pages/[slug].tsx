/* pages/[slug].tsx */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";

import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";

import { getDocKind, sanitizeData } from "@/lib/content/shared";
import { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeRequiredTier,
  normalizeUserTier,
  hasAccess,
} from "@/lib/access/tier-policy";
import { getRenderableBody } from "@/lib/content/render-body";

/* -----------------------------------------------------------------------------
   Routing guardrails
----------------------------------------------------------------------------- */
function norm(input: string): string {
  return String(input || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

const RESERVED_ROOT = new Set<string>([
  "admin",
  "api",
  "artifacts",
  "auth",
  "blog",
  "board",
  "books",
  "brands",
  "canon",
  "canon-campaign",
  "chatham-rooms",
  "consulting",
  "content",
  "contact",
  "debug",
  "dev",
  "diagnostics",
  "directorate",
  "downloads",
  "editorials",
  "education-research",
  "events",
  "fatherhood",
  "founders",
  "get",
  "inner-circle",
  "institutional",
  "leadership",
  "library",
  "media",
  "membership",
  "playbooks",
  "premium",
  "prints",
  "private",
  "private-clients",
  "registry",
  "resources",
  "shorts",
  "sovereign",
  "speaking",
  "strategy",
  "strategy-room",
  "vault",
  "ventures",
  "about",
  "contact",
  "privacy",
  "security",
  "terms",
  "subscribe",
  "newsletter",
  "cookies",
  "cookie-policy",
  "diagnostic",
  "accessibility",
  "accessibility-statement",
  "works-in-progress",
  "offline",
  "dashboard",
  "404",
  "500",
]);

function allowRootSlug(slug: string): boolean {
  const s = norm(slug).toLowerCase();
  return !!s && !s.includes("/") && !RESERVED_ROOT.has(s);
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
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

function pickRenderableDocCode(rawDoc: any, renderBody?: any): string {
  const compiled =
    safeString(renderBody?.code) ||
    safeString(rawDoc?.body?.code) ||
    safeString(rawDoc?.bodyCode);

  const raw =
    safeString(renderBody?.raw) ||
    safeString(rawDoc?.body?.raw) ||
    safeString(rawDoc?.content);

  if (compiled && !looksLikeLeakedModuleCode(compiled)) {
    return compiled;
  }

  if (raw) {
    return raw;
  }

  return compiled || "";
}

interface Props {
  doc: {
    title: string;
    kind: string;
    date: string | null;
    excerpt: string;
    readTime: string | null;
    bodyCode: string;
    bodyMode: "compiled" | "raw" | "empty";
  } | null;
  canonicalUrl: string;
  requiredTier: AccessTier;
}

const GenericContentPage: NextPage<Props> = ({
  doc,
  canonicalUrl,
  requiredTier,
}) => {
  const { data: session, status } = useSession();

  const required = normalizeRequiredTier(requiredTier);
  const user = normalizeUserTier((session?.user as any)?.tier ?? "public");

  const needsAuth = required !== "public";
  const canAccess = hasAccess(user, required);

  if (!doc) {
    return (
      <Layout
        title="404 | Abraham of London"
        description="Content not found"
        canonicalUrl={canonicalUrl}
      >
        <div className="flex min-h-screen items-center justify-center bg-black px-6">
          <div className="text-center">
            <h1 className="font-serif text-5xl text-white md:text-6xl">404</h1>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.35em] text-white/35">
              Asset Not Found
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (status === "loading") {
    return (
      <Layout
        title={doc.title}
        description={doc.excerpt}
        canonicalUrl={canonicalUrl}
      >
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="animate-pulse font-mono text-xs text-amber-500">
            Verifying clearance...
          </div>
        </div>
      </Layout>
    );
  }

  if (needsAuth && (!session?.user || !canAccess)) {
    return (
      <Layout
        title={doc.title}
        description={doc.excerpt}
        canonicalUrl={canonicalUrl}
      >
        <div className="flex min-h-screen items-center justify-center bg-black px-6">
          <AccessGate
            title={doc.title}
            requiredTier={required}
            message="This content requires appropriate clearance."
            onGoToJoin={() => {
              window.location.href = "/inner-circle";
            }}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`${doc.title} | Abraham of London`}
      description={doc.excerpt}
      canonicalUrl={canonicalUrl}
    >
      <Head>
        <title>{doc.title} | Abraham of London</title>
        {doc.excerpt ? <meta name="description" content={doc.excerpt} /> : null}
        <meta
          name="robots"
          content={required === "public" ? "index, follow" : "noindex, nofollow"}
        />
      </Head>

      <article className="relative min-h-screen bg-black pb-32 pt-24">
        <header className="mx-auto mb-16 max-w-3xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-500/60">
            {doc.kind} // {required === "public" ? "Public" : required}
          </div>

          <h1 className="mb-8 font-serif text-5xl tracking-tight text-white md:text-7xl">
            {doc.title}
          </h1>

          <div className="flex items-center justify-center gap-6 border-y border-white/5 py-4 font-mono text-[10px] uppercase tracking-widest text-white/30">
            <span>{doc.date ?? "—"}</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>{doc.readTime || "5 MIN READ"}</span>
            {required !== "public" ? (
              <>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="text-amber-500/60">{required}</span>
              </>
            ) : null}
          </div>
        </header>

        <div className="mx-auto max-w-2xl px-6">
          <div className="prose prose-invert max-w-none">
            <SafeMDXRenderer code={doc.bodyCode} />
          </div>
        </div>
      </article>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const {
    getAllCombinedDocs,
    normalizeSlug,
    isDraftContent,
    isPublished,
  } = await import("@/lib/content/server");

  const docs = (getAllCombinedDocs() || []).filter(
    (d: any) => !isDraftContent(d) && isPublished(d)
  );

  const seen = new Set<string>();
  const paths: Array<{ params: { slug: string } }> = [];

  for (const d of docs) {
    const raw = normalizeSlug(d?.slug || d?._raw?.flattenedPath || "");
    const slug = norm(raw);
    const key = slug.toLowerCase();

    if (!slug || !allowRootSlug(slug) || seen.has(key)) continue;

    seen.add(key);
    paths.push({ params: { slug } });
  }

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = norm(String(params?.slug || ""));
  const canonicalUrl = `/${slug}`;

  if (!allowRootSlug(slug)) {
    return { notFound: true, revalidate: 60 };
  }

  const {
    getDocBySlug,
    normalizeSlug,
    isDraftContent,
    isPublished,
  } = await import("@/lib/content/server");

  const needle = norm(normalizeSlug(slug));
  const rawDoc = getDocBySlug(needle);

  if (!rawDoc || isDraftContent(rawDoc) || !isPublished(rawDoc)) {
    return { notFound: true, revalidate: 60 };
  }

  const requiredTier = normalizeRequiredTier(requiredTierFromDoc(rawDoc));
  const renderBody = getRenderableBody(rawDoc);
  const bodyCode = requiredTier === "public" ? pickRenderableDocCode(rawDoc, renderBody) : "";

  const doc = sanitizeData({
    title: rawDoc?.title || "Untitled",
    kind: getDocKind(rawDoc) || "Content",
    date: rawDoc?.date ? new Date(rawDoc.date).toLocaleDateString("en-GB") : null,
    excerpt: rawDoc?.excerpt || rawDoc?.description || "",
    readTime: rawDoc?.readTime ?? null,
    bodyCode,
    bodyMode: renderBody.mode,
  });

  return {
    props: {
      doc,
      canonicalUrl,
      requiredTier,
    },
    revalidate: 3600,
  };
};

export default GenericContentPage;