import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteUserData } from "@/lib/server/privacy/identity-service.server";
import { writeSecurityAudit } from "@/lib/security/audit-log";
import {
  enforceAppRouteRateLimit,
  getClientIp,
  noStoreJson,
  parseJsonBody,
  requireJsonContent,
  requireMethod,
  requireSameOrigin,
  sha256Hex,
} from "@/lib/server/security/app-route-guards";
import { verifySignedActionToken } from "@/lib/server/security/signed-action-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email().max(320),
  proofToken: z.string().trim().min(20).max(2048).optional(),
}).strict();

/**
 * POST /api/user/delete
 *
 * Right to be forgotten. Deletes:
 * - UserIdentity (soft-deleted, hash retained for unsubscribe enforcement)
 * - All SessionLinks for this user
 * - All associated DecisionSessions
 *
 * No authentication required — email is the identity proof.
 * Rate limited by existing infrastructure.
 */
export async function POST(req: NextRequest) {
  const methodCheck = requireMethod(req, ["POST"]);
  if (!methodCheck.ok) return methodCheck.response;

  const contentCheck = requireJsonContent(req);
  if (!contentCheck.ok) return contentCheck.response;

  const parsed = await parseJsonBody(req, schema);
  if (!parsed.ok) return parsed.response;

  const proof = parsed.data.proofToken
    ? verifySignedActionToken(parsed.data.proofToken, "privacy_delete")
    : null;

  if (!proof) {
    const sameOrigin = requireSameOrigin(req, "/api/user/delete");
    if (!sameOrigin.ok) return sameOrigin.response;
  } else if (!proof.ok || proof.payload.subject !== sha256Hex(parsed.data.email.trim().toLowerCase())) {
    return noStoreJson({ ok: false, error: "INVALID_PROOF" }, { status: 403 });
  }

  const rateLimit = await enforceAppRouteRateLimit({
    request: req,
    routeKey: "user-delete",
    limit: 5,
    windowMs: 15 * 60_000,
    email: parsed.data.email,
    failClosed: true,
  });
  if (!rateLimit.ok) return rateLimit.response;

  try {
    const result = await deleteUserData(parsed.data.email);
    await writeSecurityAudit({
      action: "delete_request",
      status: "SUCCESS",
      resourceId: "/api/user/delete",
      ip: getClientIp(req),
      metadata: {
        subjectHash: sha256Hex(parsed.data.email.trim().toLowerCase()),
        deleted: result.deleted,
        sessionsRemoved: result.sessionsRemoved,
      },
    });

    return noStoreJson({
      ok: true,
      message: "If data existed for this address, it has been scheduled for deletion.",
    });
  } catch {
    return noStoreJson({ ok: false, error: "Deletion failed" }, { status: 500 });
  }
}
