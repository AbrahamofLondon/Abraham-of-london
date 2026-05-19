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
} from "@/lib/intelligence/market-intelligence-lifecycle";

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
        primaryLabel = "Purchase report";
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

const IntelligenceMarketPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  briefs,
  artifacts,
}) => {
  const activeReport = artifacts.find((artifact) => artifact.id === "global-market-intelligence-report-q1-2026");
  const reportChronology = [
    {
      period: "Q1 2026",
      title: "Global Market Intelligence Q1 2026",
      status: "Active until superseded by Q2 2026 report",
      href: activeReport?.primaryHref || "/artifacts/global-market-intelligence-report-q1-2026",
    },
    {
      period: "Q2 2026",
      title: "Global Market Intelligence Q2 2026",
      status: "Q2 2026 report in preparation",
      href: "",
    },
  ];

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
              Quarterly report catalogue
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(1.9rem,4vw,3rem)", color: "rgba(255,255,255,0.93)" }}>
              Market Intelligence Reports
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
              A dedicated catalogue for the Global Market Intelligence quarterly report line. The current active report leads the page, editions are separated by access posture, and related intelligence notes sit lower as supporting context rather than peers to the quarterly reports.
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
          <section
            style={{
              border: `1px solid ${GOLD}28`,
              background: `${GOLD}06`,
              padding: "1.35rem",
            }}
          >
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                  Current active report
                </p>
                <h2 className="mt-3" style={{ ...serif, fontSize: "clamp(1.55rem,3vw,2.45rem)", color: "rgba(255,255,255,0.90)", lineHeight: 1.05 }}>
                  Global Market Intelligence Q1 2026
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
                  The Q1 2026 institutional edition remains active for Q2 decision use and is available through restricted access until superseded by the Q2 2026 report. The public surface remains available as the open reference layer.
                </p>
                {activeReport?.freshnessNote ? (
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-white/46">{activeReport.freshnessNote}</p>
                ) : null}
                {activeReport?.freshnessLabel ? (
                  <p className="mt-3" style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}AA` }}>
                    {activeReport.freshnessLabel}
                  </p>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/intelligence/global-market-intelligence-q1-2026"
                    className="inline-flex items-center gap-1.5 transition-colors hover:opacity-80"
                    style={{ color: "rgba(255,255,255,0.72)", ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase" }}
                  >
                    Read public brief →
                  </Link>
                  <Link
                    href={activeReport?.primaryHref || "/artifacts/global-market-intelligence-report-q1-2026"}
                    className="inline-flex items-center gap-1.5 transition-colors hover:opacity-80"
                    style={{ color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase" }}
                  >
                    Access institutional edition →
                  </Link>
                </div>
              </div>

              <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-1">
                {[
                  { label: "Coverage period", value: activeReport?.coveragePeriod || "Q1 2026" },
                  { label: "Current decision window", value: activeReport?.currentDecisionWindow || "Q2 2026" },
                  { label: "Updated", value: formatDateLabel(activeReport?.updatedAt || "2026-04-08") },
                  { label: "Status", value: activeReport?.statusLabel || "Active until superseded by Q2 2026 report" },
                  { label: "Next scheduled report", value: activeReport?.nextScheduledReport || "Q2 2026 report in preparation" },
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

          {/* ── Edition structure ────────────────────────────────────────── */}
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

            <div className="grid gap-4 md:grid-cols-2">
              {reportChronology.map((report) => (
                <article key={report.period} style={{ borderLeft: `2px solid ${report.href ? GOLD : "rgba(255,255,255,0.18)"}`, paddingLeft: "16px" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)" }}>
                    2026 · {report.period}
                  </p>
                  <h3 className="mt-2 text-base leading-snug text-white/82">{report.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/48">{report.status}</p>
                  {report.href ? (
                    <Link
                      href={report.href}
                      className="mt-3 inline-flex items-center gap-1.5 transition-colors hover:opacity-80"
                      style={{ color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase" }}
                    >
                      Access report →
                    </Link>
                  ) : (
                    <span className="mt-3 inline-flex" style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
                      In preparation
                    </span>
                  )}
                </article>
              ))}
            </div>
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
                { label: "Watchlist", text: "The next quarter remains in preparation until the report is published and explicitly activated." },
              ].map((item) => (
                <article key={item.label} style={{ borderLeft: `1px solid ${GOLD}33`, paddingLeft: "14px" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}AA` }}>{item.label}</p>
                  <p className="mt-2 text-sm leading-7 text-white/50">{item.text}</p>
                </article>
              ))}
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
