/* pages/inner-circle/briefs/index.tsx — Chamber mode: manuscript registry */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

import Layout from "@/components/Layout";
import WorkspaceNav from "@/components/inner-circle/WorkspaceNav";

type BriefListItem = {
  slug: string;
  title: string;
  accessTier: string;
  restricted: boolean;
  href: string;
};

type Props = {
  briefs: BriefListItem[];
  memberName: string;
  tier: string;
};

const BriefsIndexPage: NextPage<Props> = ({ briefs, memberName, tier }) => {
  return (
    <Layout title="Briefs | Inner Circle">
      <div className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <WorkspaceNav />
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-20 lg:px-12 lg:pb-20">
          <header className="max-w-3xl">
            <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/38">
              INNER CIRCLE · BRIEFS
            </p>
            <h1 className="mt-5 font-serif text-[clamp(2rem,4vw,3rem)] font-light italic leading-[0.95] text-white/92">
              The manuscript registry.
            </h1>
            <p className="mt-4 font-mono text-[7.5px] uppercase tracking-[0.12em] text-white/48">
              Active session · {memberName} · {tier}
            </p>
          </header>

          <section className="mt-12">
            <h2 className="font-mono text-[7.5px] uppercase tracking-[0.28em] text-white/38">
              Accessible Manuscripts
            </h2>
            <div className="mt-4 border-t border-white/8">
              {briefs.length > 0 ? (
                briefs.map((brief) => (
                  <Link
                    key={brief.slug}
                    href={brief.href}
                    className="flex items-center justify-between border-b border-white/6 py-3 text-sm text-white/72 transition-colors hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      {brief.restricted ? (
                        <Lock size={14} className="text-white/34" />
                      ) : null}
                      {brief.title} · {brief.accessTier}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/38">
                      → Read
                    </span>
                  </Link>
                ))
              ) : (
                <div className="border-b border-white/6 py-3 font-mono text-[7.5px] uppercase tracking-[0.12em] text-white/28">
                  No briefs available at your access tier.
                </div>
              )}
            </div>
          </section>

          <section className="mt-12">
            <Link
              href="/inner-circle/dashboard"
              className="font-mono text-[7.5px] uppercase tracking-[0.16em] text-white/38 transition-colors hover:text-white/62"
            >
              Back to workspace →
            </Link>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const [
    { readAccessCookie },
    { getSessionContext, tierAtLeast },
  ] = await Promise.all([
    import("@/lib/server/auth/cookies"),
    import("@/lib/server/auth/tokenStore.postgres"),
  ]);

  const sessionId = readAccessCookie(context.req as any);

  if (!sessionId) {
    return {
      redirect: {
        destination: `/inner-circle?returnTo=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }

  const ctx = await getSessionContext(sessionId);

  if (!ctx.ok || !ctx.valid || !tierAtLeast(ctx.tier, "inner-circle")) {
    return {
      redirect: {
        destination: "/inner-circle/locked",
        permanent: false,
      },
    };
  }

  const { allBriefs } = await import("contentlayer/generated");
  const briefs: BriefListItem[] = allBriefs
    .filter((b: any) => !b?.draft)
    .filter((b: any) => {
      const accessTier = String(b?.accessTier ?? "public").toLowerCase();
      if (accessTier === "public") return true;
      return tierAtLeast(ctx.tier, "inner-circle");
    })
    .sort(
      (a: any, b: any) =>
        new Date(String(b?.date ?? "")).getTime() -
        new Date(String(a?.date ?? "")).getTime(),
    )
    .map((brief: any) => {
      const accessTier = String(brief?.accessTier ?? "inner-circle");
      const slug = String(
        brief?.slug || brief?._raw?.flattenedPath || "",
      ).replace(/^\/+/, "");
      return {
        slug,
        title: String(brief?.title ?? "Untitled"),
        accessTier,
        restricted: accessTier.toLowerCase() !== "public",
        href: `/inner-circle/briefs/${slug}`,
      };
    });

  return {
    props: {
      briefs,
      memberName: ctx.name || "Member",
      tier: ctx.tier || "public",
    },
  };
};

export default BriefsIndexPage;
