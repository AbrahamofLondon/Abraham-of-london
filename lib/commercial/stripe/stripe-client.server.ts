/**
 * lib/commercial/stripe/stripe-client.server.ts
 *
 * PR B — one shared, server-only Stripe client factory for the read-only
 * reconciliation path. Pins a single API version so the reconciliation snapshot
 * is stable and comparable over time.
 *
 * This factory intentionally does NOT refactor the existing production payment
 * handlers (that is a later PR). It exists so the read-only catalogue adapter
 * and reconciliation tooling share one client + one pinned version.
 *
 * The secret key is read from the environment and is never logged or serialised.
 */

import Stripe from "stripe";

/** Single pinned Stripe API version for the reconciliation path. */
export const STRIPE_RECON_API_VERSION = "2025-03-31.basil" as const;

let cached: Stripe | null = null;

export function getStripeReadClient(): Stripe {
  if (typeof window !== "undefined") {
    throw new Error("getStripeReadClient must only be used server-side.");
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.trim()) {
    throw new Error("STRIPE_SECRET_KEY is not set — cannot create the Stripe read client.");
  }
  if (!cached) {
    cached = new Stripe(key, { apiVersion: STRIPE_RECON_API_VERSION as unknown as Stripe.LatestApiVersion });
  }
  return cached;
}

/** Key mode, derived from the key prefix — never returns the key itself. */
export function getStripeKeyMode(): "live" | "test" | "unknown" {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (key.startsWith("sk_live") || key.startsWith("rk_live")) return "live";
  if (key.startsWith("sk_test") || key.startsWith("rk_test")) return "test";
  return "unknown";
}
