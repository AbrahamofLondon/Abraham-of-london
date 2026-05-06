import { NextRequest, NextResponse } from 'next/server';
import { 
  createOrUpdateMemberAndIssueKey, 
  type CreateOrUpdateMemberArgs 
} from '@/lib/innerCircleMembership';
import { getClientIp } from '@/lib/inner-circle/server-utils';
import { consumePersistentRateLimit } from '@/lib/server/security/persistent-rate-limit';
import { applyShieldFromRequest } from '@/lib/server/security/shield-middleware';
import { z } from "zod";
import { noStoreJson, parseJsonBody, requireJsonContent, requireMethod, requireSameOrigin } from "@/lib/server/security/app-route-guards";

const issueSchema = z.object({
  email: z.string().trim().email().max(320),
  name: z.string().trim().min(1).max(160).optional(),
  context: z.enum(["registration", "admin", "reissue"]).optional(),
}).strict();

/**
 * INSTITUTIONAL ONBOARDING GATEWAY
 * POST /api/inner-circle/issue
 * Securely issues new access keys to verified email identities.
 */
export async function POST(req: NextRequest) {
  const methodCheck = requireMethod(req, ["POST"]);
  if (!methodCheck.ok) return methodCheck.response;

  const contentCheck = requireJsonContent(req);
  if (!contentCheck.ok) return contentCheck.response;

  const sameOrigin = requireSameOrigin(req, "/api/inner-circle/issue");
  if (!sameOrigin.ok) return sameOrigin.response;

  // Anti-reconnaissance shield
  const shield = await applyShieldFromRequest(req, "/api/inner-circle/issue");
  if (shield.blocked) return NextResponse.json({ error: "REQUEST_THROTTLED" }, { status: 429 });

  // Rate limit: medium — 20 requests per 60s per IP
  const ip = getClientIp(req);
  const rl = await consumePersistentRateLimit({
    key: `inner-circle-issue:${ip}`,
    limit: 20,
    windowMs: 60_000,
    failClosed: true,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMIT_EXCEEDED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const parsed = await parseJsonBody(req, issueSchema);
    if (!parsed.ok) return parsed.response;
    const { email, name, context = "registration" } = parsed.data;

    // 2. Intelligence Gathering
    const args: CreateOrUpdateMemberArgs = {
      email,
      name,
      ipAddress: ip,
      context
    };

    // 3. Execution
    const issuedKey = await createOrUpdateMemberAndIssueKey(args);

    // 4. Secure Response
    // We return the raw key only ONCE during this initial issuance.
    return noStoreJson({
      success: true,
      data: {
        key: issuedKey.key, // The full IC-XXXX key
        suffix: issuedKey.keySuffix,
        status: issuedKey.status,
        issuedAt: issuedKey.createdAt
      }
    });

  } catch {
    return noStoreJson(
      { error: "Internal security reconciliation failed." }, 
      { status: 500 }
    );
  }
}
