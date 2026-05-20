/**
 * pages/intelligence/market.tsx — MARKET INTELLIGENCE LANDING v2
 *
 * Dedicated quarterly reports catalogue. Related public briefs are
 * secondary notes beneath the report line. Access boundaries are enforced
 * at card level; restricted materials are described, not exposed.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";

import Layout from "@/components/Layout";
import { getAllBriefs } from "@/lib/content/server";
import { getPremiumContentList } from "@/lib/premium/content-registry";
import {
  normalizeRequiredTier,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";
import {
  getMarketIntelligenceFreshnessLabel,
  getMarketIntelligenceLifecycleBadge,
  getMarketIntelligenceRecord,
  MARKET_INTELLIGENCE_LIFECYCLE,
} from "@/lib/intelligence/market-intelligence-lifecycle";
import { getEditionsForReport } from "@/lib/intelligence/market-intelligence-editions";
import { MarketIntelligenceCatalogue } from "@/components/Intelligence/MarketIntelligenceCatalogue";
import { MarketIntelligenceChronology } from "@/components/Intelligence/MarketIntelligenceChronology";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const GOLD  = "#C9A96E";
const BASE  = "rgb(3,3,5)";
const mono: React.CSSProperties  = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ArtifactAccess = "public" | "restricted" | "board";
type ArtifactFormat = "briefing" | "pdf" | "deck" | "document";
type ArtifactStatus = "available" | "restricted" | "archive";

type ArtifactItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  edition: string;
  editionType: string;
  access: ArtifactAccess;
  format: ArtifactFormat;
  status: ArtifactStatus;
  classification: string;
  primaryHref: string;
  primaryLabel: string;
  metaHref: string;
  coveragePeriod?: string;
  currentDecisionWindow?: string;
  updatedAt?: string;
  statusLabel?: string;
  nextScheduledReport?: string;
  freshnessLabel?: string;
  freshnessNote?: string;
};

type BriefItem = {
  title: string;
  href: string;
  description: string;
  access: "public" | "member" | "restricted" | "other";
  isPublicRoute: boolean;
  routeStatus: "readable" | "metadata_only" | "request_access";
  actionLabel: "Read public brief" | "View restricted metadata" | "Request access";
};

type Props = {
  briefs: BriefItem[];
  artifacts: ArtifactItem[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
function safeStr(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function formatDateLabel(value: string): string {
  if (value === "2026-04-08") return "8 April 2026";
  return value;
}

function normalizeSlug(value: unknown): string {
  return safeStr(value)
    .replace(/^\/+|\/+$/g, "")
    .replace(/^briefs\//i, "");
}

function isPublicBrief(doc: any): boolean {
  if (!doc || doc.draft === true || doc.published === false) return false;
  if (safeStr(doc?.status).toLowerCase() !== "canonical") return false;
  const tier = normalizeRequiredTier(requiredTierFromDoc(doc));
  return tier === "public";
}

function briefAccess(doc: any): BriefItem["access"] {
  const tier = normalizeRequiredTier(requiredTierFromDoc(doc));
  if (tier === "public")  return "public";
  if (tier === "member")  return "member";
  if (tier === "restricted") return "restricted";
  return "other";
}

function editionTypeToAccess(editionType: string, classification: string): ArtifactAccess {
  if (editionType === "board-deck")      return "board";
  if (classification === "PUBLIC")       return "public";
  return "restricted";
}

function editionTypeToFormat(editionType: string): ArtifactFormat {
  if (editionType === "institutional-pdf") return "pdf";
  if (editionType === "board-deck")        return "deck";
  if (editionType === "public-surface")    return "briefing";
  return "document";
}

function editionTypeToStatus(access: ArtifactAccess): ArtifactStatus {
  if (access === "public") return "available";
  return "restricted";
}

function editionTypeToLabel(editionType: string): string {
  if (editionType === "institutional-pdf") return "Institutional PDF";
  if (editionType === "board-deck")        return "Board Briefing Deck";
  if (editionType === "public-surface")    return "Public Surface Edition";
  return "Intelligence Artifact";
}

function lifecycleIdForArtifact(id: string): string | null {
  if (
    id === "global-market-outlook-q1-2026-public" ||
    id === "global-market-intelligence-report-q1-2026" ||
    id === "global-market-intelligence-board-deck-q1-2026"
  ) {
    return "GMI-Q1-2026";
  }

  return null;
}

function primaryCta(access: ArtifactAccess, editionType: string): { label: string; href: string } | null {
  if (access === "public")  return { label: "Read public briefing", href: "" }; // filled per item
  if (access === "board")   return { label: "Request access", href: "/inner-circle" };
  return { label: "View artifact metadata", href: "" }; // filled per item
}

// ─────────────────────────────────────────────────────────────────────────────
// getStaticProps
// ─────────────────────────────────────────────────────────────────────────────

export const getStaticProps: GetStaticProps<Props> = async () => {
  // ── Quarterly intelligence artifacts ────────────────────────────────────
  const ARTIFACT_IDS = [
    "global-market-outlook-q1-2026-public",
    "global-market-intelligence-report-q1-2026",
    "global-market-intelligence-board-deck-q1-2026",
  ] as const;

  const artifacts: ArtifactItem[] = getPremiumContentList()
    .filter((item) => ARTIFACT_IDS.includes(item.id as typeof ARTIFACT_IDS[number]))
    .map((item) => {
      const lifecycleRecord = lifecycleIdForArtifact(item.id)
        ? getMarketIntelligenceRecord(lifecycleIdForArtifact(item.id)!)
        : null;
      const lifecycleBadge = lifecycleRecord ? getMarketIntelligenceLifecycleBadge(lifecycleRecord) : null;
      const editionType  = safeStr(item.metadata?.editionType, "document");
      const classification = safeStr(item.metadata?.classification, "RESTRICTED");
      const access       = editionTypeToAccess(editionType, classification);
      const format       = editionTypeToFormat(editionType);
      const status       = editionTypeToStatus(access);
      const edition      = editionTypeToLabel(editionType);
      const metaHref     = `/artifacts/${item.id}`;
      const surfaceHref  = safeStr(item.metadata?.surfaceHref);

      let primaryLabel: string;
      let primaryHref: string;
      if (access === "public") {
        primaryLabel = "Read public briefing";
        primaryHref  = surfaceHref || metaHref;
      } else if (access === "board") {
        primaryLabel = "Request access";
        primaryHref  = "/inner-circle";
      } else if (item.id === "global-market-intelligence-report-q1-2026") {
        primaryLabel = "Access institutional edition";
        primaryHref = metaHref;
      } else {
        primaryLabel = "View artifact metadata";
        primaryHref  = metaHref;
      }

      return {
        id: item.id,
        title: safeStr(item.title, "Untitled artifact"),
        subtitle: safeStr(item.subtitle),
        description: safeStr(item.description, "Quarterly intelligence artifact."),
        edition,
        editionType,
        access,
        format,
        status,
        classification,
        primaryHref,
        primaryLabel,
        metaHref,
        coveragePeriod: lifecycleRecord?.coveragePeriod ?? safeStr(item.metadata?.coveragePeriod),
        currentDecisionWindow: lifecycleRecord?.decisionWindow ?? safeStr(item.metadata?.currentDecisionWindow),
        updatedAt: lifecycleRecord?.updatedAt ?? safeStr(item.metadata?.updatedAt || item.metadata?.createdAt),
        statusLabel: lifecycleBadge?.label ?? safeStr(item.metadata?.statusLabel),
        nextScheduledReport: lifecycleRecord?.nextExpected === "GMI-Q2-2026"
          ? "Q2 2026 report in preparation"
          : safeStr(item.metadata?.nextScheduledReport),
        freshnessLabel: lifecycleRecord
          ? getMarketIntelligenceFreshnessLabel(lifecycleRecord)
          : safeStr(item.metadata?.freshnessNote),
        freshnessNote: lifecycleRecord?.freshnessNote ?? safeStr(item.metadata?.freshnessNote),
      };
    })
    // Sort: public first, then restricted, then board
    .sort((a, b) => {
      const rank = (x: ArtifactItem) => x.access === "public" ? 0 : x.access === "restricted" ? 1 : 2;
      return rank(a) - rank(b);
    });

  // ── Related public briefs ────────────────────────────────────────────────
  const briefs: BriefItem[] = (getAllBriefs() as any[])
    .filter((doc) => doc?.draft !== true && doc?.published !== false)
    .slice(0, 8)
    .map((doc) => {
      const slug    = normalizeSlug(doc.slug || doc.urlSlug || doc._raw?.flattenedPath);
      const pub     = isPublicBrief(doc);
      const access  = briefAccess(doc);
      const href    = pub && slug ? `/briefs/${slug}` : "#";

      return {
        title: safeStr(doc.title, "Untitled brief"),
        href,
        description: safeStr(doc.description || doc.summary || doc.excerpt, "Strategic brief."),
        access,
        isPublicRoute: pub && !!slug,
        routeStatus: pub && !!slug ? "readable" : access === "restricted" ? "metadata_only" : "request_access",
        actionLabel:
          pub && !!slug
            ? "Read public brief"
            : access === "restricted"
              ? "View restricted metadata"
              : "Request access",
      };
    });

  return { props: { briefs, artifacts }, revalidate: 1800 };
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const ACCESS_BADGE: Record<ArtifactAccess, { label: string; color: string; border: string; bg: string }> = {
  public:     { label: "Public",     color: "rgba(34,197,94,0.85)",  border: "rgba(34,197,94,0.20)",  bg: "rgba(34,197,94,0.06)"  },
  restricted: { label: "Restricted", color: "rgba(245,158,11,0.85)", border: "rgba(245,158,11,0.20)", bg: "rgba(245,158,11,0.06)" },
  board:      { label: "Board",      color: `${GOLD}CC`,             border: `${GOLD}30`,             bg: `${GOLD}08`             },
};

const FORMAT_LABEL: Record<ArtifactFormat, string> = {
  briefing: "Briefing", pdf: "PDF", deck: "Deck", document: "Document",
};

const STATUS_LABEL: Record<ArtifactStatus, { text: string; color: string }> = {
  available:  { text: "Available",  color: "rgba(34,197,94,0.60)"  },
  restricted: { text: "Restricted", color: "rgba(245,158,11,0.60)" },
  archive:    { text: "Archive",    color: "rgba(255,255,255,0.30)" },
};

const EDITION_ACCENT: Record<string, string> = {
  "public-surface":   "rgba(34,197,94,0.35)",
  "institutional-pdf": "rgba(245,158,11,0.35)",
  "board-deck":       `${GOLD}60`,
};

function Badge({ label, color, border, bg }: { label: string; color: string; border: string; bg: string }) {
  return (
    <span
      style={{
        ...mono,
        fontSize: "7px",
        letterSpacing: "0.20em",
        textTransform: "uppercase",
        color,
        border: `1px solid ${border}`,
        backgroundColor: bg,
        padding: "2px 7px",
        display: "inline-block",
      }}
    >
      {label}
    </span>
  );
}

function ArtifactCard({ artifact }: { artifact: ArtifactItem }) {
  const ab      = ACCESS_BADGE[artifact.access];
  const accent  = EDITION_ACCENT[artifact.editionType] ?? "rgba(255,255,255,0.20)";
  const status  = STATUS_LABEL[artifact.status];
  const isRestricted = artifact.access !== "public";

  return (
    <article
      style={{
        borderLeft: `2px solid ${accent}`,
        paddingLeft: "16px",
        paddingTop: "4px",
        paddingBottom: "4px",
        opacity: isRestricted ? 0.88 : 1,
      }}
    >
      {/* Edition + badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
          {artifact.edition}
        </span>
        <Badge label={ab.label} color={ab.color} border={ab.border} bg={ab.bg} />
        <Badge
          label={FORMAT_LABEL[artifact.format]}
          color="rgba(255,255,255,0.40)"
          border="rgba(255,255,255,0.10)"
          bg="rgba(255,255,255,0.03)"
        />
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: status.color }}>
          {status.text}
        </span>
      </div>

      {/* Title */}
      <p className="mt-2 text-base leading-snug" style={{ color: isRestricted ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.92)", fontWeight: 400 }}>
        {artifact.title}
      </p>
      {artifact.subtitle ? (
        <p className="mt-0.5 text-sm" style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.30)", letterSpacing: "0.06em" }}>
          {artifact.subtitle}
        </p>
      ) : null}

      {/* Description */}
      <p className="mt-2 text-sm leading-6 text-white/50">{artifact.description}</p>

      {artifact.currentDecisionWindow ? (
        <p className="mt-2 text-xs" style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", color: `${GOLD}AA`, textTransform: "uppercase" }}>
          Current decision window: {artifact.currentDecisionWindow}
        </p>
      ) : null}

      {/* Restricted notice */}
      {isRestricted && (
        <p className="mt-2 text-xs" style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", color: "rgba(245,158,11,0.55)", textTransform: "uppercase" }}>
          {artifact.access === "board" ? "Board-grade material. Institutional access required." : "Restricted record. Metadata available on request."}
        </p>
      )}

      {/* Primary action */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {artifact.access === "public" ? (
          <Link
            href={artifact.primaryHref}
            className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
            style={{ color: "rgba(34,197,94,0.85)" }}
          >
            <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.20em", textTransform: "uppercase" }}>
              {artifact.primaryLabel}
            </span>
            <span aria-hidden="true" style={{ fontSize: "10px" }}>→</span>
          </Link>
        ) : artifact.access === "board" ? (
          <Link
            href="/inner-circle"
            className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
            style={{ color: `${GOLD}CC` }}
          >
            <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.20em", textTransform: "uppercase" }}>
              Request access
            </span>
            <span aria-hidden="true" style={{ fontSize: "10px" }}>→</span>
          </Link>
        ) : (
          <Link
            href={artifact.primaryHref}
            className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
            style={{ color: "rgba(245,158,11,0.75)" }}
          >
            <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.20em", textTransform: "uppercase" }}>
              {artifact.primaryLabel}
            </span>
            <span aria-hidden="true" style={{ fontSize: "10px" }}>→</span>
          </Link>
        )}
      </div>
    </article>
  );
}

