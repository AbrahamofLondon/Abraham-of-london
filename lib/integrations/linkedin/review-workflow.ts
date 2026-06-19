import crypto from "crypto";
import type { GetServerSidePropsContext } from "next";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import {
  decryptLinkedInToken,
  encryptLinkedInToken,
} from "@/lib/outbound/linkedin-token-encryption";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const LINKEDIN_POSTS_URL = "https://api.linkedin.com/rest/posts";
const LINKEDIN_API_VERSION = "202504";

export const LINKEDIN_REVIEW_WORKSPACE_ID = "linkedin-review-workspace";
export const LINKEDIN_REVIEW_WORKSPACE_NAME = "LinkedIn Review Workspace";
export const LINKEDIN_REVIEWER_EMAIL =
  (process.env.LINKEDIN_REVIEWER_EMAIL || "linkedin-reviewer@abrahamoflondon.org")
    .trim()
    .toLowerCase();
export const LINKEDIN_REVIEW_STATE_COOKIE = "linkedin_review_oauth_state";

const SAMPLE_TITLE = "The Cost of Slow Decisions";
const SAMPLE_CONTENT =
  "Most strategic failure does not come from a lack of intelligence. It comes from unresolved contradiction, delayed commitment, and decisions made without evidence discipline. Abraham of London helps leaders expose the gap before the market does.";

type SessionUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
};

