import vaultIndexManifest from "../../vault-manifest.json";

export type VaultManifestEntry = {
  key: string;
  title: string;
  requiredTier: "public" | "inner_circle" | "client" | "restricted";
  storageUrl: string;
  fileType: string;
  isDownloadable: boolean;
};

export type VaultIndexEntry = {
  title: string;
  slug: string;
  category: string;
  type: string;
};

// Explicit private-file allowlist. Keep this scoped to files that actually live
// under private/vault; editorial vault contents are indexed below from the
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

export const VAULT_INDEX_MANIFEST: readonly VaultIndexEntry[] = (
  vaultIndexManifest as VaultIndexEntry[]
).filter((entry) => {
  const slug = String(entry.slug || "").trim();
  return slug.startsWith("/vault/") && !slug.includes("..") && !slug.includes("\0");
});

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
