import crypto from "crypto";

import { prisma } from "@/lib/prisma.server";
import { normaliseGovernedCaseStatus } from "@/lib/product/case-status";
import type {
  CaseShareRecord,
  CaseShareRole,
  CaseShareStatus,
  SharedCaseView,
} from "@/lib/product/case-sharing-contract";

const DEFAULT_EXPIRY_DAYS = 7;
const MAX_EXPIRY_DAYS = 30;

type ClientSafeCaseSource = {
  journeyKey: string;
  email: string | null;
  organisationKey: string | null;
  organisation: string | null;
  status: string;
  stages: Array<{ stage: string }>;
  evidenceNodes: Array<{
    kind: string;
    summary: string;
    severity: string;
  }>;
  decisionObjects: Array<{
    decisionText: string;
    constraintText: string | null;
  }>;
};

type ShareLookup =
  | { state: "ACTIVE"; share: CaseShareRecord; view: SharedCaseView }
  | { state: "EXPIRED" | "REVOKED" | "INVALID"; share: CaseShareRecord | null; view: null };

function normaliseEmail(value?: string | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}

export function hashCaseShareToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateCaseShareToken(): string {
  return `case_${crypto.randomBytes(24).toString("base64url")}`;
}

function toShareStatus(status: string, expiresAt: Date, revokedAt: Date | null): CaseShareStatus {
  if (revokedAt || status === "REVOKED") return "REVOKED";
  if (status === "EXPIRED" || expiresAt.getTime() <= Date.now()) return "EXPIRED";
  return "ACTIVE";
}

function toRecord(input: {
  id: string;
  caseId: string;
  ownerEmail: string;
  recipientEmail: string | null;
  role: string;
  tokenHash: string;
  status: string;
  allowExport: boolean;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}): CaseShareRecord {
  return {
    id: input.id,
    caseId: input.caseId,
    ownerEmail: input.ownerEmail,
    recipientEmail: input.recipientEmail,
    role: input.role === "AUDITOR" ? "AUDITOR" : "VIEWER",
    status: toShareStatus(input.status, input.expiresAt, input.revokedAt),
    tokenHash: input.tokenHash,
    allowExport: input.allowExport,
    expiresAt: input.expiresAt.toISOString(),
    createdAt: input.createdAt.toISOString(),
    revokedAt: input.revokedAt?.toISOString() ?? null,
  };
}

function evidencePostureFromStages(stages: Array<{ stage: string }>): string {
  if (stages.length >= 2) return "MULTI_SOURCE";
  if (stages.length === 1) return "SINGLE_SOURCE";
  return "INSUFFICIENT";
}

function deriveGovernanceImplication(source: ClientSafeCaseSource): string | null {
  const contradictions = source.evidenceNodes.filter((node) => node.kind === "contradiction");
  if (contradictions.length >= 3) {
    return "Multiple unresolved contradictions indicate a persistent governance gap requiring structured intervention.";
  }
  if (contradictions.length > 0) {
    return "Unresolved contradictions are accumulating. Without governance action, the pattern may compound.";
  }
  return null;
}

function deriveSummary(source: ClientSafeCaseSource): string {
  const contradiction = source.evidenceNodes.find((node) => node.kind === "contradiction");
  if (contradiction?.summary) return contradiction.summary;
  const latestDecision = source.decisionObjects[0];
  if (latestDecision?.constraintText) return latestDecision.constraintText;
  return "Governed case record shared for client-safe external review.";
}

function deriveNextAction(source: ClientSafeCaseSource): string | null {
  const contradiction = source.evidenceNodes.find((node) => node.kind === "contradiction");
  if (contradiction?.summary) return `Resolve contradiction: ${contradiction.summary}`;
  const completedStages = new Set(source.stages.map((item) => item.stage));
  if (!completedStages.has("constitutional")) {
    return "Complete the Constitutional Diagnostic to establish structural evidence.";
  }
  return null;
}

async function resolveProvenanceStatus(caseId: string): Promise<SharedCaseView["provenanceStatus"]> {
  const anchor = await prisma.provenanceChainAnchor.findFirst({
    where: {
      scope: "GOVERNED_CASE",
      scopeId: caseId,
    },
    orderBy: { computedAt: "desc" },
    select: { id: true },
  });
  return anchor ? "AVAILABLE" : "PENDING";
}

