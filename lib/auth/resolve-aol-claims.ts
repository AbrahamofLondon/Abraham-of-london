// lib/auth/resolve-aol-claims.ts
import crypto from "crypto";
import { prisma } from "@/lib/server/prisma";
import type { AoLClaims, AoLTier } from "@/lib/auth/aol-claims";

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function safeParseFlags(flagsJson?: string | null): string[] {
  if (!flagsJson) return [];
  try {
    const v = JSON.parse(flagsJson);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function hasInternalFlag(flags: string[]): boolean {
  return (
    flags.includes("internal") ||
    flags.includes("staff") ||
    flags.includes("private_access") ||
    flags.includes("admin")
  );
}

// Map your DB member tier -> AoL tier ladder.
// Adjust once, centrally.
function mapMemberTierToAoLTier(dbTier: string, flags: string[]): AoLTier {
  if (hasInternalFlag(flags)) return "private";

  const t = (dbTier || "").toLowerCase();

  if (t.includes("elite") || t.includes("enterprise")) return "inner-circle-elite";
  if (t.includes("plus") || t.includes("premium")) return "inner-circle-plus";
  if (t.includes("standard") || t.includes("basic")) return "inner-circle";

  // default: if they exist and active, treat as inner-circle
  return "inner-circle";
}

export async function resolveAoLClaimsByEmail(email?: string | null): Promise<AoLClaims["aol"]> {
  if (!email) {
    return {
      tier: "public",
      innerCircleAccess: false,
      isInternal: false,
      allowPrivate: false,
      memberId: null,
      emailHash: null,
      flags: [],
    };
  }

  // Your InnerCircleMember uses emailHash as primary identity.
  const emailHash = sha256Hex(email.trim().toLowerCase());

  const member = await prisma.innerCircleMember.findUnique({
    where: { emailHash },
    select: {
      id: true,
      status: true,
      tier: true,
      flags: true,
      emailHash: true,
    },
  });

  if (!member || member.status !== "active") {
    return {
      tier: "public",
      innerCircleAccess: false,
      isInternal: false,
      allowPrivate: false,
      memberId: member?.id ?? null,
      emailHash,
      flags: member?.flags ? safeParseFlags(member.flags) : [],
    };
  }

  const flags = safeParseFlags(member.flags);
  const isInternal = hasInternalFlag(flags);
  const tier = mapMemberTierToAoLTier(member.tier, flags);

  return {
    tier,
    innerCircleAccess: true,
    isInternal,
    allowPrivate: isInternal, // hard rule: private requires internal
    memberId: member.id,
    emailHash: member.emailHash,
    flags,
  };
}