const BRIEF_ACCESS_BADGE = {
  public:     { label: "Public",     color: "rgba(34,197,94,0.80)",  border: "rgba(34,197,94,0.18)",  bg: "rgba(34,197,94,0.05)"  },
  member:     { label: "Member",     color: "rgba(59,130,246,0.80)", border: "rgba(59,130,246,0.18)", bg: "rgba(59,130,246,0.05)" },
  restricted: { label: "Restricted", color: "rgba(245,158,11,0.80)", border: "rgba(245,158,11,0.18)", bg: "rgba(245,158,11,0.05)" },
  other:      { label: "Archive",    color: "rgba(255,255,255,0.30)", border: "rgba(255,255,255,0.10)", bg: "rgba(255,255,255,0.02)" },
};

const BRIEF_ROUTE_BADGE = {
  readable: { label: "Readable", color: "rgba(34,197,94,0.70)", border: "rgba(34,197,94,0.16)", bg: "rgba(34,197,94,0.04)" },
  metadata_only: { label: "Metadata only", color: "rgba(245,158,11,0.70)", border: "rgba(245,158,11,0.16)", bg: "rgba(245,158,11,0.04)" },
  request_access: { label: "Access route", color: "rgba(255,255,255,0.32)", border: "rgba(255,255,255,0.08)", bg: "rgba(255,255,255,0.02)" },
};

