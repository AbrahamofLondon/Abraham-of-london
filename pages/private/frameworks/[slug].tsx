/* pages/private/frameworks/[slug].tsx — PRIVATE PREVIEW (INTEGRITY MODE, HARDENED) */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import { ShieldAlert, Lock, ArrowLeft } from "lucide-react";

import tiers from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type Props = { slug: string; requiredTier: AccessTier };

function normalizePrivateSlug(input: unknown): string {
  let s = String(input ?? "");
  try {
    s = decodeURIComponent(s);
  } catch {
    // ignore
  }

  s = s.trim().replace(/\\/g, "/");
  s = s.replace(/^\/+/, "").replace(/\/+$/, "");
  s = s.replace(/\/{2,}/g, "/");

  if (!s) return "";
  if (s.includes("..")) return "";
  if (s.startsWith(".")) return "";

  // Reject empty segments (e.g. "a//b") after collapsing, and dot segments
  const parts = s.split("/").filter(Boolean);
  if (!parts.length) return "";
  if (parts.some((p) => p === "." || p === "..")) return "";

  // Tight character set per segment
  // (Allows nested slugs and filenames like "foo-bar_01.pdf")
  const ok = parts.every((p) => /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(p));
  if (!ok) return "";

  return parts.join("/");
}

const PrivateFrameworkPreviewPage: NextPage<Props> = ({ slug, requiredTier }) => {
  const src = `/api/private/frameworks/${encodeURIComponent(slug)}`;
  const label = tiers.getLabel(requiredTier);

  return (
    <Layout title="Private Framework Preview">
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="mx-auto w-full max-w-6xl px-4 py-12 lg:py-20">
        <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-3 py-1">
              <ShieldAlert size={12} className="text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">
                Internal Restricted Asset • {label}
              </span>
            </div>

            <h1 className="font-serif text-3xl font-semibold text-white md:text-4xl">
              Framework <span className="italic text-amber-500/90">Preview</span>
            </h1>

            <p className="mt-2 max-w-xl text-sm text-gray-500">
              Streamed via secure session tunnel. Access is logged. Unauthorized distribution is a breach of mandate.
            </p>
          </div>

          <Link
            href="/inner-circle/dashboard"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-amber-500 transition-colors"
          >
            <ArrowLeft size={14} />
            Return to Vault
          </Link>
        </header>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/50">
          <div className="absolute inset-0 -z-10 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-4 text-gray-700">
              <Lock size={40} className="animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-widest">Initialising Secure Stream...</span>
            </div>
          </div>

          <iframe
            title="Institutional Framework Preview"
            src={src}
            className="relative z-10 h-[80vh] w-full border-none"
            loading="lazy"
            referrerPolicy="no-referrer"
            // PDFs do not need scripts. Keep this tight.
            sandbox="allow-same-origin allow-downloads"
          />
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slug = normalizePrivateSlug(ctx.params?.slug);

  if (!slug) return { notFound: true };

  // No caching anywhere for private routes
  ctx.res.setHeader("Cache-Control", "no-store, max-age=0");
  ctx.res.setHeader("Pragma", "no-cache");
  ctx.res.setHeader("Expires", "0");

  try {
    const auth = await getInnerCircleAccess(ctx.req);

    if (!auth?.hasAccess) {
      return {
        redirect: {
          destination: `/inner-circle/locked?returnTo=${encodeURIComponent(ctx.resolvedUrl)}`,
          permanent: false,
        },
      };
    }

    // OPTIONAL: minimum tier for /private/frameworks/*
    // If your auth object includes tier, enforce it.
    const requiredTier: AccessTier = "restricted";
    const userTier = tiers.normalizeUser((auth as any)?.tier ?? "public");

    if (!tiers.hasAccess(userTier, requiredTier)) {
      return {
        redirect: {
          destination: `/inner-circle/locked?reason=INSUFFICIENT_CLEARANCE&returnTo=${encodeURIComponent(
            ctx.resolvedUrl
          )}`,
          permanent: false,
        },
      };
    }

    return { props: { slug, requiredTier } };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[PRIVATE_PREVIEW_SSR_ERROR]", error);
    return {
      redirect: { destination: "/inner-circle/locked?reason=internal_error", permanent: false },
    };
  }
};

export default PrivateFrameworkPreviewPage;