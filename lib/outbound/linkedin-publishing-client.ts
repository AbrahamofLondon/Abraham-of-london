import { getConnectionStatus, getLinkedInAccessToken } from "./linkedin-oauth";

const LINKEDIN_POSTS_URL = "https://api.linkedin.com/rest/posts";
const LINKEDIN_API_VERSION = "202504";

export type LinkedInPublishClientResult = {
  ok: boolean;
  status: "succeeded" | "failed";
  postUrn?: string;
  postUrl?: string;
  errorCode?: string;
  safeMessage?: string;
};

export type LinkedInTextPostInput = {
  commentary: string;
};

export function buildLinkedInTextPostPayload(input: {
  authorUrn: string;
  commentary: string;
}) {
  return {
    author: input.authorUrn,
    commentary: input.commentary,
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

export async function validateLinkedInConnection() {
  return getConnectionStatus();
}

export async function refreshTokenIfSupported(): Promise<null> {
  return null;
}

export function normaliseLinkedInPublishError(status: number): Pick<
  LinkedInPublishClientResult,
  "errorCode" | "safeMessage"
> {
  if (status === 400) {
    return {
      errorCode: "LINKEDIN_PAYLOAD_INVALID",
      safeMessage: "LinkedIn rejected the post payload.",
    };
  }
  if (status === 401) {
    return {
      errorCode: "LINKEDIN_TOKEN_INVALID",
      safeMessage: "LinkedIn token is invalid or expired. Reconnect LinkedIn.",
    };
  }
  if (status === 403) {
    return {
      errorCode: "LINKEDIN_SCOPE_OR_PERMISSION_MISSING",
      safeMessage: "LinkedIn account is missing the required posting permission.",
    };
  }
  if (status === 429) {
    return {
      errorCode: "LINKEDIN_RATE_LIMITED",
      safeMessage: "LinkedIn rate limit reached. Wait before trying again.",
    };
  }
  return {
    errorCode: "LINKEDIN_POST_FAILED",
    safeMessage: `LinkedIn publishing failed with status ${status}.`,
  };
}

function postUrlFromUrn(postUrn: string): string | undefined {
  return postUrn ? `https://www.linkedin.com/feed/update/${encodeURIComponent(postUrn)}` : undefined;
}

export async function publishTextPostToLinkedIn(
  input: LinkedInTextPostInput,
): Promise<LinkedInPublishClientResult> {
  const token = await getLinkedInAccessToken();
  if (!token) {
    return {
      ok: false,
      status: "failed",
      errorCode: "LINKEDIN_NOT_CONNECTED",
      safeMessage: "LinkedIn publishing connection is not active.",
    };
  }

  if (!token.scope.split(" ").includes("w_member_social")) {
    return {
      ok: false,
      status: "failed",
      errorCode: "LINKEDIN_SCOPE_OR_PERMISSION_MISSING",
      safeMessage: "LinkedIn connection is missing w_member_social scope.",
    };
  }

  if (!token.ownerUrn) {
    return {
      ok: false,
      status: "failed",
      errorCode: "LINKEDIN_OWNER_URN_MISSING",
      safeMessage: "LinkedIn member URN is unavailable. Reconnect LinkedIn.",
    };
  }

  try {
    const response = await fetch(LINKEDIN_POSTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": LINKEDIN_API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(
        buildLinkedInTextPostPayload({
          authorUrn: token.ownerUrn,
          commentary: input.commentary,
        }),
      ),
    });

    if (!response.ok) {
      const normalised = normaliseLinkedInPublishError(response.status);
      return { ok: false, status: "failed", ...normalised };
    }

    const postUrn =
      response.headers.get("x-restli-id") ||
      response.headers.get("location") ||
      undefined;

    return {
      ok: true,
      status: "succeeded",
      postUrn,
      postUrl: postUrn ? postUrlFromUrn(postUrn) : undefined,
    };
  } catch {
    return {
      ok: false,
      status: "failed",
      errorCode: "LINKEDIN_NETWORK_FAILURE",
      safeMessage: "Network failure while publishing to LinkedIn.",
    };
  }
}
