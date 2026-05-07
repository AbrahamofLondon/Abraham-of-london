import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteUserData, hasUserIdentity } from "@/lib/server/privacy/identity-service.server";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { sendEmail } from "@/lib/email/core/sendEmail";
import { writeSecurityAudit } from "@/lib/security/audit-log";
import {
  enforceAppRouteRateLimit,
  getClientIp,
  noStoreJson,
  parseJsonBody,
  requireJsonContent,
  requireMethod,
  sha256Hex,
} from "@/lib/server/security/app-route-guards";
import {
  createSignedActionToken,
  verifySignedActionToken,
} from "@/lib/server/security/signed-action-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email().max(320),
  proofToken: z.string().trim().min(20).max(2048).optional(),
}).strict();

const genericAcceptedMessage =
  "If this address can be verified, a confirmation link will be sent.";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function buildDeleteConfirmationUrl(email: string): string {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://www.abrahamoflondon.org"
  ).replace(/\/$/, "");
  const normalizedEmail = normalizeEmail(email);
  const proofToken = createSignedActionToken({
    purpose: "privacy_delete",
    subject: sha256Hex(normalizedEmail),
    ttlSeconds: 60 * 60 * 24 * 7,
  });

  const params = new URLSearchParams({
    email: normalizedEmail,
    proofToken,
  });

  return `${baseUrl}/api/user/delete?${params.toString()}`;
}

async function sendDeleteConfirmationEmail(email: string): Promise<void> {
  const confirmationUrl = buildDeleteConfirmationUrl(email);
  await sendEmail({
    type: "TRANSACTIONAL",
    to: email,
    subject: "Confirm data deletion",
    text: [
      "A request was made to delete data associated with this address.",
      "",
      "If you want to proceed, confirm here:",
      confirmationUrl,
      "",
      "If you did not request this, no action is required.",
    ].join("\n"),
    html: [
      "<p>A request was made to delete data associated with this address.</p>",
      `<p><a href="${confirmationUrl}">Confirm deletion</a></p>`,
      "<p>If you did not request this, no action is required.</p>",
    ].join(""),
  });
}

async function executeDelete(email: string, req: NextRequest) {
  const result = await deleteUserData(email);
  await writeSecurityAudit({
    action: "delete_request",
    status: "SUCCESS",
    resourceId: "/api/user/delete",
    ip: getClientIp(req),
    metadata: {
      subjectHash: sha256Hex(normalizeEmail(email)),
      deleted: result.deleted,
      sessionsRemoved: result.sessionsRemoved,
    },
  });
}

/**
 * POST /api/user/delete
 *
 * Right to be forgotten. Deletes:
 * - UserIdentity (soft-deleted, hash retained for unsubscribe enforcement)
 * - All SessionLinks for this user
 * - All associated DecisionSessions
 *
 * Execution requires either a signed proof token or an authenticated owner.
 * Unproven email-only requests get a generic 202 and a confirmation email.
 */
export async function POST(req: NextRequest) {
  const methodCheck = requireMethod(req, ["POST"]);
  if (!methodCheck.ok) return methodCheck.response;

  const contentCheck = requireJsonContent(req);
  if (!contentCheck.ok) return contentCheck.response;

  const parsed = await parseJsonBody(req, schema);
  if (!parsed.ok) return parsed.response;

  const normalizedEmail = normalizeEmail(parsed.data.email);
  const proof = parsed.data.proofToken
    ? verifySignedActionToken(parsed.data.proofToken, "privacy_delete")
    : null;

  if (proof && (!proof.ok || proof.payload.subject !== sha256Hex(normalizedEmail))) {
    return noStoreJson({ ok: false, error: "INVALID_PROOF" }, { status: 403 });
  }

  const rateLimit = await enforceAppRouteRateLimit({
    request: req,
    routeKey: "user-delete",
    limit: 5,
    windowMs: 15 * 60_000,
    email: normalizedEmail,
    failClosed: true,
  });
  if (!rateLimit.ok) return rateLimit.response;

  try {
    const identity = await resolveIdentity(req);
    const authenticatedOwner =
      identity.authenticated &&
      typeof identity.email === "string" &&
      normalizeEmail(identity.email) === normalizedEmail;

    if (proof?.ok || authenticatedOwner) {
      await executeDelete(normalizedEmail, req);
      return noStoreJson({
        ok: true,
        message: "If data existed for this address, it has been scheduled for deletion.",
      });
    }

    if (await hasUserIdentity(normalizedEmail)) {
      await sendDeleteConfirmationEmail(normalizedEmail);
    }

    await writeSecurityAudit({
      action: "delete_confirmation_required",
      status: "PENDING",
      resourceId: "/api/user/delete",
      ip: getClientIp(req),
      metadata: {
        subjectHash: sha256Hex(normalizedEmail),
      },
    });

    return noStoreJson(
      { ok: true, pending: true, message: genericAcceptedMessage },
      { status: 202 },
    );
  } catch {
    return noStoreJson({ ok: false, error: "Deletion failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const email = normalizeEmail(req.nextUrl.searchParams.get("email") || "");
  const proofToken = req.nextUrl.searchParams.get("proofToken") || "";

  if (!email || !proofToken) {
    return noStoreJson({ ok: false, error: "INVALID_PROOF" }, { status: 400 });
  }

  const proof = verifySignedActionToken(proofToken, "privacy_delete");
  if (!proof.ok || proof.payload.subject !== sha256Hex(email)) {
    return noStoreJson({ ok: false, error: "INVALID_PROOF" }, { status: 403 });
  }

  await executeDelete(email, req);

  return NextResponse.redirect(new URL("/privacy?delete=confirmed", req.url), 303);
}
