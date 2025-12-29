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
  return ORDER.indexOf(user) >= ORDER.indexOf(required);
}

/**
 * Read tier from cookies.
 * You can wire this to your real cookie later. This is deterministic and safe.
 */
export function getUserTierFromCookies(cookieHeader: string | undefined): InnerCircleTier {
  const c = cookieHeader ?? "";
  // Example cookie: innerCircleTier=inner-circle-plus
  const m = c.match(/(?:^|;\s*)innerCircleTier=([^;]+)/i);
  const raw = m?.[1] ? decodeURIComponent(m[1]) : "";
  if (raw === "inner-circle" || raw === "inner-circle-plus" || raw === "inner-circle-elite" || raw === "private")
    return raw as InnerCircleTier;
  // If your existing system uses innerCircleAccess=true, treat it as "inner-circle"
  if (/(?:^|;\s*)innerCircleAccess=true(?:;|$)/i.test(c)) return "inner-circle";
  return "public";
}

export function newNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

type TokenPayload = {
  slug: string;
  exp: number; // unix seconds
  requiredTier: InnerCircleTier;
  nonce: string;
};

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

export function verifyDownloadToken(
  token: string,
  secret: string
): { valid: false; reason: string; slug?: string; requiredTier?: InnerCircleTier } | ({ valid: true } & TokenPayload) {
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false, reason: "malformed" };

  const [body, sig] = parts;
  const expected = crypto.createHmac("sha256", secret).update(body).digest();
  const got = unb64url(sig);

  // FIX: Cast buffers to Uint8Array to satisfy strict TypeScript definitions
  // (Buffer inherits from Uint8Array in Node, but TS types can sometimes conflict on 'entries')
  if (got.length !== expected.length || !crypto.timingSafeEqual(got as unknown as Uint8Array, expected as unknown as Uint8Array)) {
    let slug: string | undefined;
    try {
      const decoded = JSON.parse(unb64url(body).toString("utf8"));
      slug = decoded?.slug;
    } catch {}
    return { valid: false, reason: "bad_signature", slug };
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(unb64url(body).toString("utf8"));
  } catch {
    return { valid: false, reason: "bad_payload" };
  }

  if (!payload?.slug || !payload?.exp || !payload?.requiredTier || !payload?.nonce) {
    return { valid: false, reason: "missing_fields", slug: payload?.slug };
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    return {
      valid: false,
      reason: "expired",
      slug: payload.slug,
      requiredTier: payload.requiredTier,
    };
  }

  return { valid: true, ...payload };
}