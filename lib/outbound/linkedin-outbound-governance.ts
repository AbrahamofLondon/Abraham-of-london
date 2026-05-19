import {
  getMarketIntelligenceRecord,
  type MarketIntelligenceLifecycleRecord,
} from "@/lib/intelligence/market-intelligence-lifecycle";

export type LinkedInOutboundStatus =
  | "draft"
  | "ready"
  | "published"
  | "posted"
  | "retired";

export type LinkedInOutboundReadinessResult = {
  ready: boolean;
  warnings: string[];
  errors: string[];
};

export type LinkedInOutboundItem = {
  title?: string | null;
  sequence?: number | null;
  channel?: string | null;
  contentType?: string | null;
  status?: LinkedInOutboundStatus | string | null;
  draft?: boolean | null;
  published?: boolean | null;
  date?: string | null;
  category?: string | null;
  tier?: string | null;
  campaign?: string | null;
  linkedReportId?: string | null;
  publicationGate?: string | null;
  postedAt?: string | null;
  linkedinUrl?: string | null;
  claimRisk?: string | null;
  requiresLifecycleCheck?: boolean | null;
  release?: boolean | null;
  manualApprovalNote?: string | null;
  body?: string | null;
  filename?: string | null;
};

const VALID_STATUSES: LinkedInOutboundStatus[] = ["draft", "ready", "published", "posted", "retired"];
const VALID_CONTENT_TYPES = ["post", "article", "caption", "script"];
const VALID_CLAIM_RISKS = ["LOW", "MEDIUM", "HIGH"];

function text(item: LinkedInOutboundItem): string {
  return [item.title, item.body].filter(Boolean).join("\n").toLowerCase();
}

function hasValue(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : value != null;
}

function linkedReport(item: LinkedInOutboundItem): MarketIntelligenceLifecycleRecord | null {
  return item.linkedReportId ? getMarketIntelligenceRecord(item.linkedReportId) : null;
}

function isReportDraft(record: MarketIntelligenceLifecycleRecord | null): boolean {
  return record?.lifecycleState === "DRAFT" || record?.lifecycleState === "SCHEDULED";
}

function mergeResults(...results: LinkedInOutboundReadinessResult[]): LinkedInOutboundReadinessResult {
  const warnings = results.flatMap((result) => result.warnings);
  const errors = results.flatMap((result) => result.errors);
  return { ready: errors.length === 0, warnings, errors };
}

export function validateLinkedInOutboundMetadata(item: LinkedInOutboundItem): LinkedInOutboundReadinessResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!hasValue(item.title)) errors.push("Missing title.");
  if (item.channel !== "linkedin") errors.push("channel must be linkedin.");
  if (!item.contentType || !VALID_CONTENT_TYPES.includes(item.contentType)) {
    errors.push("contentType must be one of post, article, caption, script.");
  }
  if (!item.status || !VALID_STATUSES.includes(item.status as LinkedInOutboundStatus)) {
    errors.push("status must be one of draft, ready, published, posted, retired.");
  }
  if (typeof item.draft !== "boolean") errors.push("draft must be boolean.");
  if (typeof item.published !== "boolean") errors.push("published must be boolean.");
  if (!hasValue(item.date)) errors.push("Missing date.");
  if (item.category !== "Outbound") errors.push("category must be Outbound.");
  if (!["public", "restricted", "internal"].includes(String(item.tier || ""))) {
    errors.push("tier must be public, restricted, or internal.");
  }
  if (!item.claimRisk || !VALID_CLAIM_RISKS.includes(item.claimRisk)) {
    errors.push("claimRisk must be LOW, MEDIUM, or HIGH.");
  }

  if (item.draft === true && item.published === true) {
    errors.push("draft true cannot have published true.");
  }
  if (item.status === "draft" && item.published === true) {
    errors.push("status draft cannot have published true.");
  }
  if (item.status === "ready" && item.published !== true && item.release !== true) {
    errors.push("status ready requires published true or an explicit release flag.");
  }
  if (item.status === "posted" && !item.postedAt && !item.linkedinUrl) {
    warnings.push("status posted should include postedAt or linkedinUrl where available.");
  }
  if (item.claimRisk === "HIGH" && !item.publicationGate && !item.manualApprovalNote) {
    errors.push("claimRisk HIGH requires publicationGate or manualApprovalNote.");
  }

  return { ready: errors.length === 0, warnings, errors };
}

