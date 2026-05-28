import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, "reports");
const DOC_PATH = path.join(ROOT, "docs", "architecture", "institutional-operating-alignment-audit.md");

const SURFACE_ROOTS = [
  "app",
  "pages",
  "components/admin",
  "components/diagnostics",
  "components/reporting",
  "components/outbound",
  "lib/platform",
  "lib/research",
  "lib/commercial",
  "lib/outbound",
  "lib/boardroom",
  "lib/decision",
  "lib/diagnostics",
  "lib/auth",
];

const REGISTRY_FILES = [
  "lib/platform/product-ladder-registry.ts",
  "lib/platform/canonical-record-registry.ts",
  "lib/platform/admin-domain-registry.ts",
  "lib/platform/operating-spine-registry.ts",
  "lib/platform/route-deployment-registry.ts",
  "lib/platform/governance-event-types.ts",
  "lib/research/foundry-rule-registry.ts",
  "lib/research/fixture-registry.ts",
  "lib/research/module-registry.ts",
  "lib/research/engine-registry.ts",
  "lib/research/adapter-registry.ts",
];

const PRODUCT_SURFACES = [
  { name: "Fast Diagnostic", routes: ["/diagnostics/fast", "/api/diagnostics", "/api/assessments"] },
  { name: "Purpose Alignment", routes: ["/purpose-alignment", "/api/purpose-alignment"] },
  { name: "Constitutional Diagnostic", routes: ["/constitutional", "/api/constitutional"] },
  { name: "Team Assessment", routes: ["/team-assessment", "/api/team-assessment", "/api/assessments/team"] },
  { name: "Enterprise Decision Authority", routes: ["/enterprise-decision-authority", "/api/alignment/enterprise", "/api/assessments/enterprise"] },
  { name: "Executive Reporting", routes: ["/admin/reporting", "/api/executive-reporting"] },
  { name: "Decision Centre", routes: ["/decision-centre", "/api/decision-centre", "/api/decision"] },
  { name: "Strategy Room", routes: ["/strategy-room", "/api/strategy-room"] },
  { name: "Boardroom Delivery", routes: ["/boardroom", "/api/boardroom", "/admin/boardroom-delivery"] },
  { name: "Downloads/Vault", routes: ["/downloads", "/downloads/vault", "/api/private/vault", "/api/downloads"] },
  { name: "Global Market Intelligence", routes: ["/intelligence/market", "/api/admin/intelligence/gmi"] },
  { name: "Outbound Publishing", routes: ["/admin/outbound", "/admin/intelligence-foundry/outbound", "/api/admin/outbound"] },
  { name: "Content/Editorial Publishing", routes: ["/admin/content", "/api/editorials", "/api/content"] },
  { name: "Foundry ResearchRun", routes: ["/admin/intelligence-foundry", "/api/admin/intelligence-foundry"] },
  { name: "Product Health Dashboard", routes: ["/admin/intelligence-foundry/product-health", "/api/admin/intelligence-foundry/product-health"] },
];

const OWNER_RULES = [
  [/intelligence-foundry|research|foundry|fixture|engine|adapter/i, "Foundry"],
  [/admin|operator|governance|audit/i, "Admin/Governance"],
  [/outbound|linkedin|facebook|x\/|publish|scheduler/i, "Outbound"],
  [/stripe|checkout|billing|commercial|catalog|entitlement|payment/i, "Commercial"],
  [/boardroom|dossier/i, "Boardroom"],
  [/diagnostic|assessment|purpose|constitutional|team-assessment|enterprise/i, "Diagnostics"],
  [/strategy-room|decision-centre|decision/i, "Decision/Strategy"],
  [/download|vault|library|access/i, "Delivery/Vault"],
  [/auth|login|session|token/i, "Auth"],
  [/blog|canon|brief|book|content|editorial|short|resource|print/i, "Content"],
];

const STATUS_WORDS = ["LIVE", "READY", "PRODUCTION", "DELIVERED", "PUBLISHED", "GREEN", "COMPLETE", "APPROVED"];

function ensureDirs() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(DOC_PATH), { recursive: true });
}

