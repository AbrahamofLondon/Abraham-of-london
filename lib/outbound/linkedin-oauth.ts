import crypto from "crypto";

import { prisma } from "@/lib/prisma.server";
import {
  getActiveLinkedInProfileKey,
  getLinkedInAppProfileDiagnostics,
  isLinkedInAppProfileKey,
  resolveLinkedInAppProfile,
  type LinkedInAppProfileKey,
} from "@/lib/integrations/linkedin/linkedin-app-profile";
import {
  decryptLinkedInToken,
  encryptLinkedInToken,
} from "./linkedin-token-encryption";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const LINKEDIN_API_VERSION = "202504";
const PROVIDER = "linkedin";

export const LINKEDIN_OAUTH_STATE_COOKIE = "linkedin_oauth_state";

export type LinkedInPublishingOwnerType = "member" | "organization";
export type LinkedInConnectionState = "not_connected" | "active" | "revoked" | "expired" | "invalid";
export type LinkedInTargetStatus =
  | "ready"
  | "not_connected"
  | "organization_urn_missing"
  | "required_scope_missing"
  | "member_fallback_requires_confirmation";

export type LinkedInPublishingTarget = {
  profileKey: LinkedInAppProfileKey;
  ownerType: LinkedInPublishingOwnerType;
  ownerUrn: string | null;
  ownerName: string;
  requiredScope: string;
  isDefaultPublishingTarget: boolean;
  status: LinkedInTargetStatus;
};

export type LinkedInAppProfileConnectionStatus = {
  profileKey: LinkedInAppProfileKey;
  configured: boolean;
  connected: boolean;
  status: LinkedInConnectionState;
  scopes: string[];
  missingRequiredScopes: string[];
  intendedUse: string;
  memberConnection: {
    ownerUrn: string | null;
    displayName: string | null;
    status: LinkedInConnectionState;
  };
  organizationConnection: {
    ownerUrn: string | null;
    ownerName: string | null;
    status: LinkedInConnectionState;
  };
};

