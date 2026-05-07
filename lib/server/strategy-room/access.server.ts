import "server-only";

import { neon } from "@neondatabase/serverless";

import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { prisma } from "@/lib/prisma.server";
import { decryptEncryptedStateToken } from "@/lib/security/secure-client-state";
import { verifySignedActionToken } from "@/lib/server/security/signed-action-token";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { writeSecurityAudit } from "@/lib/security/audit-log";

type StrategyRoomSubject = {
  kind: "execution" | "recommendation" | "session";
  id: string;
  sessionKey: string;
  ownerUserId: string | null;
  ownerEmail: string | null;
  status: string | null;
};

type AccessResult =
  | { ok: true; subject: StrategyRoomSubject; identityEmail: string | null; subjectId: string | null }
  | { ok: false; status: 401 | 403 | 404; error: string };

type StrategyRoomEntryHandoff = {
  reportId: string;
  email: string | null;
  route: string | null;
  readinessTier: string | null;
  authorityType: string | null;
};

function normalizeEmail(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().toLowerCase()
    : null;
}

function getSql() {
  const databaseUrl = String(process.env.DATABASE_URL || "").trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return neon(databaseUrl);
}

function extractAccessToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token) return token;
  }

  const headerToken = request.headers.get("x-strategy-access-token");
  if (headerToken?.trim()) return headerToken.trim();

  const url = new URL(request.url);
  const queryToken = url.searchParams.get("access") || url.searchParams.get("token");
  if (queryToken?.trim()) return queryToken.trim();

  return null;
}

function parseSessionOwnerEmail(intake: string | null): string | null {
  if (!intake) return null;

  try {
    const parsed = JSON.parse(intake) as Record<string, unknown>;
    return normalizeEmail(parsed.email);
  } catch {
    return null;
  }
}

async function resolveStrategyRoomEntryHandoff(args: {
  handoffToken?: string | null;
  handoffReportId?: string | null;
}): Promise<StrategyRoomEntryHandoff | null> {
  const tokenPayload = args.handoffToken
    ? decryptEncryptedStateToken(args.handoffToken)
    : null;
  const reportId = String(args.handoffReportId || tokenPayload?.reportId || "").trim();

  if (!reportId) {
    return null;
  }

  const report = await prisma.constitutionalIntakeReport.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      email: true,
      route: true,
      readinessTier: true,
      authorityType: true,
    },
  });

  if (!report) {
    return null;
  }

  return {
    reportId: report.id,
    email: normalizeEmail(report.email),
    route: report.route ?? null,
    readinessTier: report.readinessTier ?? null,
    authorityType: report.authorityType ?? null,
  };
}

async function resolveStrategyRoomSubject(sessionRef: string): Promise<StrategyRoomSubject | null> {
  const execution = await prisma.strategyRoomExecutionSession.findFirst({
    where: {
      OR: [{ id: sessionRef }, { sessionKey: sessionRef }],
    },
    select: {
      id: true,
      sessionKey: true,
      userId: true,
      email: true,
      status: true,
    },
  });

  if (execution) {
    return {
      kind: "execution",
      id: execution.id,
      sessionKey: execution.sessionKey,
      ownerUserId: execution.userId ?? null,
      ownerEmail: normalizeEmail(execution.email),
      status: execution.status,
    };
  }

  const recommendation = await prisma.decisionRecommendationSession.findFirst({
    where: {
      OR: [{ id: sessionRef }, { sessionKey: sessionRef }],
    },
    select: {
      id: true,
      sessionKey: true,
      email: true,
      converted: true,
    },
  });

  if (recommendation) {
    return {
      kind: "recommendation",
      id: recommendation.id,
      sessionKey: recommendation.sessionKey,
      ownerUserId: null,
      ownerEmail: normalizeEmail(recommendation.email),
      status: recommendation.converted ? "converted" : "active",
    };
  }

  const sql = getSql();
  const rows = await sql`
    SELECT "id", "sessionKey", "status", "intake"
    FROM "StrategyRoomSession"
    WHERE "sessionKey" = ${sessionRef}
    LIMIT 1
  `;

  const row = rows[0] as
    | { id?: string; sessionKey?: string; status?: string | null; intake?: string | null }
    | undefined;

  if (!row?.sessionKey) {
    return null;
  }

  return {
    kind: "session",
    id: String(row.id || row.sessionKey),
    sessionKey: String(row.sessionKey),
    ownerUserId: null,
    ownerEmail: parseSessionOwnerEmail(row.intake ?? null),
    status: row.status ?? null,
  };
}

