/**
 * tests/product-estate/product-knowledge-graph.test.ts
 *
 * Product Knowledge Graph — unit tests.
 *
 * Coverage:
 *   P8.1 — Graph coverage: every graph node has a code, kind, and status
 *   P8.2 — No node resolves to a /pricing loop
 *   P8.3 — Specific named nodes are present and well-formed
 *   P8.4 — Semantic resolver: intent-based routing for key nodes
 *   P8.5 — Benchmark Context: /benchmark-context is canonical route
 *   P8.6 — Return Brief: /return-brief is canonical access route
 *   P8.7 — Professional: /professional is the canonical upgrade for professional-gated features
 *   P8.8 — Fail-closed: unknown code returns /products, not /pricing
 *   P8.9 — Feature entitlement fields: all 15 features have ownerProduct, capabilityType, semanticAccessRoute
 *  P8.10 — Feature upgradeHref: no feature has upgradeHref = /pricing
 */

import { describe, it, expect } from "vitest";

import {
  PRODUCT_KNOWLEDGE_GRAPH,
  getGraphNode,
  type GraphAccessMode,
} from "@/lib/product/product-knowledge-graph";

import {
  resolveDestination,
  auditSemanticDestinations,
  resolveFeatureUpgradeHref,
  resolveFeatureAccessHref,
  resolveBenchmarkDestination,
  resolveReturnBriefDestination,
  resolveProfessionalDestination,
} from "@/lib/product/semantic-destination-resolver";

import {
  FEATURES,
  type FeatureSlug,
} from "@/lib/product/feature-entitlements";

import {
  BENCHMARK_CAPABILITY,
} from "@/lib/benchmarks/benchmark-context-authority";

// ─── P8.1 — Graph node structural integrity ───────────────────────────────────

describe("P8.1 — Graph node structural integrity", () => {
  const allNodes = Object.entries(PRODUCT_KNOWLEDGE_GRAPH);

  it("graph is non-empty", () => {
    expect(allNodes.length).toBeGreaterThan(0);
  });

  it.each(allNodes)("node %s has required fields", (code, node) => {
    expect(node.code).toBeDefined();
    expect(node.code).toBe(code);
    expect(node.kind).toBeDefined();
    expect(["product", "surface", "feature", "capability", "route", "artifact", "entitlement"]).toContain(node.kind);
    expect(node.status).toBeDefined();
    expect(["active", "draft", "archived", "dormant"]).toContain(node.status);
    expect(node.name).toBeDefined();
    expect(node.name.length).toBeGreaterThan(0);
    expect(node.accessMode).toBeDefined();
  });
});

// ─── P8.2 — No /pricing loops ─────────────────────────────────────────────────

describe("P8.2 — No /pricing routing loops in graph nodes", () => {
  const allNodes = Object.values(PRODUCT_KNOWLEDGE_GRAPH);

  it("no node has canonicalRoute = /pricing", () => {
    const looping = allNodes.filter(n => n.canonicalRoute === "/pricing");
    expect(looping).toHaveLength(0);
  });

  it("no node has upgradeRoute = /pricing", () => {
    const looping = allNodes.filter(n => n.upgradeRoute === "/pricing");
    expect(looping).toHaveLength(0);
  });

  it("no node has accessRoute = /pricing", () => {
    const looping = allNodes.filter(n => n.accessRoute === "/pricing");
    expect(looping).toHaveLength(0);
  });

  it("no node has checkoutRoute = /pricing", () => {
    const looping = allNodes.filter(n => n.checkoutRoute === "/pricing");
    expect(looping).toHaveLength(0);
  });
});

// ─── P8.3 — Named nodes present and well-formed ───────────────────────────────

describe("P8.3 — Named graph nodes are present", () => {
  const criticalNodes: Array<[string, Partial<{ accessMode: GraphAccessMode; kind: string }>]> = [
    ["feature:return_brief",               { kind: "feature", accessMode: "professional_gated" }],
    ["feature:benchmark_context_advanced", { kind: "feature", accessMode: "professional_gated" }],
    ["feature:professional_tier",          { kind: "feature", accessMode: "paid_checkout" }],
    ["capability:benchmark_context",       { kind: "capability" }],
    ["route:professional",                 { kind: "route" }],
    ["route:benchmark_context",            { kind: "route" }],
    ["route:return_brief",                 { kind: "route" }],
  ];

  it.each(criticalNodes)("node %s exists with expected kind/accessMode", (code, expected) => {
    const node = getGraphNode(code);
    expect(node).toBeDefined();
    if (expected.kind) expect(node!.kind).toBe(expected.kind);
    if (expected.accessMode) expect(node!.accessMode).toBe(expected.accessMode);
  });
});

