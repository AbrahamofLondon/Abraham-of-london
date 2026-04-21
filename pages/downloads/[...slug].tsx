/* pages/downloads/[...slug].tsx — Commercial Download Page */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Lock, Shield, FileText } from "lucide-react";
import Layout from "@/components/Layout";

import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import ClientUnlockRenderer from "@/components/content/ClientUnlockRenderer";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";
import { getRenderableBody } from "@/lib/content/render-body";

import { getMdxDocumentBySlug } from "@/lib/server/mdx-collections";
import {
  assertPdfAssetIdentity,
  pdfAccessToRequiredTier,
  type PdfAssetIdentityResolved,
} from "@/lib/assets/pdf-identity";

const GOLD = "#C9A96E";

/** Price map for paid assets (pence → display) */
const PAID_ASSET_PRICES: Record<string, { amount: number; display: string; justification: string }> = {
  "global-market-intelligence-report-q1-2026": {
    amount: 5900,
    display: "£59",
    justification: "Decision-support intelligence brief for operators navigating structural fragmentation.",
  },
  "global-market-intelligence-board-deck-q1-2026": {
    amount: 4500,
    display: "£45",
    justification: "Board-grade intelligence designed for environments where decisions carry weight.",
  },
};

const DEFAULT_PAID_PRICE = {
  amount: 0,
  display: "Paid",
  justification: "Part of the paid decision layer. Used where clarity matters more than convenience.",
};

type Props = {
  slug: string;
  title: string;
  requiredTier: AccessTier;
  bodyCode: string | null;
  identity: PdfAssetIdentityResolved;
  subtitle?: string;
  description?: string;
  price?: { display: string; justification: string } | null;
};

function cleanSlug(input: unknown): string {
  const raw = Array.isArray(input) ? input.join("/") : String(input ?? "");
  const s = raw
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
  if (!s || s.includes("..")) return "";
  return s;
}

const CATEGORY_LABELS: Record<string, string> = {
  framework: "Framework",
  worksheet: "Worksheet",
  playbook: "Playbook",
  brief: "Intelligence Brief",
  report: "Report",
  toolkit: "Toolkit",
};

const ACCESS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; cta: string }> = {
  public: {
    label: "Available now",
    color: "rgba(110,231,183,0.80)",
    bg: "rgba(110,231,183,0.06)",
    border: "rgba(110,231,183,0.20)",
    cta: "Access the framework",
  },
  inner_circle: {
    label: "Included in Inner Circle",
    color: `${GOLD}CC`,
    bg: `${GOLD}08`,
    border: `${GOLD}25`,
    cta: "Unlock with Inner Circle access",
  },
  paid: {
    label: "Unlock access",
    color: `${GOLD}CC`,
    bg: `${GOLD}08`,
    border: `${GOLD}25`,
    cta: "Unlock this resource",
  },
  restricted: {
    label: "Request access required",
    color: "rgba(255,255,255,0.45)",
    bg: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.10)",
    cta: "Request access",
  },
};

const VALUE_LINES: Record<string, string> = {
  framework: "A working structure, not a template. Designed for decision environments where instinct alone is not enough.",
  worksheet: "A structured tool for converting thinking into governed action.",
  playbook: "Operational logic for situations that cannot afford improvisation.",
  brief: "Compressed institutional intelligence. Read once, act on immediately.",
  report: "Decision-grade analysis designed for boards, operators, and principals.",
  toolkit: "A complete working set for structured assessment and correction.",
};