export type LinkedInReviewActor = {
  id: string | null;
  email: string;
  name: string | null;
  role: "LINKEDIN_REVIEWER";
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

type UserInfoResponse = {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
};

function db() {
  return prisma as any;
}

function nowIso() {
  return new Date().toISOString();
}

function env(name: string): string {
  return String(process.env[name] || "").trim();
}

function getClientId() {
  return env("LINKEDIN_COMMUNITY_CLIENT_ID") || env("LINKEDIN_CLIENT_ID");
}

function getClientSecret() {
  return env("LINKEDIN_COMMUNITY_CLIENT_SECRET") || env("LINKEDIN_CLIENT_SECRET");
}

export function getLinkedInReviewRedirectUri() {
  return (
    env("LINKEDIN_REVIEW_REDIRECT_URI") ||
    env("LINKEDIN_COMMUNITY_REDIRECT_URI") ||
    env("LINKEDIN_REDIRECT_URI") ||
    `${(env("NEXT_PUBLIC_APP_URL") || env("NEXTAUTH_URL") || "http://localhost:3000").replace(/\/+$/, "")}/api/integrations/linkedin/callback`
  );
}

export function getLinkedInReviewScopes(): string[] {
  const configured = env("LINKEDIN_REVIEW_SCOPES");
  const value =
    configured ||
    "openid profile email r_organization_admin r_organization_social w_organization_social";
  return Array.from(new Set(value.split(/\s+/).filter(Boolean)));
}

export function isReviewMode() {
  return process.env.LINKEDIN_REVIEW_MODE !== "false";
}

export function linkedinReviewConfigStatus() {
  const redirectUri = getLinkedInReviewRedirectUri();
  const missing = [
    ["LINKEDIN_CLIENT_ID or LINKEDIN_COMMUNITY_CLIENT_ID", getClientId()],
    ["LINKEDIN_CLIENT_SECRET or LINKEDIN_COMMUNITY_CLIENT_SECRET", getClientSecret()],
    ["LINKEDIN_TOKEN_ENCRYPTION_KEY", env("LINKEDIN_TOKEN_ENCRYPTION_KEY")],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  let redirectValid = false;
  try {
    const parsed = new URL(redirectUri);
    redirectValid =
      parsed.pathname === "/api/integrations/linkedin/callback" &&
      (process.env.NODE_ENV !== "production" || parsed.protocol === "https:");
  } catch {
    redirectValid = false;
  }

  return {
    configured: missing.length === 0 && redirectValid,
    missing,
    redirectUri,
    redirectValid,
    requestedScopes: getLinkedInReviewScopes(),
    reviewMode: isReviewMode(),
  };
}

function stateSecret() {
  return env("CSRF_SECRET") || env("NEXTAUTH_SECRET") || "linkedin-review-development-state";
}

function sign(raw: string) {
  return crypto.createHmac("sha256", stateSecret()).update(raw).digest("base64url");
}

export function createReviewOAuthState(actor: LinkedInReviewActor) {
  const payload = {
    nonce: crypto.randomBytes(32).toString("base64url"),
    workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID,
    actorEmail: actor.email,
    issuedAt: Date.now(),
    returnTo: "/integrations/linkedin/review",
  };
  const raw = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${raw}.${sign(raw)}`;
}

export function readReviewOAuthState(state: string, expected: string | undefined) {
  if (!state || !expected || state !== expected) return null;
  const [raw, signature] = state.split(".");
  if (!raw || !signature) return null;
  const expectedSignature = sign(raw);
  if (
    expectedSignature.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as {
      workspaceId?: string;
      actorEmail?: string;
      issuedAt?: number;
      returnTo?: string;
    };
    if (payload.workspaceId !== LINKEDIN_REVIEW_WORKSPACE_ID) return null;
    if (payload.actorEmail !== LINKEDIN_REVIEWER_EMAIL) return null;
    if (payload.returnTo !== "/integrations/linkedin/review") return null;
    if (typeof payload.issuedAt !== "number" || Date.now() - payload.issuedAt > 10 * 60 * 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function buildReviewAuthorizationUrl(actor: LinkedInReviewActor) {
  const config = linkedinReviewConfigStatus();
  if (!config.configured) {
    throw new Error(`LinkedIn review OAuth is not configured: ${config.missing.join(", ")}`);
  }
  const state = createReviewOAuthState(actor);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: getClientId(),
    redirect_uri: config.redirectUri,
    state,
    scope: config.requestedScopes.join(" "),
  });
  return { state, url: `${LINKEDIN_AUTH_URL}?${params.toString()}` };
}

export function reviewStateCookie(value: string) {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${LINKEDIN_REVIEW_STATE_COOKIE}=${encodeURIComponent(value)}; HttpOnly;${secure} SameSite=Lax; Path=/api/integrations/linkedin/callback; Max-Age=600`;
}

export function clearReviewStateCookie() {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${LINKEDIN_REVIEW_STATE_COOKIE}=; HttpOnly;${secure} SameSite=Lax; Path=/api/integrations/linkedin/callback; Max-Age=0`;
}

function safeMessage(value: unknown) {
  return String(value || "")
    .replace(/access_token=[^&\s]+/gi, "access_token=[redacted]")
    .replace(/refresh_token=[^&\s]+/gi, "refresh_token=[redacted]")
    .replace(/client_secret=[^&\s]+/gi, "client_secret=[redacted]")
    .slice(0, 300);
}

export async function getReviewerActorFromSession(
  req: NextApiRequest | GetServerSidePropsContext["req"],
  res: NextApiResponse | GetServerSidePropsContext["res"],
): Promise<LinkedInReviewActor | null> {
  const session = await getServerSession(req as any, res as any, authOptions);
  const user = session?.user as SessionUser | undefined;
  const email = user?.email?.trim().toLowerCase();
  const role = String(user?.role || "");
  if (email !== LINKEDIN_REVIEWER_EMAIL && role !== "LINKEDIN_REVIEWER") {
    return null;
  }
  return {
    id: user?.id ? String(user.id) : null,
    email: email || LINKEDIN_REVIEWER_EMAIL,
    name: user?.name ?? null,
    role: "LINKEDIN_REVIEWER",
  };
}

export async function requireLinkedInReviewerApi(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const actor = await getReviewerActorFromSession(req, res);
  if (!actor) {
    res.status(403).json({ ok: false, error: "LinkedIn reviewer access required" });
    return null;
  }
  return actor;
}

export async function requireLinkedInReviewerPage(ctx: GetServerSidePropsContext) {
  const actor = await getReviewerActorFromSession(ctx.req, ctx.res);
  if (!actor) {
    return {
      actor: null,
      redirect: {
        destination: `/auth/signin?callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`,
        permanent: false,
      },
    };
  }
  return { actor, redirect: null };
}

export async function recordReviewAudit(
  eventType: string,
  actor: LinkedInReviewActor | null,
  safeMetadata: Record<string, unknown> = {},
) {
  await db().linkedInReviewAuditEvent.create({
    data: {
      workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID,
      actorId: actor?.id ?? null,
      actorEmail: actor?.email ?? null,
      eventType,
      safeMetadataJson: safeMetadata,
    },
  });
}

async function ensureDraft(actor: LinkedInReviewActor) {
  await db().linkedInReviewWorkspaceState.upsert({
    where: { workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID },
    create: {
      workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID,
      deletedAt: null,
      resetAt: new Date(),
      resetBy: actor.email,
    },
    update: {
      deletedAt: null,
      resetAt: new Date(),
      resetBy: actor.email,
    },
  });
  const existing = await db().linkedInReviewPostDraft.findFirst({
    where: {
      workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID,
      sourceId: "cost-of-slow-decisions",
    },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;
  const draft = await db().linkedInReviewPostDraft.create({
    data: {
      workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID,
      authorId: actor.id,
      authorEmail: actor.email,
      title: SAMPLE_TITLE,
      content: SAMPLE_CONTENT,
      status: "Draft",
      approvalStatus: "not_approved",
    },
  });
  await recordReviewAudit("Post drafted", actor, { sourceId: draft.sourceId });
  return draft;
}

async function getWorkspaceState() {
  return db().linkedInReviewWorkspaceState.findUnique({
    where: { workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID },
  });
}

async function assertWorkspaceActive() {
  const workspaceState = await getWorkspaceState();
  if (workspaceState?.deletedAt) {
    throw new Error("LinkedIn integration data has been deleted. Reset Review Workspace before continuing.");
  }
}

export async function getReviewConnection(actor: LinkedInReviewActor) {
  const connection = await db().linkedInReviewConnection.findUnique({
    where: {
      workspaceId_userEmail: {
        workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID,
        userEmail: actor.email,
      },
    },
  });
  if (!connection) return null;
  if (connection.status === "active" && connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
    return db().linkedInReviewConnection.update({
      where: { id: connection.id },
      data: { status: "expired" },
    });
  }
  return connection;
}

function maskUrn(urn: string | null | undefined) {
  if (!urn) return null;
  if (urn.length <= 12) return urn;
  return `${urn.slice(0, 10)}...${urn.slice(-6)}`;
}

function selectedOrganization(connection: any) {
  const configuredUrn = env("LINKEDIN_REVIEW_ORGANIZATION_URN") || env("LINKEDIN_ORGANIZATION_URN");
  const configuredName = env("LINKEDIN_REVIEW_ORGANIZATION_NAME") || "Abraham of London";
  const urn = connection?.linkedinOrganizationUrn || configuredUrn || null;
  const name = connection?.organizationName || (urn ? configuredName : null);
  return {
    name,
    urn,
    maskedUrn: maskUrn(urn),
    adminStatus: connection?.status === "active" ? "Connected token; Page role verified when LinkedIn grants endpoint access" : "Pending Standard Tier approval",
    source: connection?.linkedinOrganizationUrn ? "connected_metadata" : configuredUrn ? "configured_review_target" : "pending_standard_tier",
  };
}

export function buildLinkedInPostPayload(input: { organizationUrn: string | null; content: string }) {
  return {
    author: input.organizationUrn || "urn:li:organization:{selected-page}",
    commentary: input.content,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };
}

export async function getReviewState(actor: LinkedInReviewActor) {
  const workspaceState = await getWorkspaceState();
  const deletedAt = workspaceState?.deletedAt ?? null;
  const [connection, draft, audits, analytics] = await Promise.all([
    getReviewConnection(actor),
    deletedAt
      ? db().linkedInReviewPostDraft.findFirst({
          where: { workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID },
          orderBy: { createdAt: "asc" },
        })
      : ensureDraft(actor),
    db().linkedInReviewAuditEvent.findMany({
      where: { workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db().linkedInReviewAnalyticsSnapshot.findFirst({
      where: { workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID },
      orderBy: { capturedAt: "desc" },
    }),
  ]);
  const org = selectedOrganization(connection);
  const status =
    connection?.status === "active" && connection?.linkedinOrganizationUrn
      ? "Connected to LinkedIn page"
      : connection?.status === "active"
        ? "Connected to LinkedIn"
        : connection?.status === "expired"
          ? "Token expired"
          : connection?.status === "revoked"
            ? "Connection revoked"
            : isReviewMode()
              ? "Review/demo mode active"
              : "Not connected";

  return {
    actor,
    workspace: {
      id: LINKEDIN_REVIEW_WORKSPACE_ID,
      name: LINKEDIN_REVIEW_WORKSPACE_NAME,
      deletedAt: deletedAt?.toISOString?.() ?? null,
    },
    config: linkedinReviewConfigStatus(),
    connection: {
      status,
      createdAt: connection?.createdAt?.toISOString?.() ?? null,
      tokenExpiresAt: connection?.tokenExpiresAt?.toISOString?.() ?? null,
      displayName: connection?.linkedinMemberDisplayName ?? null,
      memberUrnMasked: maskUrn(connection?.linkedinMemberUrn),
      organizationName: org.name,
      organizationUrn: org.urn,
      organizationUrnMasked: org.maskedUrn,
      organizationSource: org.source,
      grantedScopes: String(connection?.grantedScopes || "").split(/\s+/).filter(Boolean),
      revokedAt: connection?.revokedAt?.toISOString?.() ?? null,
    },
    draft: draft
      ? {
          id: draft.id,
          title: draft.title,
          content: draft.content,
          status: draft.status,
          approvalStatus: draft.approvalStatus,
          approvedBy: draft.approvedBy,
          approvedAt: draft.approvedAt?.toISOString?.() ?? null,
          linkedinPostUrn: draft.linkedinPostUrn,
          publishedAt: draft.publishedAt?.toISOString?.() ?? null,
          errorMessage: draft.errorMessage,
          updatedAt: draft.updatedAt?.toISOString?.() ?? null,
        }
      : null,
    analytics: analytics
      ? {
          source: analytics.source,
          capturedAt: analytics.capturedAt.toISOString(),
          metrics: analytics.metricsJson,
        }
      : null,
    auditTrail: audits.map((event: any) => ({
      id: event.id,
      eventType: event.eventType,
      actor: event.actorEmail || "system",
      workspace: LINKEDIN_REVIEW_WORKSPACE_NAME,
      safeMetadata: event.safeMetadataJson,
      createdAt: event.createdAt.toISOString(),
    })),
    dryRunPayload: buildLinkedInPostPayload({ organizationUrn: org.urn, content: draft?.content ?? "" }),
  };
}

async function fetchUserInfo(accessToken: string) {
  try {
    const response = await fetch(LINKEDIN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return { memberUrn: null, displayName: null };
    const data = (await response.json()) as UserInfoResponse;
    return {
      memberUrn: data.sub ? `urn:li:person:${data.sub}` : null,
      displayName: data.name || [data.given_name, data.family_name].filter(Boolean).join(" ") || null,
    };
  } catch {
    return { memberUrn: null, displayName: null };
  }
}

export async function completeReviewOAuth(code: string, actor: LinkedInReviewActor) {
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
      redirect_uri: getLinkedInReviewRedirectUri(),
    }),
  });
  if (!response.ok) {
    throw new Error(`LinkedIn token exchange failed with status ${response.status}`);
  }
  const token = (await response.json()) as TokenResponse;
  if (!token.access_token) throw new Error("LinkedIn did not return an access token");

  const userInfo = await fetchUserInfo(token.access_token);
  const orgUrn = env("LINKEDIN_REVIEW_ORGANIZATION_URN") || env("LINKEDIN_ORGANIZATION_URN") || null;
  const orgName = orgUrn ? env("LINKEDIN_REVIEW_ORGANIZATION_NAME") || "Abraham of London" : null;
  const tokenExpiresAt = token.expires_in
    ? new Date(Date.now() + token.expires_in * 1000)
    : null;

  await db().linkedInReviewConnection.upsert({
    where: {
      workspaceId_userEmail: {
        workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID,
        userEmail: actor.email,
      },
    },
    create: {
      workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID,
      userId: actor.id,
      userEmail: actor.email,
      linkedinMemberUrn: userInfo.memberUrn,
      linkedinMemberDisplayName: userInfo.displayName,
      linkedinOrganizationUrn: orgUrn,
      organizationName: orgName,
      encryptedAccessToken: encryptLinkedInToken(token.access_token),
      encryptedRefreshToken: token.refresh_token ? encryptLinkedInToken(token.refresh_token) : null,
      grantedScopes: token.scope || getLinkedInReviewScopes().join(" "),
      tokenExpiresAt,
      status: "active",
    },
    update: {
      userId: actor.id,
      linkedinMemberUrn: userInfo.memberUrn,
      linkedinMemberDisplayName: userInfo.displayName,
      linkedinOrganizationUrn: orgUrn,
      organizationName: orgName,
      encryptedAccessToken: encryptLinkedInToken(token.access_token),
      encryptedRefreshToken: token.refresh_token ? encryptLinkedInToken(token.refresh_token) : undefined,
      grantedScopes: token.scope || getLinkedInReviewScopes().join(" "),
      tokenExpiresAt,
      status: "active",
      revokedAt: null,
    },
  });
  await recordReviewAudit("LinkedIn OAuth completed", actor, {
    scopes: token.scope || getLinkedInReviewScopes().join(" "),
    organizationConfigured: Boolean(orgUrn),
  });
}

export async function saveDraft(actor: LinkedInReviewActor, content: string) {
  await assertWorkspaceActive();
  const draft = await ensureDraft(actor);
  const updated = await db().linkedInReviewPostDraft.update({
    where: { id: draft.id },
    data: {
      content: content.slice(0, 3000),
      status: "Draft",
      approvalStatus: "not_approved",
      approvedBy: null,
      approvedAt: null,
      errorMessage: null,
    },
  });
  await recordReviewAudit("Post drafted", actor, {
    draftId: updated.id,
    characterCount: updated.content.length,
  });
  return updated;
}

export async function approveDraft(actor: LinkedInReviewActor, confirmed: boolean) {
  if (!confirmed) throw new Error("Explicit publication approval confirmation is required");
  await assertWorkspaceActive();
  const draft = await ensureDraft(actor);
  const connection = await getReviewConnection(actor);
  const org = selectedOrganization(connection);
  await recordReviewAudit("LinkedIn page selected", actor, {
    workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID,
    pageName: org.name,
    selectedPage: org.maskedUrn,
    source: org.source,
    mode: org.source === "pending_standard_tier" ? "pending_standard_tier" : "review_confirmation",
    timestamp: nowIso(),
  });
  const updated = await db().linkedInReviewPostDraft.update({
    where: { id: draft.id },
    data: {
      status: "Approved",
      approvalStatus: "approved",
      approvedBy: actor.email,
      approvedAt: new Date(),
      linkedinOrganizationUrn: org.urn,
      errorMessage: null,
    },
  });
  await recordReviewAudit("Post approved", actor, {
    draftId: updated.id,
    selectedPage: org.maskedUrn,
  });
  return updated;
}

export async function confirmReviewPageSelection(actor: LinkedInReviewActor) {
  await assertWorkspaceActive();
  const connection = await getReviewConnection(actor);
  const org = selectedOrganization(connection);
  await recordReviewAudit("LinkedIn page selected", actor, {
    workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID,
    pageName: org.name,
    selectedPage: org.maskedUrn,
    source: org.source,
    mode: org.source === "pending_standard_tier" ? "pending_standard_tier" : "review_confirmation",
    timestamp: nowIso(),
  });
  return org;
}

export async function publishOrDryRun(actor: LinkedInReviewActor) {
  await assertWorkspaceActive();
  const draft = await ensureDraft(actor);
  const connection = await getReviewConnection(actor);
  const org = selectedOrganization(connection);
  const payload = buildLinkedInPostPayload({ organizationUrn: org.urn, content: draft.content });

  if (draft.approvalStatus !== "approved") {
    throw new Error("The LinkedIn post must be explicitly approved before publishing");
  }

  const liveEnabled = process.env.LINKEDIN_REVIEW_LIVE_PUBLISHING === "true" && connection?.status === "active";
  const hasOrg = Boolean(org.urn);
  const scopes = String(connection?.grantedScopes || "").split(/\s+/).filter(Boolean);
  const hasScope = scopes.includes("w_organization_social");

  if (!liveEnabled || !hasOrg || !hasScope || isReviewMode()) {
    await db().linkedInReviewPostDraft.update({
      where: { id: draft.id },
      data: { status: "Approved", errorMessage: null },
    });
    await recordReviewAudit("Post published or dry-run attempted", actor, {
      mode: "API Review Dry Run",
      reason: !liveEnabled
        ? "Live publishing disabled for review environment"
        : !hasOrg
          ? "Selected LinkedIn organisation page pending Standard Tier approval"
          : !hasScope
            ? "w_organization_social scope not granted"
            : "LINKEDIN_REVIEW_MODE active",
      selectedPage: org.maskedUrn,
    });
    return {
      ok: true,
      mode: "dry_run" as const,
      message: "API Review Dry Run complete. No LinkedIn post was published.",
      reason: "Live LinkedIn publishing is disabled or pending Standard Tier permission.",
      requestBody: payload,
      selectedPage: org,
      approvedContent: draft.content,
    };
  }

  const accessToken = connection.encryptedAccessToken
    ? decryptLinkedInToken(connection.encryptedAccessToken)
    : null;
  if (!accessToken) throw new Error("LinkedIn access token is unavailable");

  const response = await fetch(LINKEDIN_POSTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": LINKEDIN_API_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = `LinkedIn publishing failed with status ${response.status}`;
    await db().linkedInReviewPostDraft.update({
      where: { id: draft.id },
      data: { status: "Failed", errorMessage: error },
    });
    await recordReviewAudit("Post published or dry-run attempted", actor, {
      mode: "live",
      status: "failed",
      httpStatus: response.status,
    });
    throw new Error(error);
  }
  const postUrn = response.headers.get("x-restli-id") || response.headers.get("location") || null;
  await db().linkedInReviewPostDraft.update({
    where: { id: draft.id },
    data: {
      status: "Published",
      linkedinPostUrn: postUrn,
      publishedAt: new Date(),
      errorMessage: null,
    },
  });
  await recordReviewAudit("Post published or dry-run attempted", actor, {
    mode: "live",
    status: "published",
    postUrn: maskUrn(postUrn),
  });
  return { ok: true, mode: "live" as const, postUrn };
}

export async function refreshAnalytics(actor: LinkedInReviewActor) {
  await assertWorkspaceActive();
  const connection = await getReviewConnection(actor);
  const draft = await ensureDraft(actor);
  const org = selectedOrganization(connection);
  const snapshot = await db().linkedInReviewAnalyticsSnapshot.create({
    data: {
      workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID,
      linkedinOrganizationUrn: org.urn,
      linkedinPostUrn: draft.linkedinPostUrn,
      source: "pending_standard_tier",
      metricsJson: {
        unavailableReason:
          "Analytics endpoint is wired for LinkedIn Page Analytics. Live values will appear once LinkedIn grants the required Standard Tier access. No mock analytics are shown as live data.",
        lastRefreshAttemptedAt: nowIso(),
        metricsAvailable: false,
      },
    },
  });
  await recordReviewAudit("Analytics refreshed", actor, {
    source: snapshot.source,
    selectedPage: org.maskedUrn,
  });
  return snapshot;
}

export async function disconnectReviewLinkedIn(actor: LinkedInReviewActor) {
  await db().linkedInReviewConnection.updateMany({
    where: { workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID, userEmail: actor.email },
    data: { status: "revoked", revokedAt: new Date() },
  });
  await recordReviewAudit("LinkedIn disconnected", actor);
}

export async function deleteReviewLinkedInData(actor: LinkedInReviewActor) {
  await db().linkedInReviewAnalyticsSnapshot.deleteMany({
    where: { workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID },
  });
  await db().linkedInReviewPostDraft.deleteMany({
    where: { workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID },
  });
  await db().linkedInReviewConnection.deleteMany({
    where: { workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID, userEmail: actor.email },
  });
  await db().linkedInReviewWorkspaceState.upsert({
    where: { workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID },
    create: {
      workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID,
      deletedAt: new Date(),
    },
    update: {
      deletedAt: new Date(),
    },
  });
  await recordReviewAudit("LinkedIn data deleted", actor, {
    scope: "review workspace LinkedIn tokens, page mapping, analytics snapshots, and review drafts",
  });
}

export async function resetReviewWorkspace(actor: LinkedInReviewActor) {
  await db().linkedInReviewWorkspaceState.upsert({
    where: { workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID },
    create: {
      workspaceId: LINKEDIN_REVIEW_WORKSPACE_ID,
      deletedAt: null,
      resetAt: new Date(),
      resetBy: actor.email,
    },
    update: {
      deletedAt: null,
      resetAt: new Date(),
      resetBy: actor.email,
    },
  });
  const draft = await ensureDraft(actor);
  await recordReviewAudit("LinkedIn review workspace reset", actor, {
    draftId: draft.id,
    sourceId: draft.sourceId,
  });
  return draft;
}

export { safeMessage as safeLinkedInReviewOAuthMessage };
