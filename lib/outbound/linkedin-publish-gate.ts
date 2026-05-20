import {
  validateLinkedInOutboundItem,
  type LinkedInOutboundItem,
} from "./linkedin-outbound-governance";
import { getMarketIntelligenceRecord } from "@/lib/intelligence/market-intelligence-lifecycle";

export type LinkedInPublishGateConnection = {
  connected: boolean;
  status?: string | null;
  scopes?: string[] | null;
  publishingEnabled?: boolean | null;
  selectedPublishingTarget?: {
    ownerType?: "member" | "organization" | string | null;
    ownerUrn?: string | null;
    ownerName?: string | null;
    requiredScope?: string | null;
    status?: string | null;
  } | null;
};

export type LinkedInPublishGateContext = {
  connection?: LinkedInPublishGateConnection | null;
  maxCharacters?: number;
};

export type LinkedInPublishGateResult = {
  allowed: boolean;
  blockers: string[];
  warnings: string[];
};

const DEFAULT_MAX_CHARACTERS = 3000;

function bodyOf(item: LinkedInOutboundItem): string {
  return String(item.body || "");
}

function textOf(item: LinkedInOutboundItem): string {
  return [item.title, item.body].filter(Boolean).join("\n").toLowerCase();
}

function isLifecycleAllowed(reportId: string): boolean {
  const record = getMarketIntelligenceRecord(reportId);
  return record?.lifecycleState === "ACTIVE" || record?.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED";
}

export function canPublishLinkedInOutbound(
  item: LinkedInOutboundItem | null | undefined,
  context: LinkedInPublishGateContext = {},
): LinkedInPublishGateResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!item) {
    return { allowed: false, blockers: ["LinkedIn outbound item was not found."], warnings };
  }

  if (item.draft === true) blockers.push("Draft content cannot be published.");
  if (item.status === "draft") blockers.push("Draft status cannot be published.");
  if (item.status === "posted") blockers.push("Already posted content cannot be published.");
  if (item.status === "retired") blockers.push("Retired content cannot be published.");
  if (!["ready", "published"].includes(String(item.status))) {
    blockers.push("Status must be ready or published before publishing.");
  }
  if (item.published !== true && item.release !== true) {
    blockers.push("Asset must be published true or carry an explicit release flag.");
  }

  const governance = validateLinkedInOutboundItem(item);
  blockers.push(...governance.errors);
  warnings.push(...governance.warnings);

  if (item.linkedReportId) {
    const record = getMarketIntelligenceRecord(item.linkedReportId);
    if (!record) {
      blockers.push(`Linked report ${item.linkedReportId} was not found.`);
    } else if (!isLifecycleAllowed(item.linkedReportId)) {
      blockers.push(`${item.linkedReportId} lifecycle is ${record.lifecycleState}; outbound publishing is blocked.`);
    }
  }

  if (item.linkedReportId === "GMI-Q2-2026") {
    blockers.push("GMI-Q2-2026 outbound content is blocked while the report remains draft.");
  }

  if (item.claimRisk === "HIGH" && !item.manualApprovalNote) {
    blockers.push("High claim-risk content requires a manual approval note.");
  }

  const connection = context.connection;
  if (!connection?.connected || connection.status !== "active") {
    blockers.push("LinkedIn publishing connection is not active.");
  }
  if (connection?.publishingEnabled !== true) {
    blockers.push("LinkedIn publishing is disabled in environment configuration.");
  }
  if (!connection?.scopes?.includes("w_member_social")) {
    const target = connection?.selectedPublishingTarget;
    const requiredScope = target?.requiredScope || "w_member_social";
    if (!connection?.scopes?.includes(requiredScope)) {
      blockers.push(`${requiredScope === "w_organization_social" ? "LINKEDIN_ORG_SCOPE_MISSING" : "LINKEDIN_MEMBER_SCOPE_MISSING"}: LinkedIn connection is missing ${requiredScope} scope.`);
    }
  }

  const target = connection?.selectedPublishingTarget;
  if (!target) {
    blockers.push("selectedPublishingTarget is missing.");
  } else {
    if (target.ownerType === "organization" && !target.ownerUrn) {
      blockers.push("LINKEDIN_ORG_TARGET_NOT_CONFIGURED: LinkedIn organization publishing target is missing.");
    }
    if (target.ownerType === "organization" && target.status === "required_scope_missing") {
      blockers.push("LINKEDIN_ORG_SCOPE_MISSING: LinkedIn organization publishing scope is missing.");
    }
    if (target.ownerType === "organization" && target.status === "organization_urn_missing") {
      blockers.push("LINKEDIN_ORG_TARGET_NOT_CONFIGURED: LinkedIn organization URN is not configured.");
    }
    if (target.ownerType === "organization" && target.status === "not_connected") {
      blockers.push("LINKEDIN_ORG_PERMISSION_UNVERIFIED: LinkedIn organization page role is not verified.");
    }
    if (target.ownerType === "organization" && target.status !== "ready") {
      blockers.push("LINKEDIN_APP_ORG_ACCESS_NOT_APPROVED: LinkedIn app organization access may not be approved or verified.");
    }
    if (target.ownerType === "member") {
      blockers.push("LINKEDIN_MEMBER_FALLBACK_REQUIRES_CONFIRMATION: Member-profile fallback requires explicit admin confirmation.");
    }
  }

  const text = textOf(item);
  if (text.includes("ai predicts")) blockers.push('Disallowed phrase: "AI predicts".');
  if (text.includes("guaranteed")) blockers.push('Disallowed phrase: "guaranteed".');
  if (text.includes("investment advice")) blockers.push('Disallowed phrase: "investment advice".');
  if (/q2\s+(2026\s+)?report\s+(is\s+)?(now\s+)?available/.test(text)) {
    blockers.push("Q2 report availability claim is not allowed while Q2 remains draft.");
  }

  const body = bodyOf(item);
  if (body.trim().startsWith("---")) {
    blockers.push("Final post body must not include frontmatter.");
  }
  if (/release gate|quality gate|lifecycle state|contentlayer/i.test(body)) {
    warnings.push("Post body appears to include internal control language.");
  }
  const maxCharacters = context.maxCharacters ?? DEFAULT_MAX_CHARACTERS;
  if (body.length > maxCharacters) {
    blockers.push(`Post body exceeds LinkedIn text limit (${body.length}/${maxCharacters}).`);
  }

  return {
    allowed: blockers.length === 0,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  };
}
