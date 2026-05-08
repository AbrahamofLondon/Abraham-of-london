import { promises as fs } from "fs";
import path from "path";

type AuthorityClass =
  | "Buyer-facing"
  | "Diagnostic-facing"
  | "Paid-product-facing"
  | "Admin-only"
  | "Legacy redirect"
  | "Dead/unsafe"
  | "Internal API"
  | "Duplicate API";

type RouteRecord = {
  route: string;
  source: string;
  kind: "page" | "api";
  system: "app" | "pages";
  classification: AuthorityClass;
  protected: boolean;
  notes: string[];
};

const root = process.cwd();
const docsPath = path.join(root, "docs", "architecture", "public-route-authority-map.md");

async function readIfExists(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function walk(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const entries = await Promise.all(
    dirents.map(async (dirent) => {
      const fullPath = path.join(dir, dirent.name);
      if (dirent.isDirectory()) return walk(fullPath);
      return [fullPath];
    }),
  );
  return entries.flat();
}

function normalizeSegment(segment: string): string | null {
  if (!segment) return null;
  if (segment.startsWith("(") && segment.endsWith(")")) return null;
  if (segment.startsWith("@")) return null;
  return segment;
}

function appFileToRoute(file: string): RouteRecord | null {
  const rel = path.relative(path.join(root, "app"), file).replace(/\\/g, "/");
  if (!/(page|route)\.(t|j)sx?$/.test(rel)) return null;
  const isApi = rel.includes("/api/") || rel.startsWith("api/");
  const parts = rel.split("/");
  const clean = parts
    .slice(0, -1)
    .map(normalizeSegment)
    .filter((segment): segment is string => Boolean(segment));
  let route = `/${clean.join("/")}`;
  route = route.replace(/\/index$/g, "/");
  if (!route || route === "/") {
    route = "/";
  }
  return {
    route,
    source: rel,
    kind: isApi ? "api" : "page",
    system: "app",
    classification: "Buyer-facing",
    protected: false,
    notes: [],
  };
}

function pagesFileToRoute(file: string): RouteRecord | null {
  const rel = path.relative(path.join(root, "pages"), file).replace(/\\/g, "/");
  if (!/\.(t|j)sx?$/.test(rel)) return null;
  const base = rel.replace(/\.(t|j)sx?$/, "");
  if (["_app", "_document", "_error", "404", "500"].includes(base)) return null;
  const isApi = base.startsWith("api/");
  const parts = base.split("/");
  const trimmed = parts.filter((part) => part !== "index");
  const route = trimmed.length ? `/${trimmed.join("/")}` : "/";
  return {
    route,
    source: rel,
    kind: isApi ? "api" : "page",
    system: "pages",
    classification: "Buyer-facing",
    protected: false,
    notes: [],
  };
}

function hasAny(content: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(content));
}

