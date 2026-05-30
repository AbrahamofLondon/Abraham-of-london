/* pages/api/verify.ts — PUBLIC VERIFICATION ENDPOINT
 *
 * Receives a token and returns an honest classification.
 * Does NOT fake verification. Does NOT claim cryptographic binding unless
 * a real signed record is found.
 *
 * Token type detection:
 *  - 6-char alphanumeric: demo reference — not verifiable
 *  - Longer token beginning with "FDY-": full review token — look up in DB (not yet wired)
 *  - Anything else: invalid format
 *
 * When the full verification engine is wired, replace the FULL_REVIEW branch
 * with a real database lookup.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import {
  rateLimit,
  getClientIp,
} from "@/lib/server/rateLimit";

export type TokenKind =
  | "demo_ref"        // 6-char public test reference — not verifiable
  | "full_review"     // Full governed review token — verifiable when engine is live
  | "invalid_format"  // Does not match any known pattern
  | "not_found"       // Correct format but no matching record (reserved for live engine)
  | "expired"         // Valid format and found, but the record has expired
  | "mismatch";       // Found but content hash does not match

export type VerifyResult = {
  kind: TokenKind;
  verified: boolean;
  title: string;
  explanation: string;
  nextAction: string;
};

function classifyToken(raw: string): VerifyResult {
  const t = raw.trim();

  // Demo reference: exactly 6 uppercase alphanumeric chars
  if (/^[A-Z0-9]{6}$/.test(t)) {
    return {
      kind: "demo_ref",
      verified: false,
      title: "Demo Reference — Not Verifiable",
      explanation:
        "This is a demo reference ID generated during a public test. " +
        "Demo references are not cryptographically signed and cannot be verified. " +
        "They are included in public test results for continuity reference only.",
      nextAction: "Run a public test or request a full review to receive a verifiable token.",
    };
  }

  // Full review token format: FDY- prefix followed by 24+ chars
  if (/^FDY-[A-Za-z0-9\-]{20,}$/.test(t)) {
    // Full verification engine not yet wired for public access.
    // When live: look up the token hash in the FoundryRecord table and
    // return the public-safe metadata (issuer, date, decision type, status).
    return {
      kind: "full_review",
      verified: false,
      title: "Full Review Token — Verification Pending",
      explanation:
        "This appears to be a full review token. " +
        "The public verification engine is not yet active. " +
        "If you received this token from the Foundry, contact the team directly to confirm the record.",
      nextAction: "Contact the Foundry team to verify this record while the public engine is being prepared.",
    };
  }

  return {
    kind: "invalid_format",
    verified: false,
    title: "Unrecognised Token",
    explanation:
      "This token does not match any known Foundry format. " +
      "Demo references are 6 characters. Full review tokens begin with FDY-. " +
      "Check the token was copied correctly.",
    nextAction: "Check the token for typos, or run a public test to see an example.",
  };
}

const VERIFY_RL = { limit: 20, windowSeconds: 3600 };

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(`verify:${ip}`, VERIFY_RL);
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(rl.resetSeconds ?? 3600));
    return res.status(429).json({ ok: false, error: "Too many requests." });
  }

  const raw = req.body?.token;
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return res.status(400).json({ ok: false, error: "Token is required." });
  }

  const result = classifyToken(raw);

  return res.status(200).json({
    ok: true,
    valid: result.verified,
    kind: result.kind,
    title: result.title,
    explanation: result.explanation,
    nextAction: result.nextAction,
  });
}
