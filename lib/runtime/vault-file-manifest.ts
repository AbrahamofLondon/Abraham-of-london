export type VaultManifestEntry = {
  key: string;
  title: string;
  requiredTier: "public" | "inner_circle" | "client" | "restricted";
  storageUrl: string;
  fileType: string;
  isDownloadable: boolean;
};

// Explicit private-file allowlist. Keep this scoped to files that actually live
// under private/vault; editorial vault contents are indexed separately from the
// generated content manifest and should not be mirrored back into private files.
export const VAULT_FILE_MANIFEST: readonly VaultManifestEntry[] = [
  {
    key: "frameworks/inner-circle/operating-cadence-pack.pptx",
    title: "Operating Cadence Pack",
    requiredTier: "inner_circle",
    storageUrl: "/assets/vault/operating-cadence-pack.pptx",
    fileType: "pptx",
    isDownloadable: true,
  },
];

export function normalizeVaultManifestKey(key: string): string | null {
  const normalized = String(key || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
  if (!normalized || normalized.includes("..") || normalized.includes("\0")) {
    return null;
  }
  return normalized;
}

export function getVaultManifestEntry(key: string): VaultManifestEntry | null {
  const normalized = normalizeVaultManifestKey(key);
  if (!normalized) return null;
  return VAULT_FILE_MANIFEST.find((entry) => entry.key === normalized) || null;
}
