#!/usr/bin/env node
/**
 * Product Estate Smoke Probe
 *
 * Read-only HTTP smoke test for public/API/admin surfaces. This script does not
 * POST, authenticate, or mutate state.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const audit = JSON.parse(readFileSync(join(ROOT, "lib/product/product-estate-reality-audit.json"), "utf-8"));
const JSON_MODE = process.argv.includes("--json");

function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

const baseUrl = argValue("--base-url", process.env.TARGET_URL ?? "http://localhost:3000").replace(/\/$/, "");

function normalizeSmokeRoute(route) {
  if (!route || route.includes("*")) return null;
  return route
    .replace(/\[slug\]/g, "sample")
    .replace(/\[id\]/g, "sample")
    .replace(/\[cycleId\]/g, "sample")
    .replace(/\[...slug\]/g, "sample");
}

function expectedStatusFor(route) {
  if (route.startsWith("/admin") || route.startsWith("/api/admin")) return "BLOCKED_BY_AUTH_EXPECTED";
  return "PASS";
}

async function probe(route, productCode, surface) {
  const normalized = normalizeSmokeRoute(route);
  if (!normalized) {
    return { productCode, surface, route, status: "NEEDS_MANUAL_CHECK", reason: "wildcard or unsupported dynamic route" };
  }
  const url = `${baseUrl}${normalized}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { method: "GET", redirect: "manual", signal: controller.signal });
    const contentType = response.headers.get("content-type") ?? "";
    clearTimeout(timeout);
    if (response.status >= 200 && response.status < 300) {
      return { productCode, surface, route, url, status: "PASS", httpStatus: response.status, contentType };
    }
    if ([301, 302, 303, 307, 308, 401, 403].includes(response.status) && expectedStatusFor(route) === "BLOCKED_BY_AUTH_EXPECTED") {
      return { productCode, surface, route, url, status: "BLOCKED_BY_AUTH_EXPECTED", httpStatus: response.status, contentType };
    }
    if ([400, 405].includes(response.status) && surface === "api") {
      return { productCode, surface, route, url, status: "NEEDS_MANUAL_CHECK", httpStatus: response.status, contentType, reason: "GET reached route but API requires method/body/auth context" };
    }
    if (response.status === 404 && surface === "api") {
      return { productCode, surface, route, url, status: "NEEDS_MANUAL_CHECK", httpStatus: response.status, contentType, reason: "API route may require a valid slug/query fixture for smoke" };
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      return { productCode, surface, route, url, status: "NEEDS_MANUAL_CHECK", httpStatus: response.status, location: response.headers.get("location") };
    }
    return { productCode, surface, route, url, status: "FAIL", httpStatus: response.status, contentType };
  } catch (err) {
    clearTimeout(timeout);
    return { productCode, surface, route, url, status: "NEEDS_MANUAL_CHECK", reason: err.message };
  }
}

const probes = [];
for (const product of audit.products) {
  probes.push(probe(product.route, product.productCode, "public"));
  for (const route of product.apiRoutes ?? []) probes.push(probe(route, product.productCode, "api"));
  for (const route of product.adminRoutes ?? []) probes.push(probe(route, product.productCode, "admin"));
}

const results = await Promise.all(probes);
const summary = {
  baseUrl,
  generatedAt: new Date().toISOString(),
  pass: results.filter((r) => r.status === "PASS").length,
  fail: results.filter((r) => r.status === "FAIL").length,
  blockedByAuthExpected: results.filter((r) => r.status === "BLOCKED_BY_AUTH_EXPECTED").length,
  needsManualCheck: results.filter((r) => r.status === "NEEDS_MANUAL_CHECK").length,
};

if (JSON_MODE) {
  console.log(JSON.stringify({ summary, results }, null, 2));
} else {
  console.log("Product Estate Smoke Probe");
  console.log(`Base URL: ${summary.baseUrl}`);
  console.log(`PASS ${summary.pass} | FAIL ${summary.fail} | AUTH ${summary.blockedByAuthExpected} | MANUAL ${summary.needsManualCheck}`);
  console.log("");
  for (const result of results) {
    const detail = result.httpStatus ? `HTTP ${result.httpStatus}` : result.reason ?? "";
    console.log(`${result.status.padEnd(24)} ${result.productCode.padEnd(32)} ${result.surface.padEnd(7)} ${result.route} ${detail}`);
  }
}
