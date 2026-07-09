/**
 * lib/premium/gmi-artifact-projection.ts
 *
 * Builds the institutional asset-record projection for GMI-family artifacts.
 *
 * Family membership is resolved from CANONICAL identity — the registry item's
 * docId (edition identity assigned by the publication authority) and the
 * catalog product chain — never from title-string guessing.
 *
 * Lifecycle, lineage and action labels derive from the canonical publication
 * authority (market-intelligence-lifecycle), so this projection can never
 * disagree with the release estate.
 */
import {
  getMarketIntelligenceRecord,
  getCurrentPublishedMarketIntelligenceReport,
  getUpcomingMarketIntelligenceReport,
  type MarketIntelligenceLifecycleRecord,
} from "@/lib/intelligence/market-intelligence-lifecycle";
import { getPdfExportEvidence } from "@/lib/intelligence/gmi-release-evidence";
import { resolveByContentId } from "@/lib/commercial/product-identity";
import type { PremiumContentItem } from "@/lib/premium/content-registry";
import type { GmiArtifactProjection, GmiArtifactAction } from "@/components/artifacts/GmiInstitutionalArtifactRecord";

const GMI_PRODUCT_CODES = new Set(["gmi_q1_2026", "gmi_q2_2026", "gmi_q3_2026", "gmi_quarterly"]);

/** Canonical Q2 Ledger route (the public record for the current edition). */
const Q2_LEDGER_ROUTE = "/intelligence/gmi/q2-2026";

const EDITION_THESIS: Record<string, string> = {
  "GMI-Q1-2026": "Structural pressure replaced cyclical comfort.",
  "GMI-Q2-2026": "Fragmentation under shock: two regimes now operate at once.",
};

/** Canonical family membership test. docId is publication-authority identity. */
export function isGmiFamilyArtifact(item: PremiumContentItem): boolean {
  const docId = String(item.metadata?.docId ?? "");
  if (/^GMI-Q\d-\d{4}/.test(docId)) return true;
  const chain = resolveByContentId(item.id);
  return Boolean(chain && GMI_PRODUCT_CODES.has(chain.productCode));
}

function baseEditionId(docId: string): string {
  // "GMI-Q1-2026-D" (deck) → "GMI-Q1-2026"
  const match = docId.match(/^(GMI-Q\d-\d{4})/);
  return match?.[1] ?? docId;
}

function editionLabel(record: MarketIntelligenceLifecycleRecord | null, fallback: string): string {
  return record ? `${record.quarter} ${record.year}` : fallback;
}

function formatDateLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function publicationRole(record: MarketIntelligenceLifecycleRecord | null): string {
  switch (record?.lifecycleState) {
    case "ACTIVE_UNTIL_SUPERSEDED":
    case "ACTIVE":
      return "CURRENT EDITION";
    case "SUPERSEDED":
      return "REFERENCE EDITION";
    case "ARCHIVED":
      return "ARCHIVE EDITION";
    case "DRAFT":
    case "SCHEDULED":
      return "IN PREPARATION";
    default:
      return "INSTITUTIONAL EDITION";
  }
}

/** Lifecycle-aware primary-open label — never a generic "current edition" string. */
function openLabelFor(record: MarketIntelligenceLifecycleRecord | null): string {
  switch (record?.lifecycleState) {
    case "ACTIVE_UNTIL_SUPERSEDED":
    case "ACTIVE":
      return "Open current edition";
    case "SUPERSEDED":
    case "ARCHIVED":
      return "Open reference edition";
    default:
      return "View edition record";
  }
}

/**
 * Canonical related-edition route resolution.
 *   Q1 public surface  → lifecycle publicHref
 *   Q1 institutional   → artifact asset record
 *   Q2 public/current  → canonical Q2 Ledger route
 *   Q3 draft           → no public route
 */
function lineageRows(selfDocId: string): GmiArtifactProjection["lineage"] {
  const rows: GmiArtifactProjection["lineage"] = [];
  const q1 = getMarketIntelligenceRecord("GMI-Q1-2026");
  const q2 = getMarketIntelligenceRecord("GMI-Q2-2026");

  if (q1) {
    rows.push({
      edition: "Q1 2026",
      role: "Reference edition",
      state: q1.lifecycleState.replace(/_/g, " "),
      href: selfDocId.startsWith("GMI-Q1") ? q1.publicHref ?? null : "/artifacts/global-market-intelligence-report-q1-2026",
      hrefLabel: selfDocId.startsWith("GMI-Q1") ? "View Q1 Ledger record" : "View asset record",
    });
  }
  if (q2) {
    rows.push({
      edition: "Q2 2026",
      role: "Current edition",
      state: q2.lifecycleState.replace(/_/g, " "),
      href: Q2_LEDGER_ROUTE,
      hrefLabel: openLabelFor(q2),
    });
  }
  rows.push({
    edition: "Q3 2026",
    role: "Upcoming edition",
    state: "IN PREPARATION",
    href: null,
    hrefLabel: null,
  });
  return rows;
}

