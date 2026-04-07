// lib/runtime/vault-config.ts
// RUNTIME-ONLY VAULT CONFIG
// Do NOT import next.config.mjs here.
// Do NOT perform broad fs scanning here.
// Keep every path statically scoped.

export type VaultRuntimeConfig = {
  vaultRootSegments: string[];
  cacheSeconds: number;
  allowIndex: boolean;
  enforceAuth: boolean;
};

function normalizePositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

export const vaultRuntimeConfig: VaultRuntimeConfig = {
  // Statically scoped under project root to avoid broad NFT tracing.
  // Final absolute path becomes:
  //   path.join(process.cwd(), ...vaultRootSegments)
  vaultRootSegments: ["private", "vault"],

  // 0 = no-store
  cacheSeconds: normalizePositiveInt(process.env.VAULT_CACHE_SECONDS, 0),

  // Keep false for secure private vault serving.
  allowIndex: false,

  // Private vault should enforce auth unless explicitly changed later.
  enforceAuth: true,
};

export default vaultRuntimeConfig;