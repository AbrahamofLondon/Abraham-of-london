import type { AccessSession, OneTimeToken } from "./types";

export interface TokenStore {
  // one-time token (redeem once)
  getOneTimeToken(token: string): Promise<OneTimeToken | null>;
  consumeOneTimeToken(token: string): Promise<boolean>;

  // sessions
  getSession(sessionId: string): Promise<AccessSession | null>;
  upsertSession(session: AccessSession): Promise<void>;
  revokeSession(sessionId: string): Promise<void>;
}

let singleton: TokenStore | null = null;

export async function getTokenStore(): Promise<TokenStore> {
  if (singleton) return singleton;

  const backend = (process.env.AOL_TOKENSTORE_BACKEND || "memory").toLowerCase();

  if (backend === "redis") {
    const mod = await import("./tokenStore.redis");
    singleton = await mod.createRedisTokenStore();
    return singleton;
  }

  if (backend === "postgres") {
    const mod = await import("./tokenStore.postgres");
    singleton = await mod.createPostgresTokenStore();
    return singleton;
  }

  const mod = await import("./tokenStore.memory");
  singleton = mod.createMemoryTokenStore();
  return singleton;
}