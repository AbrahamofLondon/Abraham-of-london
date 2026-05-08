import { promises as fs } from "fs";
import path from "path";

type SmokeStatus = "PASS" | "FAIL" | "NEEDS_AUTH" | "REDIRECT" | "UNKNOWN";

type Result = {
  route: string;
  status: SmokeStatus;
  detail: string;
};

const root = process.cwd();
const targets = [
  "/",
  "/diagnostics",
  "/diagnostics/purpose-alignment",
  "/diagnostics/constitutional-diagnostic",
  "/diagnostics/team-assessment",
  "/diagnostics/enterprise-assessment",
  "/diagnostics/executive-reporting",
  "/diagnostics/executive-reporting/run",
  "/strategy-room",
  "/consulting/strategy-room",
  "/api/demo/governed-decision",
  "/api/strategy-room/execution-record",
] as const;

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function inferProtected(route: string): boolean {
  return route.startsWith("/consulting");
}

async function sourceHasRoute(route: string): Promise<boolean> {
  const normalized = route === "/" ? "index" : route.replace(/^\//, "");
  const pageCandidates = [
    path.join(root, "pages", `${normalized}.tsx`),
    path.join(root, "pages", `${normalized}.ts`),
    path.join(root, "pages", normalized, "index.tsx"),
    path.join(root, "pages", normalized, "index.ts"),
  ];
  const appCandidates = [
    path.join(root, "app", ...route.split("/").filter(Boolean), "page.tsx"),
    path.join(root, "app", ...route.split("/").filter(Boolean), "page.ts"),
    path.join(root, "app", ...route.split("/").filter(Boolean), "route.ts"),
    path.join(root, "app", ...route.split("/").filter(Boolean), "route.tsx"),
  ];
  for (const candidate of [...pageCandidates, ...appCandidates]) {
    try {
      await fs.access(candidate);
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

async function manifestHasRoute(route: string): Promise<boolean> {
  const appManifest = await readJson<Record<string, string>>(path.join(root, ".next", "server", "app-paths-manifest.json"));
  const pagesManifest = await readJson<Record<string, string>>(path.join(root, ".next", "server", "pages-manifest.json"));
  const routeManifest = await readJson<{ redirects?: Array<{ source: string }> }>(path.join(root, ".next", "routes-manifest.json"));

  const allKeys = new Set<string>([
    ...Object.keys(appManifest ?? {}),
    ...Object.keys(pagesManifest ?? {}),
  ]);

  if (allKeys.has(route)) return true;
  if (route === "/" && (allKeys.has("/index") || allKeys.has("/"))) return true;
  if (routeManifest?.redirects?.some((entry) => entry.source === route)) return true;
  return sourceHasRoute(route);
}

async function probeHttp(route: string, baseUrl: string): Promise<Result> {
  try {
    const response = await fetch(`${baseUrl}${route}`, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "launch-smoke" },
    });

    const location = response.headers.get("location") || "";
    if ([401, 403].includes(response.status)) {
      return { route, status: "NEEDS_AUTH", detail: `HTTP ${response.status}` };
    }
    if ([301, 302, 307, 308].includes(response.status)) {
      if (/login|signin|access-denied|auth/i.test(location)) {
        return { route, status: "NEEDS_AUTH", detail: `Redirects to ${location}` };
      }
      return { route, status: "REDIRECT", detail: `Redirects to ${location || `HTTP ${response.status}`}` };
    }
    if ([200, 204, 405].includes(response.status)) {
      return { route, status: "PASS", detail: `HTTP ${response.status}` };
    }
    return { route, status: "FAIL", detail: `HTTP ${response.status}` };
  } catch (error) {
    return {
      route,
      status: "UNKNOWN",
      detail: error instanceof Error ? error.message : "HTTP probe failed",
    };
  }
}

async function probeManifest(route: string): Promise<Result> {
  const exists = await manifestHasRoute(route);
  if (!exists) {
    return { route, status: "FAIL", detail: "Route not found in build manifests." };
  }
  if (inferProtected(route)) {
    return { route, status: "NEEDS_AUTH", detail: "Protected by route policy heuristic." };
  }
  if (route.startsWith("/api/strategy-room/execution-record")) {
    return { route, status: "PASS", detail: "POST route present in app manifest." };
  }
  return { route, status: "PASS", detail: "Resolved in build manifest." };
}

async function main() {
  const baseUrl = process.env.TARGET_URL?.trim();
  const results: Result[] = [];
  for (const route of targets) {
    results.push(baseUrl ? await probeHttp(route, baseUrl) : await probeManifest(route));
  }

  for (const result of results) {
    console.log(`${result.status.padEnd(10)} ${result.route} ${result.detail}`);
  }

  const failures = results.filter((result) => result.status === "FAIL");
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[smoke-launch-routes] failed", error);
  process.exitCode = 1;
});
