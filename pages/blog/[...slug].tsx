/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/blog/[...slug].tsx */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import ClassicBlogReader from "@/components/blog/ClassicBlogReader";
import NextStepCTA from "@/components/content/NextStepCTA";

import { normalizeSlug, joinHref } from "@/lib/content/shared";
import { resolveDocCoverImage, sanitizeData } from "@/lib/content/client-utils";
import { isRouteEligibleNow } from "@/lib/content/publication-eligibility";
import { getRenderableBody } from "@/lib/content/render-body";
import { decodeBodyCodePayload } from "@/lib/content/client-codec";

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

type BlogSlugProps = {
  doc: any;
  code: string;
  requiredTier: AccessTier;
  bareSlug: string;
};

function collapseSlashes(s: string): string {
  return String(s || "")
    .replace(/\\/g, "/")
    .replace(/\/{2,}/g, "/");
}

function toBareBlogSlug(input: unknown): string {
  let s = collapseSlashes(String(input ?? "")).trim();
  s = normalizeSlug(s);

  const PREFIXES = [
    "blog/",
    "posts/",
    "articles/",
    "library/",
    "content/",
    "public/",
    "restricted/",
    "/blog/",
    "/posts/",
    "/articles/",
    "/library/",
    "/content/",
    "/public/",
    "/restricted/",
  ];

  let changed = true;
  while (changed) {
    changed = false;
    const lower = s.toLowerCase();

    for (const prefix of PREFIXES) {
      if (lower.startsWith(prefix)) {
        s = normalizeSlug(s.slice(prefix.length));
        changed = true;
        break;
      }
    }
  }

  s = normalizeSlug(s);
  if (!s || s.includes("..")) return "";
  return s;
}

function normalizeCoverAspect(input: unknown): "square" | "wide" | "book" | null {
  const v = String(input ?? "").trim().toLowerCase();
  if (v === "square") return "square";
  if (v === "wide") return "wide";
  if (v === "book") return "book";
  return null;
}

function normalizeCoverFit(input: unknown): "cover" | "contain" | null {
  const v = String(input ?? "").trim().toLowerCase();
  if (v === "cover") return "cover";
  if (v === "contain") return "contain";
  return null;
}

function normalizeCoverPosition(
  input: unknown,
): "center" | "top" | "bottom" | "left" | "right" | null {
  const v = String(input ?? "").trim();
  return v === "center" || v === "top" || v === "bottom" || v === "left" || v === "right"
    ? v
    : null;
}

