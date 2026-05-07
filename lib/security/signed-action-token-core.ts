import crypto from "crypto";

export type SignedActionPayload = {
  purpose: string;
  subject: string;
  iat: number;
  exp: number;
};

function getActionTokenSecret(): string {
  const secret = String(process.env.ACTION_TOKEN_SECRET || "").trim();

  if (!secret) {
    throw new Error("[ACTION_TOKEN] Missing ACTION_TOKEN_SECRET");
  }

  return secret;
}

function encode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decode(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, "base64");
}

function sign(input: string): string {
  return encode(
    crypto.createHmac("sha256", getActionTokenSecret()).update(input).digest(),
  );
}

export function createSignedActionToken(args: {
  purpose: string;
  subject: string;
  ttlSeconds: number;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SignedActionPayload = {
    purpose: String(args.purpose || "").trim(),
    subject: String(args.subject || "").trim(),
    iat: now,
    exp: now + Math.max(60, Math.floor(args.ttlSeconds)),
  };

  const body = encode(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifySignedActionToken(
  token: string,
  expectedPurpose: string,
): { ok: true; payload: SignedActionPayload } | { ok: false; reason: string } {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) {
    return { ok: false, reason: "format" };
  }

  const expected = sign(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    return { ok: false, reason: "signature" };
  }

  try {
    const payload = JSON.parse(decode(body).toString("utf8")) as SignedActionPayload;
    if (
      payload.purpose !== expectedPurpose ||
      !payload.subject ||
      !Number.isFinite(payload.iat) ||
      !Number.isFinite(payload.exp)
    ) {
      return { ok: false, reason: "payload" };
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { ok: false, reason: "expired" };
    }

    return { ok: true, payload };
  } catch {
    return { ok: false, reason: "payload" };
  }
}
