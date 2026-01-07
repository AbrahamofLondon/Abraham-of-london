// lib/premium/download-token.ts
import crypto from "crypto";

const SECRET = process.env.DOWNLOAD_TOKEN_SECRET!;

type Payload = {
  rid: string;       // report/tool id
  sub: string;       // memberId
  tier: string;      // tier
  exp: number;       // unix seconds
};

function sign(data: string) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createDownloadToken(input: {
  reportId: string;
  memberId: string;
  tier: string;
  ttlMinutes?: number;
}) {
  const ttl = input.ttlMinutes ?? 15;
  const payload: Payload = {
    rid: input.reportId,
    sub: input.memberId,
    tier: input.tier,
    exp: Math.floor(Date.now() / 1000) + ttl * 60,
  };

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifyDownloadToken(token: string): { ok: boolean; payload?: Payload } {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return { ok: false };

    const expected = sign(body);
    if (expected !== sig) return { ok: false };

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return { ok: false };

    return { ok: true, payload };
  } catch {
    return { ok: false };
  }
}