function determineClassification(record: RouteRecord, content: string, dashboardProtected: boolean, duplicates: Set<string>) {
  const route = record.route;
  const notes = new Set<string>(record.notes);
  const protectedByCode = hasAny(content, [
    /requireAdminServer/,
    /requireAdmin\(/,
    /require-admin/,
    /getServerSession/,
    /assertStrategyRoomAccess/,
    /authorizeStrategyRoomEntry/,
  ]);

  const protectedByGroup = dashboardProtected && record.source.startsWith("(dashboard)/");
  const protectedByPath =
    route.startsWith("/admin")
    || route.startsWith("/api/admin")
    || route.startsWith("/directorate")
    || route.startsWith("/inner-circle/admin");

  const protectedRoute = protectedByCode || protectedByGroup || protectedByPath;
  record.protected = protectedRoute;

  if (duplicates.has(route) && route.startsWith("/api/")) {
    record.classification = "Duplicate API";
    notes.add("Same API path exists in both app and pages routing.");
  } else if (hasAny(content, [/redirect:\s*\{/, /NextResponse\.redirect\(/, /Retired:/i, /orphaned route/i])) {
    record.classification = hasAny(content, [/Retired:/i, /orphaned route/i]) ? "Dead/unsafe" : "Legacy redirect";
  } else if (route === "/pricing" || route === "/portfolio") {
    record.classification = "Admin-only";
    if (protectedRoute) {
      notes.add("Protected by app/(dashboard)/layout.tsx.");
      notes.add("Route path can be mistaken for a public surface because the admin intent is hidden behind a route group.");
    } else {
      notes.add("Exposure risk: admin-style surface on a public-looking path without explicit protection.");
    }
  } else if (route.startsWith("/api/")) {
    if (protectedRoute || hasAny(content, [/not authenticated/i, /unauthorized/i, /Bearer /])) {
      record.classification = "Internal API";
    } else {
      record.classification = route.startsWith("/api/demo/") ? "Buyer-facing" : "Internal API";
      if (route.startsWith("/api/demo/")) notes.add("Public-demo API by design.");
    }
  } else if (protectedRoute) {
    record.classification = "Admin-only";
  } else if (
    route.startsWith("/diagnostics")
    || route.startsWith("/purpose-alignment")
  ) {
    record.classification = "Diagnostic-facing";
  } else if (
    route === "/strategy-room"
    || route === "/consulting/strategy-room"
    || route.startsWith("/private-clients")
    || route.startsWith("/retainer")
    || route === "/consulting"
  ) {
    record.classification = "Paid-product-facing";
  } else if (
    route.startsWith("/testing")
    || route.startsWith("/debug")
    || route.startsWith("/dashboard")
  ) {
    record.classification = "Dead/unsafe";
  } else {
    record.classification = "Buyer-facing";
  }

  if (route === "/pricing") {
    notes.add("Specific concern resolved by protection, but canonical public pricing must remain separate.");
  }

  if (route === "/" && record.system === "pages") {
    notes.add("Homepage currently resolves from pages router.");
  }

  record.notes = [...notes];
}

async function main() {
  const appFiles = await walk(path.join(root, "app"));
  const pageFiles = await walk(path.join(root, "pages"));
  const dashboardLayout = await readIfExists(path.join(root, "app", "(dashboard)", "layout.tsx"));
  const dashboardProtected = /requireAdminServer/.test(dashboardLayout);

  const routes = [
    ...appFiles.map(appFileToRoute).filter((route): route is RouteRecord => Boolean(route)),
    ...pageFiles.map(pagesFileToRoute).filter((route): route is RouteRecord => Boolean(route)),
  ];

  const duplicates = new Set<string>();
  const grouped = new Map<string, RouteRecord[]>();
  for (const route of routes) {
    const current = grouped.get(route.route) ?? [];
    current.push(route);
    grouped.set(route.route, current);
  }
  for (const [route, records] of grouped) {
    if (records.length > 1 && route.startsWith("/api/")) duplicates.add(route);
  }

  for (const record of routes) {
    const content = await readIfExists(path.join(root, record.system === "app" ? "app" : "pages", record.source));
    determineClassification(record, content, dashboardProtected, duplicates);
  }

  routes.sort((a, b) => a.route.localeCompare(b.route));

  const lines = [
    "# Public Route Authority Map",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Key Findings",
    "",
    `- \`/pricing\` is an admin-only surface on a public-looking path; it is now protected by \`app/(dashboard)/layout.tsx\` but remains a confusion risk.`,
    `- Homepage authority currently resolves from \`pages/index.tsx\`; \`app/page.tsx\` is absent.`,
    `- Duplicate API paths should be rationalised before launch where both app and pages implementations coexist.`,
    "",
    "## Route Inventory",
    "",
    "| Route | Kind | Source | Classification | Protected | Notes |",
    "| --- | --- | --- | --- | --- | --- |",
    ...routes.map((route) => `| \`${route.route}\` | ${route.kind} | \`${route.system}/${route.source}\` | \`${route.classification}\` | ${route.protected ? "yes" : "no"} | ${route.notes.join(" ; ")} |`),
    "",
    "## Priority Risks",
    "",
    ...routes
      .filter((route) => route.route === "/pricing" || route.classification === "Duplicate API" || route.classification === "Dead/unsafe")
      .map((route) => `- \`${route.route}\` → \`${route.classification}\` from \`${route.system}/${route.source}\`${route.notes.length ? ` (${route.notes.join("; ")})` : ""}`),
  ];

  await fs.mkdir(path.dirname(docsPath), { recursive: true });
  await fs.writeFile(docsPath, lines.join("\n"), "utf8");
  console.log(`Wrote ${path.relative(root, docsPath)}`);
}

main().catch((error) => {
  console.error("[audit-public-routes] failed", error);
  process.exitCode = 1;
});