function BriefCard({ brief }: { brief: BriefItem }) {
  const ab = BRIEF_ACCESS_BADGE[brief.access];
  const rb = BRIEF_ROUTE_BADGE[brief.routeStatus];
  const isReadable = brief.isPublicRoute;

  return (
    <article style={{ borderLeft: "1px solid rgba(201,169,110,0.22)", paddingLeft: "14px" }}>
      <div className="mb-1.5">
        <Badge
          label="Brief"
          color="rgba(255,255,255,0.40)"
          border="rgba(255,255,255,0.10)"
          bg="rgba(255,255,255,0.03)"
        />
        <Badge label={ab.label} color={ab.color} border={ab.border} bg={ab.bg} />
        <Badge label={rb.label} color={rb.color} border={rb.border} bg={rb.bg} />
      </div>

      {isReadable ? (
        <Link
          href={brief.href}
          className="block text-sm leading-snug transition-colors hover:text-white"
          style={{ color: "rgba(255,255,255,0.82)" }}
        >
          {brief.title}
        </Link>
      ) : (
        <p className="text-sm leading-snug" style={{ color: "rgba(255,255,255,0.50)" }}>
          {brief.title}
        </p>
      )}

      <p className="mt-1.5 text-sm leading-6 text-white/45">{brief.description}</p>

      <div className="mt-2">
        {isReadable ? (
          <Link
            href={brief.href}
            className="inline-flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.50)", ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            {brief.actionLabel}
            <span aria-hidden="true" style={{ fontSize: "9px" }}>→</span>
          </Link>
        ) : brief.access === "restricted" ? (
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,158,11,0.45)" }}>
            {brief.actionLabel}
          </span>
        ) : (
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
            {brief.actionLabel}
          </span>
        )}
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const GMI_Q1_RECORD = getMarketIntelligenceRecord("GMI-Q1-2026");
const GMI_Q1_EDITIONS = getEditionsForReport("GMI-Q1-2026");
const GMI_Q2_RECORD = getMarketIntelligenceRecord("GMI-Q2-2026");

const EVIDENCE_POSTURES = [
  {
    label: "Confirmed",
    text: "Supported by source evidence or observed market data.",
  },
  {
    label: "Directional",
    text: "Supported by evidence, but not settled enough to treat as final.",
  },
  {
    label: "Monitoring",
    text: "Important but not yet strong enough for a firm conclusion.",
  },
  {
    label: "Scenario assumption",
    text: "Used for planning, not prediction.",
  },
] as const;

const IntelligenceMarketPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  briefs,
  artifacts,
}) => {
  return (
    <Layout
      title="Market Intelligence Reports | Abraham of London"
      description="Quarterly Global Market Intelligence reports catalogue: active report, access editions, report chronology, methodology, and secondary intelligence notes."
      canonicalUrl="/intelligence/market"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main
        className="min-h-screen px-6 py-24"
        style={{ backgroundColor: BASE, color: "white", paddingBottom: "6rem" }}
      >
        <div className="mx-auto max-w-6xl space-y-10">

          {/* ── Page header ─────────────────────────────────────────────── */}
          <header
            style={{
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.02)",
              padding: "1.5rem",
            }}
          >
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Quarterly intelligence desk
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(1.9rem,4vw,3rem)", color: "rgba(255,255,255,0.93)" }}>
              Global Market Intelligence
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
              A governed quarterly intelligence product line for operators planning under trade fragmentation, capital selectivity, and policy friction. The active report, preparation queue, evidence standards, and call ledger are shown together so buyers can see the discipline behind the line.
            </p>

            {/* Access posture summary */}
            <div className="mt-5 flex flex-wrap gap-4">
              {[
                { label: "Current report remains active for Q2 decision use.", color: "rgba(34,197,94,0.65)" },
                { label: "Institutional edition routes through restricted access.", color: "rgba(245,158,11,0.65)" },
                { label: "Q2 2026 report is in preparation.", color: `${GOLD}AA` },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                  <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.40)", textTransform: "uppercase" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </header>

          {/* ── Current active report ───────────────────────────────────── */}
          {GMI_Q1_RECORD ? (
            <section>
              <div className="mb-4">
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                  Current active report
                </p>
                <p className="mt-1 text-xs text-white/38">
                  Q1 remains active for Q2 decision use until superseded by the Q2 report.
                </p>
              </div>
              <MarketIntelligenceCatalogue
                record={GMI_Q1_RECORD}
                editions={GMI_Q1_EDITIONS}
              />
            </section>
          ) : null}

          {/* ── In preparation ──────────────────────────────────────────── */}
          {GMI_Q2_RECORD ? (
            <section
              style={{
                border: "1px solid rgba(255,255,255,0.09)",
                background: "rgba(255,255,255,0.015)",
                padding: "1.25rem",
              }}
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-start">
                <div>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                    In preparation
                  </p>
                  <h2 className="mt-3" style={{ ...serif, fontSize: "clamp(1.35rem,3vw,2.1rem)", color: "rgba(255,255,255,0.88)", lineHeight: 1.08 }}>
                    Global Market Intelligence Q2 2026
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/52">
                    The Q2 report is in preparation. It is not public, not purchasable, and not indexed as an active report. Release requires Q1 call review, source appendix completion, and quality-gate review.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="#methodology"
                      className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
                      style={{ color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase" }}
                    >
                      View methodology →
                    </Link>
                    <Link
                      href="#accountability"
                      className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
                      style={{ color: "rgba(255,255,255,0.46)", ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase" }}
                    >
                      Track the intelligence process →
                    </Link>
                  </div>
                </div>

                <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-1">
                  {[
                    { label: "Status", value: "In preparation" },
                    { label: "Coverage", value: GMI_Q2_RECORD.coveragePeriod },
                    { label: "Decision window", value: GMI_Q2_RECORD.decisionWindow },
                    { label: "Purchase", value: "Not available" },
                  ].map((item) => (
                    <div key={item.label} style={{ backgroundColor: BASE, padding: "0.95rem" }}>
                      <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}>
                        {item.label}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-white/70">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {/* ── Three-column context row ──────────────────────────────────── */}
          <div className="grid gap-5 xl:grid-cols-3">
            <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.20em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                Global Market Intelligence
              </p>
              <p className="mt-3 text-sm leading-7 text-white/55">
                The flagship market intelligence line connects the quarterly public briefing, the institutional report, and the board briefing deck without collapsing them into one generic listing.
              </p>
              <div className="mt-4 space-y-2">
                <Link
                  href="/intelligence/global-market-intelligence-q1-2026"
                  className="block text-sm transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.62)" }}
                >
                  <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                    Open intelligence landing →
                  </span>
                </Link>
                <Link
                  href="/artifacts/global-market-outlook-q1-2026-public"
                  className="block text-sm transition-colors hover:text-white"
                  style={{ color: "rgba(34,197,94,0.65)" }}
                >
                  <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                    Open public quarterly briefing →
                  </span>
                </Link>
              </div>
            </section>

            <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.20em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                Access structure
              </p>
              <ul className="mt-3 space-y-2.5 text-sm text-white/52">
                {[
                  { dot: "rgba(34,197,94,0.65)",  text: "Public briefings are freely available and clearly labelled." },
                  { dot: "rgba(245,158,11,0.65)", text: "Restricted intelligence is tied to entitlement or governed access routes." },
                  { dot: `${GOLD}AA`,             text: "Paid or premium reports route through artifact identity, not generic library framing." },
                ].map(({ dot, text }) => (
                  <li key={text} className="flex items-start gap-2.5">
                    <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: dot, flexShrink: 0, marginTop: "6px" }} />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1.25rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.20em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                Strategic reports
              </p>
              <p className="mt-3 text-sm leading-7 text-white/52">
                Quarterly intelligence artifacts remain connected to consequence framing, edition control, and governed access. They are not presented as a generic shelf of PDFs.
              </p>
              <div className="mt-4">
                <Link
                  href="/artifacts"
                  className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
                  style={{ color: "rgba(255,255,255,0.40)", ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase" }}
                >
                  Browse artifacts →
                </Link>
              </div>
            </section>
          </div>

          {/* ── Why this report line is different ───────────────────────── */}
          <section
            style={{
              border: `1px solid ${GOLD}24`,
              background: `${GOLD}05`,
              padding: "1.25rem",
            }}
          >
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                  Why this intelligence line is different
                </p>
                <h2 className="mt-3" style={{ ...serif, fontSize: "clamp(1.2rem,2.5vw,1.8rem)", color: "rgba(255,255,255,0.88)", lineHeight: 1.1 }}>
                  This intelligence line compounds through verification, not just publication.
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/50" style={{ maxWidth: "52ch" }}>
                  Global Market Intelligence is built as a report line with memory: lifecycle state, evidence posture, source discipline, call review, and deliberate separation between public and paid editions.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "Every report has a lifecycle state.",
                  "Every major claim carries an evidence posture.",
                  "Every quarter reviews material calls from the previous quarter.",
                  "Scenario assumptions are labelled.",
                  "Source-pending claims cannot become active-release claims.",
                  "Public and paid editions are separated deliberately.",
                ].map((item) => (
                  <div key={item} style={{ borderLeft: `1px solid ${GOLD}35`, paddingLeft: "12px" }}>
                    <p className="text-sm leading-6 text-white/58">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Edition structure ────────────────────────────────────────── */}
          <section
            id="methodology"
            style={{
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.015)",
              padding: "1.25rem",
            }}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                  Edition structure
                </p>
                <p className="mt-1 text-xs text-white/35">
                  Public Surface Edition, Institutional PDF Edition, Board Briefing Deck, and Boardroom PDF where applicable.
                </p>
              </div>
              <Link
                href="/artifacts"
                className="shrink-0 text-sm transition-colors hover:text-white/60"
                style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}
              >
                All artifacts →
              </Link>
            </div>

            {artifacts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {artifacts.map((artifact) => (
                  <ArtifactCard key={artifact.id} artifact={artifact} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/35">No quarterly intelligence artifacts are currently indexed.</p>
            )}
          </section>

          {/* ── Report chronology ───────────────────────────────────────── */}
          <section
            style={{
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.015)",
              padding: "1.25rem",
            }}
          >
            <div className="mb-5">
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                Report chronology
              </p>
              <p className="mt-1 text-xs text-white/35">2026 quarterly report lifecycle.</p>
            </div>
            <MarketIntelligenceChronology records={MARKET_INTELLIGENCE_LIFECYCLE} />
          </section>

          {/* ── Methodology and cadence ─────────────────────────────────── */}
          <section
            style={{
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.015)",
              padding: "1.25rem",
            }}
          >
            <div className="mb-5">
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                Methodology and cadence
              </p>
              <p className="mt-1 text-xs text-white/35">
                Quarter just ended supplies the evidence base. Current quarter supplies the decision window. Next quarter supplies the watchlist.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                { label: "Evidence base", text: "The quarter just ended is reviewed for market structure, policy posture, capital flow, and consequence patterns." },
                { label: "Decision window", text: "The current quarter frames live operating choices, scenario posture, and leadership timing." },
                { label: "Watchlist", text: "The next quarter remains in preparation until the report is published and explicitly activated. The Q2 preparation process tracks tariff policy, Treasury-yield stress, institutional growth forecasts, and AI-productivity offsets as monitored inputs. These signals inform the next report only after evidence review." },
              ].map((item) => (
                <article key={item.label} style={{ borderLeft: `1px solid ${GOLD}33`, paddingLeft: "14px" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}AA` }}>{item.label}</p>
                  <p className="mt-2 text-sm leading-7 text-white/50">{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          {/* ── Source and confidence standards ─────────────────────────── */}
          <section
            style={{
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.015)",
              padding: "1.25rem",
            }}
          >
            <div className="mb-5">
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                Source and confidence standards
              </p>
              <p className="mt-1 text-xs text-white/38">
                Evidence posture is a buyer-facing control, not a disclaimer. It shows where evidence ends and judgement begins.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {EVIDENCE_POSTURES.map((item) => (
                <article key={item.label} style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.012)", padding: "1rem" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}AA` }}>
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/54">{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          {/* ── Intelligence Accountability ─────────────────────────────── */}
          <section
            id="accountability"
            style={{
              border: `1px solid ${GOLD}20`,
              background: `${GOLD}04`,
              padding: "1.25rem",
            }}
          >
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                  Intelligence accountability
                </p>
                <h2 className="mt-3" style={{ ...serif, fontSize: "clamp(1.2rem,2.5vw,1.75rem)", color: "rgba(255,255,255,0.88)", lineHeight: 1.1 }}>
                  Every report is accountable to the next one.
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/52" style={{ maxWidth: "52ch" }}>
                  Each quarterly report records its material calls, board instructions, scenario assumptions, and risk warnings in a governed ledger. The following report reviews those calls before issuing new ones — scoring what held, what failed, and what the model now weights differently.
                </p>
                <p className="mt-3 text-sm leading-7 text-white/52" style={{ maxWidth: "52ch" }}>
                  Future quarterly reports are not released until material calls from the previous report have been reviewed, scored, or explicitly carried forward as too early to assess.
                </p>
                <p className="mt-3 text-sm leading-7 text-white/40" style={{ maxWidth: "52ch" }}>
                  This is not automated market learning. It is governed institutional memory — the same discipline applied to decision records inside high-functioning boards.
                </p>
                <div className="mt-5">
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                    Call Verification Ledger
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/48" style={{ maxWidth: "56ch" }}>
                    Each quarter, material calls are recorded and reviewed before the next report is released. Q1 2026 currently has 8 material calls recorded, with 7 scheduled for Q2 review and 1 carried toward Q3 review.
                  </p>
                </div>
              </div>

              <div className="grid gap-px bg-white/[0.05]">
                {[
                  { label: "Q1 2026 material calls",        value: "8 calls recorded" },
                  { label: "Reviewed",                      value: "0" },
                  { label: "Pending review",                value: "7" },
                  { label: "Carried forward",               value: "1" },
                ].map((item) => (
                  <div key={item.label} style={{ backgroundColor: "rgb(3,3,5)", padding: "0.90rem" }}>
                    <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                      {item.label}
                    </div>
                    <div className="mt-1.5 text-sm leading-6" style={{ color: `${GOLD}CC` }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Related public briefs ─────────────────────────────────────── */}
          <section
            style={{
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.015)",
              padding: "1.25rem",
            }}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                  Related intelligence notes
                </p>
                <p className="mt-1 text-xs text-white/35">
                  Public briefs link directly to their route. Restricted briefs are noted as metadata only.
                </p>
              </div>
              <Link
                href="/library"
                className="shrink-0 text-sm transition-colors hover:text-white/60"
                style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}
              >
                Structured archive →
              </Link>
            </div>

            {briefs.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {briefs.map((brief, i) => (
                  <BriefCard key={`${brief.href}-${i}`} brief={brief} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/35">No briefs are currently indexed here.</p>
            )}
          </section>

        </div>
      </main>
    </Layout>
  );
};

export default IntelligenceMarketPage;
