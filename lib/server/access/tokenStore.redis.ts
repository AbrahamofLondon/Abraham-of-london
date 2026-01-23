import Redis from "ioredis";
import type { TokenStore } from "./tokenStore";
import type { AccessSession, OneTimeToken } from "./types";

const PREFIX = "aol:access";
const KEY = {
  oneTime: (token: string) => `${PREFIX}:ott:${token}`,
  session: (sessionId: string) => `${PREFIX}:sess:${sessionId}`,
  revokedOtt: (token: string) => `${PREFIX}:ott_revoked:${token}`, // optional marker
};

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function redisFromEnv(): Redis {
  const url = mustEnv("REDIS_URL");
  return new Redis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: false,
  });
}

function sessionTtlSeconds(): number {
  const days = Number(process.env.AOL_SESSION_TTL_DAYS || 30);
  return Math.max(1, Math.floor(days * 24 * 60 * 60));
}

function tokenTtlSecondsFallback(): number {
  // used only when creating tokens (optional)
  const hours = Number(process.env.AOL_TOKEN_TTL_HOURS || 168); // 7 days
  return Math.max(60, Math.floor(hours * 60 * 60));
}

export async function createRedisTokenStore(): Promise<TokenStore> {
  const redis = redisFromEnv();

  // Quick connectivity check (fail fast in build/runtime)
  await redis.ping();

  return {
    async getOneTimeToken(token: string) {
      const raw = await redis.get(KEY.oneTime(token));
      if (!raw) return null;
      try {
        return JSON.parse(raw) as OneTimeToken;
      } catch {
        return null;
      }
    },

    async consumeOneTimeToken(token: string) {
      const k = KEY.oneTime(token);

      // atomic: check exists + not consumed + not expired + set consumedAt
      // We store token as JSON; update by LUA to avoid races.
      const lua = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])

        local raw = redis.call("GET", key)
        if not raw then return 0 end

        local ok, obj = pcall(cjson.decode, raw)
        if not ok then return 0 end

        if obj["revoked"] == true then return 0 end
        if obj["consumedAt"] ~= nil then return 0 end
        if obj["expiresAt"] ~= nil and now > tonumber(obj["expiresAt"]) then return 0 end

        obj["consumedAt"] = now
        local updated = cjson.encode(obj)

        -- preserve TTL if exists
        local ttl = redis.call("TTL", key)
        if ttl and ttl > 0 then
          redis.call("SET", key, updated, "EX", ttl)
        else
          redis.call("SET", key, updated)
        end

        return 1
      `;

      const result = await redis.eval(lua, 1, k, String(Date.now()));
      return Number(result) === 1;
    },

    async getSession(sessionId: string) {
      const raw = await redis.get(KEY.session(sessionId));
      if (!raw) return null;
      try {
        const s = JSON.parse(raw) as AccessSession;
        if (s.revoked) return null;
        if (Date.now() > s.expiresAt) return null;
        return s;
      } catch {
        return null;
      }
    },

    async upsertSession(session: AccessSession) {
      const ttl = Math.max(60, Math.floor((session.expiresAt - Date.now()) / 1000));
      await redis.set(KEY.session(session.sessionId), JSON.stringify(session), "EX", ttl);
    },

    async revokeSession(sessionId: string) {
      const k = KEY.session(sessionId);
      const raw = await redis.get(k);
      if (!raw) return;

      try {
        const s = JSON.parse(raw) as AccessSession;
        const updated: AccessSession = { ...s, revoked: true };
        // keep short TTL; no need to keep forever
        await redis.set(k, JSON.stringify(updated), "EX", 60 * 60 * 24);
      } catch {
        // if malformed, just delete
        await redis.del(k);
      }
    },
  };
}

/**
 * Optional helper (admin issuance) - not part of TokenStore interface.
 * If you want token issuance via API/admin panel, use this.
 */
export async function issueOneTimeToken(args: {
  token: string;
  tier: OneTimeToken["tier"];
  subject: string;
  expiresAt?: number;
}) {
  const redis = redisFromEnv();
  const now = Date.now();
  const ttl = tokenTtlSecondsFallback();

  const record: OneTimeToken = {
    token: args.token,
    tier: args.tier,
    subject: args.subject,
    expiresAt: args.expiresAt ?? now + ttl * 1000,
  };

  const seconds = Math.max(60, Math.floor((record.expiresAt - now) / 1000));
  await redis.set(KEY.oneTime(args.token), JSON.stringify(record), "EX", seconds);

  return record;
}