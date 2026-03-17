/* pages/private/frameworks/[slug].tsx — PRIVATE PREVIEW (ARCHITECTURAL EDITION) */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  Eye,
  FileText,
  Clock,
  Fingerprint,
  Shield,
  AlertTriangle,
} from "lucide-react";

import tiers from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type Props = {
  slug: string;
  requiredTier: AccessTier;
  sessionStamp: string;
  viewedAt: string;
};

function normalizePrivateSlug(input: unknown): string {
  const raw = Array.isArray(input) ? input.join("/") : String(input ?? "");

  let s = raw;
  try {
    s = decodeURIComponent(s);
  } catch {
    // ignore malformed encoding and continue with raw
  }

  s = s.trim().replace(/\\/g, "/");
  s = s.replace(/^\/+/, "").replace(/\/+$/, "");
  s = s.replace(/\/{2,}/g, "/");

  if (!s) return "";
  if (s.includes("..")) return "";
  if (s.startsWith(".")) return "";

  const parts = s.split("/").filter(Boolean);
  if (!parts.length) return "";
  if (parts.some((p) => p === "." || p === "..")) return "";

  const ok = parts.every((p) => /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(p));
  if (!ok) return "";

  return parts.join("/");
}

function SecurityBadge({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 border border-amber-500/20 bg-amber-500/[0.03] px-3 py-1.5">
      <Shield className="h-3 w-3 text-amber-400/60" />
      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400/70">
        {label}
      </span>
    </div>
  );
}

function MetaSeparator() {
  return <div className="h-3 w-px bg-white/8" aria-hidden="true" />;
}

const PrivateFrameworkPreviewPage: NextPage<Props> = ({
  slug,
  requiredTier,
  sessionStamp,
  viewedAt,
}) => {
  const src = `/api/private/frameworks/${encodeURIComponent(slug)}`;
  const label = tiers.getLabel(requiredTier);
  const [isLoading, setIsLoading] = React.useState(true);
  const frameRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Layout title="Private Framework Preview" className="bg-black text-white" fullWidth>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="referrer" content="same-origin" />
      </Head>

      <main className="relative min-h-screen bg-black">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-[5%] h-[20rem] w-[20rem] rounded-full bg-amber-500/[0.02] blur-[100px]" />
          <div className="absolute bottom-[10%] right-[10%] h-[15rem] w-[15rem] rounded-full bg-white/[0.01] blur-[80px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-6 py-12 lg:py-16">
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-px bg-amber-500/30" />
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/70">
                  Secure Preview
                </span>
              </div>

              <h1 className="font-serif text-4xl font-light tracking-tight text-white md:text-5xl lg:text-6xl">
                Framework
                <span className="ml-3 text-amber-400/70 italic">Preview</span>
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-white/50">
                Streamed via encrypted session tunnel. All access is logged and monitored.
                Unauthorized distribution constitutes breach of institutional mandate.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <SecurityBadge label={label} />
                <SecurityBadge label="End-to-end encrypted" />
                <SecurityBadge label="Session logged" />
              </div>
            </div>

            <Link
              href="/inner-circle/dashboard"
              className="group flex items-center gap-2 border border-white/10 bg-white/[0.02] px-5 py-3 transition-all duration-300 hover:border-amber-500/30 hover:bg-amber-500/[0.04]"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-white/40 transition-transform group-hover:-translate-x-1 group-hover:text-amber-400" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/50 group-hover:text-amber-400">
                Return to Vault
              </span>
            </Link>
          </div>

          <div className="relative overflow-hidden border border-white/10 bg-zinc-950/50 shadow-2xl shadow-black/60 backdrop-blur-sm">
            <div className="flex flex-col gap-3 border-b border-white/5 bg-black/50 px-6 py-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-400/60" />
                  <span className="font-mono text-[10px] text-white/60">
                    {slug.split("/").pop() || slug}
                  </span>
                </div>

                <MetaSeparator />

                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-white/30" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/30">
                    Live session
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500/60" />
                <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/30">
                  Encrypted
                </span>
              </div>
            </div>

            {isLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-black/80 backdrop-blur-sm">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-amber-500/20" />
                  <Lock className="relative h-10 w-10 text-amber-400/60" />
                </div>

                <div className="space-y-2 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
                    Initializing secure stream
                  </p>
                  <p className="text-xs text-white/20">
                    Establishing encrypted tunnel...
                  </p>
                </div>
              </div>
            )}

            <iframe
              ref={frameRef}
              title="Institutional Framework Preview"
              src={src}
              className="relative z-10 h-[70vh] w-full border-none md:h-[75vh]"
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox="allow-same-origin allow-downloads"
              onLoad={() => setIsLoading(false)}
            />

            <div className="flex flex-col gap-3 border-t border-white/5 bg-black/50 px-6 py-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-3.5 w-3.5 text-white/20" />
                  <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/20">
                    Session ID: {sessionStamp}
                  </span>
                </div>

                <MetaSeparator />

                <div className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-white/20" />
                  <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/20">
                    Viewing: {viewedAt}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500/30" />
                <span className="font-mono text-[6px] uppercase tracking-[0.2em] text-white/20">
                  Confidential
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-start gap-4 border border-amber-500/10 bg-amber-500/[0.02] p-5">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400/50" />
            <div className="space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber-400/60">
                Institutional Access Protocol
              </p>
              <p className="text-xs leading-relaxed text-white/40">
                This document is protected under institutional mandate. Access is logged,
                monitored, and restricted to authorized personnel. Any unauthorized
                distribution or reproduction constitutes breach of trust and may result
                in immediate revocation of access privileges.
              </p>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slug = normalizePrivateSlug(ctx.params?.slug);

  if (!slug) return { notFound: true };

  ctx.res.setHeader("Cache-Control", "no-store, max-age=0");
  ctx.res.setHeader("Pragma", "no-cache");
  ctx.res.setHeader("Expires", "0");
  ctx.res.setHeader("X-Robots-Tag", "noindex, nofollow");

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

    const requiredTier: AccessTier = "restricted";
    const userTier = tiers.normalizeUser((auth as any)?.tier ?? "public");

    if (!tiers.hasAccess(userTier, requiredTier)) {
      return {
        redirect: {
          destination: `/inner-circle/locked?reason=INSUFFICIENT_CLEARANCE&returnTo=${encodeURIComponent(
            ctx.resolvedUrl,
          )}`,
          permanent: false,
        },
      };
    }

    const sessionStamp = `SES-${Buffer.from(slug).toString("hex").slice(0, 8).toUpperCase()}`;
    const viewedAt = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      props: {
        slug,
        requiredTier,
        sessionStamp,
        viewedAt,
      },
    };
  } catch (error) {
    console.error("[PRIVATE_PREVIEW_SSR_ERROR]", error);
    return {
      redirect: {
        destination: "/inner-circle/locked?reason=internal_error",
        permanent: false,
      },
    };
  }
};

export default PrivateFrameworkPreviewPage;