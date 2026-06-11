import { getRedis } from "@/lib/redis";

export type RedisClientMode = "upstash-rest" | "ioredis" | "not-configured" | "disabled";

export type RedisEnvShape = {
  REDIS_DISABLED: "present:true" | "present:false" | "missing";
  USE_REDIS: "present:true" | "present:false" | "missing";
  UPSTASH_REDIS_REST_URL: "present" | "missing";
  UPSTASH_REDIS_REST_TOKEN: "present" | "missing";
  REDIS_URL: "present" | "missing";
  REDIS_HOST: "present" | "missing";
  REDIS_PASSWORD: "present" | "missing";
};

export type RedisHealthResult = {
  ok: boolean;
  clientMode: RedisClientMode;
  configured: boolean;
  required: boolean;
  latency: number;
  timeoutMs: number;
  message: string;
  errorClass?: string;
  env: RedisEnvShape;
};

const DEFAULT_TIMEOUT_MS = 4000;

function present(value: string | undefined): boolean {
  const trimmed = value?.trim();
  return Boolean(trimmed && !trimmed.includes("CHANGE_ME"));
}

function boolShape(key: "REDIS_DISABLED" | "USE_REDIS"): RedisEnvShape[typeof key] {
  const value = process.env[key];
  if (value === undefined) return "missing";
  return value === "true" ? "present:true" : "present:false";
}

export function getRedisEnvShape(): RedisEnvShape {
  return {
    REDIS_DISABLED: boolShape("REDIS_DISABLED"),
    USE_REDIS: boolShape("USE_REDIS"),
    UPSTASH_REDIS_REST_URL: present(process.env.UPSTASH_REDIS_REST_URL) ? "present" : "missing",
    UPSTASH_REDIS_REST_TOKEN: present(process.env.UPSTASH_REDIS_REST_TOKEN) ? "present" : "missing",
    REDIS_URL: present(process.env.REDIS_URL) ? "present" : "missing",
    REDIS_HOST: present(process.env.REDIS_HOST) ? "present" : "missing",
    REDIS_PASSWORD: present(process.env.REDIS_PASSWORD) ? "present" : "missing",
  };
}

export function isRedisExplicitlyDisabled(): boolean {
  return process.env.REDIS_DISABLED === "true" || process.env.USE_REDIS === "false";
}

function isRedisRequired(): boolean {
  return process.env.USE_REDIS === "true" && process.env.REDIS_DISABLED !== "true";
}

function classifyError(error: unknown): string {
  if (error instanceof Error && error.name) return error.name;
  return "RedisHealthError";
}

function sanitizeError(error: unknown): string {
  if (!(error instanceof Error)) return "Redis health check failed";
  const message = error.message || "Redis health check failed";
  if (/401|403|unauthor/i.test(message)) return "Redis authentication failed";
  if (/404|not found/i.test(message)) return "Redis REST endpoint not found";
  if (/timeout|abort/i.test(message)) return "Redis health check timed out";
  if (/ECONNREFUSED/i.test(message)) return "Redis TCP connection refused";
  if (/ENOTFOUND|DNS|fetch failed/i.test(message)) return "Redis network lookup failed";
  if (/UPSTASH_REDIS/i.test(message)) return message;
  return "Redis health check failed";
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        const listener = () => reject(new Error("Redis health check timed out"));
        controller.signal.addEventListener("abort", listener, { once: true });
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

async function pingUpstashRest(timeoutMs: number): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/^"|"$/g, "").replace(/\/+$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim().replace(/^"|"$/g, "");
  if (!url || !token) throw new Error("UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${url}/ping`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Upstash REST ping failed: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    if (text.includes("PONG")) return;
    try {
      const json = JSON.parse(text) as { result?: unknown };
      if (json.result === "PONG") return;
    } catch {
      // Non-JSON bodies are handled by the text check above.
    }
    throw new Error("Upstash REST ping did not return PONG");
  } finally {
    clearTimeout(timeout);
  }
}

async function pingIoRedis(timeoutMs: number): Promise<void> {
  const redis = getRedis();
  await withTimeout(redis.ping().then(() => undefined), timeoutMs);
}

export async function checkCanonicalRedisHealth(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<RedisHealthResult> {
  const startedAt = Date.now();
  const env = getRedisEnvShape();
  const required = isRedisRequired();

  if (isRedisExplicitlyDisabled()) {
    return {
      ok: false,
      clientMode: "disabled",
      configured: false,
      required,
      latency: Date.now() - startedAt,
      timeoutMs,
      message: "Redis explicitly disabled by environment",
      env,
    };
  }

  const hasUpstashUrl = env.UPSTASH_REDIS_REST_URL === "present";
  const hasUpstashToken = env.UPSTASH_REDIS_REST_TOKEN === "present";

  if (hasUpstashUrl || hasUpstashToken) {
    const clientMode: RedisClientMode = "upstash-rest";
    if (!hasUpstashUrl || !hasUpstashToken) {
      return {
        ok: false,
        clientMode,
        configured: false,
        required,
        latency: Date.now() - startedAt,
        timeoutMs,
        message: "Upstash Redis REST environment is incomplete",
        errorClass: "RedisConfigurationError",
        env,
      };
    }

    try {
      await pingUpstashRest(timeoutMs);
      return {
        ok: true,
        clientMode,
        configured: true,
        required,
        latency: Date.now() - startedAt,
        timeoutMs,
        message: "Redis reachable via Upstash REST",
        env,
      };
    } catch (error) {
      return {
        ok: false,
        clientMode,
        configured: true,
        required,
        latency: Date.now() - startedAt,
        timeoutMs,
        message: sanitizeError(error),
        errorClass: classifyError(error),
        env,
      };
    }
  }

  if (env.REDIS_URL === "present") {
    try {
      await pingIoRedis(timeoutMs);
      return {
        ok: true,
        clientMode: "ioredis",
        configured: true,
        required,
        latency: Date.now() - startedAt,
        timeoutMs,
        message: "Redis reachable via ioredis",
        env,
      };
    } catch (error) {
      return {
        ok: false,
        clientMode: "ioredis",
        configured: true,
        required,
        latency: Date.now() - startedAt,
        timeoutMs,
        message: sanitizeError(error),
        errorClass: classifyError(error),
        env,
      };
    }
  }

  return {
    ok: false,
    clientMode: "not-configured",
    configured: false,
    required,
    latency: Date.now() - startedAt,
    timeoutMs,
    message: "Redis not configured",
    errorClass: "RedisConfigurationError",
    env,
  };
}
