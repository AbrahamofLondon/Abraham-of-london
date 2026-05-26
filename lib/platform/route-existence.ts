import fs from "fs";
import path from "path";

export type RouteKind = "page" | "api" | "any";

export type RouteExistenceResult = {
  exists: boolean;
  route: string;
  kind: RouteKind;
  matchedPath?: string;
  router?: "app" | "pages";
};

type SegmentMatch = "none" | "single" | "catchAll" | "optionalCatchAll";

function normaliseRoute(route: string): string[] {
  return route
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/[?#].*$/, "")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);
}

function segmentMatch(candidate: string, actual: string): SegmentMatch {
  if (candidate === actual) return "single";
  if (/^\[\[\.\.\.[^\]]+\]\]$/.test(candidate)) return "optionalCatchAll";
  if (/^\[\.\.\.[^\]]+\]$/.test(candidate)) return "catchAll";
  if (/^\[[^\]]+\]$/.test(candidate)) return "single";
  return "none";
}

function findRouteDirectory(baseDir: string, routeSegments: string[]): string | null {
  function walk(currentDir: string, index: number): string | null {
    if (index === routeSegments.length) return currentDir;
    if (!fs.existsSync(currentDir)) return null;

    const entries = fs
      .readdirSync(currentDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    const exact = entries.find((entry) => entry === routeSegments[index]);
    if (exact) {
      const result = walk(path.join(currentDir, exact), index + 1);
      if (result) return result;
    }

    for (const entry of entries) {
      const match = segmentMatch(entry, routeSegments[index] ?? "");
      if (match === "single") {
        const result = walk(path.join(currentDir, entry), index + 1);
        if (result) return result;
      }
      if (match === "catchAll" || match === "optionalCatchAll") {
        return path.join(currentDir, entry);
      }
    }

    return null;
  }

  return walk(baseDir, 0);
}

function existingFile(candidates: string[]): string | undefined {
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function findPagesRoute(root: string, routeSegments: string[], kind: RouteKind): string | undefined {
  const pagesDir = path.join(root, "pages");
  const directBase = path.join(pagesDir, ...routeSegments);
  const allowPage = kind === "page" || kind === "any";
  const allowApi = kind === "api" || kind === "any";

  const directCandidates = [
    ...(allowPage ? [`${directBase}.tsx`, `${directBase}.ts`, path.join(directBase, "index.tsx"), path.join(directBase, "index.ts")] : []),
    ...(allowApi ? [`${directBase}.ts`, `${directBase}.tsx`, path.join(directBase, "index.ts"), path.join(directBase, "index.tsx")] : []),
  ];
  const direct = existingFile(directCandidates);
  if (direct) return direct;

  const parentSegments = routeSegments.slice(0, -1);
  const leaf = routeSegments.at(-1) ?? "";
  const parentDir = findRouteDirectory(pagesDir, parentSegments);
  if (!parentDir) return undefined;

  const entries = fs.readdirSync(parentDir, { withFileTypes: true });
  for (const entry of entries) {
    const name = entry.name.replace(/\.(tsx|ts)$/, "");
    if (segmentMatch(name, leaf) === "none") continue;

    const candidate = path.join(parentDir, entry.name);
    if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) return candidate;
    if (entry.isDirectory()) {
      const index = existingFile([path.join(candidate, "index.tsx"), path.join(candidate, "index.ts")]);
      if (index) return index;
    }
  }

  return undefined;
}

function findAppRoute(root: string, routeSegments: string[], kind: RouteKind): string | undefined {
  const appDir = path.join(root, "app");
  const routeDir = findRouteDirectory(appDir, routeSegments);
  if (!routeDir) return undefined;

  const allowPage = kind === "page" || kind === "any";
  const allowApi = kind === "api" || kind === "any";

  return existingFile([
    ...(allowPage ? [path.join(routeDir, "page.tsx"), path.join(routeDir, "page.ts")] : []),
    ...(allowApi ? [path.join(routeDir, "route.ts"), path.join(routeDir, "route.tsx")] : []),
  ]);
}

export function routeExists(
  route: string,
  options?: { rootDir?: string; kind?: RouteKind },
): RouteExistenceResult {
  const root = options?.rootDir ?? process.cwd();
  const inferredKind: RouteKind = options?.kind ?? (route.startsWith("/api/") ? "api" : "page");
  const segments = normaliseRoute(route);

  if (segments.length === 0) {
    const appHome = existingFile([path.join(root, "app", "page.tsx"), path.join(root, "app", "page.ts")]);
    if (appHome) return { exists: true, route, kind: inferredKind, matchedPath: appHome, router: "app" };
    const pagesHome = existingFile([path.join(root, "pages", "index.tsx"), path.join(root, "pages", "index.ts")]);
    if (pagesHome) return { exists: true, route, kind: inferredKind, matchedPath: pagesHome, router: "pages" };
  }

  const appMatch = findAppRoute(root, segments, inferredKind);
  if (appMatch) return { exists: true, route, kind: inferredKind, matchedPath: appMatch, router: "app" };

  const pagesMatch = findPagesRoute(root, segments, inferredKind);
  if (pagesMatch) return { exists: true, route, kind: inferredKind, matchedPath: pagesMatch, router: "pages" };

  return { exists: false, route, kind: inferredKind };
}

export function assertRouteExists(route: string, options?: { rootDir?: string; kind?: RouteKind }): void {
  const result = routeExists(route, options);
  if (!result.exists) {
    throw new Error(`Route "${route}" does not exist as a ${result.kind} route.`);
  }
}
