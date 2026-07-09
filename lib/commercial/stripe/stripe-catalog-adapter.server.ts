/**
 * lib/commercial/stripe/stripe-catalog-adapter.server.ts
 *
 * PR B — READ-ONLY Stripe catalogue adapter.
 *
 * Uses ONLY products.list and prices.list. No write operations of any kind. No
 * customer, payment, invoice, or subscription data is retrieved — none is needed
 * for catalogue reconciliation.
 *
 * Retrieves active AND inactive Products and Prices with complete pagination,
 * preserves the Product→Price relationship, records livemode, and returns a
 * normalized, sanitized snapshot (no secret material).
 */

import type Stripe from "stripe";
import { getStripeReadClient, getStripeKeyMode, STRIPE_RECON_API_VERSION } from "./stripe-client.server";

export type NormalizedStripeProduct = {
  id: string;
  name: string;
  active: boolean;
  livemode: boolean;
  /** Canonical binding if deliberately set on the Stripe product. */
  aolProductCode: string | null;
};

export type NormalizedStripePrice = {
  id: string;
  productId: string | null;
  active: boolean;
  livemode: boolean;
  currency: string;
  unitAmount: number | null;
  recurringInterval: string | null; // "month" | "year" | ... | null (one-time)
  lookupKey: string | null;
  aolProductCode: string | null;
};

export type StripeCatalogSnapshot = {
  retrievedAt: string;
  schemaVersion: "1";
  keyMode: "live" | "test" | "unknown";
  apiVersion: string;
  livemode: boolean | null;
  productCount: number;
  priceCount: number;
  products: NormalizedStripeProduct[];
  prices: NormalizedStripePrice[];
};

function normalizeProduct(p: Stripe.Product): NormalizedStripeProduct {
  return {
    id: p.id,
    name: p.name,
    active: p.active,
    livemode: p.livemode,
    aolProductCode: (p.metadata && (p.metadata.aol_product_code || p.metadata.productCode)) || null,
  };
}

function normalizePrice(pr: Stripe.Price): NormalizedStripePrice {
  const productId = typeof pr.product === "string" ? pr.product : pr.product?.id ?? null;
  return {
    id: pr.id,
    productId,
    active: pr.active,
    livemode: pr.livemode,
    currency: pr.currency,
    unitAmount: pr.unit_amount ?? null,
    recurringInterval: pr.recurring?.interval ?? null,
    lookupKey: pr.lookup_key ?? null,
    aolProductCode: (pr.metadata && (pr.metadata.aol_product_code || pr.metadata.productCode)) || null,
  };
}

/**
 * Pull the live/test Stripe catalogue (products + prices), active and inactive,
 * fully paginated. READ-ONLY.
 */
export async function pullStripeCatalogSnapshot(): Promise<StripeCatalogSnapshot> {
  const stripe = getStripeReadClient();

  const products: NormalizedStripeProduct[] = [];
  const prices: NormalizedStripePrice[] = [];

  // Active AND inactive — Stripe's list defaults to active only, so we pass both.
  for (const active of [true, false]) {
    for await (const p of stripe.products.list({ limit: 100, active })) {
      products.push(normalizeProduct(p));
    }
    for await (const pr of stripe.prices.list({ limit: 100, active })) {
      prices.push(normalizePrice(pr));
    }
  }

  // Live/test separation: a single snapshot must never mix modes.
  const modes = new Set<boolean>([...products.map((p) => p.livemode), ...prices.map((p) => p.livemode)]);
  if (modes.size > 1) {
    throw new Error("Stripe snapshot mixes live and test objects — refusing to produce a mixed snapshot.");
  }
  const livemode = products[0]?.livemode ?? prices[0]?.livemode ?? null;

  return {
    retrievedAt: new Date().toISOString(),
    schemaVersion: "1",
    keyMode: getStripeKeyMode(),
    apiVersion: STRIPE_RECON_API_VERSION,
    livemode,
    productCount: products.length,
    priceCount: prices.length,
    products,
    prices,
  };
}
