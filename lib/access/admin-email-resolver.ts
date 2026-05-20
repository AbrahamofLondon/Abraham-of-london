const HARDCODED_BOOTSTRAP_ADMIN_EMAILS = [
  "info@abrahamoflondon.org",
  "admin@abrahamoflondon.org",
  "seunadaramola@gmail.com",
  "abrahamadaramola@outlook.com",
] as const;

function splitEmailList(value: string | undefined): string[] {
  return String(value || "")
    .split(/[,\s;]+/g)
    .map((email) => normalizeAdminEmail(email))
    .filter(Boolean);
}

export function normalizeAdminEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function getHardcodedBootstrapAdminEmails(): readonly string[] {
  return HARDCODED_BOOTSTRAP_ADMIN_EMAILS;
}

export function getResolvedAdminEmails(env: NodeJS.ProcessEnv = process.env): readonly string[] {
  return Array.from(new Set([
    ...HARDCODED_BOOTSTRAP_ADMIN_EMAILS,
    ...splitEmailList(env.ADMIN_USER_EMAILS),
  ]));
}

export function getResolvedAdminEmailSet(env: NodeJS.ProcessEnv = process.env): Set<string> {
  return new Set(getResolvedAdminEmails(env));
}

export function isResolvedAdminEmail(email: unknown, env: NodeJS.ProcessEnv = process.env): boolean {
  const normalized = normalizeAdminEmail(email);
  return Boolean(normalized) && getResolvedAdminEmailSet(env).has(normalized);
}
