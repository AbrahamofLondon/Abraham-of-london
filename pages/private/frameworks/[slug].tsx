/* pages/private/frameworks/[slug].tsx — PRIVATE PREVIEW
   
   Security logic (auth, SSP, headers, iframe sandbox): UNCHANGED — all correct.
   
   Visual changes:
   - animate-ping / animate-pulse decorative indicators removed
   - "Initializing secure stream" / "Establishing encrypted tunnel..." loading copy removed
   - rounded-full on atmosphere blobs removed (they're decorative divs in a private page
     so rounded is minor, but keeping consistent)
   - bg-zinc-950/50 → rgb(5 5 7) canonical card background
   - text-amber-400/70 italic on headline → standard softGold, no italic
   - amber-500/30 eyebrow tick → softGold token
   - amber-400/70 eyebrow text → softGold token
   - "Encrypted" pulsing dot removed — the real encryption is in the iframe sandbox
     and response headers; a pulsing dot doesn't add security, it performs it
   - h-6 w-px bg-amber-500/30 eyebrow → softGold
   - hover:border-amber-500/30 hover:bg-amber-500/[0.04] on back link → platform ghost CTA
   
   Everything functional — getServerSideProps, auth, iframe, security notice — preserved.
*/

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

const GOLD = "#C9A96E";

type Props = {
  slug: string;
  requiredTier: AccessTier;
  sessionStamp: string;
  viewedAt: string;
};

function normalizePrivateSlug(input: unknown): string {
  const raw = Array.isArray(input) ? input.join("/") : String(input ?? "");
  let s = raw;
  try { s = decodeURIComponent(s); } catch { /* ignore */ }
  s = s.trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "").replace(/\/{2,}/g, "/");
  if (!s || s.includes("..") || s.startsWith(".")) return "";
  const parts = s.split("/").filter(Boolean);
  if (!parts.length || parts.some((p) => p === "." || p === "..")) return "";
  if (!parts.every((p) => /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(p))) return "";
  return parts.join("/");
}

function SecurityBadge({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.5rem",
        border: `1px solid ${GOLD}22`,
        backgroundColor: `${GOLD}06`,
        padding: "4px 12px",
      }}
    >
      <Shield style={{ width: "11px", height: "11px", color: `${GOLD}80` }} />
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7px", letterSpacing: "0.26em", textTransform: "uppercase",
        color: `${GOLD}AA`,
      }}>
        {label}
      </span>
    </div>
  );
}

function MetaSeparator() {
  return <div className="h-3 w-px bg-white/[0.08]" aria-hidden="true" />;
}

