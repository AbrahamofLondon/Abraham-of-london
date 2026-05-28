import vaultIndexManifest from "../../vault-manifest.json";

export {
  VAULT_FILE_MANIFEST,
  getVaultManifestEntry,
  normalizeVaultManifestKey,
  type VaultManifestEntry,
} from "./vault-file-manifest";

export type VaultIndexEntry = {
  title: string;
  slug: string;
  category: string;
  type: string;
};

export const VAULT_INDEX_MANIFEST: readonly VaultIndexEntry[] = (
  vaultIndexManifest as VaultIndexEntry[]
).filter((entry) => {
  const slug = String(entry.slug || "").trim();
  return slug.startsWith("/vault/") && !slug.includes("..") && !slug.includes("\0");
});