export async function assertStrategyRoomAccess(args: {
  request: Request;
  sessionRef: string;
  purpose: string;
  allowTokenPurposes?: readonly string[];
  requireEntitlement?: boolean;
  requireActive?: boolean;
}): Promise<AccessResult> {
  const sessionRef = String(args.sessionRef || "").trim();
  if (!sessionRef) {
    return { ok: false, status: 404, error: "SESSION_NOT_FOUND" };
  }

  const subject = await resolveStrategyRoomSubject(sessionRef);
  if (!subject) {
    return { ok: false, status: 404, error: "SESSION_NOT_FOUND" };
  }

  if (args.requireActive !== false && subject.status && !["active", "monitoring", "converted"].includes(subject.status)) {
    return { ok: false, status: 403, error: "SESSION_INACTIVE" };
  }

  const token = extractAccessToken(args.request);
  const purposes = args.allowTokenPurposes ?? [args.purpose];
  let tokenAuthorized = false;

  if (token) {
    for (const purpose of purposes) {
      const verified = verifySignedActionToken(token, purpose);
      if (
        verified.ok &&
        (verified.payload.subject === subject.sessionKey || verified.payload.subject === subject.id)
      ) {
        tokenAuthorized = true;
        break;
      }
    }
  }

  const identity = await resolveIdentity(args.request);
  const identityEmail = normalizeEmail(identity.email);

  if (!tokenAuthorized) {
    if (!identityEmail) {
      await writeSecurityAudit({
        action: "strategy_room_access_denied",
        severity: "warn",
        status: "BLOCKED",
        actorId: identity.subjectId,
        resourceId: subject.sessionKey,
        metadata: { reason: "missing_identity", purpose: args.purpose },
      });
      return { ok: false, status: 401, error: "AUTHENTICATION_REQUIRED" };
    }

    const ownerMatchesByUserId =
      Boolean(identity.subjectId && subject.ownerUserId && identity.subjectId === subject.ownerUserId);
    const ownerMatchesByEmail =
      Boolean(identityEmail && subject.ownerEmail && subject.ownerEmail === identityEmail);

    if (!ownerMatchesByUserId && !ownerMatchesByEmail) {
      await writeSecurityAudit({
        action: "forbidden_object_access",
        severity: "warn",
        status: "BLOCKED",
        actorId: identity.subjectId,
        actorEmail: identityEmail,
        resourceId: subject.sessionKey,
        metadata: { reason: "owner_mismatch", purpose: args.purpose },
      });
      return { ok: false, status: 403, error: "FORBIDDEN" };
    }

    if (args.requireEntitlement !== false) {
      const entitlement = await resolveCanonicalEntitlement({
        userId: identity.subjectId,
        email: identityEmail,
        slug: "strategy-room.entry",
      });

      if (!entitlement.granted) {
        return { ok: false, status: 403, error: "ENTITLEMENT_REQUIRED" };
      }
    }
  }

  return {
    ok: true,
    subject,
    identityEmail,
    subjectId: identity.subjectId,
  };
}

export async function authorizeStrategyRoomEntry(args: {
  request: Request;
  intakeEmail?: string | null;
  entryToken?: string | null;
  handoffToken?: string | null;
  handoffReportId?: string | null;
}): Promise<
  | {
      ok: true;
      identityEmail: string | null;
      subjectId: string | null;
      handoff: StrategyRoomEntryHandoff | null;
    }
  | { ok: false; status: 401 | 403; error: string }
> {
  const intakeEmail = normalizeEmail(args.intakeEmail);
  const handoff = await resolveStrategyRoomEntryHandoff({
    handoffToken: args.handoffToken,
    handoffReportId: args.handoffReportId,
  });

  if (handoff && handoff.route !== "STRATEGY") {
    return { ok: false, status: 403, error: "HANDOFF_NOT_QUALIFIED" };
  }

  const token = args.entryToken || extractAccessToken(args.request);
  const identity = await resolveIdentity(args.request);
  const identityEmail = normalizeEmail(identity.email);

  if (token) {
    const verified = verifySignedActionToken(token, "strategy_room_init");
    if (!verified.ok) {
      return { ok: false, status: 403, error: "INVALID_ENTRY_TOKEN" };
    }

    if (!handoff) {
      return { ok: false, status: 403, error: "QUALIFIED_HANDOFF_REQUIRED" };
    }

    const tokenSubject = normalizeEmail(verified.payload.subject) || verified.payload.subject;
    const handoffOwner = handoff.email;
    const subjectMatches =
      tokenSubject === handoff.reportId ||
      (handoffOwner ? tokenSubject === handoffOwner : false);

    if (!subjectMatches) {
      return { ok: false, status: 403, error: "FORBIDDEN" };
    }

    if (intakeEmail && handoffOwner && intakeEmail !== handoffOwner) {
      return { ok: false, status: 403, error: "FORBIDDEN" };
    }

    return {
      ok: true,
      identityEmail: handoffOwner || intakeEmail,
      subjectId: null,
      handoff,
    };
  }

  if (!identityEmail) {
    return { ok: false, status: 401, error: "AUTHENTICATION_REQUIRED" };
  }

  if (intakeEmail && identityEmail !== intakeEmail) {
    return { ok: false, status: 403, error: "FORBIDDEN" };
  }

  if (handoff) {
    if (!handoff.email || handoff.email !== identityEmail) {
      return { ok: false, status: 403, error: "FORBIDDEN" };
    }
  }

  const entitlement = await resolveCanonicalEntitlement({
    userId: identity.subjectId,
    email: identityEmail,
    slug: "strategy-room.entry",
  });

  if (!entitlement.granted) {
    return { ok: false, status: 403, error: "ENTITLEMENT_REQUIRED" };
  }

  return {
    ok: true,
    identityEmail,
    subjectId: identity.subjectId,
    handoff,
  };
}
