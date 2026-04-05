/* lib/security/download-signing.ts
   Expiring signed URLs for controlled artifact download.
*/

import crypto from "crypto";

export type SignedDownloadPayload = {
  artifactId: string;
  diagnosticRef: string;
  email: string;
  exp: number;
};

function requireSecret(): string {
  const secret = process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret) {
    throw new Error("DOWNLOAD_SIGNING_SECRET_MISSING");
  }
  return secret;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function unb64url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded =
    normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(input: string): string {
  return b64url(
    crypto.createHmac("sha256", requireSecret()).update(input).digest(),
  );
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function createSignedDownloadToken(
  payload: SignedDownloadPayload,
): string {
  const normalized: SignedDownloadPayload = {
    artifactId: safeString(payload.artifactId),
    diagnosticRef: safeString(payload.diagnosticRef),
    email: safeString(payload.email).toLowerCase(),
    exp: safeNumber(payload.exp),
  };

  const body = b64url(JSON.stringify(normalized));
  const mac = sign(body);
  return `${body}.${mac}`;
}

export function verifySignedDownloadToken(
  token: string,
): SignedDownloadPayload | null {
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;

  const body = token.slice(0, idx);
  const providedMac = token.slice(idx + 1);
  const expectedMac = sign(body);

  const a = Buffer.from(providedMac);
  const b = Buffer.from(expectedMac);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(unb64url(body));
  } catch {
    return null;
  }

  const payload = parsed as Partial<SignedDownloadPayload>;

  const artifactId = safeString(payload.artifactId);
  const diagnosticRef = safeString(payload.diagnosticRef);
  const email = safeString(payload.email).toLowerCase();
  const exp = safeNumber(payload.exp);

  if (!artifactId || !diagnosticRef || !email || !exp) {
    return null;
  }

  if (Date.now() > exp) {
    return null;
  }

  return {
    artifactId,
    diagnosticRef,
    email,
    exp,
  };
}