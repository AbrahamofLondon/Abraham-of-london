/**
 * pages/api/provenance/public-verify.ts
 *
 * GET /api/provenance/public-verify?token=<signed-token>
 *
 * Third-party client-safe verification endpoint. No authentication required.
 * Accepts a signed verification token (issued by the system) and returns
 * a provenance status without exposing any internal IDs, emails, actor data,
 * or raw evidence.
 *
 * Token format: base64url( JSON({ scope, scopeId, issuedAt, sig }) )
 * where sig = HMAC-SHA256( pepper, `${scope}:${scopeId}:${issuedAt}` )
 *
 * Rate-limited: 20 requests / 60s / IP.
 *
 * Safe to link to from client-facing communications.
 * Does not confirm the identity of any party.
 * Does not return the caseId or journeyKey directly.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { buildGovernedCaseHash } from "@/lib/product/governed-case-hash";
import { applyRateLimit, getClientIp } from "@/lib/server/apply-rate-limit";

// ─── Token structure ──────────────────────────────────────────────────────────

type VerificationToken = {
  scope: string;
  scopeId: string;
  issuedAt: number; // Unix epoch seconds
  sig: string;
};

const TOKEN_MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // 90 days

function getTokenSecret(): string {
  return (
    process.env.PROVENANCE_VERIFY_SECRET ||
    process.env.ACTION_TOKEN_SECRET ||
    process.env.JWT_SECRET ||
    "dev-provenance-verify-secret"
  );
}

function buildExpectedSig(scope: string, scopeId: string, issuedAt: number): string {
  const secret = getTokenSecret();
  const message = `${scope}:${scopeId}:${issuedAt}`;
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

function parseToken(raw: string): VerificationToken | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).scope !== "string" ||
      typeof (parsed as Record<string, unknown>).scopeId !== "string" ||
      typeof (parsed as Record<string, unknown>).issuedAt !== "number" ||
      typeof (parsed as Record<string, unknown>).sig !== "string"
    ) {
      return null;
    }
    return parsed as VerificationToken;
  } catch {
    return null;
  }
}

/**
 * Issue a signed verification token for a provenance anchor.
 * Used internally when generating client-safe links.
 */
export function issueVerificationToken(scope: string, scopeId: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const sig = buildExpectedSig(scope, scopeId, issuedAt);
  const payload: VerificationToken = { scope, scopeId, issuedAt, sig };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

// ─── Response type ────────────────────────────────────────────────────────────

export type PublicVerifyStatus = "MATCH" | "MISMATCH" | "UNAVAILABLE" | "INVALID_TOKEN" | "EXPIRED";

export type PublicVerifyResult = {
  status: PublicVerifyStatus;
  verifiedAt: string;
  message: string;
  scope?: string;
};

const MESSAGES: Record<PublicVerifyStatus, string> = {
  MATCH: "Record integrity confirmed. The provenance anchor matches.",
  MISMATCH: "Integrity warning. The record has been modified since anchoring.",
  UNAVAILABLE: "This record has not yet been included in a provenance anchor.",
  INVALID_TOKEN: "The verification token is invalid or malformed.",
  EXPIRED: "The verification token has expired. Request a new one.",
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicVerifyResult | { error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ok = await applyRateLimit(req, res, {
    scope: "PROVENANCE_PUBLIC_VERIFY",
    identifier: getClientIp(req),
    limit: 20,
    windowSeconds: 60,
  });
  if (!ok) return;

  const verifiedAt = new Date().toISOString();
  const { token } = req.query;

  if (typeof token !== "string" || !token) {
    return res.status(200).json({
      status: "INVALID_TOKEN",
      verifiedAt,
      message: MESSAGES.INVALID_TOKEN,
    });
  }

  const parsed = parseToken(token);
  if (!parsed) {
    return res.status(200).json({
      status: "INVALID_TOKEN",
      verifiedAt,
      message: MESSAGES.INVALID_TOKEN,
    });
  }

  // Verify signature
  const expectedSig = buildExpectedSig(parsed.scope, parsed.scopeId, parsed.issuedAt);
  if (!crypto.timingSafeEqual(Buffer.from(parsed.sig), Buffer.from(expectedSig))) {
    return res.status(200).json({
      status: "INVALID_TOKEN",
      verifiedAt,
      message: MESSAGES.INVALID_TOKEN,
    });
  }

  // Check expiry
  const ageSeconds = Math.floor(Date.now() / 1000) - parsed.issuedAt;
  if (ageSeconds > TOKEN_MAX_AGE_SECONDS) {
    return res.status(200).json({
      status: "EXPIRED",
      verifiedAt,
      message: MESSAGES.EXPIRED,
      scope: parsed.scope,
    });
  }

  // Unsupported scope
  if (parsed.scope !== "GOVERNED_CASE") {
    return res.status(200).json({
      status: "UNAVAILABLE",
      verifiedAt,
      message: MESSAGES.UNAVAILABLE,
      scope: parsed.scope,
    });
  }

  try {
    const anchor = await prisma.provenanceChainAnchor.findFirst({
      where: { scope: parsed.scope, scopeId: parsed.scopeId },
      orderBy: { computedAt: "desc" },
      select: {
        chainHash: true,
        computedAt: true,
        merkleRoot: true,
        leafCount: true,
      },
    });

    if (!anchor) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({
        status: "UNAVAILABLE",
        verifiedAt,
        message: MESSAGES.UNAVAILABLE,
        scope: parsed.scope,
      });
    }

    const canonicalPayload: Record<string, unknown> = {
      scope: parsed.scope,
      scopeId: parsed.scopeId,
      merkleRoot: anchor.merkleRoot,
      leafCount: anchor.leafCount,
      computedAt: anchor.computedAt.toISOString(),
    };

    const recomputedHash = buildGovernedCaseHash(canonicalPayload);
    const isMatch = recomputedHash === anchor.chainHash;

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Provenance-Status", isMatch ? "MATCH" : "MISMATCH");
    return res.status(200).json({
      status: isMatch ? "MATCH" : "MISMATCH",
      verifiedAt,
      message: isMatch ? MESSAGES.MATCH : MESSAGES.MISMATCH,
      scope: parsed.scope,
    });
  } catch (err) {
    console.error("[public-verify]", err);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      status: "UNAVAILABLE",
      verifiedAt,
      message: "Verification could not be completed due to an unexpected error.",
    });
  }
}

export const config = {
  api: { bodyParser: false },
};