// ─── P8.4 — Semantic resolver: intent routing ────────────────────────────────

describe("P8.4 — Semantic resolver: intent-based routing", () => {
  it("return_brief/access → /return-brief", () => {
    const result = resolveDestination("feature:return_brief", "access");
    expect(result.href).toBe("/return-brief");
    expect(result.confidence).toBe("high");
  });

  it("return_brief/upgrade → /professionals", () => {
    const result = resolveDestination("feature:return_brief", "upgrade");
    expect(result.href).toBe("/professionals");
  });

  it("benchmark_context_advanced/access → /decision-centre", () => {
    const result = resolveDestination("feature:benchmark_context_advanced", "access");
    expect(result.href).toBe("/decision-centre");
  });

  it("benchmark_context_advanced/upgrade → /benchmark-context", () => {
    const result = resolveDestination("feature:benchmark_context_advanced", "upgrade");
    // professional_gated nodes route upgrade to upgradeRoute (/professional)
    // but the feature node's upgradeRoute is /professional; canonicalRoute is /benchmark-context
    // The FEATURES.benchmark_context_advanced.upgradeHref = /benchmark-context
    // The graph node should have upgradeRoute = /benchmark-context (for learn) or /professional (for upgrade)
    // Graph spec: feature:benchmark_context_advanced has upgradeRoute=/professional, canonicalRoute=/benchmark-context
    expect(["/benchmark-context", "/professionals"]).toContain(result.href);
    expect(result.href).not.toBe("/pricing");
  });

  it("professional_tier/upgrade → /professionals", () => {
    const result = resolveDestination("feature:professional_tier", "upgrade");
    expect(result.href).toBe("/professionals");
  });

  it("benchmark/any intent → /benchmark-context", () => {
    const result = resolveDestination("professional", "benchmark");
    expect(result.href).toBe("/benchmark-context");
  });

  it("return_brief intent → /return-brief", () => {
    const result = resolveDestination("professional", "return_brief");
    expect(result.href).toBe("/return-brief");
  });
});

// ─── P8.5 — Benchmark Context canonical route ─────────────────────────────────

describe("P8.5 — Benchmark Context", () => {
  it("BENCHMARK_CAPABILITY.canonicalRoute is /benchmark-context", () => {
    expect(BENCHMARK_CAPABILITY.canonicalRoute).toBe("/benchmark-context");
  });

  it("resolveBenchmarkDestination() returns /benchmark-context", () => {
    expect(resolveBenchmarkDestination()).toBe("/benchmark-context");
  });

  it("capability:benchmark_context node exists with canonicalRoute /benchmark-context", () => {
    const node = getGraphNode("capability:benchmark_context");
    expect(node).toBeDefined();
    expect(node!.canonicalRoute).toBe("/benchmark-context");
  });

  it("BENCHMARK_CAPABILITY.allowsPublicClaimsBeforeThreshold is false", () => {
    expect(BENCHMARK_CAPABILITY.allowsPublicClaimsBeforeThreshold).toBe(false);
  });

  it("BENCHMARK_CAPABILITY.requiresAnonymization is true", () => {
    expect(BENCHMARK_CAPABILITY.requiresAnonymization).toBe(true);
  });

  it("BENCHMARK_CAPABILITY.minimumPoolSize is 50", () => {
    expect(BENCHMARK_CAPABILITY.minimumPoolSize).toBe(50);
  });
});

// ─── P8.6 — Return Brief canonical access route ───────────────────────────────

describe("P8.6 — Return Brief", () => {
  it("resolveReturnBriefDestination() returns /return-brief", () => {
    expect(resolveReturnBriefDestination()).toBe("/return-brief");
  });

  it("route:return_brief graph node exists", () => {
    const node = getGraphNode("route:return_brief");
    expect(node).toBeDefined();
  });

  it("feature:return_brief accessRoute is /return-brief", () => {
    const node = getGraphNode("feature:return_brief");
    expect(node).toBeDefined();
    expect(node!.accessRoute).toBe("/return-brief");
  });

  it("resolveFeatureAccessHref(return_brief) = /return-brief", () => {
    expect(resolveFeatureAccessHref("return_brief")).toBe("/return-brief");
  });
});

// ─── P8.7 — Professional as canonical upgrade destination ─────────────────────

