import crypto from "crypto";

import { prisma } from "@/lib/prisma.server";
import {
  decryptLinkedInToken,
  encryptLinkedInToken,
} from "./linkedin-token-encryption";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const LINKEDIN_API_VERSION = "202504";
const PROVIDER = "linkedin";
const OWNER_TYPE = "member";

export const LINKEDIN_OAUTH_STATE_COOKIE = "linkedin_oauth_state";

export type LinkedInConnectionStatus = {
  connected: boolean;
  ownerType: "member";
  ownerUrn: string | null;
  organisationId: string | null;
  displayName: string | null;
  scopes: string[];
  expiresAt: string | null;
  status: "not_connected" | "active" | "revoked" | "expired" | "invalid";
  publishingEnabled: boolean;
  message: string;
};

type LinkedInTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
};

type LinkedInUserInfo = {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
};

function getClientId(): string {
  const id = process.env.LINKEDIN_CLIENT_ID?.trim();
  if (!id) throw new Error("[LINKEDIN_OAUTH] Missing LINKEDIN_CLIENT_ID");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  if (!secret) throw new Error("[LINKEDIN_OAUTH] Missing LINKEDIN_CLIENT_SECRET");
  return secret;
}

function getRedirectUri(): string {
  const uri = process.env.LINKEDIN_REDIRECT_URI?.trim();
  if (uri) return uri;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/api/admin/outbound/linkedin/oauth/callback`;
}

function getScopeString(): string {
  return (
    process.env.LINKEDIN_OAUTH_SCOPES?.trim() ||
    "openid profile w_member_social"
  );
}

function getStateSecret(): string {
  return process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || "linkedin-oauth-state-development-only";
}

function signState(rawState: string): string {
  return crypto.createHmac("sha256", getStateSecret()).update(rawState).digest("hex");
}

export function generateLinkedInOAuthState(): string {
  const rawState = crypto.randomBytes(32).toString("base64url");
  return `${rawState}.${signState(rawState)}`;
}

export function validateLinkedInOAuthState(state: string, expectedState: string): boolean {
  if (!state || !expectedState || state !== expectedState) return false;
  const [rawState, signature] = state.split(".");
  if (!rawState || !signature) return false;
  const expectedSignature = signState(rawState);
  if (expectedSignature.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

export function buildAuthorizationUrl(): { url: string; state: string } {
  const state = generateLinkedInOAuthState();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    state,
    scope: getScopeString(),
  });

  return {
    url: `${LINKEDIN_AUTH_URL}?${params.toString()}`,
    state,
  };
}

async function fetchUserInfo(accessToken: string): Promise<{
  ownerUrn: string | null;
  displayName: string | null;
}> {
  try {
    const response = await fetch(LINKEDIN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return { ownerUrn: null, displayName: null };
    const data = (await response.json()) as LinkedInUserInfo;
    const displayName = data.name ?? ([data.given_name, data.family_name].filter(Boolean).join(" ") || null);
    return {
      ownerUrn: data.sub ? `urn:li:person:${data.sub}` : null,
      displayName,
    };
  } catch {
    return { ownerUrn: null, displayName: null };
  }
}

function tokenExpiry(expiresIn?: number): Date | null {
  if (!expiresIn || !Number.isFinite(expiresIn)) return null;
  return new Date(Date.now() + expiresIn * 1000);
}

export async function exchangeCodeForToken(
  code: string,
  connectedBy?: string | null,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const response = await fetch(LINKEDIN_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "LinkedIn-Version": LINKEDIN_API_VERSION,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: getClientId(),
        client_secret: getClientSecret(),
        redirect_uri: getRedirectUri(),
      }),
    });

    if (!response.ok) {
      return { ok: false, error: `LinkedIn token exchange failed with status ${response.status}.` };
    }

    const data = (await response.json()) as LinkedInTokenResponse;
    if (!data.access_token) return { ok: false, error: "LinkedIn did not return an access token." };

    const profile = await fetchUserInfo(data.access_token);
    const scope = data.scope || getScopeString();

    await prisma.linkedInPublishingConnection.upsert({
      where: {
        linkedin_publishing_connection_provider_owner_type: {
          provider: PROVIDER,
          ownerType: OWNER_TYPE,
        },
      },
      create: {
        provider: PROVIDER,
        ownerType: OWNER_TYPE,
        ownerUrn: profile.ownerUrn,
        displayName: profile.displayName,
        encryptedAccessToken: encryptLinkedInToken(data.access_token),
        encryptedRefreshToken: data.refresh_token
          ? encryptLinkedInToken(data.refresh_token)
          : null,
        expiresAt: tokenExpiry(data.expires_in),
        scope,
        status: "active",
        lastVerifiedAt: new Date(),
      },
      update: {
        ownerUrn: profile.ownerUrn,
        displayName: profile.displayName,
        encryptedAccessToken: encryptLinkedInToken(data.access_token),
        encryptedRefreshToken: data.refresh_token
          ? encryptLinkedInToken(data.refresh_token)
          : undefined,
        expiresAt: tokenExpiry(data.expires_in),
        scope,
        status: "active",
        lastVerifiedAt: new Date(),
      },
    });

    void connectedBy;
    return { ok: true, message: "LinkedIn member publishing connection stored." };
  } catch {
    return { ok: false, error: "Failed to complete LinkedIn OAuth connection." };
  }
}

async function getActiveConnection() {
  return prisma.linkedInPublishingConnection.findUnique({
    where: {
      linkedin_publishing_connection_provider_owner_type: {
        provider: PROVIDER,
        ownerType: OWNER_TYPE,
      },
    },
  });
}

export async function getLinkedInAccessToken(): Promise<{
  accessToken: string;
  ownerUrn: string | null;
  scope: string;
} | null> {
  const record = await getActiveConnection();
  if (!record || record.status !== "active") return null;

  if (record.expiresAt && record.expiresAt < new Date()) {
    await prisma.linkedInPublishingConnection.update({
      where: { id: record.id },
      data: { status: "expired" },
    });
    return null;
  }

  return {
    accessToken: decryptLinkedInToken(record.encryptedAccessToken),
    ownerUrn: record.ownerUrn,
    scope: record.scope,
  };
}

export async function getConnectionStatus(): Promise<LinkedInConnectionStatus> {
  try {
    const record = await getActiveConnection();
    const publishingEnabled = process.env.LINKEDIN_PUBLISHING_ENABLED === "true";

    if (!record) {
      return {
        connected: false,
        ownerType: OWNER_TYPE,
        ownerUrn: null,
        organisationId: null,
        displayName: null,
        scopes: [],
        expiresAt: null,
        status: "not_connected",
        publishingEnabled,
        message: "No LinkedIn member publishing connection is active.",
      };
    }

    const expired = record.expiresAt ? record.expiresAt < new Date() : false;
    const status = expired ? "expired" : record.status;
    return {
      connected: status === "active",
      ownerType: OWNER_TYPE,
      ownerUrn: record.ownerUrn,
      organisationId: null,
      displayName: record.displayName,
      scopes: record.scope.split(" ").filter(Boolean),
      expiresAt: record.expiresAt?.toISOString() ?? null,
      status: status as LinkedInConnectionStatus["status"],
      publishingEnabled,
      message:
        status === "active"
          ? "LinkedIn member publishing connection is active."
          : `LinkedIn publishing connection is ${status}.`,
    };
  } catch {
    return {
      connected: false,
      ownerType: OWNER_TYPE,
      ownerUrn: null,
      organisationId: null,
      displayName: null,
      scopes: [],
      expiresAt: null,
      status: "invalid",
      publishingEnabled: process.env.LINKEDIN_PUBLISHING_ENABLED === "true",
      message: "LinkedIn connection status could not be read.",
    };
  }
}

export async function revokeLinkedInConnection(): Promise<{ ok: boolean }> {
  await prisma.linkedInPublishingConnection.updateMany({
    where: { provider: PROVIDER, ownerType: OWNER_TYPE },
    data: { status: "revoked" },
  });
  return { ok: true };
}

export async function disconnectIntegration(): Promise<void> {
  await revokeLinkedInConnection();
}

export type PublishResult = {
  ok: boolean;
  error?: string;
  errorCode?: string;
  linkedinPostId?: string;
  linkedinPostUrl?: string;
};

export async function publishToLinkedIn(
  commentary?: string,
  articleUrl?: string,
  articleTitle?: string,
  articleDescription?: string,
): Promise<PublishResult> {
  void commentary;
  void articleUrl;
  void articleTitle;
  void articleDescription;
  return {
    ok: false,
    error: "Use the governed LinkedIn publishing client for text-only member publishing.",
    errorCode: "LINKEDIN_GOVERNED_CLIENT_REQUIRED",
  };
}
