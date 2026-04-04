/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/blog/[...slug].tsx */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import DirectorateOversight from "@/components/content/DirectorateOversight";

import { normalizeSlug, joinHref } from "@/lib/content/shared";
import { resolveDocCoverImage, sanitizeData } from "@/lib/content/client-utils";
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

  let changed = true;
  while (changed) {
    changed = false;
    const lower = s.toLowerCase();

    if (lower.startsWith("blog/")) {
      s = normalizeSlug(s.slice("blog/".length));
      changed = true;
    } else if (lower.startsWith("posts/")) {
      s = normalizeSlug(s.slice("posts/".length));
      changed = true;
    } else if (lower.startsWith("/blog/")) {
      s = normalizeSlug(s.slice("/blog/".length));
      changed = true;
    } else if (lower.startsWith("/posts/")) {
      s = normalizeSlug(s.slice("/posts/".length));
      changed = true;
    }
  }

  s = normalizeSlug(s);
  if (!s || s.includes("..")) return "";
  return s;
}

const BlogSlugPage: NextPage<BlogSlugProps> = ({ doc, code, requiredTier, bareSlug }) => {
  const { data: session, status } = useSession();

  const title = doc?.title || "Untitled Essay";
  const excerpt = doc?.excerpt || doc?.description || "";
  const cover = resolveDocCoverImage(doc) || "/assets/images/blog/default-blog-cover.jpg";
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

  const handleUnlock = React.useCallback(async () => {
    if (!needsAuth || !bareSlug) return;

    setUnlockError(null);
    setLoadingContent(true);

    try {
      const res = await fetch(`/api/blog/${encodeURIComponent(bareSlug)}`, { method: "GET" });
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
              message="This essay requires appropriate clearance."
              onUnlocked={handleUnlock}
              onGoToJoin={() => {
                window.location.href = "/inner-circle";
              }}
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

      <DirectorateOversight
        kind="essay"
        title={title}
        excerpt={excerpt}
        category={doc?.category || "Essay"}
        date={doc?.date || null}
        tags={Array.isArray(doc?.tags) ? doc.tags : []}
        readTime={doc?.readTime || null}
        cover={cover}
        backHref="/blog"
        backLabel="Back"
        imprint="Abraham of London • Essays & Insights"
        requiredTier={required}
        loading={loadingContent}
        unlockError={unlockError}
        activeCode={activeCode}
        emptyLabel="No essay content available."
      />
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const { getPublishedPosts } = await import("@/lib/content/server");

  const posts = (await getPublishedPosts()) || [];

  const paths = posts
    .filter((p: any) => !p?.draft)
    .map((p: any) => {
      const raw = normalizeSlug(
        p?.urlSlug ||
          p?.collectionSlug ||
          p?.slug ||
          p?._raw?.flattenedPath ||
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

    const { getPublishedPosts } = await import("@/lib/content/server");
    const posts = (await getPublishedPosts()) || [];

    const wantBlog = `blog/${bare}`;
    const wantPosts = `posts/${bare}`;

    const rawDoc =
      posts.find((p: any) => normalizeSlug(p?.collectionSlug || "") === wantBlog) ||
      posts.find((p: any) => normalizeSlug(p?.collectionSlug || "") === wantPosts) ||
      posts.find((p: any) => normalizeSlug(p?.slug || "") === wantBlog) ||
      posts.find((p: any) => normalizeSlug(p?._raw?.flattenedPath || "") === wantBlog) ||
      posts.find((p: any) => normalizeSlug(p?.slug || "") === wantPosts) ||
      posts.find((p: any) => normalizeSlug(p?._raw?.flattenedPath || "") === wantPosts) ||
      posts.find((p: any) => normalizeSlug(p?.urlSlug || "") === bare) ||
      null;

    if (!rawDoc || rawDoc?.draft) {
      return { notFound: true };
    }

    const requiredTier = normalizeRequiredTier(requiredTierFromDoc(rawDoc));
    const renderBody = getRenderableBody(rawDoc);
    const code = requiredTier === "public" ? renderBody.code : "";

    const doc = {
      ...rawDoc,
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