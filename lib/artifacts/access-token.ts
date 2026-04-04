/* lib/artifacts/access-token.ts */

import crypto from "crypto";

const SECRET = process.env.ARTIFACT_ACCESS_SECRET || "local-dev-artifact-secret";

type Payload = {
  artifactId: string;
  email: string;
  exp: number;
};

function encode(data: object) {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

function decode<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function sign(value: string) {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

export function issueArtifactAccessToken(input: {
  artifactId: string;
  email: string;
  ttlSeconds?: number;
}) {
  const payload: Payload = {
    artifactId: input.artifactId,
    email: input.email.toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + (input.ttlSeconds ?? 900),
  };

  const encoded = encode(payload);
  const mac = sign(encoded);
  return `${encoded}.${mac}`;
}

export function verifyArtifactAccessToken(token: string): Payload | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const encoded = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(encoded);

  if (mac !== expected) return null;

  const payload = decode<Payload>(encoded);
  if (!payload?.artifactId || !payload?.email || !payload?.exp) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}