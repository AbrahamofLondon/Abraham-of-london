import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

import { scanPublicPdfAssets, writeJsonReport } from "./pdf-audit-shared";

type Finding = {
  rule: string;
  severity: "fail";
  message: string;
};

function readJson<T>(relativePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")) as T;
  } catch {
    return null;
  }
}

function gitShow(pathname: string): string | null {
  try {
    return execFileSync("git", ["show", `HEAD:${pathname}`], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

function stripGeneratedAt(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripGeneratedAt);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "generatedAt")
      .map(([key, entry]) => [key, stripGeneratedAt(entry)]),
  );
}

function reportChangedSubstantively(pathname: string): boolean {
  const current = fs.existsSync(path.join(process.cwd(), pathname))
    ? fs.readFileSync(path.join(process.cwd(), pathname), "utf8")
    : null;
  const baseline = gitShow(pathname);

  if (!current || !baseline) return false;

  try {
    return JSON.stringify(stripGeneratedAt(JSON.parse(current))) !==
      JSON.stringify(stripGeneratedAt(JSON.parse(baseline)));
  } catch {
    return current !== baseline;
  }
}

const findings: Finding[] = [];

function readText(relativePath: string): string {
  const abs = path.join(process.cwd(), relativePath);
  return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
}

function requireFile(relativePath: string, rule: string): string {
  const text = readText(relativePath);
  if (!text) {
    findings.push({
      rule,
      severity: "fail",
      message: `Missing required monetisation infrastructure file: ${relativePath}.`,
    });
  }
  return text;
}

function walkFiles(dir: string, extensions: Set<string>): string[] {
  const abs = path.join(process.cwd(), dir);
  if (!fs.existsSync(abs)) return [];

  const files: string[] = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const child = path.join(abs, entry.name);
    const rel = path.relative(process.cwd(), child).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      files.push(...walkFiles(rel, extensions));
    } else if (extensions.has(path.extname(entry.name))) {
      files.push(rel);
    }
  }
  return files;
}

function assertIncludes(text: string, needle: string, rule: string, file: string): void {
  if (!text.includes(needle)) {
    findings.push({
      rule,
      severity: "fail",
      message: `${file} must include ${needle}.`,
    });
  }
}

const accessPolicy = requireFile("lib/assets/pdf-access.ts", "pdf_access_policy_exists");
assertIncludes(accessPolicy, "canAccessPdfAsset", "pdf_access_policy_exported", "lib/assets/pdf-access.ts");
assertIncludes(accessPolicy, "asset.access === \"public\"", "pdf_access_public_enforced", "lib/assets/pdf-access.ts");
assertIncludes(accessPolicy, "asset.access === \"inner_circle\"", "pdf_access_inner_circle_enforced", "lib/assets/pdf-access.ts");
assertIncludes(accessPolicy, "asset.access === \"restricted\"", "pdf_access_restricted_enforced", "lib/assets/pdf-access.ts");
assertIncludes(accessPolicy, "Purchase entitlement required", "pdf_access_paid_enforced", "lib/assets/pdf-access.ts");
assertIncludes(accessPolicy, "hasExplicitPdfEntitlement", "pdf_access_entitlement_override", "lib/assets/pdf-access.ts");

const pricingEngine = requireFile("lib/commercial/pricing-engine.ts", "pricing_engine_exists");
assertIncludes(pricingEngine, "PdfAssetIdentityResolved", "pricing_requires_pdf_identity", "lib/commercial/pricing-engine.ts");
assertIncludes(pricingEngine, "BASE_PRICING", "pricing_base_table_exists", "lib/commercial/pricing-engine.ts");
assertIncludes(pricingEngine, "resolveAssetPricing", "pricing_exported", "lib/commercial/pricing-engine.ts");
assertIncludes(pricingEngine, "hasExplicitPdfEntitlement", "pricing_entitlement_override", "lib/commercial/pricing-engine.ts");

const deliveryEngine = requireFile("lib/assets/pdf-delivery.ts", "delivery_engine_exists");
assertIncludes(deliveryEngine, "PdfAssetIdentityResolved", "delivery_requires_pdf_identity", "lib/assets/pdf-delivery.ts");
assertIncludes(deliveryEngine, "canAccessPdfAsset", "delivery_uses_access_policy", "lib/assets/pdf-delivery.ts");
assertIncludes(deliveryEngine, "resolveAssetPricing", "delivery_uses_pricing_policy", "lib/assets/pdf-delivery.ts");
assertIncludes(deliveryEngine, "mode: \"paid\"", "delivery_paid_mode_exists", "lib/assets/pdf-delivery.ts");
assertIncludes(deliveryEngine, "mode: \"member_only\"", "delivery_member_mode_exists", "lib/assets/pdf-delivery.ts");

const entitlementSystem = requireFile("lib/commercial/entitlements.ts", "entitlement_system_exists");
assertIncludes(entitlementSystem, "getUserEntitlements", "entitlement_get_exported", "lib/commercial/entitlements.ts");
assertIncludes(entitlementSystem, "hasAssetEntitlement", "entitlement_has_exported", "lib/commercial/entitlements.ts");
assertIncludes(entitlementSystem, "grantEntitlement", "entitlement_grant_exported", "lib/commercial/entitlements.ts");

const downloadRoute = requireFile("app/api/downloads/[slug]/route.ts", "controlled_download_route_exists");
assertIncludes(downloadRoute, "getPdfAssetIdentityBySlug", "download_route_resolves_identity", "app/api/downloads/[slug]/route.ts");
assertIncludes(downloadRoute, "resolvePdfDelivery", "download_route_resolves_delivery", "app/api/downloads/[slug]/route.ts");
assertIncludes(downloadRoute, "delivery.allowed", "download_route_enforces_delivery", "app/api/downloads/[slug]/route.ts");

