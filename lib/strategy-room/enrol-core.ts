/* lib/strategy-room/enrol-core.ts — SSOT intake pipeline */
import { prisma } from "@/lib/prisma";
import { verifyRecaptchaDetailed } from "@/lib/recaptchaServer";
import { vetStrategyInquiry } from "@/lib/intelligence/vetting-engine";
import { Prisma } from "@prisma/client";

export type StrategyRoomCanonicalInput = {
  name: string;
  email: string;
  intent: string;
  token?: string | null;
  source?: string;
  organisation?: string | null;
  metadata?: Record<string, unknown>;
};

export type StrategyRoomApiResult =
  | {
      ok: true;
      message: string;
      referenceId: string;
      priorityStatus?: string | null;
      warning?: string;
    }
  | {
      ok: false;
      error: string;
      statusCode: number;
      details?: unknown;
    };

export type StrategyRoomRequestContext = {
  ip?: string;
  userAgent?: string;
};

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown): string {
  return normalizeString(value).toLowerCase();
}

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function bypassAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_RECAPTCHA_BYPASS === "true"
  );
}

/**
 * Nested Prisma JSON value.
 * Important: nested object properties may be null, but top-level InputJsonValue may not be.
 */
function toPrismaJsonNested(
  value: unknown
): Prisma.InputJsonValue | null {
  if (value === null || value === undefined) return null;

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    const arr: Array<Prisma.InputJsonValue | null> = [];
    for (const item of value) {
      arr.push(toPrismaJsonNested(item));
    }
    return arr as Prisma.InputJsonArray;
  }

  if (typeof value === "object") {
    const out: Record<string, Prisma.InputJsonValue | null> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = toPrismaJsonNested(val);
    }
    return out as Prisma.InputJsonObject;
  }

  return String(value);
}

/**
 * Top-level JSON object for Prisma JSON fields.
 * Guarantees an object, never top-level null.
 */
function toPrismaJsonObject(value: unknown): Prisma.InputJsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Prisma.InputJsonObject;
  }

  const out: Record<string, Prisma.InputJsonValue | null> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = toPrismaJsonNested(val);
  }
  return out as Prisma.InputJsonObject;
}

async function writeAuditSafe(data: {
  action: string;
  severity: string;
  actorEmail?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.systemAuditLog.create({
      data: {
        action: data.action,
        severity: data.severity as any,
        actorEmail: data.actorEmail || null,
        resourceType: data.resourceType || null,
        resourceId: data.resourceId || null,
        metadata: toPrismaJsonObject(data.metadata),
      },
    });
  } catch (error) {
    console.error("[STRATEGY_ROOM_AUDIT_ERROR]:", error);
  }
}

export function normalizeCanonicalInput(body: any): StrategyRoomCanonicalInput {
  const name = normalizeString(body?.name || body?.fullName);
  const email = normalizeEmail(body?.email || body?.contact?.email);
  const intent = normalizeString(
    body?.intent ||
      body?.message ||
      body?.decision?.statement ||
      body?.decisionStatement
  );
  const token = normalizeString(body?.token || null) || null;
  const source = normalizeString(body?.source || "strategy_room");
  const organisation =
    normalizeString(
      body?.organisation ||
        body?.company ||
        body?.contact?.organisation ||
        null
    ) || null;

  return {
    name,
    email,
    intent,
    token,
    source,
    organisation,
    metadata:
      body?.metadata &&
      typeof body.metadata === "object" &&
      !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : {},
  };
}

export async function processStrategyRoomEnrolment(
  input: StrategyRoomCanonicalInput,
  ctx: StrategyRoomRequestContext = {}
): Promise<StrategyRoomApiResult> {
  const name = normalizeString(input.name);
  const email = normalizeEmail(input.email);
  const intent = normalizeString(input.intent);
  const token = normalizeString(input.token || "");
  const source = normalizeString(input.source || "strategy_room");
  const organisation = normalizeString(input.organisation || "") || null;
  const ip = normalizeString(ctx.ip || "");
  const userAgent = normalizeString(ctx.userAgent || "");

  if (!name || !email || !intent) {
    return {
      ok: false,
      statusCode: 400,
      error: "Incomplete institutional data.",
      details: { required: ["name", "email", "intent"] },
    };
  }

  if (!isEmailLike(email)) {
    return {
      ok: false,
      statusCode: 400,
      error: "Invalid institutional email.",
    };
  }

  if (intent.length < 12) {
    return {
      ok: false,
      statusCode: 400,
      error: "Strategic intent is too brief.",
    };
  }

  let recaptchaWarning: string | undefined;

  if (token) {
    const verification = await verifyRecaptchaDetailed(
      token,
      "artifact_access_request",
      ip
    );

    if (!verification.success) {
      const retryVerification = await verifyRecaptchaDetailed(
        token,
        "strategy_room_intake",
        ip
      );

      if (!retryVerification.success) {
        await writeAuditSafe({
          action: "BOT_DETECTION_SHIELD",
          severity: "high",
          actorEmail: email,
          resourceType: "STRATEGY_INQUIRY",
          metadata: {
            ip,
            userAgent,
            verification,
            retryVerification,
            source,
          },
        });

        return {
          ok: false,
          statusCode: 403,
          error: "Security validation failed.",
          details:
            process.env.NODE_ENV !== "production"
              ? { verification, retryVerification }
              : undefined,
        };
      }

      if (retryVerification.warning) {
        recaptchaWarning = retryVerification.warning;
      }
    } else if (verification.warning) {
      recaptchaWarning = verification.warning;
    }
  } else if (!bypassAllowed()) {
    return {
      ok: false,
      statusCode: 400,
      error: "Security token missing.",
    };
  } else {
    recaptchaWarning = "bypass_active_missing_token";
  }

  try {
    const entry = await prisma.strategyInquiry.create({
      data: {
        name,
        email,
        intent,
        status: "PENDING",
        metadata: toPrismaJsonObject({
          ip,
          userAgent,
          timestamp: new Date().toISOString(),
          source,
          organisation,
          recaptchaWarning: recaptchaWarning ?? null,
          ...(input.metadata || {}),
        }),
      },
    });

    let vettedEntry: any = null;

    try {
      vettedEntry = await vetStrategyInquiry(entry.id);
    } catch (error) {
      console.error("[STRATEGY_ROOM_VETTING_ERROR]:", error);
    }

    await writeAuditSafe({
      action: "INTAKE_INITIALIZED",
      severity: vettedEntry?.status === "PRIORITY" ? "info" : "low",
      actorEmail: email,
      resourceType: "STRATEGY_INQUIRY",
      resourceId: entry.id,
      metadata: {
        ip,
        source,
        organisation,
        priorityStatus: vettedEntry?.status || null,
        recaptchaWarning: recaptchaWarning ?? null,
      },
    });

    return {
      ok: true,
      message: "Institutional sequence initialized.",
      referenceId: entry.id,
      priorityStatus: vettedEntry?.status || null,
      warning: recaptchaWarning,
    };
  } catch (error) {
    console.error("[STRATEGY_ROOM_ENROL_ERROR]:", error);

    await writeAuditSafe({
      action: "INTAKE_FAILURE",
      severity: "critical",
      actorEmail: email || null,
      resourceType: "STRATEGY_INQUIRY",
      metadata: {
        ip,
        userAgent,
        source,
        organisation,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return {
      ok: false,
      statusCode: 500,
      error: "System failure during archival.",
    };
  }
}