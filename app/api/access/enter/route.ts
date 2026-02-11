import { NextRequest, NextResponse } from "next/server";
import { prisma, safePrismaQuery } from "@/lib/prisma";
import { sha256Hex, mapMemberTierToAoLTier, safeParseFlags } from "@/lib/auth-utils";
import { rateLimit, RATE_LIMIT_CONFIGS, getClientIp, createRateLimitHeaders } from "@/lib/server/rate-limit-unified";

/**
 * ACCESS HANDSHAKE: Validates inbound security keys against the Neon Registry.
 * Shielded by Institutional-grade Rate Limiting (Memory-Fallback).
 */
export async function POST(req: NextRequest) {
  // 1. RATE LIMIT CHECK: Shield the vault from brute-force
  const ip = getClientIp(req);
  const rl = await rateLimit(ip, RATE_LIMIT_CONFIGS.INNER_CIRCLE_UNLOCK);
  
  const headers = createRateLimitHeaders(rl);

  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, reason: "TOO_MANY_ATTEMPTS", retryAfter: Math.ceil(rl.retryAfterMs / 1000) },
      { status: 429, headers }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { ok: false, reason: "AUTHENTICATION_TOKEN_REQUIRED" }, 
        { status: 400, headers }
      );
    }

    const normalized = token.trim().toLowerCase();
    const hashed = sha256Hex(normalized);

    // 2. Identity Verification via Neon Registry
    const member = await safePrismaQuery(() => 
      prisma.innerCircleMember.findFirst({
        where: {
          OR: [
            { email: normalized },
            { emailHash: hashed },
            { emailHash: normalized } // Directorate Master Key Support
          ],
          status: "active"
        },
        select: { 
          id: true,
          tier: true, 
          flags: true 
        }
      })
    );

    // 3. Failure Handling: Prevent credential fishing
    if (!member) {
      return NextResponse.json(
        { ok: false, reason: "INVALID_CREDENTIAL_MATCH" }, 
        { status: 401, headers }
      );
    }

    // 4. Logic Synchronization: Map DB strings to AoLTier types
    const flags = safeParseFlags(member.flags);
    const resolvedTier = mapMemberTierToAoLTier(member.tier, flags);

    // 5. Successful Handshake
    return NextResponse.json({ 
      ok: true, 
      tier: resolvedTier,
      memberId: member.id,
      flags: flags
    }, { headers });

  } catch (error) {
    console.error("[VAULT_HANDSHAKE_FAILURE]:", error);
    return NextResponse.json(
      { ok: false, reason: "ENCRYPTION_LAYER_FAILURE" }, 
      { status: 500, headers }
    );
  }
}