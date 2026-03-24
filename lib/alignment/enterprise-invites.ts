import crypto from "crypto";

const ENTERPRISE_INVITE_SECRET =
  process.env.ENTERPRISE_ALIGNMENT_INVITE_SECRET ||
  process.env.SYSTEM_INTEGRITY_SALT ||
  "dev-enterprise-invite-secret-change-me-now";

export type EnterpriseInvitePayload = {
  participantId: string;
  campaignId: string;
  email: string;
  issuedAt: number;
  expiresAt: number;
};

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(paddingLength);
  return Buffer.from(padded, "base64");
}

function sign(value: string): string {
  return crypto
    .createHmac("sha256", ENTERPRISE_INVITE_SECRET)
    .update(value)
    .digest("hex");
}

export function createEnterpriseInviteToken(
  payload: EnterpriseInvitePayload
): string {
  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyEnterpriseInviteToken(
  token: string
): EnterpriseInvitePayload | null {
  const [encoded, signature] = safeString(token).split(".");

  if (!encoded || !signature) return null;
  if (sign(encoded) !== signature) return null;

  try {
    const parsed = JSON.parse(
      fromBase64Url(encoded).toString("utf8")
    ) as Partial<EnterpriseInvitePayload>;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.participantId !== "string" ||
      typeof parsed.campaignId !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }

    if (Date.now() > parsed.expiresAt) return null;

    return {
      participantId: parsed.participantId,
      campaignId: parsed.campaignId,
      email: parsed.email,
      issuedAt: parsed.issuedAt,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function hashEnterpriseInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createEnterpriseInviteBundle(input: {
  participantId: string;
  campaignId: string;
  email: string;
  expiresInDays?: number;
}) {
  const issuedAt = Date.now();
  const expiresAt =
    issuedAt + 1000 * 60 * 60 * 24 * (input.expiresInDays ?? 14);

  const payload: EnterpriseInvitePayload = {
    participantId: input.participantId,
    campaignId: input.campaignId,
    email: input.email,
    issuedAt,
    expiresAt,
  };

  const token = createEnterpriseInviteToken(payload);

  return {
    token,
    tokenHash: hashEnterpriseInviteToken(token),
    payload,
  };
}