const checkoutRoute = requireFile("app/api/checkout/route.ts", "checkout_route_exists");
assertIncludes(checkoutRoute, "resolveAssetPricing", "checkout_validates_pricing", "app/api/checkout/route.ts");
assertIncludes(checkoutRoute, "grantEntitlement", "checkout_grants_entitlement", "app/api/checkout/route.ts");

const proxySource = readText("proxy.ts");
assertIncludes(proxySource, "/api/downloads/", "static_pdf_proxy_to_controlled_api", "proxy.ts");
if (proxySource.includes("allowedReferrer") || proxySource.includes("downloadToken")) {
  findings.push({
    rule: "static_pdf_no_referrer_or_query_bypass",
    severity: "fail",
    message: "proxy.ts must not allow raw /assets/downloads/*.pdf access through referrer or query-token exceptions.",
  });
}

const sourceFiles = ["app", "pages", "components", "lib"]
  .flatMap((dir) => walkFiles(dir, new Set([".ts", ".tsx", ".js", ".jsx"])))
  .filter((file) => ![
    "lib/assets/pdf-canonical.ts",
    "lib/assets/pdf-identity.ts",
    "lib/config/runtime.ts",
    "lib/pdf/pdf-registry.generated.ts",
  ].includes(file))
  .filter((file) => !/(\.test|\.spec)\.[jt]sx?$/.test(file));

for (const sourceFile of sourceFiles) {
  const text = readText(sourceFile);
  if (/["'`]\/assets\/downloads\/[^"'`]+\.pdf["'`]/i.test(text)) {
    findings.push({
      rule: "no_direct_pdf_asset_links",
      severity: "fail",
      message: `${sourceFile} contains a direct /assets/downloads/*.pdf link; use /api/downloads/{slug}.`,
    });
  }
}

const canonical = readJson<{
  totals?: { unresolved?: number };
  decisions?: Array<{ slug: string; canonicalPath: string; resolved: boolean }>;
}>("reports/pdf-canonical-decisions.json");

if (!canonical) {
  findings.push({ rule: "canonical_report_exists", severity: "fail", message: "Missing reports/pdf-canonical-decisions.json." });
} else {
  const unresolved = Number(canonical.totals?.unresolved || 0);
  if (unresolved > 0) {
    findings.push({ rule: "unresolved_canonical_decisions", severity: "fail", message: `${unresolved} canonical decisions remain unresolved.` });
  }

  for (const decision of canonical.decisions || []) {
    if (!decision.resolved) continue;
    const expected = `/assets/downloads/${decision.slug}.pdf`;
    if (decision.canonicalPath !== expected) {
      findings.push({
        rule: "canonical_path_shape",
        severity: "fail",
        message: `${decision.slug} canonicalPath is ${decision.canonicalPath}; expected ${expected}.`,
      });
    }

    const abs = path.join(process.cwd(), "public", expected.replace(/^\/+/, ""));
    if (!fs.existsSync(abs)) {
      findings.push({
        rule: "canonical_binary_exists",
        severity: "fail",
        message: `${decision.slug} is missing physical canonical binary ${expected}.`,
      });
    }
  }
}

const linkReport = readJson<{ totals?: { rawPdfLinks?: number; rawCanonicalDownloadLinks?: number } }>(
  "reports/pdf-link-verification.json",
);
const rawPdfLinks = Number(linkReport?.totals?.rawPdfLinks || linkReport?.totals?.rawCanonicalDownloadLinks || 0);
if (rawPdfLinks > 0) {
  findings.push({ rule: "no_raw_pdf_links", severity: "fail", message: `${rawPdfLinks} raw PDF links remain in UI/content.` });
}

const activeOutsideCanonical = scanPublicPdfAssets().filter((asset) => {
  if (!asset.publicUrl.endsWith(".pdf")) return false;
  if (/^\/assets\/downloads\/[^/]+\.pdf$/i.test(asset.publicUrl)) return false;
  if (/^\/(vault|resources|prints|lexicon)\//.test(asset.publicUrl)) return false;
  return true;
});

if (activeOutsideCanonical.length > 0) {
  findings.push({
    rule: "active_pdf_outside_canonical_path",
    severity: "fail",
    message: `${activeOutsideCanonical.length} active non-strategic PDFs remain outside /assets/downloads/{slug}.pdf.`,
  });
}

if (process.env.PDF_ACCEPT_REPORT_CHANGES !== "1") {
  const dirtyReports = [
    "reports/pdf-canonical-decisions.json",
    "reports/pdf-asset-registry.json",
    "reports/pdf-duplicate-report.json",
    "reports/pdf-link-verification.json",
  ].filter(reportChangedSubstantively);

  if (dirtyReports.length > 0) {
    findings.push({
      rule: "generated_reports_committed",
      severity: "fail",
      message: `Generated PDF reports changed unexpectedly: ${dirtyReports.join(", ")}.`,
    });
  }
}

const out = writeJsonReport("pdf-enforcement-report.json", {
  generatedAt: new Date().toISOString(),
  totals: {
    failures: findings.length,
  },
  findings,
});

console.log("[pdf:enforce] wrote", path.relative(process.cwd(), out));
console.log("[pdf:enforce] failures", findings.length);

if (findings.length > 0) {
  for (const finding of findings) {
    console.error(`[pdf:enforce] ${finding.rule}: ${finding.message}`);
  }
  process.exit(1);
}
