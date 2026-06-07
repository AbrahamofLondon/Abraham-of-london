/**
 * tests/lib/decision-instruments/instrument-catalog-bridge.test.ts
 *
 * Validates that:
 * 1. Every registered instrument slug resolves to a valid catalog entry
 * 2. Prices are consistent — no local override diverges from catalog
 * 3. Pack IDs resolve to catalog entries (or are explicitly provisional)
 * 4. Slug mismatch ("board-brief-template") is eliminated from INSTRUMENT_REGISTRY
 * 5. INSTRUMENT_PACKS uses board-brief-builder not board-brief-template
 */

import { describe, it, expect } from "vitest";
import {
  INSTRUMENT_SLUG_TO_CATALOG_CODE,
  PACK_ID_TO_CATALOG_CODE,
  getInstrumentCatalogProduct,
  getInstrumentDisplayPrice,
  getInstrumentAmountGbp,
  getPackDisplayPrice,
  getPackAmountGbp,
  validateInstrumentCatalogIntegrity,
  isKnownInstrumentSlug,
  isKnownPackId,
  EXECUTIVE_INTELLIGENCE_PACK_PRICE_GBP,
} from "@/lib/decision-instruments/instrument-catalog-bridge";

import {
  INSTRUMENT_REGISTRY,
  INSTRUMENT_SLUGS,
  getInstrumentPrice,
} from "@/lib/instruments/governed-instrument-contract";

import {
  INSTRUMENT_PACKS,
  getPackPrice,
} from "@/lib/instruments/instrument-pack-contract";

import {
  PREMIUM_DECISION_ASSETS,
  getAssetPriceGbp,
  getAssetDisplayPrice,
} from "@/lib/commercial/premium-decision-assets";

import { CATALOG } from "@/lib/commercial/catalog";

// ── Bridge integrity ──────────────────────────────────────────────────────────

describe("instrument-catalog-bridge integrity", () => {
  it("passes full catalog integrity validation with zero errors", () => {
    const errors = validateInstrumentCatalogIntegrity();
    expect(errors).toHaveLength(0);
  });

  it("every instrument slug in INSTRUMENT_SLUG_TO_CATALOG_CODE resolves to a real catalog entry", () => {
    for (const [slug, code] of Object.entries(INSTRUMENT_SLUG_TO_CATALOG_CODE)) {
      const product = CATALOG[code];
      expect(
        product,
        `Instrument slug "${slug}" maps to catalog code "${code}" which does not exist in CATALOG`,
      ).toBeDefined();
    }
  });

  it("every pack in PACK_ID_TO_CATALOG_CODE resolves to a real catalog entry", () => {
    for (const [packId, code] of Object.entries(PACK_ID_TO_CATALOG_CODE)) {
      const product = CATALOG[code];
      expect(
        product,
        `Pack ID "${packId}" maps to catalog code "${code}" which does not exist in CATALOG`,
      ).toBeDefined();
    }
  });

  it("getInstrumentCatalogProduct returns product for all known slugs", () => {
    for (const slug of Object.keys(INSTRUMENT_SLUG_TO_CATALOG_CODE)) {
      const product = getInstrumentCatalogProduct(slug);
      expect(product, `No catalog product found for slug "${slug}"`).not.toBeNull();
    }
  });

  it("getInstrumentCatalogProduct returns null for unknown slug", () => {
    expect(getInstrumentCatalogProduct("fake-instrument-slug")).toBeNull();
  });

  it("getInstrumentDisplayPrice returns non-empty string for all known slugs", () => {
    for (const slug of Object.keys(INSTRUMENT_SLUG_TO_CATALOG_CODE)) {
      const price = getInstrumentDisplayPrice(slug);
      expect(price, `Empty display price for slug "${slug}"`).toBeTruthy();
    }
  });

  it("getInstrumentDisplayPrice throws for unknown slug", () => {
    expect(() => getInstrumentDisplayPrice("unknown-slug")).toThrow();
  });

  it("getInstrumentAmountGbp returns positive number for paid instruments", () => {
    const paidSlugs = Object.keys(INSTRUMENT_SLUG_TO_CATALOG_CODE).filter(
      (slug) => !slug.includes("pack"),
    );
    for (const slug of paidSlugs) {
      const product = getInstrumentCatalogProduct(slug);
      if (product?.commercialStatus === "paid") {
        const amount = getInstrumentAmountGbp(slug);
        expect(amount, `Zero amount for paid instrument "${slug}"`).toBeGreaterThan(0);
      }
    }
  });

  it("getPackDisplayPrice returns price for all known pack IDs", () => {
    const packIds = [...Object.keys(PACK_ID_TO_CATALOG_CODE), "executive_intelligence"];
    for (const packId of packIds) {
      const price = getPackDisplayPrice(packId);
      expect(price, `Empty price for pack "${packId}"`).toBeTruthy();
      expect(price).toMatch(/^£/);
    }
  });

  it("executive_intelligence pack price is held provisionally until catalog entry exists", () => {
    expect(EXECUTIVE_INTELLIGENCE_PACK_PRICE_GBP).toBe(995);
    expect(getPackDisplayPrice("executive_intelligence")).toBe("£995");
    // Not yet in catalog — that's the known state
    expect(CATALOG["executive_intelligence"]).toBeUndefined();
  });

  it("isKnownInstrumentSlug returns true for registered slugs", () => {
    expect(isKnownInstrumentSlug("decision-exposure-instrument")).toBe(true);
    expect(isKnownInstrumentSlug("board-brief-builder")).toBe(true);
    expect(isKnownInstrumentSlug("board-brief-template")).toBe(false);
    expect(isKnownInstrumentSlug("fake")).toBe(false);
  });

  it("isKnownPackId returns true for known packs including executive_intelligence", () => {
    expect(isKnownPackId("operator_essentials")).toBe(true);
    expect(isKnownPackId("executive_intelligence")).toBe(true);
    expect(isKnownPackId("unknown_pack")).toBe(false);
  });
});

