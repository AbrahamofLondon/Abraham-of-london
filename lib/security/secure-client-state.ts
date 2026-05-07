const STORAGE_PREFIX = "aol_secure_state_ref_v1";
const MAX_TOKEN_AGE_MS = 1000 * 60 * 60 * 24;

type SecureStateTokenPayload = {
  kind: "constitutional_handoff";
  reportId: string;
  issuedAt: string;
  version: 1;
};

function getStorageKey(scope: string): string {
  return `${STORAGE_PREFIX}:${scope}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getSecret(): string {
  const secret = String(process.env.SECURE_CLIENT_STATE_SECRET || "").trim();

  if (!secret) {
    throw new Error("SECURE_CLIENT_STATE_SECRET is required");
  }

  return secret;
}

export function writeSecureStateReference(scope: string, token: string): void {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.setItem(getStorageKey(scope), token);
  } catch {
    // Ignore storage failures.
  }
}

export function readSecureStateReference(scope: string): string | null {
  if (!isBrowser()) return null;

  try {
    return window.sessionStorage.getItem(getStorageKey(scope));
  } catch {
    return null;
  }
}

export function clearSecureStateReference(scope: string): void {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.removeItem(getStorageKey(scope));
  } catch {
    // Ignore storage failures.
  }
}

export function clearAllSecureStateReferences(scopes: string[]): void {
  if (!isBrowser()) return;

  for (const scope of scopes) {
    clearSecureStateReference(scope);
  }
}

export function createEncryptedStateToken(
  payload: SecureStateTokenPayload,
): string {
  const crypto = require("crypto") as typeof import("crypto");
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash("sha256").update(getSecret()).digest();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const json = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptEncryptedStateToken(
  token: string,
): SecureStateTokenPayload | null {
  try {
    const crypto = require("crypto") as typeof import("crypto");
    const [ivPart, tagPart, encryptedPart] = token.split(".");
    if (!ivPart || !tagPart || !encryptedPart) return null;

    const iv = Buffer.from(ivPart, "base64url");
    const tag = Buffer.from(tagPart, "base64url");
    const encrypted = Buffer.from(encryptedPart, "base64url");
    const key = crypto.createHash("sha256").update(getSecret()).digest();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const json = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");

    const parsed = JSON.parse(json) as SecureStateTokenPayload;
    if (
      parsed?.kind !== "constitutional_handoff" ||
      parsed?.version !== 1 ||
      typeof parsed?.reportId !== "string" ||
      typeof parsed?.issuedAt !== "string"
    ) {
      return null;
    }

    const issuedAt = new Date(parsed.issuedAt);
    if (Number.isNaN(issuedAt.getTime())) {
      return null;
    }

    if (Date.now() - issuedAt.getTime() > MAX_TOKEN_AGE_MS) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
