export type VaultManifestEntry = {
  key: string;
  title: string;
  requiredTier: "public" | "inner_circle" | "client" | "restricted";
  storageUrl: string;
  fileType: string;
  isDownloadable: boolean;
};

// Explicit vault allowlist. Keep this small; large/private media belongs in
// external storage, not in serverless function traces.
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

export function getVaultManifestEntry(key: string): VaultManifestEntry | null {
  const normalized = String(key || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
  if (!normalized || normalized.includes("..") || normalized.includes("\0")) {
    return null;
  }
  return VAULT_FILE_MANIFEST.find((entry) => entry.key === normalized) || null;
}