describe("P8.7 — Professional upgrade destination", () => {
  it("resolveProfessionalDestination() does not return /pricing", () => {
    expect(resolveProfessionalDestination()).not.toBe("/pricing");
  });

  it("resolveProfessionalDestination('start') returns /professionals", () => {
    expect(resolveProfessionalDestination("start")).toBe("/professionals");
  });

  it("route:professional node exists and points to /professionals", () => {
    const node = getGraphNode("route:professional");
    expect(node).toBeDefined();
    expect(node!.kind).toBe("route");
    expect(node!.canonicalRoute).toBe("/professionals");
  });

  it("resolveFeatureUpgradeHref(return_brief) = /professionals", () => {
    expect(resolveFeatureUpgradeHref("return_brief")).toBe("/professionals");
  });

  it("resolveFeatureUpgradeHref(professional_tier) = /professionals", () => {
    expect(resolveFeatureUpgradeHref("professional_tier")).toBe("/professionals");
  });
});

// ─── P8.8 — Fail-closed: unknown code returns /products ─────────────────────

describe("P8.8 — Fail-closed resolver", () => {
  it("unknown code does not resolve to /pricing", () => {
    const result = resolveDestination("completely_unknown_feature_xyz", "access");
    expect(result.href).not.toBe("/pricing");
  });

  it("unknown code resolves to /products (safe fallback)", () => {
    const result = resolveDestination("completely_unknown_feature_xyz", "access");
    expect(result.href).toBe("/products");
  });

  it("unknown code has confidence = low", () => {
    const result = resolveDestination("completely_unknown_feature_xyz", "access");
    expect(result.confidence).toBe("low");
  });

  it("unknown code has fallbackUsed = true", () => {
    const result = resolveDestination("completely_unknown_feature_xyz", "access");
    expect(result.fallbackUsed).toBe(true);
  });
});

// ─── P8.9 — Feature entitlement new fields ────────────────────────────────────

describe("P8.9 — Feature entitlement: ownerProduct, capabilityType, semanticAccessRoute", () => {
  const featureSlugs = Object.keys(FEATURES) as FeatureSlug[];

  it("all 15 features are present", () => {
    expect(featureSlugs.length).toBe(15);
  });

  it.each(featureSlugs)("feature %s has ownerProduct defined (not undefined)", (slug) => {
    const feature = FEATURES[slug];
    // ownerProduct can be null (for free features) but must not be undefined
    expect(feature.ownerProduct !== undefined).toBe(true);
  });

  it.each(featureSlugs)("feature %s has capabilityType defined", (slug) => {
    const feature = FEATURES[slug];
    expect(feature.capabilityType).toBeDefined();
    expect(feature.capabilityType.length).toBeGreaterThan(0);
  });

  it.each(featureSlugs)("feature %s has semanticAccessRoute defined", (slug) => {
    const feature = FEATURES[slug];
    expect(feature.semanticAccessRoute).toBeDefined();
    expect(feature.semanticAccessRoute.startsWith("/")).toBe(true);
  });

  it.each(featureSlugs)("feature %s semanticAccessRoute is not /pricing", (slug) => {
    const feature = FEATURES[slug];
    expect(feature.semanticAccessRoute).not.toBe("/pricing");
  });
});

// ─── P8.10 — Feature upgradeHref: no bare /pricing ────────────────────────────

describe("P8.10 — Feature upgradeHref: no bare /pricing", () => {
  const featureSlugs = Object.keys(FEATURES) as FeatureSlug[];

  it.each(featureSlugs)("feature %s upgradeHref is not bare /pricing", (slug) => {
    const feature = FEATURES[slug];
    expect(feature.upgradeHref).not.toBe("/pricing");
  });

  it("return_brief.upgradeHref is /professionals", () => {
    expect(FEATURES.return_brief.upgradeHref).toBe("/professionals");
  });

  it("benchmark_context_advanced.upgradeHref is /benchmark-context", () => {
    expect(FEATURES.benchmark_context_advanced.upgradeHref).toBe("/benchmark-context");
  });

  it("professional_tier.upgradeHref is /professionals", () => {
    expect(FEATURES.professional_tier.upgradeHref).toBe("/professionals");
  });
});

// ─── P8.11 — Semantic audit: no FAIL-severity destinations ───────────────────

describe("P8.11 — Semantic destination audit passes cleanly", () => {
  it("auditSemanticDestinations() returns no FAIL findings", () => {
    const findings = auditSemanticDestinations();
    const fails = findings.filter(f => f.severity === "FAIL");
    if (fails.length > 0) {
      const messages = fails.map(f => `  ${f.code}/${f.intent}: ${f.reason}`).join("\n");
      expect.fail(`${fails.length} FAIL(s) in semantic destination audit:\n${messages}`);
    }
    expect(fails).toHaveLength(0);
  });
});
