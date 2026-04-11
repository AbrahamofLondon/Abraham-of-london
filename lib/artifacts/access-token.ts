import crypto from "crypto";

const DEFAULT_TTL_SECONDS = 900;
const MIN_TTL_SECONDS = 60;
const MAX_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const TOKEN_VERSION = 1;

type Payload = {
  v: number;
  artifactId: string;
  email: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.ARTIFACT_ACCESS_SECRET?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ARTIFACT_ACCESS_SECRET is required in production.",
      );
    }

    return "local-dev-artifact-secret";
  }

  return secret;
}

function encode(data: object): string {
  return Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
}

function decode<T>(value: string): T | null {
  try {
    return JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as T;
  } catch {
    return null;
  }
}

function sign(value: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(value)
    .digest("hex");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(a, "hex"),
      Buffer.from(b, "hex"),
    );
  } catch {
    return false;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isLikelyEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeTtl(ttlSeconds?: number): number {
  const ttl = Number.isFinite(ttlSeconds) ? Math.floor(ttlSeconds as number) : DEFAULT_TTL_SECONDS;

  if (ttl < MIN_TTL_SECONDS) return MIN_TTL_SECONDS;
  if (ttl > MAX_TTL_SECONDS) return MAX_TTL_SECONDS;

  return ttl;
}

export function issueArtifactAccessToken(input: {
  artifactId: string;
  email: string;
  ttlSeconds?: number;
}): string {
  const artifactId = input.artifactId?.trim();
  const email = normalizeEmail(input.email);

  if (!artifactId) {
    throw new Error("artifactId is required.");
  }

  if (!email || !isLikelyEmail(email)) {
    throw new Error("A valid email is required.");
  }

  const ttlSeconds = normalizeTtl(input.ttlSeconds);

  const payload: Payload = {
    v: TOKEN_VERSION,
    artifactId,
    email,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  const encoded = encode(payload);
  const mac = sign(encoded);

  return `${encoded}.${mac}`;
}

export function verifyArtifactAccessToken(token: string): Payload | null {
  const raw = token?.trim();
  if (!raw) return null;

  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;

  const encoded = raw.slice(0, dot);
  const mac = raw.slice(dot + 1);

  if (!encoded || !mac) return null;

  const expected = sign(encoded);
  if (!timingSafeEqualHex(mac, expected)) return null;

  const payload = decode<Payload>(encoded);
  if (!payload) return null;

  if (payload.v !== TOKEN_VERSION) return null;
  if (!payload.artifactId || typeof payload.artifactId !== "string") return null;
  if (!payload.email || typeof payload.email !== "string") return null;
  if (!isLikelyEmail(payload.email)) return null;
  if (!payload.exp || typeof payload.exp !== "number") return null;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) return null;

  return {
    v: payload.v,
    artifactId: payload.artifactId.trim(),
    email: normalizeEmail(payload.email),
    exp: payload.exp,
  };
}