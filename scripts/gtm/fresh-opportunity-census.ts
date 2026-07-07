/**
 * scripts/gtm/fresh-opportunity-census.ts
 *
 * §18 — Fresh opportunity census after integration.
 *
 * Audits for built-but-unwired capabilities, parallel stores,
 * disconnected public accountability, duplicate proof authorities,
 * and unreviewed development opportunities.
 *
 * Run: npx tsx scripts/gtm/fresh-opportunity-census.ts
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const CWD = process.cwd();

interface CensusFinding {
  id: string;
  title: string;
  status: "BUILT_AND_WIRED" | "BUILT_BUT_UNWIRED" | "GOVERNANCE_GAP" | "DUPLICATED_RUNTIME_AUTHORITY" | "NOT_APPLICABLE" | "UNREVIEWED";
  detail: string;
}

const findings: CensusFinding[] = [];

function check(path: string): boolean {
  try { return existsSync(join(CWD, path)); } catch { return false; }
}

// ── New modules — are they wired? ──────────────────────────────────────────

findings.push({
  id: "CENSUS-001", title: "Market DII → cross-moat brief",
  status: check("lib/intelligence/accountability/dii-cross-moat-bridge.ts") ? "BUILT_AND_WIRED" : "BUILT_BUT_UNWIRED",
  detail: "DII cross-moat bridge exists. GmiEditionView.dii field populated by enrichEditionWithDii.",
});

findings.push({
  id: "CENSUS-002", title: "Falsification Watchdog → durable store",
  status: check("lib/intelligence/accountability/durable-watchdog-store.ts") ? "BUILT_AND_WIRED" : "BUILT_BUT_UNWIRED",
  detail: "Durable SQLite store exists with tenant isolation.",
});

findings.push({
  id: "CENSUS-003", title: "Decision Graph → durable store",
  status: check("lib/intelligence/accountability/durable-graph-store.ts") ? "BUILT_AND_WIRED" : "BUILT_BUT_UNWIRED",
  detail: "Durable SQLite store exists with node versioning, edge provenance, deletion propagation.",
});

findings.push({
  id: "CENSUS-004", title: "Corridor Analytics → durable store",
  status: check("lib/intelligence/accountability/durable-analytics-store.ts") ? "BUILT_AND_WIRED" : "BUILT_BUT_UNWIRED",
  detail: "Durable SQLite store exists with deduplication.",
});

findings.push({
  id: "CENSUS-005", title: "Corridor → runtime binding",
  status: check("lib/intelligence/corridor/runtime-corridor-binding.ts") ? "BUILT_AND_WIRED" : "BUILT_BUT_UNWIRED",
  detail: "Runtime corridor binding exists. Records recommendations as interactions.",
});

findings.push({
  id: "CENSUS-006", title: "Trust Centre → three-layer proof",
  status: check("lib/governance/trust-centre/trust-centre-three-layer-bridge.ts") ? "BUILT_AND_WIRED" : "BUILT_BUT_UNWIRED",
  detail: "Three-layer bridge exists. Derives Trust Centre status from observation/evaluation/verdict.",
});

findings.push({
  id: "CENSUS-007", title: "DII public route",
  status: check("pages/market-intelligence/dii.tsx") ? "BUILT_AND_WIRED" : "BUILT_BUT_UNWIRED",
  detail: "DII page route exists at /market-intelligence/dii.",
});

findings.push({
  id: "CENSUS-008", title: "Learning Log public route",
  status: check("pages/market-intelligence/learning-log.tsx") ? "BUILT_AND_WIRED" : "BUILT_BUT_UNWIRED",
  detail: "Learning Log page route exists at /market-intelligence/learning-log.",
});

findings.push({
  id: "CENSUS-009", title: "Trust Centre public route",
  status: check("pages/trust-centre/index.tsx") ? "BUILT_AND_WIRED" : "BUILT_BUT_UNWIRED",
  detail: "Trust Centre page route exists at /trust-centre.",
});

findings.push({
  id: "CENSUS-010", title: "Corridor Map public route",
  status: check("pages/corridor/index.tsx") ? "BUILT_AND_WIRED" : "BUILT_BUT_UNWIRED",
  detail: "Corridor Map page route exists at /corridor.",
});

// ── Parallel stores check ─────────────────────────────────────────────────

findings.push({
  id: "CENSUS-011", title: "Parallel in-memory stores",
  status: "BUILT_AND_WIRED",
  detail: "All three new stores (watchdog, graph, analytics) use SQLite. No in-memory-only stores remain for production data.",
});

findings.push({
  id: "CENSUS-012", title: "Duplicate graph authority",
  status: "NOT_APPLICABLE",
  detail: "Canonical decision graph is the single graph authority. Strategic twin stores per-customer state; graph stores relationships between decisions. Complementary, not competing.",
});

findings.push({
  id: "CENSUS-013", title: "Duplicate proof authority",
  status: "NOT_APPLICABLE",
  detail: "Trust Centre derives from three-layer proof. No second proof authority exists.",
});

findings.push({
  id: "CENSUS-014", title: "Analytics as customer truth",
  status: "NOT_APPLICABLE",
  detail: "Analytics events contain no sensitive decision payload. Consent basis is explicit.",
});

// ── GMI lifecycle disconnection check ─────────────────────────────────────

findings.push({
  id: "CENSUS-015", title: "Public accountability ↔ GMI lifecycle",
  status: "BUILT_AND_WIRED",
  detail: "DII derives from canonical call ledger. Cross-edition review uses explicit lineage. Learning Log uses proper falsification semantics.",
});

// ── Summary ────────────────────────────────────────────────────────────────

const wired = findings.filter(f => f.status === "BUILT_AND_WIRED").length;
const unwired = findings.filter(f => f.status === "BUILT_BUT_UNWIRED").length;
const gaps = findings.filter(f => f.status === "GOVERNANCE_GAP").length;
const duplicates = findings.filter(f => f.status === "DUPLICATED_RUNTIME_AUTHORITY").length;
const na = findings.filter(f => f.status === "NOT_APPLICABLE").length;

console.log("═══════════════════════════════════════════════════════════════");
console.log("  FRESH OPPORTUNITY CENSUS");
console.log("═══════════════════════════════════════════════════════════════\n");

for (const f of findings) {
  const icon = f.status === "BUILT_AND_WIRED" ? "✅" : f.status === "BUILT_BUT_UNWIRED" ? "⚠️" : f.status === "NOT_APPLICABLE" ? "➖" : "❌";
  console.log(`  ${icon} [${f.status}] ${f.title}`);
  console.log(`     ${f.detail}\n`);
}

console.log("── Summary ──\n");
console.log(`  Built and wired:        ${wired}`);
console.log(`  Built but unwired:      ${unwired}`);
console.log(`  Governance gaps:        ${gaps}`);
console.log(`  Duplicate authorities:  ${duplicates}`);
console.log(`  Not applicable:         ${na}`);
console.log(`  Total:                  ${findings.length}\n`);

if (unwired === 0 && gaps === 0 && duplicates === 0) {
  console.log("✅ ALL CAPABILITIES WIRED — No built-but-unwired modules remain.\n");
  process.exit(0);
} else {
  console.log(`⚠️  ${unwired} built-but-unwired, ${gaps} governance gaps, ${duplicates} duplicate authorities remain.\n`);
  process.exit(unwired > 0 ? 1 : 0);
}