export function buildGmiArtifactProjection(
  item: PremiumContentItem,
  entitled: boolean,
): GmiArtifactProjection {
  const docId = String(item.metadata?.docId ?? item.id);
  const editionId = baseEditionId(docId);
  const record = getMarketIntelligenceRecord(editionId);
  const current = getCurrentPublishedMarketIntelligenceReport();
  const upcoming = getUpcomingMarketIntelligenceReport();
  const isDeck = /-D$/.test(docId) || item.metadata?.editionType === "board-deck";
  const isCurrent = record?.id === current?.id;

  const actions: GmiArtifactAction[] = [];
  if (record?.publicHref) {
    actions.push({
      label: record.id === "GMI-Q1-2026" ? "View Q1 Ledger record" : openLabelFor(record),
      href: record.id === "GMI-Q2-2026" ? Q2_LEDGER_ROUTE : record.publicHref,
      kind: "primary",
    });
  }
  if (entitled && item.metadata?.directDownloadHref) {
    actions.push({
      label: isDeck ? "Resume board deck" : "Resume institutional PDF",
      href: item.metadata.directDownloadHref,
      kind: "secondary",
    });
  }
  if (!isCurrent && current) {
    actions.push({
      label: `View current ${current.quarter} ${current.year} edition`,
      href: Q2_LEDGER_ROUTE,
      kind: "quiet",
    });
  }

  const pdfEvidence = editionId === "GMI-Q2-2026" ? getPdfExportEvidence(editionId) : null;
  const evidenceRecord: GmiArtifactProjection["evidenceRecord"] = [
    { label: "Document ID", value: docId },
    { label: "Version", value: String(item.metadata?.version ?? record?.version ?? "—") },
    { label: "Published", value: formatDateLabel(record?.publishedAt ?? item.metadata?.createdAt) },
    ...(record?.lifecycleState === "SUPERSEDED"
      ? [{ label: "Superseded", value: `${formatDateLabel(record.updatedAt)} · by ${record.supersededBy ?? "successor"}` }]
      : []),
    ...(record?.dataLockedAt ? [{ label: "Data lock", value: formatDateLabel(record.dataLockedAt) }] : []),
    ...(pdfEvidence?.candidateHash ? [{ label: "Candidate hash", value: pdfEvidence.candidateHash }] : []),
    ...(pdfEvidence?.reportContentHash ? [{ label: "Content hash", value: pdfEvidence.reportContentHash }] : []),
    ...(pdfEvidence?.hash ? [{ label: "PDF hash", value: pdfEvidence.hash }] : []),
    ...(editionId === "GMI-Q1-2026"
      ? [{
          label: "Receipt note",
          value: "Released before the durable receipt architecture; record maintained by the publication authority.",
        }]
      : []),
  ];

  return {
    documentId: docId,
    edition: editionLabel(record, editionId.replace("GMI-", "").replace("-", " ")),
    title: item.title,
    thesis: EDITION_THESIS[editionId] ?? item.description,
    publicationRole: isDeck ? "CONTROLLED ASSET · BOARD DECK" : publicationRole(record),
    lifecycleState: record?.lifecycleState ?? "UNKNOWN",
    supersededBy: record?.supersededBy
      ? editionLabel(getMarketIntelligenceRecord(record.supersededBy), record.supersededBy)
      : null,
    publishedAtLabel: formatDateLabel(record?.publishedAt ?? item.metadata?.createdAt),
    currentEditionLabel: current ? `${current.quarter} ${current.year}` : "—",
    upcomingEditionLabel: upcoming ? `${upcoming.quarter} ${upcoming.year} — in preparation` : "Q3 2026 — in preparation",
    retentionNote:
      record?.lifecycleState === "SUPERSEDED"
        ? "Retained for historical judgement review and the public call-scoring record."
        : record?.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED"
          ? "Current authorised edition; evidence-locked and receipt-bound."
          : "Maintained under the GMI publication lifecycle.",
    asset: {
      format: isDeck ? "Board deck (PPTX)" : item.asset.mimeType === "application/pdf" ? "Institutional PDF" : "Institutional briefing",
      version: String(item.metadata?.version ?? record?.version ?? "—"),
      classification: String(item.metadata?.classification ?? "RESTRICTED"),
      distribution: item.metadata?.watermarkRequired ? "Traceable" : "Controlled",
      pages: item.asset.pageCount ? String(item.asset.pageCount) : null,
      fileSize: item.fileSize ?? null,
    },
    evidenceRecord,
    accessNote: entitled
      ? "Your entitlement covers this edition. Downloads are watermarked and traceable; distribution outside your organisation requires written permission."
      : record?.lifecycleState === "SUPERSEDED"
        ? "Reference editions are available to entitled readers (Architect tier, Inner Circle, or prior purchasers). The public Ledger record for this edition remains open to all."
        : "Access to the current edition is fulfilled through the canonical product route. The public Ledger record remains open to all.",
    entitled,
    actions,
    lineage: lineageRows(docId),
    publicRecordHref: record?.id === "GMI-Q2-2026" ? Q2_LEDGER_ROUTE : record?.publicHref ?? null,
  };
}