export function validateLinkedInPublicationGate(item: LinkedInOutboundItem): LinkedInOutboundReadinessResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const record = linkedReport(item);

  if (item.requiresLifecycleCheck && !record) {
    errors.push(`requiresLifecycleCheck is true but linkedReportId ${item.linkedReportId || "(missing)"} was not found.`);
  }

  if (record && isReportDraft(record) && item.published === true) {
    errors.push(`${item.linkedReportId} is ${record.lifecycleState}; linked outbound asset cannot be published.`);
  }

  if (record && isReportDraft(record) && item.status !== "draft") {
    errors.push(`${item.linkedReportId} is ${record.lifecycleState}; linked outbound asset must remain draft.`);
  }

  const body = text(item);
  if (record && isReportDraft(record) && /q2\s+(2026\s+)?report\s+is\s+(now\s+)?available/.test(body)) {
    errors.push("Q2 report availability claim is not allowed while linked report lifecycle is draft.");
  }

  if (item.linkedReportId && !item.publicationGate) {
    warnings.push("linkedReportId is present without a publicationGate.");
  }

  return { ready: errors.length === 0, warnings, errors };
}

export function validateLinkedInClaimSafety(item: LinkedInOutboundItem): LinkedInOutboundReadinessResult {
  const errors: string[] = [];
  const body = text(item);

  if (body.includes("ai predicts markets")) {
    errors.push('Unsupported claim: "AI predicts markets".');
  }

  if (body.includes("guaranteed")) {
    errors.push('Unsupported claim: "guaranteed".');
  }

  return { ready: errors.length === 0, warnings: [], errors };
}

export function validateLinkedInSequence(items: LinkedInOutboundItem[]): LinkedInOutboundReadinessResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const byCampaign = new Map<string, LinkedInOutboundItem[]>();

  for (const item of items) {
    const campaign = item.campaign || "uncategorised";
    byCampaign.set(campaign, [...(byCampaign.get(campaign) || []), item]);

    if (/^\d{2}-/.test(item.filename || "") && typeof item.sequence !== "number") {
      warnings.push(`${item.filename} has a sequence-style filename but no sequence field.`);
    }
  }

  for (const [campaign, campaignItems] of byCampaign.entries()) {
    const seen = new Map<number, string>();
    const sequences = campaignItems
      .map((item) => item.sequence)
      .filter((sequence): sequence is number => typeof sequence === "number")
      .sort((a, b) => a - b);

    for (const item of campaignItems) {
      if (typeof item.sequence !== "number") continue;
      const duplicate = seen.get(item.sequence);
      if (duplicate) {
        errors.push(`Duplicate LinkedIn sequence ${item.sequence} in ${campaign}: ${duplicate}, ${item.filename || item.title}`);
      }
      seen.set(item.sequence, item.filename || item.title || `sequence-${item.sequence}`);
    }

    if (sequences.length > 1) {
      for (let i = 1; i < sequences.length; i += 1) {
        if (sequences[i]! - sequences[i - 1]! > 1) {
          warnings.push(`Sequence gap in ${campaign}: ${sequences[i - 1]} to ${sequences[i]}.`);
        }
      }
    }
  }

  return { ready: errors.length === 0, warnings, errors };
}

export function validateLinkedInOutboundItem(item: LinkedInOutboundItem): LinkedInOutboundReadinessResult {
  return mergeResults(
    validateLinkedInOutboundMetadata(item),
    validateLinkedInPublicationGate(item),
    validateLinkedInClaimSafety(item),
  );
}

export function getPublishableLinkedInPosts(items: LinkedInOutboundItem[]): LinkedInOutboundItem[] {
  return items.filter((item) => {
    if (item.draft || item.status === "draft" || item.status === "posted" || item.status === "retired") return false;
    const result = validateLinkedInOutboundItem(item);
    return result.errors.length === 0 && (item.published === true || item.release === true);
  });
}

export function getDraftLinkedInPosts(items: LinkedInOutboundItem[]): LinkedInOutboundItem[] {
  return items.filter((item) => item.draft === true || item.status === "draft");
}
