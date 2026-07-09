/**
 * lib/intelligence/interaction-spine/runtime-spine-provider.ts
 *
 * §3 — resolves the DURABLE spine used by the live runtime binding. Deliberately
 * separated from runtime-binding.ts so the binding stays pure/testable and the heavy
 * native dependency (better-sqlite3) is NEVER statically imported into an API route
 * bundle — it is dynamic-imported here only when a durable store is configured.
 *
 * Deploy boundary (honest): if INTERACTION_STORE_PATH is not set, this returns null
 * and the binding records nothing (and says so). The durable SQLite store is proven
 * (sqlite-interaction-store.test / sqlite-outbox-store.test); pointing this at a file
 * path (local/staging volume) activates durable compounding with no schema change.
 * Production on the operational Postgres requires an async InteractionStore adapter
 * (a named, non-invented hardening dependency — see persistence-authority-adr).
 *
 * The store + outbox are cached per path (one connection, migrations run once); close()
 * on the RuntimeSpine is a no-op so the shared connection is not torn down per request.
 */

import { isMappedProduct } from "./product-interaction-mappers";
import type { RuntimeSpine, RuntimeSpineResolver } from "./runtime-binding";
import type { InteractionStore } from "./product-interaction-spine";
import type { OutboxStore } from "./interaction-outbox";

interface CachedDurable {
  store: InteractionStore;
  outbox: OutboxStore;
}

const cache = new Map<string, CachedDurable>();

async function openDurable(path: string): Promise<CachedDurable> {
  const existing = cache.get(path);
  if (existing) return existing;
  // dynamic import: native module loaded lazily, only when durable persistence is on.
  const [{ createSqliteInteractionStore }, { createSqliteOutboxStore }] = await Promise.all([
    import("./sqlite-interaction-store"),
    import("./sqlite-outbox-store"),
  ]);
  const store = createSqliteInteractionStore(path);
  const outbox = createSqliteOutboxStore(path);
  const durable: CachedDurable = { store, outbox };
  cache.set(path, durable);
  return durable;
}

/**
 * The runtime resolver the live handlers pass to recordRuntimeInteraction. Returns a
 * durable spine when INTERACTION_STORE_PATH is set, else null (deploy boundary).
 */
export const resolveRuntimeSpine: RuntimeSpineResolver = async (): Promise<RuntimeSpine | null> => {
  const path = process.env.INTERACTION_STORE_PATH?.trim();
  if (!path) return null;
  const { store, outbox } = await openDurable(path);
  return {
    deps: { store, isCanonicalProduct: isMappedProduct },
    outbox,
    // synchronous better-sqlite3 writes are already durable on return; nothing to flush.
    close: () => { /* shared connection — intentionally not closed per request */ },
  };
};

/** Test/diagnostic helper: is durable runtime persistence configured? */
export function isDurableRuntimeConfigured(): boolean {
  return Boolean(process.env.INTERACTION_STORE_PATH?.trim());
}
