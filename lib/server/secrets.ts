// lib/server/secrets.ts
// Production-safe secrets access: env-first, validated, predictable.

type SecretName =
  | "ACCESS_COOKIE_SECRET"
  | "ACCESS_KEY_PEPPER"
  | "JWT_SECRET"
  | "INNER_CIRCLE_JWT_SECRET"
  | "ADMIN_JWT_SECRET"
  | "RESEND_API_KEY"
  | "RECAPTCHA_SECRET";

function readEnv(name: string): string | null {
  const v = process.env[name];
  if (!v) return null;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : null;
}

export function requireSecret(name: SecretName): string {
  const v = readEnv(name);
  if (!v) {
    throw new Error(`Missing required secret: ${name}`);
  }
  return v;
}

/**
 * Supports rotation by allowing comma-separated secrets:
 * e.g. ACCESS_COOKIE_SECRET="newsecret,oldsecret"
 * Returns [primary, ...fallbacks]
 */
export function getRotatingSecrets(name: SecretName): string[] {
  const v = requireSecret(name);
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Optional secrets (return null if absent)
 */
export function getOptionalSecret(name: SecretName): string | null {
  return readEnv(name);
}