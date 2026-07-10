#!/usr/bin/env node
/**
 * scripts/_authority-runtime-crawl.mjs
 *
 * One-off representative server crawl for the authority closure pass.
 * Hits a fixed set of routes against a running `next start` server and
 * reports HTTP status, route class, forbidden-vocabulary count, and
 * forbidden-identifier count per route.
 *
 * Not a permanent gate (that's authority-dom-vocabulary-scan.mjs --built,
 * which already covers this systematically over all built HTML). This is
 * the specific representative-route proof requested for this closure pass.
 */
const BASE = process.env.CRAWL_BASE || "http://localhost:3000";

const FORBIDDEN_VOCAB = [
  "Missing evidence ledger entry",
  "product_evidence_object",
  "evidence_ledger_inventory_record",
  "generic_ai_comparison_source",
  "market_comparison_source",
  "anti_toy_validation",
  "red_team_validation",
  "Full validation chain not complete",
  "Canonical evidence location",
  "Legacy Authority",
  "v2 revalidation",
  "legacy_validated_pending_v2_revalidation",
  "blockingReasons",
];

const FORBIDDEN_IDENTIFIERS = [
  "ProductAuthorityPanel",
  "ProductAuthorityNotice",
  "ProductAuthorityBadge",
  "ProductAuthorityWrapper",
  "ProductEvidenceStatus",
  "resolveProductAuthority",
  "lib/product/product-authority-contract",
  "lib/product/resolve-product-authority",
];

const ROUTES = [
  { path: "/enterprise-decision-scan", class: "PUBLIC_CUSTOMER", note: "the screenshot route" },
  { path: "/registry/index", class: "PUBLIC_CUSTOMER (App Router)", note: "app router public page (DB-backed; 500 expected without local DATABASE_URL, checked for clean error body)" },
  { path: "/artifacts/global-market-outlook-q1-2026-public", class: "PUBLIC_CUSTOMER (SSR)", note: "getServerSideProps public page; follows canonical redirect to destination" },
  { path: "/report/CRAWL-TEST-FIXTURE", class: "CONTROLLED_CUSTOMER", note: "report/[reportId] with synthetic fixture id (client-fetched, unauthenticated)" },
  { path: "/decision-instruments/decision-exposure-instrument/run", class: "CONTROLLED_CUSTOMER", note: "instrument run page, unauthenticated" },
  { path: "/intelligence/gmi/red-team", class: "PUBLIC_ACCOUNTABILITY", note: "fixed allowlist route" },
];

function count(haystack, needle) {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

async function crawl(route) {
  const url = BASE + route.path;
  let status = null;
  let text = "";
  let error = null;
  let finalUrl = url;
  try {
    const res = await fetch(url, { redirect: "follow" });
    status = res.status;
    finalUrl = res.url;
    text = await res.text();
  } catch (e) {
    error = e.message;
  }

  const vocabHits = FORBIDDEN_VOCAB
    .map((v) => ({ term: v, n: count(text, v) }))
    .filter((h) => h.n > 0);
  const idHits = FORBIDDEN_IDENTIFIERS
    .map((v) => ({ term: v, n: count(text, v) }))
    .filter((h) => h.n > 0);

  const vocabCount = vocabHits.reduce((a, h) => a + h.n, 0);
  const idCount = idHits.reduce((a, h) => a + h.n, 0);

  const pass = error === null && status !== null && status < 500 && vocabCount === 0 && idCount === 0;

  return {
    ...route,
    url,
    finalUrl,
    status,
    error,
    vocabCount,
    idCount,
    vocabHits,
    idHits,
    pass,
  };
}

async function main() {
  console.log("── Authority Runtime Crawl ──");
  console.log(`base: ${BASE}\n`);

  const results = [];
  for (const route of ROUTES) {
    results.push(await crawl(route));
  }

  console.log("route | class | http status | final url (if redirected) | forbidden vocab | forbidden ids | result");
  for (const r of results) {
    const redirected = r.finalUrl && r.finalUrl !== r.url ? r.finalUrl.replace(BASE, "") : "-";
    console.log(
      `${r.path} | ${r.class} | ${r.status ?? "ERROR: " + r.error} | ${redirected} | ${r.vocabCount} | ${r.idCount} | ${r.pass ? "PASS" : "FAIL"}`,
    );
    if (r.vocabHits.length > 0) {
      for (const h of r.vocabHits) console.log(`    vocab leak: "${h.term}" x${h.n}`);
    }
    if (r.idHits.length > 0) {
      for (const h of r.idHits) console.log(`    identifier leak: "${h.term}" x${h.n}`);
    }
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} routes PASS`);
  if (failed.length > 0) {
    console.error(`${failed.length} route(s) FAILED.`);
    process.exit(1);
  }
  process.exit(0);
}

main();