export type LinkedInConnectionStatus = {
  connected: boolean;
  activeProfileKey: LinkedInAppProfileKey;
  ownerType: LinkedInPublishingOwnerType;
  ownerUrn: string | null;
  organisationId: string | null;
  displayName: string | null;
  ownerName: string | null;
  scopes: string[];
  expiresAt: string | null;
  status: LinkedInConnectionState;
  publishingEnabled: boolean;
  selectedPublishingTarget: LinkedInPublishingTarget;
  profiles: Record<LinkedInAppProfileKey, LinkedInAppProfileConnectionStatus>;
  memberConnection: {
    ownerUrn: string | null;
    displayName: string | null;
    status: LinkedInConnectionState;
  };
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

export function getDefaultLinkedInOwnerType(): LinkedInPublishingOwnerType {
  return process.env.LINKEDIN_DEFAULT_OWNER_TYPE === "member" ? "member" : "organization";
}

export function getConfiguredLinkedInOrganizationUrn(): string | null {
  const value = process.env.LINKEDIN_ORGANIZATION_URN?.trim();
  return value || null;
}

function getOrganizationName(): string {
  return "Abraham of London";
}

function requiredScopeFor(ownerType: LinkedInPublishingOwnerType): string {
  return ownerType === "organization" ? "w_organization_social" : "w_member_social";
}

function getStateSecret(): string {
  return process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || "linkedin-oauth-state-development-only";
}

function signState(rawState: string): string {
  return crypto.createHmac("sha256", getStateSecret()).update(rawState).digest("hex");
}

export type LinkedInOAuthStatePayload = {
  nonce: string;
  profileKey: LinkedInAppProfileKey;
  returnTo: string;
  issuedAt: number;
};

function encodeOAuthState(payload: LinkedInOAuthStatePayload): string {
  const rawState = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${rawState}.${signState(rawState)}`;
}

export function generateLinkedInOAuthState(
  profileKey = getActiveLinkedInProfileKey(),
): string {
  return encodeOAuthState({
    nonce: crypto.randomBytes(32).toString("base64url"),
    profileKey,
    returnTo: "/admin/outbound/linkedin",
    issuedAt: Date.now(),
  });
}

export function readLinkedInOAuthState(
  state: string,
  expectedState: string,
): LinkedInOAuthStatePayload | null {
  if (!state || !expectedState || state !== expectedState) return null;
  const [rawState, signature] = state.split(".");
  if (!rawState || !signature) return null;
  const expectedSignature = signState(rawState);
  if (expectedSignature.length !== signature.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(rawState, "base64url").toString("utf8"),
    ) as Partial<LinkedInOAuthStatePayload>;
    if (
      !payload.nonce ||
      !isLinkedInAppProfileKey(payload.profileKey) ||
      payload.returnTo !== "/admin/outbound/linkedin" ||
      typeof payload.issuedAt !== "number"
    ) {
      return null;
    }
    return payload as LinkedInOAuthStatePayload;
  } catch {
    return null;
  }
}

export function validateLinkedInOAuthState(state: string, expectedState: string): boolean {
  return Boolean(readLinkedInOAuthState(state, expectedState));
}

export function buildAuthorizationUrl(
  requestedProfile?: LinkedInAppProfileKey,
): { url: string; state: string; profileKey: LinkedInAppProfileKey } {
  const profile = resolveLinkedInAppProfile(requestedProfile);
  const state = generateLinkedInOAuthState(profile.profileKey);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: profile.clientId,
    redirect_uri: profile.redirectUri,
    state,
    scope: profile.requiredScopes.join(" "),
  });

  return {
    url: `${LINKEDIN_AUTH_URL}?${params.toString()}`,
    state,
    profileKey: profile.profileKey,
  };
}

async function fetchUserInfo(accessToken: string): Promise<{
  ownerUrn: string | null;
  accountMemberId: string | null;
  displayName: string | null;
}> {
  try {
    const response = await fetch(LINKEDIN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return { ownerUrn: null, accountMemberId: null, displayName: null };
    const data = (await response.json()) as LinkedInUserInfo;
    const displayName = data.name ?? ([data.given_name, data.family_name].filter(Boolean).join(" ") || null);
    return {
      ownerUrn: data.sub ? `urn:li:person:${data.sub}` : null,
      accountMemberId: data.sub ?? null,
      displayName,
    };
  } catch {
    return { ownerUrn: null, accountMemberId: null, displayName: null };
  }
}

function tokenExpiry(expiresIn?: number): Date | null {
  if (!expiresIn || !Number.isFinite(expiresIn)) return null;
  return new Date(Date.now() + expiresIn * 1000);
}

async function upsertConnection(input: {
  profileKey: LinkedInAppProfileKey;
  ownerType: LinkedInPublishingOwnerType;
  ownerUrn: string | null;
  accountMemberId: string | null;
  ownerName: string | null;
  displayName: string | null;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt: Date | null;
  scope: string;
  isDefaultPublishingTarget: boolean;
}) {
  await prisma.linkedInPublishingConnection.upsert({
    where: {
      linkedin_publishing_connection_provider_profile_owner_type: {
        provider: PROVIDER,
        profileKey: input.profileKey,
        ownerType: input.ownerType,
      },
    },
    create: {
      provider: PROVIDER,
      profileKey: input.profileKey,
      ownerType: input.ownerType,
      ownerUrn: input.ownerUrn,
      accountMemberId: input.accountMemberId,
      ownerName: input.ownerName,
      displayName: input.displayName,
      isDefaultPublishingTarget: input.isDefaultPublishingTarget,
      requiredScope: requiredScopeFor(input.ownerType),
      encryptedAccessToken: encryptLinkedInToken(input.accessToken),
      encryptedRefreshToken: input.refreshToken ? encryptLinkedInToken(input.refreshToken) : null,
      expiresAt: input.expiresAt,
      scope: input.scope,
      status: "active",
      lastValidationStatus: "oauth_connected",
      lastVerifiedAt: new Date(),
    },
    update: {
      ownerUrn: input.ownerUrn,
      accountMemberId: input.accountMemberId,
      ownerName: input.ownerName,
      displayName: input.displayName,
      isDefaultPublishingTarget: input.isDefaultPublishingTarget,
      requiredScope: requiredScopeFor(input.ownerType),
      encryptedAccessToken: encryptLinkedInToken(input.accessToken),
      encryptedRefreshToken: input.refreshToken ? encryptLinkedInToken(input.refreshToken) : undefined,
      expiresAt: input.expiresAt,
      scope: input.scope,
      status: "active",
      lastValidationStatus: "oauth_connected",
      lastVerifiedAt: new Date(),
    },
  });
}

export async function exchangeCodeForToken(
  code: string,
  connectedBy?: string | null,
  profileKey = getActiveLinkedInProfileKey(),
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const appProfile = resolveLinkedInAppProfile(profileKey);
    const response = await fetch(LINKEDIN_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "LinkedIn-Version": LINKEDIN_API_VERSION,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: appProfile.clientId,
        client_secret: appProfile.clientSecret,
        redirect_uri: appProfile.redirectUri,
      }),
    });

    if (!response.ok) {
      return { ok: false, error: `LinkedIn token exchange failed with status ${response.status}.` };
    }

    const data = (await response.json()) as LinkedInTokenResponse;
    if (!data.access_token) return { ok: false, error: "LinkedIn did not return an access token." };

    const profile = await fetchUserInfo(data.access_token);
    const scope = data.scope || appProfile.requiredScopes.join(" ");
    const expiresAt = tokenExpiry(data.expires_in);
    const defaultOwnerType = getDefaultLinkedInOwnerType();
    const organizationUrn = getConfiguredLinkedInOrganizationUrn();

    await upsertConnection({
      profileKey: appProfile.profileKey,
      ownerType: "member",
      ownerUrn: profile.ownerUrn,
      accountMemberId: profile.accountMemberId,
      ownerName: profile.displayName,
      displayName: profile.displayName,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt,
      scope,
      isDefaultPublishingTarget: defaultOwnerType === "member",
    });

    if (organizationUrn || defaultOwnerType === "organization") {
      await upsertConnection({
        profileKey: appProfile.profileKey,
        ownerType: "organization",
        ownerUrn: organizationUrn,
        accountMemberId: profile.accountMemberId,
        ownerName: getOrganizationName(),
        displayName: getOrganizationName(),
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresAt,
        scope,
        isDefaultPublishingTarget: defaultOwnerType === "organization",
      });
    }

    void connectedBy;
    return { ok: true, message: "LinkedIn publishing connection stored." };
  } catch {
    return { ok: false, error: "Failed to complete LinkedIn OAuth connection." };
  }
}

async function getConnections() {
  return prisma.linkedInPublishingConnection.findMany({
    where: { provider: PROVIDER },
  });
}

async function markExpired(id: string) {
  await prisma.linkedInPublishingConnection.update({
    where: { id },
    data: { status: "expired" },
  });
}

function connectionState(record: { status: string; expiresAt: Date | null } | null): LinkedInConnectionState {
  if (!record) return "not_connected";
  if (record.expiresAt && record.expiresAt < new Date()) return "expired";
  if (record.status === "active" || record.status === "revoked" || record.status === "expired" || record.status === "invalid") {
    return record.status;
  }
  return "invalid";
}

function buildTarget(input: {
  profileKey: LinkedInAppProfileKey;
  ownerType: LinkedInPublishingOwnerType;
  ownerUrn: string | null;
  ownerName: string | null;
  scopes: string[];
  connected: boolean;
  isDefaultPublishingTarget: boolean;
}): LinkedInPublishingTarget {
  const requiredScope = requiredScopeFor(input.ownerType);
  let status: LinkedInTargetStatus = "ready";

  if (!input.connected) status = "not_connected";
  else if (input.ownerType === "organization" && !input.ownerUrn) status = "organization_urn_missing";
  else if (!input.scopes.includes(requiredScope)) status = "required_scope_missing";
  else if (input.ownerType === "member" && getDefaultLinkedInOwnerType() === "organization") {
    status = "member_fallback_requires_confirmation";
  }

  return {
    profileKey: input.profileKey,
    ownerType: input.ownerType,
    ownerUrn: input.ownerUrn,
    ownerName: input.ownerName || (input.ownerType === "organization" ? getOrganizationName() : "LinkedIn member"),
    requiredScope,
    isDefaultPublishingTarget: input.isDefaultPublishingTarget,
    status,
  };
}

export async function getLinkedInPublishingCredential(
  ownerType = getDefaultLinkedInOwnerType(),
  profileKey = getActiveLinkedInProfileKey(),
): Promise<{
  accessToken: string;
  profileKey: LinkedInAppProfileKey;
  ownerType: LinkedInPublishingOwnerType;
  ownerUrn: string | null;
  ownerName: string;
  scope: string;
  requiredScope: string;
} | null> {
  const connections = await getConnections();
  const profileConnections = connections.filter(
    (connection) => connection.profileKey === profileKey,
  );
  const record = profileConnections.find((connection) => connection.ownerType === ownerType)
    ?? profileConnections.find((connection) => connection.ownerType === "member")
    ?? null;

  if (!record || record.status !== "active") return null;
  if (record.expiresAt && record.expiresAt < new Date()) {
    await markExpired(record.id);
    return null;
  }

  const selectedOwnerType = ownerType as LinkedInPublishingOwnerType;
  const ownerUrn = selectedOwnerType === "organization"
    ? (record.ownerUrn || getConfiguredLinkedInOrganizationUrn())
    : record.ownerUrn;

  return {
    accessToken: decryptLinkedInToken(record.encryptedAccessToken),
    profileKey,
    ownerType: selectedOwnerType,
    ownerUrn,
    ownerName: selectedOwnerType === "organization" ? getOrganizationName() : (record.ownerName || record.displayName || "LinkedIn member"),
    scope: record.scope,
    requiredScope: requiredScopeFor(selectedOwnerType),
  };
}

export async function getLinkedInAccessToken(): Promise<{
  accessToken: string;
  ownerUrn: string | null;
  scope: string;
} | null> {
  const credential = await getLinkedInPublishingCredential();
  if (!credential) return null;
  return {
    accessToken: credential.accessToken,
    ownerUrn: credential.ownerUrn,
    scope: credential.scope,
  };
}

function buildProfileConnectionStatus(
  profileKey: LinkedInAppProfileKey,
  connections: Awaited<ReturnType<typeof getConnections>>,
): LinkedInAppProfileConnectionStatus {
  const diagnostics = getLinkedInAppProfileDiagnostics().profiles[profileKey];
  const profileConnections = connections.filter(
    (connection) => connection.profileKey === profileKey,
  );
  const memberRecord =
    profileConnections.find((connection) => connection.ownerType === "member") ??
    null;
  const organizationRecord =
    profileConnections.find(
      (connection) => connection.ownerType === "organization",
    ) ?? null;
  const scopes = (
    organizationRecord?.scope ||
    memberRecord?.scope ||
    ""
  ).split(" ").filter(Boolean);
  const status = connectionState(organizationRecord ?? memberRecord);

  return {
    profileKey,
    configured: diagnostics.configured,
    connected: connectionState(memberRecord) === "active",
    status,
    scopes,
    missingRequiredScopes: diagnostics.requiredScopes.filter(
      (scope) => !scopes.includes(scope),
    ),
    intendedUse: diagnostics.intendedUse,
    memberConnection: {
      ownerUrn: memberRecord?.ownerUrn ?? null,
      displayName: memberRecord?.displayName ?? null,
      status: connectionState(memberRecord),
    },
    organizationConnection: {
      ownerUrn:
        organizationRecord?.ownerUrn ??
        (profileKey === getActiveLinkedInProfileKey()
          ? getConfiguredLinkedInOrganizationUrn()
          : null),
      ownerName: organizationRecord?.ownerName ?? null,
      status: connectionState(organizationRecord),
    },
  };
}

export async function getConnectionStatus(): Promise<LinkedInConnectionStatus> {
  try {
    const connections = await getConnections();
    const activeProfileKey = getActiveLinkedInProfileKey();
    const defaultOwnerType = getDefaultLinkedInOwnerType();
    const profileConnections = connections.filter(
      (connection) => connection.profileKey === activeProfileKey,
    );
    const memberRecord = profileConnections.find((connection) => connection.ownerType === "member") ?? null;
    const targetRecord = profileConnections.find((connection) => connection.ownerType === defaultOwnerType) ?? memberRecord;
    const memberState = connectionState(memberRecord);
    const targetState = connectionState(targetRecord ?? null);
    const connected = memberState === "active";
    const scopes = (targetRecord?.scope || memberRecord?.scope || "").split(" ").filter(Boolean);
    const targetOwnerUrn = defaultOwnerType === "organization"
      ? (targetRecord?.ownerUrn || getConfiguredLinkedInOrganizationUrn())
      : targetRecord?.ownerUrn ?? null;
    const selectedPublishingTarget = buildTarget({
      profileKey: activeProfileKey,
      ownerType: defaultOwnerType,
      ownerUrn: targetOwnerUrn ?? null,
      ownerName: defaultOwnerType === "organization" ? getOrganizationName() : targetRecord?.ownerName ?? targetRecord?.displayName ?? null,
      scopes,
      connected,
      isDefaultPublishingTarget: true,
    });

    return {
      connected,
      ownerType: selectedPublishingTarget.ownerType,
      activeProfileKey,
      ownerUrn: selectedPublishingTarget.ownerUrn,
      organisationId: selectedPublishingTarget.ownerUrn?.replace("urn:li:organization:", "") ?? null,
      displayName: memberRecord?.displayName ?? null,
      ownerName: selectedPublishingTarget.ownerName,
      scopes,
      expiresAt: targetRecord?.expiresAt?.toISOString() ?? memberRecord?.expiresAt?.toISOString() ?? null,
      status: targetState,
      publishingEnabled: process.env.LINKEDIN_PUBLISHING_ENABLED === "true",
      selectedPublishingTarget,
      profiles: {
        legacy: buildProfileConnectionStatus("legacy", connections),
        community: buildProfileConnectionStatus("community", connections),
      },
      memberConnection: {
        ownerUrn: memberRecord?.ownerUrn ?? null,
        displayName: memberRecord?.displayName ?? null,
        status: memberState,
      },
      message:
        selectedPublishingTarget.status === "ready"
          ? `LinkedIn publishing target ready: ${selectedPublishingTarget.ownerName}.`
          : `LinkedIn publishing target blocked: ${selectedPublishingTarget.status}.`,
    };
  } catch {
    const selectedPublishingTarget = buildTarget({
      profileKey: getActiveLinkedInProfileKey(),
      ownerType: getDefaultLinkedInOwnerType(),
      ownerUrn: getConfiguredLinkedInOrganizationUrn(),
      ownerName: getDefaultLinkedInOwnerType() === "organization" ? getOrganizationName() : null,
      scopes: [],
      connected: false,
      isDefaultPublishingTarget: true,
    });
    return {
      connected: false,
      activeProfileKey: getActiveLinkedInProfileKey(),
      ownerType: selectedPublishingTarget.ownerType,
      ownerUrn: selectedPublishingTarget.ownerUrn,
      organisationId: selectedPublishingTarget.ownerUrn?.replace("urn:li:organization:", "") ?? null,
      displayName: null,
      ownerName: selectedPublishingTarget.ownerName,
      scopes: [],
      expiresAt: null,
      status: "invalid",
      publishingEnabled: process.env.LINKEDIN_PUBLISHING_ENABLED === "true",
      selectedPublishingTarget,
      profiles: {
        legacy: buildProfileConnectionStatus("legacy", []),
        community: buildProfileConnectionStatus("community", []),
      },
      memberConnection: { ownerUrn: null, displayName: null, status: "invalid" },
      message: "LinkedIn connection status could not be read.",
    };
  }
}

export async function revokeLinkedInConnection(
  profileKey?: LinkedInAppProfileKey,
): Promise<{ ok: boolean }> {
  await prisma.linkedInPublishingConnection.updateMany({
    where: {
      provider: PROVIDER,
      ...(profileKey ? { profileKey } : {}),
    },
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
    error: "Use the governed LinkedIn publishing client for text-only member or organization publishing.",
    errorCode: "LINKEDIN_GOVERNED_CLIENT_REQUIRED",
  };
}
