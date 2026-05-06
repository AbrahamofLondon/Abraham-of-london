import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { unsubscribeUser } from "@/lib/server/privacy/identity-service.server";
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
 * POST /api/user/unsubscribe
 *
 * Unsubscribes user from all system communications.
 * The Decision State Orchestrator checks this before sending.
 */
export async function POST(req: NextRequest) {
  const methodCheck = requireMethod(req, ["POST"]);
  if (!methodCheck.ok) return methodCheck.response;

  const contentCheck = requireJsonContent(req);
  if (!contentCheck.ok) return contentCheck.response;

  const parsed = await parseJsonBody(req, schema);
  if (!parsed.ok) return parsed.response;

  const proof = parsed.data.proofToken
    ? verifySignedActionToken(parsed.data.proofToken, "privacy_unsubscribe")
    : null;

  if (!proof) {
    const sameOrigin = requireSameOrigin(req, "/api/user/unsubscribe");
    if (!sameOrigin.ok) return sameOrigin.response;
  } else if (!proof.ok || proof.payload.subject !== sha256Hex(parsed.data.email.trim().toLowerCase())) {
    return noStoreJson({ ok: false, error: "INVALID_PROOF" }, { status: 403 });
  }

  const rateLimit = await enforceAppRouteRateLimit({
    request: req,
    routeKey: "user-unsubscribe",
    limit: 8,
    windowMs: 15 * 60_000,
    email: parsed.data.email,
    failClosed: true,
  });
  if (!rateLimit.ok) return rateLimit.response;

  try {
    const result = await unsubscribeUser(parsed.data.email);
    await writeSecurityAudit({
      action: "unsubscribe",
      status: "SUCCESS",
      resourceId: "/api/user/unsubscribe",
      ip: getClientIp(req),
      metadata: {
        subjectHash: sha256Hex(parsed.data.email.trim().toLowerCase()),
        updated: result,
      },
    });
    return noStoreJson({
      ok: true,
      message: "If this address exists, communication preferences have been updated.",
    });
  } catch {
    return noStoreJson({ ok: false, error: "Unsubscribe failed" }, { status: 500 });
  }
}
