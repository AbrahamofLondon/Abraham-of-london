/* lib/downloads/security.ts */
import crypto from "node:crypto";

export type InnerCircleTier =
  | "public"
  | "inner-circle"
  | "inner-circle-plus"
  | "inner-circle-elite"
  | "private";

const ORDER: InnerCircleTier[] = [
  "public",
  "inner-circle",
  "inner-circle-plus",
  "inner-circle-elite",
  "private",
];

export function tierAtLeast(user: InnerCircleTier, required: InnerCircleTier): boolean {
  const uIdx = ORDER.indexOf(user);
  const rIdx = ORDER.indexOf(required);
  // Fail-closed: return false if tier is unrecognized (-1)
  return uIdx >= rIdx && uIdx !== -1 && rIdx !== -1;
}

/**
 * Institutional Tier Extraction
 * Logic: Hardened regex to prevent ReDoS and ensure exact cookie matching.
 */
export function getUserTierFromCookies(cookieHeader: string | undefined): InnerCircleTier {
  if (!cookieHeader) return "public";
  
  const match = cookieHeader.match(/(?:^|;\s*)innerCircleTier=([^;]+)/i);
  const raw = match?.[1] ? decodeURIComponent(match[1]).trim().toLowerCase() : "";
  
  if (ORDER.includes(raw as InnerCircleTier)) return raw as InnerCircleTier;
  
  // High-availability fallback for binary access keys
  if (/(?:^|;\s*)innerCircleAccess=true(?:;|$)/i.test(cookieHeader)) return "inner-circle";
  
  return "public";
}

export function newNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

export type TokenPayload = {
  slug: string;
  exp: number; // unix seconds
  requiredTier: InnerCircleTier;
  nonce: string;
};

/* --- RFC 4648 Compliant Base64Url Helpers --- */
function b64url(input: Buffer | string): string {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function unb64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const s = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(s, "base64");
}

export function signDownloadToken(payload: TokenPayload, secret: string): string {
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(body).digest();
  return `${body}.${b64url(sig)}`;
}

/**
 * Robust Token Verification
 * Logic: Uses constant-time comparison to mitigate side-channel timing attacks.
 */
export function verifyDownloadToken(
  token: string,
  secret: string
): { valid: false; reason: string; slug?: string; requiredTier?: InnerCircleTier } | ({ valid: true } & TokenPayload) {
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false, reason: "malformed_structure" };
  
  const bodyEncoded = parts[0];
  const sigEncoded = parts[1];
  
  // Type safety: ensure both parts exist
  if (!bodyEncoded || !sigEncoded) {
    return { valid: false, reason: "malformed_structure" };
  }
  
  try {
    const expected = crypto.createHmac("sha256", secret).update(bodyEncoded).digest();
    const got = unb64url(sigEncoded);
    
    // FIXED: Strict casting to Uint8Array for timingSafeEqual to prevent TS 'entries' collision
    if (got.length !== expected.length || 
        !crypto.timingSafeEqual(new Uint8Array(got), new Uint8Array(expected))) {
      
      let slug: string | undefined;
      try {
        const decoded = JSON.parse(unb64url(bodyEncoded).toString("utf8"));
        slug = decoded?.slug;
      } catch {
        // Silent catch - slug extraction is best-effort
      }
      return { valid: false, reason: "signature_mismatch", slug };
    }
    
    const payload: TokenPayload = JSON.parse(unb64url(bodyEncoded).toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp < now) {
      return { valid: false, reason: "token_expired", slug: payload.slug, requiredTier: payload.requiredTier };
    }
    
    if (!payload.slug || !payload.exp || !payload.requiredTier || !payload.nonce) {
      return { valid: false, reason: "incomplete_payload", slug: payload.slug };
    }
    
    return { valid: true, ...payload };
  } catch (err) {
    return { valid: false, reason: "internal_decryption_error" };
  }
}