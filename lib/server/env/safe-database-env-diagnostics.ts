export type SafeDatabaseEnvDiagnostics = {
  hasDatabaseUrl: boolean;
  scheme: "postgresql" | "postgres" | "other" | "missing";
  hostPresent: boolean;
  usesPoolerHost: boolean;
  hasDirectUrl: boolean;
};

function schemeOf(value: string | undefined): SafeDatabaseEnvDiagnostics["scheme"] {
  if (!value) return "missing";
  if (value.startsWith("postgresql://")) return "postgresql";
  if (value.startsWith("postgres://")) return "postgres";
  return "other";
}

function safeHost(value: string | undefined): string {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    return parsed.hostname;
  } catch {
    return "";
  }
}

export function getSafeDatabaseEnvDiagnostics(
  env: Partial<Pick<NodeJS.ProcessEnv, "DATABASE_URL" | "DIRECT_URL">> = process.env,
): SafeDatabaseEnvDiagnostics {
  const databaseUrl = env.DATABASE_URL?.trim();
  const host = safeHost(databaseUrl);

  return {
    hasDatabaseUrl: Boolean(databaseUrl),
    scheme: schemeOf(databaseUrl),
    hostPresent: Boolean(host),
    usesPoolerHost: host.includes("-pooler."),
    hasDirectUrl: Boolean(env.DIRECT_URL?.trim()),
  };
}
