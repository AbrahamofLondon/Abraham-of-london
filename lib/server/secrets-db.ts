import crypto from "crypto";

type SecretKey = "ACCESS_TOKENS_JSON";

type CacheEntry = { value: string; expiresAt: number };
const CACHE = new Map<SecretKey, CacheEntry>();

function assertDbUrl(): string {
  const url = process.env.INNER_CIRCLE_DB_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL / INNER_CIRCLE_DB_URL");
  return url;
}

async function querySecret(key: SecretKey): Promise<string | null> {
  const dbUrl = assertDbUrl();

  // Lightweight Postgres via fetch to your own API? No.
  // Use node-postgres if you already have it; otherwise use your existing DB client.
  // If you don't have pg installed, install: pnpm add pg
  const { Client } = await import("pg");
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    const res = await client.query(
      "SELECT value FROM app_secrets WHERE key = $1 LIMIT 1",
      [key]
    );
    return res.rows?.[0]?.value ?? null;
  } finally {
    await client.end();
  }
}

export async function getSecret(key: SecretKey, ttlMs = 60_000): Promise<string> {
  const now = Date.now();
  const cached = CACHE.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  const val = await querySecret(key);
  if (!val) throw new Error(`Secret not found in DB: ${key}`);

  CACHE.set(key, { value: val, expiresAt: now + ttlMs });
  return val;
}

// Optional: if you want tamper detection, store a hash too.
export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}