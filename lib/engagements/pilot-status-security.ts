import crypto from "node:crypto";

export const PILOT_STATUS_SECRET_RE = /^pstat_[a-f0-9]{64}$/;
export const PILOT_STATUS_COOKIE = "pilot_status_session";
const SESSION_TTL_SECONDS = 30 * 60;

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function fromBase64url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function getPilotStatusHmacKey(): string {
  const key = process.env.PILOT_STATUS_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "";
  if (!key && process.env.NODE_ENV === "production") {
    throw new Error("PILOT_STATUS_SECRET_REQUIRED");
  }
  return key || "local-pilot-status-development-key";
}

export function newPilotStatusSecret(): string {
  return `pstat_${crypto.randomBytes(32).toString("hex")}`;
}

export function hashPilotStatusSecret(secret: string): string {
  if (!PILOT_STATUS_SECRET_RE.test(secret)) throw new Error("INVALID_PILOT_STATUS_SECRET");
  return crypto.createHmac("sha256", getPilotStatusHmacKey()).update(secret).digest("hex");
}

export function hashPilotStatusAccessIdentifier(value: string): string {
  return crypto.createHash("sha256").update(value.trim()).digest("hex").slice(0, 24);
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getPilotStatusHmacKey()).update(payload).digest("base64url");
}

export function createPilotStatusSessionValue(reference: string, now = Date.now()): string {
  const payload = JSON.stringify({ reference, exp: now + SESSION_TTL_SECONDS * 1000 });
  const encoded = base64url(payload);
  return `${encoded}.${sign(encoded)}`;
}

export function verifyPilotStatusSessionValue(value: string, now = Date.now()): { reference: string } | null {
  const [encoded, signature] = String(value || "").split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(fromBase64url(encoded)) as { reference?: unknown; exp?: unknown };
    if (typeof parsed.reference !== "string" || typeof parsed.exp !== "number") return null;
    if (parsed.exp <= now) return null;
    return { reference: parsed.reference };
  } catch {
    return null;
  }
}

export function serializePilotStatusCookie(value: string, maxAgeSeconds = SESSION_TTL_SECONDS): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${PILOT_STATUS_COOKIE}=${value}; Path=/engagements/operator-pilot/status; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${secure}`;
}

export function clearPilotStatusCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${PILOT_STATUS_COOKIE}=; Path=/engagements/operator-pilot/status; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}

export function readCookie(header: string | string[] | undefined, name: string): string | null {
  const raw = Array.isArray(header) ? header.join("; ") : header ?? "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=") || null;
  }
  return null;
}