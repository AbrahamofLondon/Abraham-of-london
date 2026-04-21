import crypto from "crypto";

const TEAM_INVITE_SECRET =
  process.env.TEAM_ASSESSMENT_INVITE_SECRET ||
  process.env.ENTERPRISE_ALIGNMENT_INVITE_SECRET ||
  process.env.SYSTEM_INTEGRITY_SALT ||
  "dev-team-assessment-invite-secret-change-me-now";

export type TeamAssessmentInvitePayload = {
  inviteId: string;
  campaignId: string;
  email?: string | null;
  issuedAt: number;
  expiresAt: number;
};

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
  return Buffer.from(normalized + "=".repeat(paddingLength), "base64");
}

function sign(value: string): string {
  return crypto.createHmac("sha256", TEAM_INVITE_SECRET).update(value).digest("hex");
}

export function createTeamAssessmentInviteToken(payload: TeamAssessmentInvitePayload): string {
  const encoded = toBase64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function verifyTeamAssessmentInviteToken(token: string): TeamAssessmentInvitePayload | null {
  const [encoded, signature] = String(token || "").split(".");
  if (!encoded || !signature) return null;
  if (sign(encoded) !== signature) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(encoded).toString("utf8")) as Partial<TeamAssessmentInvitePayload>;
    if (
      !parsed ||
      typeof parsed.inviteId !== "string" ||
      typeof parsed.campaignId !== "string" ||
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }
    if (Date.now() > parsed.expiresAt) return null;
    return {
      inviteId: parsed.inviteId,
      campaignId: parsed.campaignId,
      email: typeof parsed.email === "string" ? parsed.email : null,
      issuedAt: parsed.issuedAt,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function hashTeamAssessmentInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
