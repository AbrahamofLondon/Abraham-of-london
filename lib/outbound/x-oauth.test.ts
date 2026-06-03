import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockConnectionFindFirst, mockAttemptFindFirst, mockAttemptFindMany } = vi.hoisted(() => ({
  mockConnectionFindFirst: vi.fn(),
  mockAttemptFindFirst: vi.fn(),
  mockAttemptFindMany: vi.fn(),
}));

const mockFindFirst = mockConnectionFindFirst;

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    xOAuthConnection: {
      findFirst: mockConnectionFindFirst,
    },
    xPublishAttempt: {
      findFirst: mockAttemptFindFirst,
      findMany: mockAttemptFindMany,
    },
  },
}));

import {
  buildXAuthUrl,
  getConfiguredXOAuthScopes,
  getMissingXOutboundEnv,
  getXConnectionStatus,
} from "./x-oauth";
import {
  X_API_BASE,
  X_AUTH_URL,
  X_REVOKE_URL,
  X_TOKEN_URL,
} from "./x-types";

const originalEnv = { ...process.env };

function clearXEnv() {
  delete process.env.X_CLIENT_ID;
  delete process.env.X_CLIENT_SECRET;
  delete process.env.X_REDIRECT_URI;
  delete process.env.X_OAUTH_SCOPES;
  delete process.env.X_PUBLISHING_ENABLED;
  delete process.env.X_TOKEN_ENCRYPTION_KEY;
}

function configureXEnv() {
  process.env.X_CLIENT_ID = "x-client-id";
  process.env.X_CLIENT_SECRET = "x-client-secret";
  process.env.X_REDIRECT_URI = "https://www.abrahamoflondon.org/api/admin/outbound/x/oauth/callback";
  process.env.X_OAUTH_SCOPES = "tweet.read tweet.write users.read offline.access";
  process.env.X_PUBLISHING_ENABLED = "true";
  process.env.X_TOKEN_ENCRYPTION_KEY = "x-token-encryption-key-32-characters";
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...originalEnv };
  clearXEnv();
  mockFindFirst.mockResolvedValue(null);
  mockAttemptFindFirst.mockResolvedValue(null);
  mockAttemptFindMany.mockResolvedValue([]);
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("X OAuth readiness", () => {
  it("reports full missing env list when X is not configured", async () => {
    const status = await getXConnectionStatus();

    expect(status.readiness).toBe("CONFIG_MISSING");
    expect(status.oauthConfigured).toBe(false);
    expect(status.missingEnv).toEqual([
      "X_CLIENT_ID",
      "X_CLIENT_SECRET",
      "X_REDIRECT_URI",
      "X_OAUTH_SCOPES",
      "X_PUBLISHING_ENABLED",
      "X_TOKEN_ENCRYPTION_KEY",
    ]);
  });

  it("moves to READY_TO_CONNECT when env is present but no token is stored", async () => {
    configureXEnv();

    const status = await getXConnectionStatus();

    expect(getMissingXOutboundEnv()).toEqual([]);
    expect(getConfiguredXOAuthScopes()).toEqual([
      "tweet.read",
      "tweet.write",
      "users.read",
      "offline.access",
    ]);
    expect(status.readiness).toBe("READY_TO_CONNECT");
    expect(status.oauthConfigured).toBe(true);
    expect(status.connected).toBe(false);
    expect(status.publishingEnabled).toBe(true);
    expect(status.missingEnv).toEqual([]);
  });

  it("builds the OAuth authorize URL on the current x.com host", () => {
    configureXEnv();

    const authUrl = new URL(buildXAuthUrl({
      state: "signed-state",
      codeChallenge: "pkce-challenge",
    }));

    expect(X_AUTH_URL).toBe("https://x.com/i/oauth2/authorize");
    expect(X_TOKEN_URL).toBe("https://api.x.com/2/oauth2/token");
    expect(X_REVOKE_URL).toBe("https://api.x.com/2/oauth2/revoke");
    expect(X_API_BASE).toBe("https://api.x.com/2");
    expect(authUrl.origin).toBe("https://x.com");
    expect(authUrl.pathname).toBe("/i/oauth2/authorize");
    expect(authUrl.searchParams.get("response_type")).toBe("code");
    expect(authUrl.searchParams.get("redirect_uri")).toBe(
      "https://www.abrahamoflondon.org/api/admin/outbound/x/oauth/callback",
    );
    expect(authUrl.searchParams.get("scope")).toBe(
      "tweet.read tweet.write users.read offline.access",
    );
    expect(authUrl.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("returns CREDIT_BLOCKED when latest live attempt is X_CREDIT_BLOCKED", async () => {
    configureXEnv();
    mockConnectionFindFirst.mockResolvedValue({
      id: "conn_1",
      userId: "x_user_1",
      username: "abrahamoflondon",
      expiresAt: new Date(Date.now() + 3600_000),
      encryptedRefreshToken: "encrypted_refresh",
      scopesJson: JSON.stringify(["tweet.read", "tweet.write", "users.read", "offline.access"]),
    });
    mockAttemptFindMany.mockResolvedValue([
      {
        errorCode: "X_CREDIT_BLOCKED",
        status: "failed",
        dryRun: false,
        createdAt: new Date(),
      },
    ]);

    const status = await getXConnectionStatus();

    expect(status.connected).toBe(true);
    expect(status.canPublish).toBe(true);
    expect(status.readiness).toBe("CREDIT_BLOCKED");
  });

  it("returns READY when latest live attempt is successful after a credit blocker", async () => {
    configureXEnv();
    mockConnectionFindFirst.mockResolvedValue({
      id: "conn_1",
      userId: "x_user_1",
      username: "abrahamoflondon",
      expiresAt: new Date(Date.now() + 3600_000),
      encryptedRefreshToken: "encrypted_refresh",
      scopesJson: JSON.stringify(["tweet.read", "tweet.write", "users.read", "offline.access"]),
    });
    mockAttemptFindMany.mockResolvedValue([
      {
        errorCode: null,
        status: "succeeded",
        dryRun: false,
        createdAt: new Date(),
      },
      {
        errorCode: "X_CREDIT_BLOCKED",
        status: "failed",
        dryRun: false,
        createdAt: new Date(Date.now() - 10_000),
      },
    ]);

    const status = await getXConnectionStatus();

    expect(status.connected).toBe(true);
    expect(status.canPublish).toBe(true);
    expect(status.readiness).toBe("READY");
  });
});