async function loadClientSafeCaseSource(caseId: string): Promise<ClientSafeCaseSource | null> {
  const journey = await prisma.diagnosticJourney.findUnique({
    where: { journeyKey: caseId },
    select: {
      journeyKey: true,
      email: true,
      organisationKey: true,
      organisation: true,
      status: true,
      stages: {
        select: { stage: true },
        orderBy: { createdAt: "asc" },
      },
      evidenceNodes: {
        select: { kind: true, summary: true, severity: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      decisionObjects: {
        select: { decisionText: true, constraintText: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return journey;
}

async function canManageCase(input: {
  caseId: string;
  requesterEmail: string;
}): Promise<{ allowed: true; ownerEmail: string } | { allowed: false }> {
  const journey = await prisma.diagnosticJourney.findUnique({
    where: { journeyKey: input.caseId },
    select: {
      email: true,
      organisationKey: true,
    },
  });

  const requesterEmail = input.requesterEmail.toLowerCase();
  const ownerEmail = normaliseEmail(journey?.email);
  if (!journey || !ownerEmail) return { allowed: false };
  if (ownerEmail === requesterEmail) return { allowed: true, ownerEmail };

  if (!journey.organisationKey) return { allowed: false };

  const organisation = await prisma.organisation.findFirst({
    where: {
      OR: [
        { slug: journey.organisationKey },
        { name: journey.organisationKey },
      ],
    },
    select: { id: true },
  });
  if (!organisation) return { allowed: false };

  const membership = await prisma.organisationMembership.findFirst({
    where: {
      organisationId: organisation.id,
      email: requesterEmail,
      status: "active",
      role: { in: ["OWNER", "ADMIN"] },
    },
    select: { id: true },
  });

  return membership ? { allowed: true, ownerEmail } : { allowed: false };
}

export async function createCaseShare(input: {
  caseId: string;
  requesterEmail: string;
  role: CaseShareRole;
  recipientEmail?: string | null;
  expiresInDays?: number | null;
  allowExport?: boolean | null;
}): Promise<
  | { ok: true; share: CaseShareRecord; token: string }
  | { ok: false; reason: "CASE_ACCESS_REQUIRED" | "CASE_NOT_FOUND" }
> {
  const access = await canManageCase({
    caseId: input.caseId,
    requesterEmail: input.requesterEmail,
  });
  if (!access.allowed) {
    const exists = await prisma.diagnosticJourney.findUnique({
      where: { journeyKey: input.caseId },
      select: { id: true },
    });
    return { ok: false, reason: exists ? "CASE_ACCESS_REQUIRED" : "CASE_NOT_FOUND" };
  }

  const expiresInDays = Math.min(
    MAX_EXPIRY_DAYS,
    Math.max(1, input.expiresInDays ?? DEFAULT_EXPIRY_DAYS),
  );
  const token = generateCaseShareToken();
  const row = await prisma.caseShareInvite.create({
    data: {
      caseId: input.caseId,
      ownerEmail: access.ownerEmail,
      recipientEmail: normaliseEmail(input.recipientEmail),
      role: input.role,
      tokenHash: hashCaseShareToken(token),
      allowExport: input.role === "AUDITOR" && Boolean(input.allowExport),
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
    },
  });

  return { ok: true, share: toRecord(row), token };
}

export async function revokeCaseShare(input: {
  shareId: string;
  requesterEmail: string;
}): Promise<
  | { ok: true; share: CaseShareRecord }
  | { ok: false; reason: "SHARE_NOT_FOUND" | "CASE_ACCESS_REQUIRED" }
> {
  const existing = await prisma.caseShareInvite.findUnique({
    where: { id: input.shareId },
  });
  if (!existing) return { ok: false, reason: "SHARE_NOT_FOUND" };

  const access = await canManageCase({
    caseId: existing.caseId,
    requesterEmail: input.requesterEmail,
  });
  if (!access.allowed) return { ok: false, reason: "CASE_ACCESS_REQUIRED" };

  const updated = await prisma.caseShareInvite.update({
    where: { id: input.shareId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });

  return { ok: true, share: toRecord(updated) };
}

export async function listCaseShares(input: {
  caseId: string;
  requesterEmail: string;
}): Promise<
  | { ok: true; shares: CaseShareRecord[] }
  | { ok: false; reason: "CASE_ACCESS_REQUIRED" }
> {
  const access = await canManageCase(input);
  if (!access.allowed) return { ok: false, reason: "CASE_ACCESS_REQUIRED" };

  const rows = await prisma.caseShareInvite.findMany({
    where: { caseId: input.caseId },
    orderBy: { createdAt: "desc" },
  });
  return { ok: true, shares: rows.map(toRecord) };
}

export async function loadSharedCaseByToken(token: string): Promise<ShareLookup> {
  const tokenHash = hashCaseShareToken(token);
  const row = await prisma.caseShareInvite.findUnique({
    where: { tokenHash },
  });

  if (!row) return { state: "INVALID", share: null, view: null };

  const share = toRecord(row);
  if (share.status !== "ACTIVE") {
    if (share.status === "EXPIRED" && row.status !== "EXPIRED") {
      await prisma.caseShareInvite.update({
        where: { id: row.id },
        data: { status: "EXPIRED" },
      }).catch(() => null);
    }
    return { state: share.status, share, view: null };
  }

  const source = await loadClientSafeCaseSource(share.caseId);
  if (!source) return { state: "INVALID", share: null, view: null };

  const provenanceStatus = await resolveProvenanceStatus(source.journeyKey);
  const latestDecision = source.decisionObjects[0];
  const title = latestDecision?.decisionText?.trim() || `Governed case ${source.journeyKey.slice(0, 12)}`;
  const view: SharedCaseView = {
    caseId: source.journeyKey,
    caseRef: source.journeyKey,
    title,
    status: normaliseGovernedCaseStatus(source.status),
    summary: deriveSummary(source),
    evidencePosture: evidencePostureFromStages(source.stages),
    governanceImplication: deriveGovernanceImplication(source),
    nextAction: deriveNextAction(source),
    provenanceStatus,
    canVerify: share.role === "AUDITOR" && provenanceStatus === "AVAILABLE",
    canExport: share.role === "AUDITOR" && share.allowExport,
  };

  return { state: "ACTIVE", share, view };
}
