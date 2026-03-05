// lib/server/access/tokenStore.ts
// Transitional TokenStore façade — stable typed export

import type { AccessSession, OneTimeToken } from "./types";

export interface TokenStore {
  // one-time token
  getOneTimeToken(token: string): Promise<OneTimeToken | null>;
  consumeOneTimeToken(token: string): Promise<boolean>;

  // sessions
  getSession(sessionId: string): Promise<AccessSession | null>;
  upsertSession(session: AccessSession): Promise<void>;
  revokeSession(sessionId: string): Promise<void>;
}

let singleton: TokenStore | null = null;

function assertTokenStore(store: TokenStore | null | undefined, backend: string): TokenStore {
  if (!store) {
    throw new Error(`TokenStore backend "${backend}" failed to initialize.`);
  }
  return store;
}

export async function getTokenStore(): Promise<TokenStore> {
  if (singleton) return singleton;

  const backend = String(process.env.AOL_TOKENSTORE_BACKEND || "memory").toLowerCase();

  if (backend === "redis") {
    const mod = await import("./tokenStore.redis");
    const created = await mod.createRedisTokenStore();
    singleton = assertTokenStore(created, backend);
    return singleton;
  }

  if (backend === "postgres") {
    const mod = await import("./tokenStore.postgres");
    const factory = (mod as { createPostgresTokenStore?: () => Promise<TokenStore> | TokenStore })
      .createPostgresTokenStore;

    const created = factory ? await factory() : null;
    singleton = assertTokenStore(created, backend);
    return singleton;
  }

  const mod = await import("./tokenStore.memory");
  const created = mod.createMemoryTokenStore();
  singleton = assertTokenStore(created, backend);
  return singleton;
}