function read(rel) {
  try {
    return fs.readFileSync(path.join(ROOT, rel), "utf8");
  } catch {
    return "";
  }
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function inheritedLayoutSource(file) {
  if (!file.startsWith("app/")) return "";
  const parts = file.split("/");
  const chunks = [];
  for (let i = parts.length - 2; i >= 1; i--) {
    const layout = `${parts.slice(0, i + 1).join("/")}/layout.tsx`;
    if (exists(layout)) chunks.push(read(layout));
  }
  if (exists("app/layout.tsx")) chunks.push(read("app/layout.tsx"));
  return chunks.join("\n");
}

function isDevOnly404(source) {
  return (/(NODE_ENV|nodeEnv)\s*!==\s*["']development["']/.test(source) || /(NODE_ENV|nodeEnv)\s*===\s*["']production["']/.test(source)) &&
    /(status\(\s*404\s*\)|notFound:\s*true|Not found)/i.test(source);
}

function isRetiredNoop(source) {
  return /(Endpoint retired|status\(\s*410\s*\)|return\s+NextResponse\.json\(\s*\{[^}]*Not found)/i.test(source);
}

function walk(dirRel) {
  const dir = path.join(ROOT, dirRel);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
    const rel = path.join(dirRel, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) out.push(...walk(rel));
    else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

function allFiles() {
  return Array.from(new Set(SURFACE_ROOTS.flatMap(walk))).sort();
}

function routeFromFile(file) {
  const extless = file.replace(/\.(tsx?|jsx?|mjs|cjs)$/, "");
  if (file.startsWith("app/")) {
    if (!/(\/page|\/route)$/.test(extless)) return null;
    const route = extless
      .replace(/^app/, "")
      .replace(/\/(page|route)$/, "")
      .replace(/\/index$/, "") || "/";
    return route.replace(/\[(\.\.\.)?([^\]]+)\]/g, (_, dots, name) => dots ? `[...${name}]` : `[${name}]`);
  }
  if (file.startsWith("pages/api/")) {
    const route = extless.replace(/^pages/, "").replace(/\/index$/, "") || "/";
    return route.replace(/\[(\.\.\.)?([^\]]+)\]/g, (_, dots, name) => dots ? `[...${name}]` : `[${name}]`);
  }
  if (file.startsWith("pages/")) {
    if (/^pages\/_/.test(file)) return null;
    const route = extless.replace(/^pages/, "").replace(/\/index$/, "") || "/";
    return route.replace(/\[(\.\.\.)?([^\]]+)\]/g, (_, dots, name) => dots ? `[...${name}]` : `[${name}]`);
  }
  return null;
}

function routerFor(file) {
  if (file.startsWith("app/api/")) return "api";
  if (file.startsWith("app/")) return "app";
  if (file.startsWith("pages/api/")) return "api";
  if (file.startsWith("pages/")) return "pages";
  return "component-lib";
}

function classifySurface(route, file, source) {
  const s = `${route || ""} ${file}`;
  if (/redirect\(|permanent:\s*(true|false)|NextResponse\.redirect/.test(source) && source.length < 2500) return "REDIRECT_ONLY";
  if (/legacy|\.legacy|disabled|deprecated/i.test(s) || /LEGACY_.*DISABLED|DISABLED/.test(source)) return "LEGACY_DISABLED";
  if (/webhook/i.test(s)) return "WEBHOOK";
  if (/debug|testing|chaos|red-team|trash-day/i.test(s)) return "DEBUG_INTERNAL";
  if (/admin\/intelligence-foundry|foundry/i.test(s) && !route?.startsWith("/api/")) return "FOUNDRY_CONSOLE";
  if (/admin\/outbound|outbound/i.test(s)) return route?.startsWith("/api/") ? "INTERNAL_API" : "OUTBOUND_CONSOLE";
  if (/^\/api\/admin|pages\/api\/admin|app\/api\/admin/.test(s)) return "INTERNAL_API";
  if (/^\/admin|pages\/admin|app\/admin/.test(s)) return "ADMIN_CONSOLE";
  if (/stripe|checkout|billing|commercial/i.test(s)) return route?.startsWith("/api/") ? "INTERNAL_API" : "COMMERCIAL_CHECKOUT";
  if (/boardroom|dossier/i.test(s)) return route?.startsWith("/api/") ? "INTERNAL_API" : "BOARDROOM_DELIVERY";
  if (/strategy-room/i.test(s)) return route?.startsWith("/api/") ? "INTERNAL_API" : "STRATEGY_ROOM";
  if (/diagnostic|assessment|purpose-alignment|constitutional|team-assessment|enterprise/i.test(s)) {
    return route?.startsWith("/api/") ? "PUBLIC_API" : "PUBLIC_DIAGNOSTIC";
  }
  if (/download|vault|client\/reports|case\/shared|briefing\/return|dl\/|access\/serve/i.test(s)) {
    return route?.startsWith("/api/") ? "INTERNAL_API" : "CLIENT_DELIVERY";
  }
  if (route?.startsWith("/api/")) return /^\/api\/(search|stats|subscribe|newsletter|contact|root|v2)/.test(route) ? "PUBLIC_API" : "INTERNAL_API";
  if (/blog|canon|brief|book|short|resource|print|library|evidence|events/i.test(s)) return "PUBLIC_CONTENT";
  if (route) return "PUBLIC_MARKETING";
  return "DEAD_OR_ORPHANED";
}

function ownerDomain(file, route) {
  const s = `${route || ""} ${file}`;
  for (const [pattern, owner] of OWNER_RULES) {
    if (pattern.test(s)) return owner;
  }
  return route ? "Public/Product" : "Shared";
}

function authEvidence(file, route, source) {
  const adminLayout = file.startsWith("app/admin/") && exists("app/admin/layout.tsx");
  const testingLayout = file.startsWith("app/testing/") && exists("app/testing/layout.tsx");
  const tokens = [
    "requireAdmin",
    "requireAdminServer",
    "requireAdminAppRoute",
    "withAdmin",
    "getServerSession",
    "getToken",
    "verifySession",
    "getInnerCircleAccess",
    "requireRole",
    "adminFetch",
    "entitlement",
    "accessToken",
    "verifyDownload",
    "validateAdmin",
  ].filter((t) => source.includes(t));
  const requiresByPath = /(^\/admin|\/admin\/|^\/api\/admin|\/api\/admin|testing|private\/vault|client\/reports|boardroom\/dossier|restricted)/.test(`${route || ""} ${file}`);
  return {
    requiresAuth: Boolean(adminLayout || testingLayout || tokens.length || requiresByPath),
    requiredRole: adminLayout || /^\/admin|^\/api\/admin|pages\/admin|pages\/api\/admin/.test(`${route || ""} ${file}`) ? "admin" : "",
    evidence: [
      adminLayout ? "app/admin/layout.tsx" : "",
      testingLayout ? "app/testing/layout.tsx" : "",
      ...tokens,
    ].filter(Boolean).join(", "),
  };
}

function inferRecord(file, route, source) {
  const s = `${route || ""} ${file} ${source.slice(0, 2000)}`;
  if (/ResearchRun|researchRun|foundry/i.test(s)) return "ResearchRun";
  if (/Assessment|assessment/i.test(s)) return "Assessment";
  if (/Campaign|campaign/i.test(s)) return "Campaign";
  if (/Report|report|Executive/i.test(s)) return "ExecutiveReport";
  if (/Dossier|dossier|Boardroom/i.test(s)) return "BoardroomDossier";
  if (/Entitlement|entitlement|Stripe|payment|checkout/i.test(s)) return "Entitlement/Payment";
  if (/Download|download|Vault|vault/i.test(s)) return "DownloadGrant/VaultAsset";
  if (/Decision|decision|Strategy Room|strategy-room/i.test(s)) return "DecisionRecord";
  if (/Outbound|publish|linkedin|facebook/i.test(s)) return "OutboundLedger";
  if (/Governance|audit|event/i.test(s)) return "GovernanceEvent";
  return "";
}

function extractGovernanceEvents(source) {
  const events = new Set();
  // Only match governance-bus-specific eventType fields and explicit governance calls.
  // The broad `type:` pattern was removed — it matched TypeScript discriminated union
  // members (e.g. type: "TRANSACTIONAL", type: "EXECUTIVE_REPORT") that are not
  // governance events, generating 16 false-positive RED findings.
  const patterns = [
    /eventType:\s*["'`]([A-Z0-9_:-]+)["'`]/g,
    /governanceEventType:\s*["'`]([A-Z0-9_:-]+)["'`]/g,
    /recordGovernanceEvent\s*\([^)]*["'`]([A-Z0-9_:-]+)["'`]/g,
    /emit(?:Governance)?Event\s*\([^)]*["'`]([A-Z0-9_:-]+)["'`]/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) events.add(match[1]);
  }
  return Array.from(events).slice(0, 20);
}

function extractOutboundEvents(source) {
  return ["publish", "queue", "draft", "approval", "sync", "mark-posted", "oauth"]
    .filter((word) => new RegExp(word, "i").test(source));
}

function moduleEvidence(file, source) {
  const foundryModuleId = firstMatch(source, /moduleId:\s*["'`]([^"'`]+)["'`]/) || firstMatch(file, /lib\/research\/(?:engines\/)?([^/]+?)(?:-adapter|-engine)?\.ts/);
  const engineId = firstMatch(source, /engineId:\s*["'`]([^"'`]+)["'`]/) || (/engine/i.test(file) ? path.basename(file).replace(/\.(ts|tsx)$/, "") : "");
  const adapterId = firstMatch(source, /adapterId:\s*["'`]([^"'`]+)["'`]/) || (/adapter/i.test(file) ? path.basename(file).replace(/\.(ts|tsx)$/, "") : "");
  return { foundryModuleId, engineId, adapterId };
}

function firstMatch(value, regex) {
  const match = String(value || "").match(regex);
  return match?.[1] || "";
}

function statusFor(surfaceType, source, route, file) {
  const s = `${route || ""} ${file} ${source.slice(0, 3000)}`;
  if (/deprecated|legacy/i.test(s)) return "DEPRECATED";
  if (/simulation|fixture|mock|dry.?run|sample/i.test(s)) return "SIMULATION";
  if (/TODO|throw new Error\(["'`]not implemented|coming soon|placeholder/i.test(s)) return "BROKEN";
  if (/debug|admin|internal|testing/i.test(`${surfaceType} ${route || ""} ${file}`)) return "INTERNAL";
  if (/LIVE|READY|PRODUCTION/.test(source)) return "LIVE";
  return "UNKNOWN";
}

function buildInventory() {
  return allFiles().map((file) => {
    const source = read(file);
    const route = routeFromFile(file) || "";
    const surfaceType = classifySurface(route, file, source);
    const auth = authEvidence(file, route, source);
    const mod = moduleEvidence(file, source);
    return {
      route,
      file,
      router: routerFor(file),
      surfaceType,
      ownerDomain: ownerDomain(file, route),
      requiresAuth: auth.requiresAuth,
      requiredRole: auth.requiredRole,
      entitlementRequired: /entitlement|paid|stripe|checkout|token|grant/i.test(source) ? "detected" : "",
      canonicalRecord: inferRecord(file, route, source),
      foundryModuleId: mod.foundryModuleId,
      engineId: mod.engineId,
      adapterId: mod.adapterId,
      governanceEvents: extractGovernanceEvents(source),
      outboundEvents: extractOutboundEvents(source),
      paymentLinked: /stripe|checkout|priceId|payment|catalog/i.test(source),
      deliveryLinked: /deliver|delivery|email|download|token|dossier|report/i.test(source),
      status: statusFor(surfaceType, source, route, file),
      evidence: auth.evidence || "static route/source scan",
    };
  });
}

function registrySnapshot() {
  const files = {};
  const routes = new Set();
  const eventTypes = new Set();
  for (const rel of REGISTRY_FILES) {
    const source = read(rel);
    files[rel] = {
      exists: Boolean(source),
      routeRefs: Array.from(source.matchAll(/["'`]((?:\/[a-zA-Z0-9_[\].\-]+)+)["'`]/g)).map((m) => m[1]).sort(),
      symbols: Array.from(source.matchAll(/\b([A-Z][A-Z0-9_]{3,})\b/g)).map((m) => m[1]).sort(),
    };
    files[rel].routeRefs.forEach((r) => routes.add(r));
    if (rel.includes("governance-event-types")) files[rel].symbols.forEach((e) => eventTypes.add(e));
  }
  return { files, routes: Array.from(routes).sort(), eventTypes: Array.from(eventTypes).sort() };
}

function addFinding(findings, severity, code, message, evidence = {}) {
  findings.push({ severity, code, message, ...evidence });
}

function auditRegistryParity(inventory, registries) {
  const findings = [];
  const routeSet = new Set(inventory.filter((s) => s.route).map((s) => s.route));
  const registryRoutes = new Set(registries.routes);
  for (const surface of inventory.filter((s) => s.route)) {
    if (["PUBLIC_MARKETING", "PUBLIC_CONTENT", "PUBLIC_API", "REDIRECT_ONLY", "LEGACY_DISABLED"].includes(surface.surfaceType)) continue;
    // /admin/login is the auth bootstrap — intentionally ungoverned (no admin domain owner required)
    if (surface.route === "/admin/login") continue;
    // XML sitemap routes are infrastructure assets, not product surfaces requiring domain ownership
    if (/\.(xml|xml\.ts)$/.test(surface.route) || surface.route.includes("-sitemap")) continue;
    if (!registryRoutes.has(surface.route)) {
      addFinding(findings, surface.surfaceType.includes("ADMIN") || surface.surfaceType.includes("FOUNDRY") || surface.surfaceType.includes("CLIENT") ? "RED" : "AMBER", "ROUTE_WITHOUT_REGISTRY_OWNER", `${surface.route} has no explicit owner in scanned registries`, { route: surface.route, file: surface.file, surfaceType: surface.surfaceType });
    }
  }
  for (const route of registries.routes) {
    if (!routeSet.has(route) && !route.includes(":") && !route.includes("*")) {
      addFinding(findings, "AMBER", "REGISTRY_ROUTE_MISSING_FILE", `Registry references ${route}, but no exact physical route was found`, { route });
    }
  }
  for (const surface of inventory.filter((s) => s.surfaceType === "REDIRECT_ONLY")) {
    if (routeSet.has(surface.route) && registries.routes.includes(surface.route)) {
      addFinding(findings, "AMBER", "REDIRECT_PHYSICAL_ROUTE", `${surface.route} is physical and appears redirect-like; verify registry status`, { route: surface.route, file: surface.file });
    }
  }
  return report("institutional-registry-parity", findings, { registryRouteCount: registries.routes.length });
}

function auditAuth(inventory) {
  const findings = [];
  for (const s of inventory.filter((x) => x.route)) {
    const source = read(s.file);
    const inheritedSource = inheritedLayoutSource(s.file);
    const authEvidence = `${source}\n${inheritedSource}`;

    // ADMIN_API_NO_VISIBLE_AUTH: skip bootstrap auth routes — they are the auth
    // mechanism and intentionally cannot require an existing admin session.
    // Their guards are email allowlists, anti-enumeration responses, rate limits,
    // shield middleware, dev-only 404s, or private-host checks.
    const isBootstrapAuthRoute = /dev-login/.test(`${s.route} ${s.file}`) ||
      /^\/api\/admin\/auth\/(send-link|verify|callback|reset-rate-limit)$/.test(s.route);
    const isExplicitPublicSafeAdminRoute = /Public-safe|publicSafe|constitutional health posture/i.test(source);
    // Auth patterns: named guards + session/cookie-based auth used throughout Pages Router admin APIs
    const hasAdminAuth = /(requireAdmin|requireAdminApi|requireAdminServer|requireAdminPage|requireAdminAppRoute|getServerSession|getToken|validateAdmin|adminFetch|verifyAdmin|readAccessCookie|getSessionContext|tierAtLeast|isPrivateHost|INNER_CIRCLE_ADMIN_KEY|x-inner-circle-admin-key)/.test(authEvidence) ||
      (/resolveIdentity/.test(authEvidence) && /(deriveOversightOperatorRole|canAccessAdmin|ADMIN)/.test(authEvidence)) ||
      /export\s+\{\s*default\s*\}\s+from\s+["'](?:@\/pages\/api\/admin\/audit-logs|\.\/oauth\/(?:start|callback))["']/.test(source);
    if (!isBootstrapAuthRoute && !isExplicitPublicSafeAdminRoute && !isRetiredNoop(source) && /^\/api\/admin|pages\/api\/admin|app\/api\/admin/.test(`${s.route} ${s.file}`) && !hasAdminAuth) {
      addFinding(findings, "RED", "ADMIN_API_NO_VISIBLE_AUTH", `${s.route} lacks visible admin auth guard`, { route: s.route, file: s.file });
    }

    if (/^\/admin|pages\/admin|app\/admin/.test(`${s.route} ${s.file}`) && !s.requiresAuth && !/login/.test(s.route) && !hasAdminAuth) {
      addFinding(findings, "RED", "ADMIN_PAGE_NO_VISIBLE_AUTH", `${s.route} lacks visible/inherited admin auth`, { route: s.route, file: s.file });
    }
    if (/debug|chaos|red-team|testing/i.test(`${s.route} ${s.file}`) && !s.requiresAuth && !isDevOnly404(source) && !hasAdminAuth) {
      addFinding(findings, "RED", "DEBUG_SURFACE_PUBLIC", `${s.route || s.file} appears debug/internal without auth`, { route: s.route, file: s.file });
    }

    // DELIVERY_ROUTE_NO_TOKEN_OR_ENTITLEMENT:
    //   Recognised guards: token, entitlement, grant, verifySession, getServerSession (session auth),
    //   getInnerCircleAccess, requireAdmin, admin.
    //   Suspense shell pages (page.tsx that imports a single *Client component and has no data logic)
    //   are excluded — they are pure entry points; the actual auth gate is in the API route they call.
    const isDeliveryRoute = /client\/reports|boardroom\/dossier|private\/vault|downloads\/vault|restricted/.test(`${s.route} ${s.file}`);
    const hasDeliveryGuard = /(token|entitlement|grant|verifySession|getServerSession|getInnerCircleAccess|requireAdmin|admin)/i.test(authEvidence);
    const isSuspenseShell = s.file.endsWith("page.tsx") &&
      /from\s+['"].*Client['"]/i.test(source) &&
      source.split("\n").filter((l) => l.trim()).length < 25;
    if (isDeliveryRoute && !hasDeliveryGuard && !isSuspenseShell) {
      addFinding(findings, "RED", "DELIVERY_ROUTE_NO_TOKEN_OR_ENTITLEMENT", `${s.route} appears delivery-gated but lacks visible token/entitlement check`, { route: s.route, file: s.file });
    }

    if (/public|blog|canon|short|resource/i.test(s.surfaceType) && /requireAdmin|adminFetch/.test(source)) {
      addFinding(findings, "AMBER", "PUBLIC_ROUTE_IMPORTS_ADMIN_AUTH", `${s.route} is public-classified but imports admin auth/client`, { route: s.route, file: s.file });
    }
  }
  return report("auth-access-symmetry", findings, {});
}

function auditProductLadder(inventory, registries) {
  const findings = [];
  const routes = new Set(inventory.map((s) => s.route).filter(Boolean));
  const registryText = REGISTRY_FILES.map(read).join("\n");
  for (const product of PRODUCT_SURFACES) {
    const matching = inventory.filter((s) => product.routes.some((r) => s.route.startsWith(r) || s.file.includes(r.replace(/^\//, "").replace(/\//g, path.sep))));
    const hasRoute = matching.length > 0 || product.routes.some((r) => routes.has(r));
    const hasRegistry = product.routes.some((r) => registries.routes.includes(r)) || new RegExp(product.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(registryText);
    const hasRecord = matching.some((s) => s.canonicalRecord) || /canonical|record|model|prisma/i.test(matching.map((s) => read(s.file)).join("\n"));
    const hasEvent = matching.some((s) => s.governanceEvents.length) || /governance|audit|event/i.test(matching.map((s) => read(s.file)).join("\n"));
    const hasAdmin = matching.some((s) => /admin/.test(s.route || s.file));
    const hasDelivery = matching.some((s) => s.deliveryLinked);
    if (!hasRoute) addFinding(findings, "RED", "PRODUCT_ROUTE_MISSING", `${product.name} has no discoverable route/API surface`, { product: product.name });
    if (hasRoute && !hasRegistry) addFinding(findings, "RED", "PRODUCT_NO_LADDER_REGISTRY", `${product.name} has route/API surface but no registry declaration`, { product: product.name, routes: product.routes });
    if (hasRoute && !hasRecord) addFinding(findings, "RED", "PRODUCT_NO_CANONICAL_RECORD", `${product.name} has no visible canonical record creation/read`, { product: product.name });
    if (hasRoute && !hasEvent) addFinding(findings, "AMBER", "PRODUCT_NO_GOVERNANCE_EVENT", `${product.name} has no visible governance event emission`, { product: product.name });
    if (hasRoute && !hasAdmin) addFinding(findings, "AMBER", "PRODUCT_NO_ADMIN_VISIBILITY", `${product.name} has no obvious admin visibility route`, { product: product.name });
    if (/Paid|Delivery|Downloads|Boardroom|Report/i.test(product.name) && hasRoute && !hasDelivery) addFinding(findings, "RED", "PRODUCT_DELIVERY_NOT_WIRED", `${product.name} lacks visible delivery link`, { product: product.name });
  }
  return report("product-ladder-e2e", findings, { productCount: PRODUCT_SURFACES.length });
}

// Infrastructure files that define adapter/engine contracts and registries — not implementations.
// These legitimately match adapter/engine filename patterns but are not callable Foundry adapters.
const FOUNDRY_INFRA = new Set([
  "lib/research/adapter-base-contract.ts",
  "lib/research/adapter-registry.ts",
  "lib/research/engine-adapter-contract.ts",
  "lib/research/engine-registry.ts",
  "lib/research/module-registry.ts",
]);

function auditFoundry(inventory) {
  const findings = [];
  const researchFiles = inventory.filter((s) => s.file.startsWith("lib/research/") && !FOUNDRY_INFRA.has(s.file));
  const adapters = researchFiles.filter((s) => /adapter/i.test(s.file));
  const engines = researchFiles.filter((s) => /engine|module|service/i.test(s.file));
  const tests = walk("tests/research").concat(walk("tests/research/canary"));
  const adminFoundry = inventory.filter((s) => /admin\/intelligence-foundry/.test(s.file) && !s.file.endsWith("layout.tsx"));
  for (const adapter of adapters) {
    const base = path.basename(adapter.file).replace(/\.(ts|tsx)$/, "").replace(/-adapter$/, "");
    const hasAdmin = adminFoundry.some((s) => read(s.file).includes(base) || s.file.includes(base));
    const hasTest = tests.some((t) => read(t).includes(base) || t.includes(base));
    if (!hasAdmin) addFinding(findings, "RED", "FOUNDRY_ADAPTER_NO_ADMIN_SURFACE", `${adapter.file} has no obvious admin Foundry surface`, { file: adapter.file });
    if (!hasTest) addFinding(findings, "AMBER", "FOUNDRY_ADAPTER_NO_CALLABLE_TEST", `${adapter.file} has no obvious research/canary test`, { file: adapter.file });
  }
  for (const page of adminFoundry) {
    const src = read(page.file);
    // Skip pure redirect pages — they have no engine/adapter wiring by design
    if (/redirect\(|NextResponse\.redirect/.test(src) && src.length < 2500) continue;
    if (!/adapter|engine|ResearchRun|run|module|product-health/i.test(src)) {
      addFinding(findings, "RED", "FOUNDRY_PAGE_NO_ENGINE", `${page.route} exists but no engine/adapter linkage is visible`, { route: page.route, file: page.file });
    }
    if (/GREEN|READY/.test(src) && !/evidence|route|auth|event|proof|test/i.test(src)) {
      addFinding(findings, "RED", "FOUNDRY_FALSE_GREEN_RISK", `${page.route} may mark health from declarations without proof`, { route: page.route, file: page.file });
    }
  }
  return report("foundry-operating-alignment", findings, { adapters: adapters.length, engines: engines.length, adminFoundryPages: adminFoundry.length });
}

function auditGovernance(inventory, registries) {
  const findings = [];
  const allSource = inventory.map((s) => read(s.file)).join("\n");
  const emitted = new Set();

  // Only extract governance events from files that actually call the governance bus
  // (routeGovernanceEvent / emitGovernanceEvent). Files that use eventType: for
  // domain-specific logging (outbound audit helpers, boardroom delivery logs) are
  // not governance bus callers and must not contribute to the emitted set.
  const GOVERNANCE_BUS_CALLERS = /routeGovernanceEvent|emitGovernanceEvent|governance-event-bus/;
  const GOVERNANCE_INFRA = new Set([
    "lib/platform/governance-event-types.ts",
    "lib/platform/governance-event-bus.ts",
    "lib/platform/product-event-contract.ts",
    "lib/research/lineage/lineage-chain-definitions.ts",
  ]);
  for (const s of inventory) {
    if (GOVERNANCE_INFRA.has(s.file)) continue;
    const src = read(s.file);
    if (!GOVERNANCE_BUS_CALLERS.test(src)) continue;
    extractGovernanceEvents(src).forEach((e) => emitted.add(e));
  }

  for (const event of emitted) {
    if (!registries.eventTypes.includes(event)) addFinding(findings, "RED", "EVENT_EMITTED_NOT_REGISTERED", `${event} is emitted/referenced but not registered in governance event types`, { event });
  }
  for (const event of registries.eventTypes.filter((e) => /^[A-Z0-9_:-]{4,}$/.test(e))) {
    if (!emitted.has(event) && !allSource.includes(event)) addFinding(findings, "AMBER", "EVENT_REGISTERED_NOT_EMITTED", `${event} is registered but no emission/reference was found`, { event });
  }
  const bus = read("lib/platform/governance-event-bus.ts");
  if (/RECORDED/.test(bus) && !/(fs\.|prisma|insert|create|append|write|audit)/i.test(bus)) {
    addFinding(findings, "RED", "EVENT_BUS_SUCCESS_WITHOUT_DURABLE_WRITE", "Governance bus may return RECORDED without visible durable write", { file: "lib/platform/governance-event-bus.ts" });
  }
  for (const s of inventory.filter((x) => x.status === "LIVE" && /PRODUCT|DIAGNOSTIC|DELIVERY|COMMERCIAL|BOARDROOM|STRATEGY|CLIENT/.test(x.surfaceType))) {
    if (!s.governanceEvents.length && !/governance|audit|event/i.test(read(s.file))) {
      addFinding(findings, "AMBER", "LIVE_ACTION_NO_EVENT", `${s.route || s.file} is live-classified but has no visible governance event`, { route: s.route, file: s.file });
    }
  }
  return report("governance-event-durability", findings, { registeredEvents: registries.eventTypes.length, emittedEvents: emitted.size });
}

function auditOutbound(inventory) {
  const findings = [];
  const outbound = inventory.filter((s) => /outbound|linkedin|facebook|\/x\/|publish/i.test(`${s.route} ${s.file}`));
  for (const s of outbound) {
    const src = read(s.file);

    // OUTBOUND_PUBLISH_WITHOUT_APPROVAL_GATE: only check actual publish execution endpoints
    // (API routes ending in /publish) and the scheduler runner. Support files — content
    // loaders, provider contracts, gate helpers, OAuth clients — legitimately reference
    // "publish" without being the approval authority and are excluded.
    const isPublishEndpoint = (s.route && /\/publish$/.test(s.route)) || /scheduler-runner/.test(s.file);
    if (isPublishEndpoint && !/approval|approved|finalApproval|approvalStatus|requiresFinalApproval|manualApprovalNote|claimPublishSlot|isOutboundItemEligible|finalGate|policy|eligibility|dry.?run|confirm/i.test(src)) {
      addFinding(findings, "RED", "OUTBOUND_PUBLISH_WITHOUT_APPROVAL_GATE", `${s.route || s.file} publishes without visible approval/policy gate`, { route: s.route, file: s.file });
    }

    // OUTBOUND_STATUS_OVERCLAIM: detect files that have a dryRun conditional but assign
    // status: "published" without a corresponding status: "dry_run" alternative.
    // This is the specific anti-pattern of mislabelling dry-run success as a real publish.
    // Files that correctly separate the two paths (e.g. ledger type definitions, provider
    // APIs that return dryRun:true) will have both values and are not flagged.
    const hasDryRunBlock = /if\s*\([^)]*dryRun/.test(src);
    const assignsPublishedStatus = /status:\s*["']published["']/.test(src);
    const assignsDryRunStatus = /status:\s*["']dry.?run["']/.test(src);
    if (hasDryRunBlock && assignsPublishedStatus && !assignsDryRunStatus) {
      addFinding(findings, "RED", "OUTBOUND_STATUS_OVERCLAIM", `${s.route || s.file} mixes published label with dry-run flow — use distinct "dry_run" status`, { route: s.route, file: s.file });
    }

    if (/LIVE|PRODUCTION/.test(src) && !/process\.env|credential|oauth|provider|token/i.test(src)) {
      addFinding(findings, "AMBER", "OUTBOUND_LIVE_NO_PROVIDER_EVIDENCE", `${s.route || s.file} uses live language without visible provider/credential check`, { route: s.route, file: s.file });
    }
  }
  return report("outbound-operating-alignment", findings, { outboundSurfaces: outbound.length });
}

function auditAdminNavigation(inventory, registries) {
  const findings = [];
  const routeSet = new Set(inventory.map((s) => s.route).filter(Boolean));
  const adminSources = inventory.filter((s) => /^components\/admin|^app\/admin|^pages\/admin/.test(s.file));
  const navTargets = new Map();
  for (const s of adminSources) {
    const src = read(s.file);
    for (const match of src.matchAll(/href=\{?["'`]([^"'`]+)["'`]\}?|href:\s*["'`]([^"'`]+)["'`]/g)) {
      const raw = match[1] || match[2];
      // Skip template literals (contain ${...}) — they resolve at runtime and cannot be statically checked
      if (!raw?.startsWith("/") || raw.includes("${")) continue;
      // Strip query params before registering the target
      const target = raw.split("?")[0];
      navTargets.set(target, s.file);
    }
  }
  // Build dynamic route patterns for matching hardcoded slug values
  // e.g. /admin/foo/[id] matches /admin/foo/my-specific-slug
  const dynamicRoutes = Array.from(routeSet).filter((r) => r.includes("["));

  function matchesDynamicRoute(target) {
    return dynamicRoutes.some((pattern) => {
      // Convert [param] and [...slug] segments to regex
      const re = new RegExp("^" + pattern.replace(/\[\.\.\.([^\]]+)\]/g, ".+").replace(/\[([^\]]+)\]/g, "[^/]+") + "$");
      return re.test(target);
    });
  }

  for (const [target, file] of navTargets) {
    if (!routeSet.has(target) && !matchesDynamicRoute(target) && !target.includes(":") && !target.includes("#")) addFinding(findings, "RED", "ADMIN_NAV_TARGET_MISSING", `${file} links to missing route ${target}`, { file, route: target });
    if (!registries.routes.includes(target) && /^\/admin/.test(target)) addFinding(findings, "AMBER", "ADMIN_NAV_TARGET_NO_DOMAIN_REGISTRY", `${target} is in admin nav but not in scanned registries`, { file, route: target });
  }
  for (const s of inventory.filter((x) => /^\/admin/.test(x.route) && !/login/.test(x.route))) {
    const reached = Array.from(navTargets.keys()).some((t) => t === s.route);
    if (!reached && !/api|dynamic|\[/.test(s.route)) addFinding(findings, "AMBER", "ADMIN_PAGE_NOT_IN_NAV", `${s.route} exists but no admin nav link was found`, { route: s.route, file: s.file });
    if (read(s.file).trim().startsWith('"use client"') && !/allowlisted|pending migration|admin-layout-force-dynamic/i.test(read("scripts/check-route-lambda-integrity.mjs"))) {
      addFinding(findings, "AMBER", "DIRECT_CLIENT_ADMIN_PAGE", `${s.route} is direct use-client admin page`, { route: s.route, file: s.file });
    }
  }
  return report("admin-navigation-truth", findings, { adminNavTargets: navTargets.size });
}

function auditCommercial(inventory) {
  const findings = [];
  const catalog = read("lib/commercial/catalog.ts");
  const webhook = read("app/api/stripe/webhook/route.ts") || read("pages/api/webhooks/stripe.ts") || read("pages/api/billing/webhook.ts");
  const checkoutSources = inventory.filter((s) => /checkout|billing/.test(`${s.route} ${s.file}`)).map((s) => [s, read(s.file)]);
  if (!/stripePriceId|priceId|catalog|product/i.test(catalog)) addFinding(findings, "RED", "CATALOG_NO_PRICE_AUTHORITY", "Commercial catalog lacks visible product/price authority", { file: "lib/commercial/catalog.ts" });
  if (!/constructEvent|stripe\.webhooks|signature|STRIPE_WEBHOOK_SECRET/i.test(webhook)) addFinding(findings, "RED", "STRIPE_WEBHOOK_NO_SIGNATURE_VERIFY", "Stripe webhook lacks visible signature verification", { file: "app/api/stripe/webhook/route.ts" });
  if (!/idempot|event\.id|processed|dedupe/i.test(webhook)) addFinding(findings, "RED", "STRIPE_WEBHOOK_NO_IDEMPOTENCY", "Stripe webhook lacks visible idempotency handling", { file: "app/api/stripe/webhook/route.ts" });
  if (/metadata/.test(webhook) && !/catalog|verify|entitlement|product/i.test(webhook)) addFinding(findings, "AMBER", "WEBHOOK_METADATA_TRUST_RISK", "Webhook reads metadata without obvious catalog/entitlement verification", { file: "app/api/stripe/webhook/route.ts" });
  for (const [s, src] of checkoutSources) {
    // SIMULATED_CHECKOUT_REACHABLE_RISK: fire only when simulation is NOT explicitly restricted to
    // development mode. A guard of `NODE_ENV === "development" && simulateSuccess` is sufficient.
    const hasSimulationPath = /simulateSuccess|simulate.*true|test checkout/i.test(src);
    const simulationRestrictedToDev = /NODE_ENV\s*===?\s*['"]development['"]/.test(src);
    if (hasSimulationPath && !simulationRestrictedToDev) {
      addFinding(findings, "RED", "SIMULATED_CHECKOUT_REACHABLE_RISK", `${s.route} contains simulated checkout path`, { route: s.route, file: s.file });
    }

    // CHECKOUT_BYPASSES_CATALOG_RISK: only flag API routes — page-layer files delegate
    // price/catalog resolution to the API they call. Also skip tombstone routes (410 Gone).
    const isTombstone = /\.status\(410\)|statusCode.*410|reason.*RETIRED|DIAGNOSTIC_REPORT_PRODUCTS_RETIRED/.test(src);
    const isApiRoute = Boolean(s.route?.startsWith("/api/"));
    if (!isTombstone && isApiRoute && !/catalog|stripePriceId|priceId|productCode|server/i.test(src)) {
      addFinding(findings, "RED", "CHECKOUT_BYPASSES_CATALOG_RISK", `${s.route} lacks visible server-side catalog/price authority`, { route: s.route, file: s.file });
    }
  }
  if (!/token|hash|secure|report/i.test(read("lib/commercial/paid-er-generation.ts"))) addFinding(findings, "AMBER", "PAID_ER_DELIVERY_TOKEN_NOT_OBVIOUS", "Paid ER generation lacks obvious secure token/report delivery chain", { file: "lib/commercial/paid-er-generation.ts" });
  return report("commercial-delivery-e2e", findings, { checkoutSurfaces: checkoutSources.length });
}

function auditStatusTruth(inventory) {
  const findings = [];
  // PUBLISHED, LIVE, DELIVERED are the only words that constitute an outbound publication
  // overclaim when appearing alongside simulation/dry-run language. COMPLETE and APPROVED
  // are workflow/completion states used legitimately throughout admin tooling (task completion,
  // approval workflows) and do not imply outbound publication.
  const PUBLICATION_OVERCLAIM_WORDS = ["LIVE", "PUBLISHED", "DELIVERED"];

  for (const s of inventory) {
    const src = read(s.file);
    const hasStatus = STATUS_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(src));
    if (!hasStatus.length) continue;

    // Skip infrastructure files where simulation and published states legitimately coexist
    // in separate, correctly-labelled code paths:
    //   - Outbound core + admin API: correctly separate DRY_RUN from PUBLISHED execution paths
    //   - Foundry/research engines: "simulation" is the domain purpose, not a publication qualifier
    //   - Boardroom + client portal delivery: "DELIVERED" is a workflow decision, not an outbound claim
    //   - Admin workflow pages (oversight, editorial, sample): use status words in prose/UX labels
    //   - Test files: simulation and proof language coexist by definition
    const isOutboundInfra = /lib\/outbound|components\/admin\/outbound|pages\/api\/admin\/outbound/.test(s.file);
    const isFoundryInfra = /lib\/research|intelligence-foundry/.test(s.file);
    // client.portal matches both "client-portal" (hyphenated path) and "client/portal"
    const isBoardroomOrPortal = /lib\/boardroom|boardroom-delivery|client.portal/.test(s.file);
    // internal/oversight delivery-action uses "DELIVERED" as a workflow state and
    // "INTERNAL_PREVIEW" as a delivery method — neither is an outbound publication claim
    const isAdminWorkflowPage = /oversight-review|editorials\/index|sample-export|internal\/oversight/.test(s.file);
    const isTestFile = /\.test\.|\.spec\.|__tests__|\/tests\//.test(s.file);
    // Platform registry/type files legitimately contain event names (e.g. OUTBOUND_POST_PUBLISHED,
    // BOARDROOM_DOSSIER_DELIVERED) alongside simulation-classification type values — they are
    // vocabulary definitions, not product surfaces claiming a publication state.
    const isPlatformRegistry = /lib\/platform\/governance-event-types|lib\/platform\/governance-event-bus|lib\/platform\/product-event-contract/.test(s.file);
    const isInfraFile = isOutboundInfra || isFoundryInfra || isBoardroomOrPortal || isAdminWorkflowPage || isTestFile || isPlatformRegistry;

    const simulation = /simulation|fixture|mock|dry.?run|sample|preview/i.test(src);
    const proof = /evidence|audit|governance|provider|credential|webhook|route-integrity|verified|durable|record/i.test(src);

    if (!isInfraFile && simulation && hasStatus.some((w) => PUBLICATION_OVERCLAIM_WORDS.includes(w))) {
      addFinding(findings, "RED", "SIMULATION_LABELLED_LIVE", `${s.file} uses ${hasStatus.join(", ")} near simulation/dry-run language`, { route: s.route, file: s.file, labels: hasStatus });
    } else if (!proof && hasStatus.some((w) => ["GREEN", "READY", "LIVE", "PRODUCTION"].includes(w))) {
      addFinding(findings, "AMBER", "STATUS_LABEL_WITHOUT_PROOF", `${s.file} uses ${hasStatus.join(", ")} without obvious proof chain`, { route: s.route, file: s.file, labels: hasStatus });
    }
  }
  return report("status-truthfulness", findings, {});
}

function report(name, findings, extra) {
  const summary = {
    red: findings.filter((f) => f.severity === "RED").length,
    amber: findings.filter((f) => f.severity === "AMBER").length,
    green: findings.filter((f) => f.severity === "GREEN").length,
    totalFindings: findings.length,
    ...extra,
  };
  const payload = { generatedAt: new Date().toISOString(), summary, findings };
  fs.writeFileSync(path.join(REPORTS_DIR, `${name}.json`), `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

function writeInventory(inventory) {
  fs.writeFileSync(path.join(REPORTS_DIR, "institutional-surface-inventory.json"), `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary: {
      totalSurfaces: inventory.length,
      routes: inventory.filter((s) => s.route).length,
      adminSurfaces: inventory.filter((s) => /ADMIN|FOUNDRY|OUTBOUND/.test(s.surfaceType)).length,
      productSurfaces: inventory.filter((s) => /DIAGNOSTIC|DELIVERY|COMMERCIAL|STRATEGY|BOARDROOM/.test(s.surfaceType)).length,
      apiSurfaces: inventory.filter((s) => s.router === "api").length,
    },
    surfaces: inventory,
  }, null, 2)}\n`);
}

function writeDoc(inventory, reports, registries) {
  const allFindings = Object.entries(reports).flatMap(([name, r]) => r.findings.map((f) => ({ report: name, ...f })));
  const red = allFindings.filter((f) => f.severity === "RED");
  const amber = allFindings.filter((f) => f.severity === "AMBER");
  const greenNotes = [
    "Route inventory was generated from app/** and pages/** rather than registry declarations.",
    "Vercel route integrity remains a separate build-output proof and is not treated as product integration proof.",
    "Private vault delivery is manifest-scoped in the currently merged rollback branch.",
  ];
  const foundry = inventory.filter((s) => /foundry|research|adapter|engine/i.test(`${s.file} ${s.route}`));
  const outbound = inventory.filter((s) => /outbound|linkedin|facebook|publish/i.test(`${s.file} ${s.route}`));
  const governanceEvents = new Set(inventory.flatMap((s) => s.governanceEvents));
  const lines = [
    "# Institutional Operating Alignment Audit",
    "",
    "## Executive summary",
    "",
    "This is a report-only static institutional control audit. It verifies route existence, source-level auth evidence, registry parity, product ladder wiring, Foundry linkage, outbound controls, governance event durability indicators, commercial delivery indicators, and status-label truthfulness. It does not modify product code or content publication status.",
    "",
    "Registry presence alone was not counted as integration. Surfaces are treated as aligned only when route, access policy, registry owner, canonical record, implementation evidence, governance event, durable audit/failure path, and truthful status language are visible in source.",
    "",
    "## Counts",
    "",
    `- Total surfaces audited: ${inventory.length}`,
    `- Total routes audited: ${inventory.filter((s) => s.route).length}`,
    `- Total admin surfaces audited: ${inventory.filter((s) => /ADMIN|FOUNDRY|OUTBOUND/.test(s.surfaceType)).length}`,
    `- Total product surfaces audited: ${inventory.filter((s) => /DIAGNOSTIC|DELIVERY|COMMERCIAL|STRATEGY|BOARDROOM/.test(s.surfaceType)).length}`,
    `- Total Foundry engines/adapters audited: ${foundry.length}`,
    `- Total outbound flows audited: ${outbound.length}`,
    `- Total governance events referenced: ${governanceEvents.size}`,
    `- Registry route references scanned: ${registries.routes.length}`,
    "",
    "## RED findings",
    "",
    ...formatFindings(red, 80),
    "",
    "## AMBER findings",
    "",
    ...formatFindings(amber, 120),
    "",
    "## GREEN confirmations",
    "",
    ...greenNotes.map((x) => `- ${x}`),
    "",
    "## Orphaned surfaces",
    "",
    ...formatFindings(allFindings.filter((f) => f.code?.includes("WITHOUT_REGISTRY") || f.code?.includes("ORPHAN")), 80),
    "",
    "## False-green surfaces",
    "",
    ...formatFindings(allFindings.filter((f) => /FALSE_GREEN|STATUS_LABEL|SIMULATION_LABELLED/.test(f.code || "")), 80),
    "",
    "## Simulated-but-labelled-live surfaces",
    "",
    ...formatFindings(allFindings.filter((f) => f.code === "SIMULATION_LABELLED_LIVE"), 80),
    "",
    "## Auth/access mismatches",
    "",
    ...formatFindings(reports.auth.findings, 120),
    "",
    "## Product ladder gaps",
    "",
    ...formatFindings(reports.product.findings, 120),
    "",
    "## Recommended fix order",
    "",
    "1. RED security/access findings: admin APIs, debug surfaces, token/entitlement delivery routes.",
    "2. RED paid/delivery path findings: checkout, Stripe webhook idempotency/signature, paid report delivery.",
    "3. RED false-publication/outbound findings: approval gates, dry-run vs publish state, provider evidence.",
    "4. Foundry false-green and simulation/live ambiguity: require proof beyond registry declarations.",
    "5. AMBER ownership/navigation gaps: registry owners, admin nav truth, dashboard visibility.",
    "6. Governance durability gaps: durable writes, registered-vs-emitted event parity, explicit failure states.",
    "",
    "## No fixes applied",
    "",
    "No product, content, auth, commercial, outbound, Foundry, or platform implementation files were changed by this audit pass.",
    "",
  ];
  fs.writeFileSync(DOC_PATH, `${lines.join("\n")}\n`);
}

function formatFindings(findings, limit) {
  if (!findings.length) return ["- None detected by this static pass."];
  const shown = findings.slice(0, limit).map((f) => `- [${f.severity}] ${f.code}: ${f.message}${f.route ? ` (${f.route})` : ""}${f.file ? ` - ${f.file}` : ""}`);
  if (findings.length > limit) shown.push(`- ... ${findings.length - limit} additional finding(s) in JSON reports.`);
  return shown;
}

function writeAggregate(reports) {
  const summary = Object.fromEntries(Object.entries(reports).map(([k, v]) => [k, v.summary]));
  fs.writeFileSync(path.join(REPORTS_DIR, "institutional-alignment-summary.json"), `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary,
  }, null, 2)}\n`);
}

export async function runAudit(scope = "all", { fail = true } = {}) {
  ensureDirs();
  const inventory = buildInventory();
  const registries = registrySnapshot();
  writeInventory(inventory);
  const reports = {
    registry: auditRegistryParity(inventory, registries),
    auth: auditAuth(inventory),
    product: auditProductLadder(inventory, registries),
    foundry: auditFoundry(inventory),
    governance: auditGovernance(inventory, registries),
    outbound: auditOutbound(inventory),
    admin: auditAdminNavigation(inventory, registries),
    commercial: auditCommercial(inventory),
    status: auditStatusTruth(inventory),
  };
  writeAggregate(reports);
  writeDoc(inventory, reports, registries);

  const selected = scope === "all" ? reports : { [scope]: reports[scope] };
  const red = Object.values(selected).reduce((sum, r) => sum + (r?.summary?.red || 0), 0);
  const amber = Object.values(selected).reduce((sum, r) => sum + (r?.summary?.amber || 0), 0);
  console.log(`[institutional-audit] scope=${scope} red=${red} amber=${amber}`);
  if (fail && red > 0) process.exitCode = 1;
  return { inventory, reports };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const scope = process.argv[2] || "registry";
  await runAudit(scope);
}