// ── INSTRUMENT_REGISTRY ───────────────────────────────────────────────────────

describe("INSTRUMENT_REGISTRY (governed-instrument-contract)", () => {
  it("does not contain board-brief-template — only board-brief-builder is canonical", () => {
    const slugs = Object.keys(INSTRUMENT_REGISTRY);
    expect(slugs).not.toContain("board-brief-template");
    expect(slugs).toContain("board-brief-builder");
  });

  it("every registry entry has a catalogCode field", () => {
    for (const [slug, entry] of Object.entries(INSTRUMENT_REGISTRY)) {
      expect(
        entry.catalogCode,
        `INSTRUMENT_REGISTRY["${slug}"] is missing catalogCode`,
      ).toBeTruthy();
    }
  });

  it("every registry catalogCode resolves to a real catalog entry", () => {
    for (const [slug, entry] of Object.entries(INSTRUMENT_REGISTRY)) {
      const product = CATALOG[entry.catalogCode];
      expect(
        product,
        `INSTRUMENT_REGISTRY["${slug}"].catalogCode "${entry.catalogCode}" not found in CATALOG`,
      ).toBeDefined();
    }
  });

  it("does not have a price field on any entry (prices come from catalog)", () => {
    for (const [slug, entry] of Object.entries(INSTRUMENT_REGISTRY)) {
      expect(
        (entry as Record<string, unknown>)["price"],
        `INSTRUMENT_REGISTRY["${slug}"] still has a hardcoded price field`,
      ).toBeUndefined();
    }
  });

  it("getInstrumentPrice returns non-empty string for all INSTRUMENT_SLUGS", () => {
    for (const slug of INSTRUMENT_SLUGS) {
      const price = getInstrumentPrice(slug);
      expect(price, `getInstrumentPrice("${slug}") returned empty`).toBeTruthy();
    }
  });
});

// ── INSTRUMENT_SLUGS ──────────────────────────────────────────────────────────

describe("INSTRUMENT_SLUGS", () => {
  it("contains board-brief-builder not board-brief-template", () => {
    expect(INSTRUMENT_SLUGS).toContain("board-brief-builder");
    expect(INSTRUMENT_SLUGS).not.toContain("board-brief-template");
  });

  it("has exactly 10 slugs", () => {
    expect(INSTRUMENT_SLUGS).toHaveLength(10);
  });

  it("every slug is registered in the instrument-catalog-bridge", () => {
    for (const slug of INSTRUMENT_SLUGS) {
      expect(
        isKnownInstrumentSlug(slug),
        `INSTRUMENT_SLUGS contains "${slug}" which is not in INSTRUMENT_SLUG_TO_CATALOG_CODE`,
      ).toBe(true);
    }
  });
});

// ── INSTRUMENT_PACKS ──────────────────────────────────────────────────────────

describe("INSTRUMENT_PACKS (instrument-pack-contract)", () => {
  it("does not contain board-brief-template in any pack — only board-brief-builder", () => {
    for (const [packId, pack] of Object.entries(INSTRUMENT_PACKS)) {
      for (const slug of pack.includedInstruments) {
        expect(
          slug,
          `Pack "${packId}" contains legacy slug "board-brief-template"`,
        ).not.toBe("board-brief-template");
      }
    }
  });

  it("does not have a price field on any entry (prices come from catalog)", () => {
    for (const [packId, pack] of Object.entries(INSTRUMENT_PACKS)) {
      expect(
        (pack as Record<string, unknown>)["price"],
        `INSTRUMENT_PACKS["${packId}"] still has a hardcoded price field`,
      ).toBeUndefined();
    }
  });

  it("catalogCode matches the catalog for catalog-linked packs", () => {
    for (const [packId, pack] of Object.entries(INSTRUMENT_PACKS)) {
      if (pack.catalogCode) {
        const product = CATALOG[pack.catalogCode];
        expect(
          product,
          `INSTRUMENT_PACKS["${packId}"].catalogCode "${pack.catalogCode}" not in CATALOG`,
        ).toBeDefined();
      }
    }
  });

  it("getPackPrice returns non-empty price for all packs", () => {
    for (const packId of Object.keys(INSTRUMENT_PACKS) as Array<keyof typeof INSTRUMENT_PACKS>) {
      const price = getPackPrice(packId);
      expect(price, `getPackPrice("${packId}") returned empty`).toBeTruthy();
      expect(price).toMatch(/^£/);
    }
  });

  it("pack prices from catalog match expected commercial amounts", () => {
    // operator_essentials_pack — catalog £129
    expect(getPackAmountGbp("operator_essentials")).toBe(129);
    // command_pack — catalog £249
    expect(getPackAmountGbp("command_pack")).toBe(249);
    // governance_suite — catalog £495
    expect(getPackAmountGbp("governance_suite")).toBe(495);
    // executive_intelligence — provisional £995
    expect(getPackAmountGbp("executive_intelligence")).toBe(995);
  });
});