const PrivateFrameworkPreviewPage: NextPage<Props> = ({
  slug,
  requiredTier,
  sessionStamp,
  viewedAt,
}) => {
  const src    = `/api/private/frameworks/${encodeURIComponent(slug)}`;
  const label  = tiers.getLabel(requiredTier);
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

        {/* Atmosphere — subtle, no rounded-full blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-[5%] h-80 w-80" style={{ background: `radial-gradient(ellipse at center, ${GOLD}04 0%, transparent 65%)`, filter: "blur(100px)" }} />
          <div className="absolute bottom-[10%] right-[10%] h-64 w-64" style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.012) 0%, transparent 65%)", filter: "blur(80px)" }} />
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)" }} />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-6 py-12 lg:py-16">

          {/* Header */}
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              {/* Eyebrow — softGold (was amber-500/30 + amber-400/70) */}
              <div className="flex items-center gap-3">
                <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
                  color: `${GOLD}BF`,
                }}>
                  Secure Preview
                </span>
              </div>

              {/* Headline — no italic on the accented span (was text-amber-400/70 italic) */}
              <h1 className="font-['Cormorant_Garamond',Georgia,serif] text-4xl font-light text-white md:text-5xl lg:text-6xl">
                Framework
                <span style={{ marginLeft: "0.6rem", color: `${GOLD}AA` }}>Preview</span>
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-white/45">
                Streamed via encrypted session. All access is logged and monitored.
                Unauthorized distribution constitutes breach of institutional mandate.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <SecurityBadge label={label} />
                <SecurityBadge label="Session logged" />
                <SecurityBadge label="Restricted" />
              </div>
            </div>

            {/* Back link — platform ghost CTA (was hover:border-amber-500/30) */}
            <Link
              href="/inner-circle/dashboard"
              className="group flex items-center gap-2 border border-white/10 bg-white/[0.02] px-5 py-3 transition-all duration-300 hover:border-white/18 hover:bg-white/[0.04]"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-white/40 transition-transform group-hover:-translate-x-0.5 group-hover:text-white/70" />
              <span style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8.5px", letterSpacing: "0.22em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)",
              }}
              className="group-hover:[color:rgba(255,255,255,0.72)] transition-colors"
              >
                Return to Vault
              </span>
            </Link>
          </div>

          {/* Viewer */}
          <div
            className="relative overflow-hidden shadow-2xl shadow-black/60"
            style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgb(5 5 7)" }}
          >
            {/* Viewer header bar */}
            <div className="flex flex-col gap-3 border-b border-white/5 bg-black/50 px-6 py-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <FileText style={{ width: "14px", height: "14px", color: `${GOLD}AA` }} />
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

              {/* Status — static indicator, no animation (performance, not security) */}
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `${GOLD}80` }} />
                <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/28">
                  Active
                </span>
              </div>
            </div>

            {/* Loading state — functional, no theatrical animation */}
            {isLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-black/80 backdrop-blur-sm">
                <Lock style={{ width: "32px", height: "32px", color: `${GOLD}80` }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px", letterSpacing: "0.30em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.30)",
                }}>
                  Loading
                </span>
              </div>
            )}

            {/* Iframe — all security attributes preserved */}
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

            {/* Viewer footer bar */}
            <div className="flex flex-col gap-3 border-t border-white/5 bg-black/50 px-6 py-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-3.5 w-3.5 text-white/20" />
                  <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/20">
                    Session: {sessionStamp}
                  </span>
                </div>
                <MetaSeparator />
                <div className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-white/20" />
                  <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/20">
                    Accessed: {viewedAt}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-white/22" />
                <span className="font-mono text-[6px] uppercase tracking-[0.2em] text-white/20">
                  Confidential
                </span>
              </div>
            </div>
          </div>

          {/* Security notice */}
          <div
            style={{
              marginTop: "2rem",
              padding: "1.25rem",
              border: `1px solid ${GOLD}16`,
              backgroundColor: `${GOLD}05`,
              display: "flex", gap: "1rem", alignItems: "flex-start",
            }}
          >
            <ShieldAlert style={{ width: "18px", height: "18px", color: `${GOLD}70`, flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px", letterSpacing: "0.24em", textTransform: "uppercase",
                color: `${GOLD}90`, marginBottom: "0.4rem",
              }}>
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
  console.log("[PAGE_DATA] pages/private/frameworks/[slug].tsx getServerSideProps START");
  try {
  const slug = normalizePrivateSlug(ctx.params?.slug);
  if (!slug) return { notFound: true };

  ctx.res.setHeader("Cache-Control", "no-store, max-age=0");
  ctx.res.setHeader("Pragma", "no-cache");
  ctx.res.setHeader("Expires", "0");
  ctx.res.setHeader("X-Robots-Tag", "noindex, nofollow");

  try {
    const auth = await getInnerCircleAccess(ctx.req);
    if (!auth?.hasAccess) {
      return { redirect: { destination: `/inner-circle/locked?returnTo=${encodeURIComponent(ctx.resolvedUrl)}`, permanent: false } };
    }

    const requiredTier: AccessTier = "restricted";
    const userTier = tiers.normalizeUser((auth as any)?.tier ?? "public");
    if (!tiers.hasAccess(userTier, requiredTier)) {
      return { redirect: { destination: `/inner-circle/locked?reason=INSUFFICIENT_CLEARANCE&returnTo=${encodeURIComponent(ctx.resolvedUrl)}`, permanent: false } };
    }

    const sessionStamp = `SES-${Buffer.from(slug).toString("hex").slice(0, 8).toUpperCase()}`;
    const viewedAt     = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    return { props: { slug, requiredTier, sessionStamp, viewedAt } };
  } catch (error) {
    console.error("[PRIVATE_PREVIEW_SSR_ERROR]", error);
    return { redirect: { destination: "/inner-circle/locked?reason=internal_error", permanent: false } };
  }

  } finally {
    console.log("[PAGE_DATA] pages/private/frameworks/[slug].tsx getServerSideProps END");
  }
};

export default PrivateFrameworkPreviewPage;