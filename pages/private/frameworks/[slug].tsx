/* pages/private/frameworks/[slug].tsx — PRIVATE PREVIEW (INTEGRITY MODE) */
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import { ShieldAlert, Lock, ArrowLeft } from "lucide-react";

type Props = { slug: string };

function normalizePrivateSlug(input: string): string {
  // 1) decode safely (if already decoded, keep original)
  let s = input ?? "";
  try {
    s = decodeURIComponent(s);
  } catch {
    // ignore decoding errors; keep raw input
  }

  // 2) trim + remove surrounding slashes
  s = s.trim().replace(/^\/+/, "").replace(/\/+$/, "");

  // 3) forbid traversal and backslashes
  if (!s || s.includes("..") || s.includes("\\") || s.startsWith(".")) return "";

  // 4) allow only safe path chars (tighten if you want)
  // permits nested slugs: abc/def-123
  const ok = /^[a-zA-Z0-9/_-]+$/.test(s);
  if (!ok) return "";

  // 5) collapse duplicate slashes
  s = s.replace(/\/{2,}/g, "/");

  return s;
}

const PrivateFrameworkPreviewPage: NextPage<Props> = ({ slug }) => {
  // Use the established private API route for streaming the asset
  const src = `/api/private/frameworks/${encodeURIComponent(slug)}`;

  return (
    <Layout title="Private Framework Preview">
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="mx-auto w-full max-w-6xl px-4 py-12 lg:py-20">
        <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1">
              <ShieldAlert size={12} className="text-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                Internal Restricted Asset
              </span>
            </div>

            <h1 className="font-serif text-3xl font-semibold text-white md:text-4xl">
              Framework <span className="italic text-gold/90">Preview</span>
            </h1>

            <p className="mt-2 max-w-xl text-sm text-gray-500">
              Streamed via secure session tunnel. Access is logged and audited.
              Unauthorized distribution is a breach of institutional mandate.
            </p>
          </div>

          <Link
            href="/inner-circle/dashboard"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gold transition-colors"
          >
            <ArrowLeft size={14} />
            Return to Vault
          </Link>
        </header>

        {/* SECURE VIEWPORT */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/50">
          <div className="absolute inset-0 -z-10 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-4 text-gray-700">
              <Lock size={40} className="animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-widest">
                Initialising Secure Stream...
              </span>
            </div>
          </div>

          <iframe
            title="Institutional Framework Preview"
            src={src}
            className="relative z-10 h-[80vh] w-full border-none"
            loading="lazy"
            referrerPolicy="no-referrer"
            // keep it tight; expand only if your PDF viewer needs more
            sandbox="allow-same-origin allow-scripts allow-downloads"
          />
        </div>
      </main>
    </Layout>
  );
};

/**
 * SERVER SIDE: POSTGRES ACCESS ENFORCEMENT
 */
export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const rawSlug = String(ctx.params?.slug ?? "");
  const slug = normalizePrivateSlug(rawSlug);

  if (!slug) return { notFound: true };

  // Prevent CDN/proxy caching for restricted pages
  ctx.res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  try {
    // 1) Establish session integrity via Postgres (or your source of truth)
    const auth = await getInnerCircleAccess(ctx.req);

    // 2) UX redirect: guests go to join/locked with returnTo
    if (!auth?.hasAccess) {
      return {
        redirect: {
          destination: `/inner-circle/locked?returnTo=${encodeURIComponent(ctx.resolvedUrl)}`,
          permanent: false,
        },
      };
    }

    // 3) Optional: enforce a minimum tier/role for /private/*
    // If your auth object has tier/role, enforce it here.
    // Example:
    // if (auth.tier !== "private" && auth.role !== "founder") { ... }

    return { props: { slug } };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[PRIVATE_PREVIEW_SSR_ERROR]", error);

    return {
      redirect: {
        destination: "/inner-circle/locked",
        permanent: false,
      },
    };
  }
};

export default PrivateFrameworkPreviewPage;