// ── PREMIUM_DECISION_ASSETS ───────────────────────────────────────────────────

describe("PREMIUM_DECISION_ASSETS (premium-decision-assets)", () => {
  it("every asset has a catalogCode field", () => {
    for (const asset of PREMIUM_DECISION_ASSETS) {
      expect(
        asset.catalogCode,
        `PREMIUM_DECISION_ASSETS slug "${asset.slug}" is missing catalogCode`,
      ).toBeTruthy();
    }
  });

  it("every asset catalogCode resolves to a real catalog entry", () => {
    for (const asset of PREMIUM_DECISION_ASSETS) {
      const product = CATALOG[asset.catalogCode];
      expect(
        product,
        `Asset "${asset.slug}" catalogCode "${asset.catalogCode}" not found in CATALOG`,
      ).toBeDefined();
    }
  });

  it("does not have a priceGbp field on any entry (prices come from catalog)", () => {
    for (const asset of PREMIUM_DECISION_ASSETS) {
      expect(
        (asset as Record<string, unknown>)["priceGbp"],
        `PREMIUM_DECISION_ASSETS["${asset.slug}"] still has a hardcoded priceGbp field`,
      ).toBeUndefined();
    }
  });

  it("getAssetPriceGbp returns positive number for all assets", () => {
    for (const asset of PREMIUM_DECISION_ASSETS) {
      const price = getAssetPriceGbp(asset);
      expect(price, `getAssetPriceGbp for "${asset.slug}" returned zero/negative`).toBeGreaterThan(0);
    }
  });

  it("getAssetDisplayPrice returns non-empty string for all assets", () => {
    for (const asset of PREMIUM_DECISION_ASSETS) {
      const price = getAssetDisplayPrice(asset);
      expect(price, `getAssetDisplayPrice for "${asset.slug}" returned empty`).toBeTruthy();
      expect(price).toMatch(/^£/);
    }
  });

  it("price parity — asset prices match catalog prices (no stale overrides)", () => {
    const mismatches: string[] = [];
    for (const asset of PREMIUM_DECISION_ASSETS) {
      const catalogAmount = CATALOG[asset.catalogCode]?.amount ?? 0;
      const assetAmount = getAssetPriceGbp(asset) * 100;
      if (catalogAmount !== assetAmount) {
        mismatches.push(
          `"${asset.slug}": catalog £${catalogAmount / 100} vs asset £${assetAmount / 100}`,
        );
      }
    }
    expect(
      mismatches,
      `Price mismatches found:\n${mismatches.join("\n")}`,
    ).toHaveLength(0);
  });
});

// ── Cross-system price consistency ────────────────────────────────────────────

describe("cross-system instrument price consistency", () => {
  const INSTRUMENT_SLUG_TO_CATALOG: Record<string, string> = {
    "decision-exposure-instrument": "decision_exposure_instrument",
    "mandate-clarity-framework": "mandate_clarity_framework",
    "intervention-path-selector": "intervention_path_selector",
    "escalation-readiness-scorecard": "escalation_readiness_scorecard",
    "structural-failure-diagnostic-canvas": "structural_failure_diagnostic_canvas",
    "execution-risk-index": "execution_risk_index",
    "team-alignment-gap-map": "team_alignment_gap_map",
    "governance-drift-detector": "governance_drift_detector",
    "strategic-priority-stack-builder": "strategic_priority_stack_builder",
    "board-brief-builder": "board_brief_builder",
  };

  it("INSTRUMENT_REGISTRY catalogCodes match bridge mapping", () => {
    for (const [slug, entry] of Object.entries(INSTRUMENT_REGISTRY)) {
      const expectedCode = INSTRUMENT_SLUG_TO_CATALOG[slug];
      if (expectedCode) {
        expect(entry.catalogCode).toBe(expectedCode);
      }
    }
  });

  it("getInstrumentPrice matches catalog displayPrice for all instruments", () => {
    for (const slug of INSTRUMENT_SLUGS) {
      const priceFromGetter = getInstrumentPrice(slug);
      const catalogCode = INSTRUMENT_SLUG_TO_CATALOG[slug];
      if (catalogCode && CATALOG[catalogCode]) {
        const catalogPrice = CATALOG[catalogCode]!.displayPrice;
        expect(priceFromGetter, `Price mismatch for "${slug}"`).toBe(catalogPrice);
      }
    }
  });
});
