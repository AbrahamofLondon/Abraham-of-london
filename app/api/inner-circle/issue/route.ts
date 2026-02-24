import { NextRequest, NextResponse } from 'next/server';
import { 
  createOrUpdateMemberAndIssueKey, 
  type CreateOrUpdateMemberArgs 
} from '@/lib/innerCircleMembership';
import { getClientIp, rateLimitForRequestIp } from '@/lib/inner-circle/server-utils';

/**
 * INSTITUTIONAL ONBOARDING GATEWAY
 * POST /api/inner-circle/issue
 * Securely issues new access keys to verified email identities.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
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