// lib/server/secrets.ts
import { z } from "zod";

/**
 * Institutional Schema: Defines all required secrets and their formats.
 * This acts as a firewall—if any of these are missing/malformed in production,
 * the build or server startup will fail immediately with a clear error.
 */
const secretSchema = z.object({
  // Infrastructure
  DATABASE_URL: z.string().url(),
  NEON_API_KEY: z.string().min(1),
  
  // Security & Auth
  ACCESS_COOKIE_SECRET: z.string().min(32), // Enforce high entropy
  ACCESS_KEY_PEPPER: z.string().min(16),
  JWT_SECRET: z.string().min(32),
  INNER_CIRCLE_JWT_SECRET: z.string().min(32),
  ADMIN_JWT_SECRET: z.string().min(32),
  
  // Third-Party Integrations
  RESEND_API_KEY: z.string().startsWith("re_"),
  RECAPTCHA_SECRET: z.string().min(1),
});

type Secrets = z.infer<typeof secretSchema>;

/**
 * Validates and exports all secrets. 
 * Accessing process.env directly elsewhere is now "Institutional Debt."
 */
export const secrets = (() => {
  const result = secretSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues.map(i => i.path.join(".")).join(", ");
    throw new Error(`[SECURITY] Missing or invalid institutional secrets: ${missing}`);
  }

  return result.data;
})();

/**
 * Supports rotation by allowing comma-separated secrets in one env var.
 * Returns [primary, ...fallbacks]
 */
export function getRotatingSecrets(key: keyof Secrets): string[] {
  const value = secrets[key];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}