const Page: NextPage<Props> = ({ slug, title, requiredTier, bodyCode, identity, subtitle, description, price }) => {
  const isPublic = requiredTier === "public";
  const isPaid = identity.access === "paid";
  const access = ACCESS_CONFIG[identity.access] || ACCESS_CONFIG.public!;
  const categoryLabel = CATEGORY_LABELS[identity.category] || identity.category;
  const valueLine = description || VALUE_LINES[identity.category] || "Designed for serious use in decision-grade environments.";
  const paidLabel = isPaid && price ? `${price.display} — Unlock access` : access.label;
  const paidCta = isPaid && price ? `Unlock this resource — ${price.display}` : access.cta;

  return (
    <Layout
      title={`${title} | Abraham of London`}
      description={valueLine}
      canonicalUrl={`/downloads/${slug}`}
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <meta name="robots" content={isPublic ? "index,follow" : "noindex,nofollow"} />
      </Head>

      <main className="min-h-screen px-6 py-16 md:py-24" style={{ backgroundColor: "var(--ds-background)", color: "var(--ds-text)" }}>
        <div className="mx-auto max-w-4xl">

          {/* Asset framing */}
          <div className="flex items-center gap-3 mb-2">
            <span className="h-px w-8" style={{ backgroundColor: `${GOLD}50` }} />
            <span
              className="font-mono uppercase"
              style={{ fontSize: "8px", letterSpacing: "0.34em", color: `${GOLD}90` }}
            >
              {categoryLabel}
            </span>
          </div>

          <h1
            className="font-['Cormorant_Garamond',Georgia,serif] font-light"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.05, color: "var(--ds-text)" }}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className="mt-2 font-['Cormorant_Garamond',Georgia,serif] font-light italic"
              style={{ fontSize: "1.05rem", lineHeight: 1.5, color: "var(--ds-text-muted)" }}
            >
              {subtitle}
            </p>
          )}

          {/* Value layer */}
          <p
            className="mt-4 max-w-[56ch]"
            style={{ fontSize: "14.5px", lineHeight: 1.7, color: "var(--ds-text-muted)" }}
          >
            {valueLine}
          </p>

          {/* Access state + CTA */}
          <div
            className="mt-8 flex flex-wrap items-center justify-between gap-4 border p-5"
            style={{ borderColor: access.border, backgroundColor: access.bg }}
          >
            <div className="flex items-center gap-3">
              {isPublic ? (
                <FileText className="h-4 w-4" style={{ color: access.color }} />
              ) : (
                <Lock className="h-4 w-4" style={{ color: access.color }} />
              )}
              <span
                className="font-mono uppercase"
                style={{ fontSize: "8px", letterSpacing: "0.28em", color: access.color }}
              >
                {isPaid ? paidLabel : access.label}
              </span>
            </div>

            {isPublic ? (
              <a
                href={`/api/downloads/resolve/${encodeURIComponent(identity.slug)}`}
                className="inline-flex items-center gap-2 border px-5 py-2.5 transition-all hover:opacity-80"
                style={{
                  borderColor: `${GOLD}40`,
                  backgroundColor: `${GOLD}0D`,
                  color: `${GOLD}CC`,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                {access.cta}
                <ArrowRight className="h-3 w-3" />
              </a>
            ) : identity.access === "inner_circle" ? (
              <Link
                href="/inner-circle"
                className="inline-flex items-center gap-2 border px-5 py-2.5 transition-all hover:opacity-80"
                style={{
                  borderColor: `${GOLD}40`,
                  backgroundColor: `${GOLD}0D`,
                  color: `${GOLD}CC`,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                {access.cta}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ) : isPaid ? (
              <Link
                href={`/access?asset=${encodeURIComponent(slug)}`}
                className="inline-flex items-center gap-2 border px-5 py-2.5 transition-all hover:opacity-80"
                style={{
                  borderColor: `${GOLD}40`,
                  backgroundColor: `${GOLD}0D`,
                  color: `${GOLD}CC`,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                {paidCta}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ) : (
              <Link
                href="/access"
                className="inline-flex items-center gap-2 border px-5 py-2.5 transition-all hover:opacity-80"
                style={{
                  borderColor: "var(--ds-border)",
                  color: "var(--ds-text-muted)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                {access.cta}
                <Shield className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Pricing justification (paid assets only) */}
          {isPaid && price?.justification && (
            <p
              className="mt-3 max-w-[56ch]"
              style={{ fontSize: "12.5px", lineHeight: 1.7, color: "var(--ds-text-muted)", fontStyle: "italic" }}
            >
              {price.justification}
            </p>
          )}

          {/* Inner Circle alternative path for paid assets */}
          {isPaid && (
            <p className="mt-2 font-mono" style={{ fontSize: "7.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ds-text-subtle)" }}>
              Also available through{" "}
              <Link href="/inner-circle" style={{ color: `${GOLD}90`, textDecoration: "underline", textUnderlineOffset: "3px" }}>
                Inner Circle access
              </Link>
              {" "}· Continuous access without per-asset cost
            </p>
          )}

          {/* Authority line */}
          <p
            className={isPaid ? "mt-2 font-mono" : "mt-3 font-mono"}
            style={{ fontSize: "7.5px", letterSpacing: "0.20em", textTransform: "uppercase", color: "var(--ds-text-subtle)" }}
          >
            Designed for decision environments · Part of the Abraham of London system
          </p>

          {/* Content body */}
          <div className="mt-12">
            {isPublic ? (
              bodyCode ? (
                <SafeMDXRenderer code={bodyCode} />
              ) : (
                <div className="border p-6" style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)" }}>
                  <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--ds-text-muted)" }}>
                    This resource is available through the download system.
                  </p>
                  <a
                    href={`/api/downloads/resolve/${encodeURIComponent(slug)}`}
                    className="mt-4 inline-flex items-center gap-2 transition-all"
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8.5px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: `${GOLD}CC`,
                    }}
                  >
                    Access the framework
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              )
            ) : (
              <ClientUnlockRenderer
                slug={`downloads/${slug}`}
                requiredTier={requiredTier}
                initialCode={null}
              />
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({
  params,
}) => {
  const slug = cleanSlug(params?.slug);
  if (!slug) return { notFound: true };

  let identity: PdfAssetIdentityResolved;
  try {
    identity = assertPdfAssetIdentity(slug);
  } catch {
    return { notFound: true };
  }

  const doc = await getMdxDocumentBySlug("downloads", slug);

  const identityTier = pdfAccessToRequiredTier(identity.access);
  const requiredTier = tiers.normalizeRequired(identityTier || (doc ? requiredTierFromDoc(doc as Parameters<typeof requiredTierFromDoc>[0]) : "public"));
  const isPublic = requiredTier === "public";

  const priceEntry = PAID_ASSET_PRICES[identity.slug] || (identity.access === "paid" ? DEFAULT_PAID_PRICE : null);

  return {
    props: {
      slug: identity.slug,
      title: identity.title,
      requiredTier,
      bodyCode: isPublic && doc ? getRenderableBody(doc).code : null,
      identity,
      subtitle: (doc as any)?.subtitle ?? null,
      description: (doc as any)?.description ?? identity.description ?? null,
      price: priceEntry ? { display: priceEntry.display, justification: priceEntry.justification } : null,
    },
  };
};

export default Page;
