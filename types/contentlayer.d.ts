declare module ".contentlayer/generated" {
  export const allDocuments: readonly Record<string, unknown>[];
  export const allPosts: readonly Record<string, unknown>[];
  export const allShorts: readonly Record<string, unknown>[];
  export const allBooks: readonly Record<string, unknown>[];
  export const allCanons: readonly Record<string, unknown>[];
  export const allBriefs: readonly Record<string, unknown>[];
  export const allVaultBriefs: readonly Record<string, unknown>[];
  export const allIntelligences: readonly Record<string, unknown>[];
  export const allDispatches: readonly Record<string, unknown>[];
  export const allDownloads: readonly Record<string, unknown>[];
  export const allEvents: readonly Record<string, unknown>[];
  export const allPrints: readonly Record<string, unknown>[];
  export const allResources: readonly Record<string, unknown>[];
  export const allStrategies: readonly Record<string, unknown>[];
  export const allLexicons: readonly Record<string, unknown>[];
  export const allVaults: readonly Record<string, unknown>[];
  export const allPlaybooks: readonly Record<string, unknown>[];

  export type Post = Record<string, unknown>;
  export type Short = Record<string, unknown>;
  export type Book = Record<string, unknown>;
  export type Canon = Record<string, unknown>;
  export type Brief = Record<string, unknown>;
  export type VaultBrief = Record<string, unknown>;
  export type Intelligence = Record<string, unknown>;
  export type Dispatch = Record<string, unknown>;
  export type Download = Record<string, unknown>;
  export type Event = Record<string, unknown>;
  export type Print = Record<string, unknown>;
  export type Resource = Record<string, unknown>;
  export type Strategy = Record<string, unknown>;
  export type Lexicon = Record<string, unknown>;
  export type Vault = Record<string, unknown>;
  export type Playbook = Record<string, unknown>;
  export type DocumentTypes = Record<string, unknown>;
}

declare module "contentlayer/generated" {
  export * from ".contentlayer/generated";
}
