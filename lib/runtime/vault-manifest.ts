// Explicit vault allowlist. Keep this small; large/private media belongs in
// external storage, not in serverless function traces.
export const VAULT_FILE_MANIFEST = [
  "frameworks/inner-circle/operating-cadence-pack.pptx",
] as const;

export const VAULT_FILE_SET = new Set<string>(VAULT_FILE_MANIFEST);
