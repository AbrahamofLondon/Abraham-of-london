import { NextRequest, NextResponse } from 'next/server';
import { 
  createOrUpdateMemberAndIssueKey, 
  type CreateOrUpdateMemberArgs 
} from '@/lib/innerCircleMembership';
import { getClientIp } from '@/lib/inner-circle/server-utils';
import { consumePersistentRateLimit } from '@/lib/server/security/persistent-rate-limit';
import { applyShieldFromRequest } from '@/lib/server/security/shield-middleware';

/**
 * INSTITUTIONAL ONBOARDING GATEWAY
 * POST /api/inner-circle/issue
 * Securely issues new access keys to verified email identities.
 */
export async function POST(req: NextRequest) {
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
    const body = await req.json();
    const { email, name, context = "registration" } = body;

    // 1. Validation Perimeter
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: "A valid institutional email is required." }, 
        { status: 400 }
      );
    }

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
    return NextResponse.json({
      success: true,
      data: {
        key: issuedKey.key, // The full IC-XXXX key
        suffix: issuedKey.keySuffix,
        status: issuedKey.status,
        issuedAt: issuedKey.createdAt
      }
    });

  } catch (error: any) {
    console.error("❌ [ONBOARDING_FAILURE]:", error.message);
    return NextResponse.json(
      { error: "Internal security reconciliation failed." }, 
      { status: 500 }
    );
  }
}