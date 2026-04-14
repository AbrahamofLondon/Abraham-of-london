function hasStrongSecret(value: string | undefined, minLength: number): boolean {
  return typeof value === "string" && value.trim().length >= minLength;
}

export function requirePdfGenerationEnv(context: string): void {
  const missing: string[] = [];

  if (!hasStrongSecret(process.env.SYSTEM_INTEGRITY_SALT, 16)) {
    missing.push("SYSTEM_INTEGRITY_SALT (must be >=16 chars)");
  }

  if (missing.length === 0) {
    return;
  }

  const message = [
    `[PDF_ENV] ${context} blocked by missing required environment.`,
    ...missing.map((item) => `- ${item}`),
    'Copy ".env.example" or ".env.local.example" to ".env.local" and set real secrets before running PDF generation.',
  ].join("\n");

  throw new Error(message);
}