const BlogSlugPage: NextPage<BlogSlugProps> = ({
  doc,
  code,
  requiredTier,
  bareSlug,
}) => {
  const { data: session, status } = useSession();

  const title = doc?.title || "Untitled Essay";
  const excerpt = doc?.excerpt || doc?.description || "";
  // Pass null when no cover is set in frontmatter so ClassicBlogReader suppresses
  // the cover section — avoids forcing the default fallback image into the layout.
  const rawCover = doc?.coverImage || doc?.featuredImage || doc?.heroImage || doc?.thumbnail || null;
  const cover = rawCover ? resolveDocCoverImage(doc, { contentType: "BLOG" }) : null;
  const canonicalUrl = joinHref("blog", bareSlug);

  const required = normalizeRequiredTier(requiredTier);
  const userTier = normalizeUserTier(
    (session?.user as any)?.tier ?? (session?.user as any)?.role ?? "public"
  );

  const needsAuth = required !== "public";
  const canRead = !needsAuth || (!!session?.user && hasAccess(userTier, required));

  const [activeCode, setActiveCode] = React.useState<string>(code || "");
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  // Guards the one-shot auto-unlock below so a failed fetch cannot re-fire
  // on every re-render (activeCode stays "" on failure).
  const autoUnlockAttempted = React.useRef(false);

  const handleUnlock = React.useCallback(async () => {
    if (!needsAuth || !bareSlug) return;

    setUnlockError(null);
    setLoadingContent(true);

    try {
      const res = await fetch(`/api/blog/${encodeURIComponent(bareSlug)}`, {
        method: "GET",
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setUnlockError(json?.reason || "UNLOCK_FAILED");
        return;
      }

      const decoded = decodeBodyCodePayload(json);

      if (decoded.trim()) {
        setActiveCode(decoded);
      } else {
        setUnlockError("UNLOCK_PAYLOAD_MISSING");
      }
    } catch {
      setUnlockError("UNLOCK_NETWORK_FAILURE");
    } finally {
      setLoadingContent(false);
    }
  }, [bareSlug, needsAuth]);

  // Hydration-lifecycle bridge for pre-authorized users.
  // A logged-in, cleared reader bypasses <AccessGate> (the gate's onUnlocked
  // never fires), yet getStaticProps stripped `code` to "" for gated posts.
  // Without this, activeCode stays "" and the reader renders empty. Fetch the
  // secured payload exactly once when the user is authenticated and authorized
  // and nothing has been loaded yet.
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
            Verifying clearance…
          </div>
        </div>
      </Layout>
    );
  }

  if (needsAuth && (!session?.user || !canRead)) {
    return (
      <Layout title={title}>
        <div className="flex min-h-screen items-center justify-center bg-black px-6">
          <div className="w-full max-w-lg">
            <AccessGate
              title={title}
              requiredTier={required}
              message="This essay requires appropriate access."
              isAuthenticated={!!session?.user}
              onUnlocked={handleUnlock}
            />
            {unlockError ? (
              <div className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-red-400/90">
                {unlockError}
              </div>
            ) : null}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`${title} // Abraham of London`}
      canonicalUrl={canonicalUrl}
      className="bg-black text-white"
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <title>{title} // Abraham of London</title>
        {excerpt ? <meta name="description" content={excerpt} /> : null}
        <meta
          name="robots"
          content={required === "public" ? "index, follow" : "noindex, nofollow"}
        />
      </Head>

      <ClassicBlogReader
        title={title}
        excerpt={excerpt}
        category={doc?.category || "Essay"}
        date={doc?.date || null}
        tags={Array.isArray(doc?.tags) ? doc.tags : []}
        readTime={doc?.readTime || null}
        cover={cover}
        coverAspect={normalizeCoverAspect(doc?.coverAspect)}
        coverFit={normalizeCoverFit(doc?.coverFit)}
        coverPosition={normalizeCoverPosition(doc?.coverPosition)}
        backHref="/blog"
        backLabel="Back"
        imprint="Abraham of London • Essays"
        requiredTier={required}
        loading={loadingContent}
        unlockError={unlockError}
        activeCode={activeCode}
        emptyLabel="No essay content available."
        childrenBottom={<NextStepCTA surface="essay" title="Next step" />}
      />
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const { getAllPosts } = await import("@/lib/content/server");

  const posts = (getAllPosts()) || [];

  const paths = [...posts]
    .filter((p: any) => isRouteEligibleNow(p))
    // Exclude blog series posts — those are handled by /blog/series/[seriesSlug]/[partSlug]
    .filter((p: any) => !p?.series)
    .map((p: any) => {
      const raw = normalizeSlug(
        p?.urlSlug ||
          p?.collectionSlug ||
          p?.slug ||
          p?.href ||
          p?.path ||
          p?._raw?.flattenedPath ||
          p?._raw?.sourceFilePath ||
          p?._raw?.sourceFileName ||
          ""
      );

      const bare = toBareBlogSlug(raw);
      return bare ? { params: { slug: bare.split("/") } } : null;
    })
    .filter(Boolean) as Array<{ params: { slug: string[] } }>;

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<BlogSlugProps> = async ({ params }) => {
  try {
    const rawParam = Array.isArray(params?.slug)
      ? (params?.slug as string[]).join("/")
      : String(params?.slug || "");

    const bare = toBareBlogSlug(rawParam);
    if (!bare) return { notFound: true };

    const { getAllPosts } = await import("@/lib/content/server");
    const posts = (getAllPosts()) || [];

    const wantBlog = `blog/${bare}`;
    const wantPosts = `posts/${bare}`;

    // Build a set of candidate patterns to match against every slug field on every post.
    const candidates = [
      wantBlog,
      wantPosts,
      bare,
      `blog/${bare}`,
      `posts/${bare}`,
      `articles/${bare}`,
      `library/${bare}`,
      `content/${bare}`,
      `public/${bare}`,
      `restricted/${bare}`,
    ].filter(Boolean);

    const rawDoc = posts.find((p: any) => {
      const fields = [
        p?.collectionSlug,
        p?.urlSlug,
        p?.slug,
        p?.href,
        p?.path,
        p?._raw?.flattenedPath,
        p?._raw?.sourceFilePath,
        p?._raw?.sourceFileName,
      ];

      return fields.some((field) => {
        if (!field) return false;
        const normalised = normalizeSlug(String(field));
        const withoutExt = normalised.replace(/\.(md|mdx)$/i, "");
        return candidates.includes(normalised) || candidates.includes(withoutExt);
      });
    }) || null;

    // A. Invalid or missing slug
    if (!rawDoc) return { notFound: true };

    // B. Blog-series documents belong only at /blog/series/[seriesSlug]/[partSlug]
    if (rawDoc.series) return { notFound: true };

    // Use classifyPublication for fine-grained distinction
    const { classifyPublication } = await import("@/lib/content/publication-eligibility");
    const pubState = classifyPublication(rawDoc);

    // C. SCHEDULED — return revalidating 404
    if (pubState === "SCHEDULED") {
      return { notFound: true, revalidate: 60 };
    }

    // D. DRAFT, INTERNAL or UNKNOWN — permanent 404
    if (pubState !== "PUBLIC_READABLE_NOW" && pubState !== "RESTRICTED") {
      return { notFound: true };
    }

    // E. PUBLIC_READABLE_NOW or RESTRICTED — continue through access path
    const requiredTier = normalizeRequiredTier(requiredTierFromDoc(rawDoc));
    const renderBody = getRenderableBody(rawDoc);
    const code = requiredTier === "public" ? renderBody.code : "";

    const { body: _body, ...safeRawDoc } = rawDoc as any;

    const doc = {
      ...safeRawDoc,
      slug: bare,
      bodyMode: renderBody.mode,
    };

    return {
      props: sanitizeData({
        doc,
        code,
        requiredTier,
        bareSlug: bare,
      }),
      revalidate: 1800,
    };
  } catch (error) {
    console.error("[Blog] Error in getStaticProps:", error);
    return { notFound: true, revalidate: 60 };
  }
};

export default BlogSlugPage;
