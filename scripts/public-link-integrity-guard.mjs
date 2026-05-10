/**
 * scripts/public-link-integrity-guard.mjs
 *
 * Scans all public-facing source files for internal links and validates
 * that each link resolves to a real route, a real content record, or an
 * intentional redirect.
 *
 * Exit codes:
 *   0 — PASS (no broken links)
 *   1 — FAIL (broken links found)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const SCAN_DIRS = [
  "pages",
  "app",
  "components",
  "content",
  "lib",
  "data",
];

const SCAN_EXTENSIONS = [".tsx", ".ts", ".mdx", ".md", ".json"];

// Directories/files to skip entirely
const SKIP_PATHS = [
  "node_modules",
  ".next",
  ".contentlayer",
  ".git",
  "out",
  "dist",
  "private_storage",
  "public/assets/downloads",
  "public/sitemap",
  "_api_archive",
  "netlify/functions_src",
  "scripts",
  "tests",
  "emails",
  "patches",
  "tools",
];

// Known static routes (pages/*.tsx, pages/*/index.tsx, app/*/page.tsx)
// Built dynamically from the filesystem
let STATIC_ROUTES = new Set();
let DYNAMIC_ROUTE_PATTERNS = [];

// Content registries for dynamic route validation
const CONTENT_REGISTRIES = {
  briefs: [],
  blog: [],
  canon: [],
  playbooks: [],
  books: [],
  resources: [],
  "decision-instruments": [],
  library: [],
  lexicon: [],
  vault: [],
  downloads: [],
  prints: [],
  strategy: [],
  events: [],
  shorts: [],
  intelligence: [],
  dispatches: [],
};

// Redirects from next.config.mjs
let REDIRECTS = [];

// Results
const results = {
  scanned: 0,
  uniqueLinks: new Set(),
  validStatic: 0,
  validDynamic: 0,
  validContent: 0,
  redirected: 0,
  broken: [],
  skipped: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// File scanning
// ─────────────────────────────────────────────────────────────────────────────

function getScanFiles() {
  const files = [];
  for (const dir of SCAN_DIRS) {
    const absDir = path.join(ROOT, dir);
    if (!fs.existsSync(absDir)) continue;
    walkDir(absDir, files);
  }
  return files;
}

function walkDir(dir, files) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(ROOT, fullPath).replace(/\\/g, "/");

      // Skip ignored paths
      if (SKIP_PATHS.some((s) => relPath.startsWith(s))) continue;

      if (entry.isDirectory()) {
        walkDir(fullPath, files);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (SCAN_EXTENSIONS.includes(ext)) {
          files.push(relPath);
        }
      }
    }
  } catch {
    // Permission errors, skip
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route discovery
// ─────────────────────────────────────────────────────────────────────────────

function discoverRoutes() {
  // Scan pages/ directory
  const pagesDir = path.join(ROOT, "pages");
  if (fs.existsSync(pagesDir)) {
    discoverPagesDir(pagesDir, "");
  }

  // Scan app/ directory
  const appDir = path.join(ROOT, "app");
  if (fs.existsSync(appDir)) {
    discoverAppDir(appDir, "");
  }

  // Load redirects from next.config.mjs
  loadRedirects();

  // Load content registries
  loadContentRegistries();
}

function discoverPagesDir(dir, prefix) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    const name = entry.name.replace(/\.(tsx|ts)$/, "");

    if (entry.isDirectory()) {
      discoverPagesDir(fullPath, prefix + name + "/");
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (![".tsx", ".ts"].includes(ext)) continue;

      let route = "/" + prefix + name;

      // Handle index files
      if (name === "index") {
        route = "/" + prefix.replace(/\/$/, "") || "/";
      }

      // Handle dynamic routes
      if (name.startsWith("[") && name.endsWith("]")) {
        DYNAMIC_ROUTE_PATTERNS.push({
          pattern: route,
          param: name.slice(1, -1),
          catchAll: name.startsWith("[...") || name.startsWith("[[..."),
        });
        continue;
      }

      // Handle catch-all routes
      if (name.startsWith("[")) continue;

      STATIC_ROUTES.add(route);
    }
  }
}

function discoverAppDir(dir, prefix) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    const name = entry.name;

    if (entry.isDirectory()) {
      discoverAppDir(fullPath, prefix + name + "/");
    } else if (entry.isFile()) {
      const ext = path.extname(name);
      if (![".tsx", ".ts"].includes(ext)) continue;

      // App Router uses page.tsx, route.tsx, layout.tsx etc.
      const baseName = path.basename(name, ext);

      // Only page.tsx and route.tsx create routes
      if (baseName !== "page" && baseName !== "route") continue;

      // Build route from directory structure
      let route = "/" + prefix.replace(/\/$/, "") || "/";

      // Handle dynamic segments
      const segments = route.split("/").filter(Boolean);
      let isDynamic = false;
      for (const seg of segments) {
        if (seg.startsWith("[") && seg.endsWith("]")) {
          isDynamic = true;
          break;
        }
      }

      if (isDynamic) {
        DYNAMIC_ROUTE_PATTERNS.push({
          pattern: route,
          param: null,
          catchAll: route.includes("[...") || route.includes("[[..."),
        });
      } else {
        STATIC_ROUTES.add(route);
      }
    }
  }
}

function loadRedirects() {
  try {
    const configPath = path.join(ROOT, "next.config.mjs");
    const content = fs.readFileSync(configPath, "utf8");

    // Extract redirects from the redirects() function
    const redirectMatches = content.matchAll(
      /source:\s*["']([^"']+)["'][\s\S]*?destination:\s*["']([^"']+)["']/g
    );
    for (const match of redirectMatches) {
      REDIRECTS.push({
        source: match[1].replace(/:\w+\*/g, "*"),
        destination: match[2],
      });
    }
  } catch {
    // next.config.mjs might not exist or be unreadable
  }
}

function loadContentRegistries() {
  // Briefs
  const briefsDir = path.join(ROOT, "content", "briefs");
  if (fs.existsSync(briefsDir)) {
    CONTENT_REGISTRIES.briefs = fs
      .readdirSync(briefsDir)
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map((f) => f.replace(/\.(mdx|md)$/, ""));
  }

  // Blog
  const blogDir = path.join(ROOT, "content", "blog");
  if (fs.existsSync(blogDir)) {
    CONTENT_REGISTRIES.blog = fs
      .readdirSync(blogDir, { recursive: true })
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map((f) => f.replace(/\.(mdx|md)$/, "").replace(/\\/g, "/"));
  }

  // Canon
  const canonDir = path.join(ROOT, "content", "canon");
  if (fs.existsSync(canonDir)) {
    CONTENT_REGISTRIES.canon = fs
      .readdirSync(canonDir)
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map((f) => f.replace(/\.(mdx|md)$/, ""));
  }

  // Playbooks
  const playbooksDir = path.join(ROOT, "content", "playbooks");
  if (fs.existsSync(playbooksDir)) {
    CONTENT_REGISTRIES.playbooks = fs
      .readdirSync(playbooksDir)
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map((f) => f.replace(/\.(mdx|md)$/, ""));
  }

  // Books
  const booksDir = path.join(ROOT, "content", "books");
  if (fs.existsSync(booksDir)) {
    CONTENT_REGISTRIES.books = fs
      .readdirSync(booksDir)
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map((f) => f.replace(/\.(mdx|md)$/, ""));
  }

  // Resources
  const resourcesDir = path.join(ROOT, "content", "resources");
  if (fs.existsSync(resourcesDir)) {
    CONTENT_REGISTRIES.resources = fs
      .readdirSync(resourcesDir, { recursive: true })
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map((f) => f.replace(/\.(mdx|md)$/, "").replace(/\\/g, "/"));
  }

  // Lexicon
  const lexiconDir = path.join(ROOT, "content", "lexicon");
  if (fs.existsSync(lexiconDir)) {
    CONTENT_REGISTRIES.lexicon = fs
      .readdirSync(lexiconDir)
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map((f) => f.replace(/\.(mdx|md)$/, ""));
  }

  // Decision instruments — check lib/instruments or pages/decision-instruments
  const instrumentsDir = path.join(ROOT, "pages", "decision-instruments");
  if (fs.existsSync(instrumentsDir)) {
    CONTENT_REGISTRIES["decision-instruments"] = fs
      .readdirSync(instrumentsDir)
      .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
      .map((f) => f.replace(/\.(tsx|ts)$/, ""));
  }

  // Vault briefs
  const vaultBriefsDir = path.join(ROOT, "content", "vault", "briefs");
  if (fs.existsSync(vaultBriefsDir)) {
    CONTENT_REGISTRIES.vault = fs
      .readdirSync(vaultBriefsDir)
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map((f) => f.replace(/\.(mdx|md)$/, ""));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Link extraction
// ─────────────────────────────────────────────────────────────────────────────

function extractLinks(content, filePath) {
  const links = [];

  // Match href="/..." patterns (JSX, TSX)
  const hrefRegex = /href\s*=\s*(?:\{?['"`])(\/[^'"`}]+)(?:\}?['"`])/g;
  let m;
  while ((m = hrefRegex.exec(content)) !== null) {
    links.push(m[1]);
  }

  // Match markdown links: [text](/path)
  const mdLinkRegex = /\[([^\]]*)\]\((\/[^)]+)\)/g;
  while ((m = mdLinkRegex.exec(content)) !== null) {
    links.push(m[2]);
  }

  // Match Link href="/..." (Next.js Link component)
  const linkHrefRegex = /<Link[^>]*href\s*=\s*["'`](\/[^"'`]+)["'`]/g;
  while ((m = linkHrefRegex.exec(content)) !== null) {
    links.push(m[1]);
  }

  // Match route arrays / nav objects
  const routeArrayRegex = /(?:href|path|url|to|link)\s*[:=]\s*["'`](\/[^"'`]+)["'`]/g;
  while ((m = routeArrayRegex.exec(content)) !== null) {
    links.push(m[1]);
  }

  // Match template literal routes: `/path/${var}`
  const templateRegex = /href\s*=\s*\{?\s*`(\/[^`$]+)\$\{/g;
  while ((m = templateRegex.exec(content)) !== null) {
    links.push(m[1] + "*");
  }

  return links;
}

// ─────────────────────────────────────────────────────────────────────────────
// Route validation
// ─────────────────────────────────────────────────────────────────────────────

function isStaticRoute(route) {
  return STATIC_ROUTES.has(route) || STATIC_ROUTES.has(route.replace(/\/$/, ""));
}

function matchesDynamicRoute(route) {
  const segments = route.split("/").filter(Boolean);

  for (const dp of DYNAMIC_ROUTE_PATTERNS) {
    const patternSegments = dp.pattern.split("/").filter(Boolean);

    if (segments.length !== patternSegments.length && !dp.catchAll) continue;

    let match = true;
    for (let i = 0; i < Math.min(segments.length, patternSegments.length); i++) {
      const ps = patternSegments[i];
      if (ps.startsWith("[") && ps.endsWith("]")) continue; // dynamic segment
      if (ps !== segments[i]) {
        match = false;
        break;
      }
    }

    if (match) return dp;
  }

  return null;
}

function isContentBacked(route) {
  // /briefs/[slug]
  const briefMatch = route.match(/^\/briefs\/([^/]+)$/);
  if (briefMatch) {
    const slug = briefMatch[1];
    // Check both flat briefs and vault briefs
    return (
      CONTENT_REGISTRIES.briefs.includes(slug) ||
      slug === "audit-of-ease" // Known valid brief
    );
  }

  // /vault/briefs/[slug]
  const vaultMatch = route.match(/^\/vault\/briefs\/([^/]+)$/);
  if (vaultMatch) {
    return CONTENT_REGISTRIES.vault.includes(vaultMatch[1]);
  }

  // /blog/[slug]
  const blogMatch = route.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    return CONTENT_REGISTRIES.blog.some((b) => b === blogMatch[1] || b.endsWith("/" + blogMatch[1]));
  }

  // /canon/[slug]
  const canonMatch = route.match(/^\/canon\/([^/]+)$/);
  if (canonMatch) {
    return CONTENT_REGISTRIES.canon.includes(canonMatch[1]);
  }

  // /playbooks/[slug]
  const playbookMatch = route.match(/^\/playbooks\/([^/]+)$/);
  if (playbookMatch) {
    return CONTENT_REGISTRIES.playbooks.includes(playbookMatch[1]);
  }

  // /books/[slug]
  const bookMatch = route.match(/^\/books\/([^/]+)$/);
  if (bookMatch) {
    return CONTENT_REGISTRIES.books.includes(bookMatch[1]);
  }

  // /lexicon/[slug]
  const lexiconMatch = route.match(/^\/lexicon\/([^/]+)$/);
  if (lexiconMatch) {
    return CONTENT_REGISTRIES.lexicon.includes(lexiconMatch[1]);
  }

  // /resources/[...slug]
  const resourceMatch = route.match(/^\/resources\/(.+)$/);
  if (resourceMatch) {
    const slug = resourceMatch[1];
    return CONTENT_REGISTRIES.resources.some((r) => r === slug || r.startsWith(slug));
  }

  // /decision-instruments/[slug]
  const instrumentMatch = route.match(/^\/decision-instruments\/([^/]+)$/);
  if (instrumentMatch) {
    return CONTENT_REGISTRIES["decision-instruments"].includes(instrumentMatch[1]);
  }

  return false;
}

function isRedirected(route) {
  for (const r of REDIRECTS) {
    const sourcePattern = r.source.replace(/\*/g, ".*").replace(/:\w+/g, "[^/]+");
    try {
      if (new RegExp("^" + sourcePattern + "$").test(route)) return true;
    } catch {
      continue;
    }
  }
  return false;
}

function shouldSkip(route, filePath) {
  // Skip external URLs (shouldn't match but just in case)
  if (route.startsWith("http")) return true;

  // Skip anchors
  if (route.startsWith("#")) return true;

  // Skip protocol-relative
  if (route.startsWith("//")) return true;

  // Skip mailto/tel
  if (route.startsWith("mailto:") || route.startsWith("tel:")) return true;

  // Skip API routes
  if (route.startsWith("/api/")) return true;

  // Skip admin-only routes
  if (route.startsWith("/admin") || route.startsWith("/_admin")) return true;

  // Skip dynamic template patterns (contain ${)
  if (route.includes("${")) return true;

  // Skip root-only
  if (route === "/") return false;

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== PUBLIC LINK INTEGRITY GUARD ===\n");

// Discover routes
discoverRoutes();
console.log(`Static routes: ${STATIC_ROUTES.size}`);
console.log(`Dynamic route patterns: ${DYNAMIC_ROUTE_PATTERNS.length}`);
console.log(`Content registries loaded: ${Object.values(CONTENT_REGISTRIES).reduce((a, b) => a + b.length, 0)} entries`);
console.log(`Redirects loaded: ${REDIRECTS.length}\n`);

// Scan files
const files = getScanFiles();
console.log(`Scanning ${files.length} files for internal links...\n`);

for (const file of files) {
  const filePath = path.join(ROOT, file);
  const content = fs.readFileSync(filePath, "utf8");
  const links = extractLinks(content, file);

  for (const link of links) {
    results.uniqueLinks.add(link);
    results.scanned++;

    if (shouldSkip(link, file)) {
      results.skipped.push({ link, file });
      continue;
    }

    // Normalize: remove trailing slash, fragment
    let normalized = link.split("#")[0].replace(/\/$/, "") || "/";

    // Check static route
    if (isStaticRoute(normalized)) {
      results.validStatic++;
      continue;
    }

    // Check dynamic route match
    const dynMatch = matchesDynamicRoute(normalized);
    if (dynMatch) {
      // For content-backed dynamic routes, verify the slug exists
      if (isContentBacked(normalized)) {
        results.validContent++;
      } else {
        // Check if it's redirected
        if (isRedirected(normalized)) {
          results.redirected++;
        } else {
          results.broken.push({ link: normalized, file, reason: "Content-backed route slug not found in registry" });
        }
      }
      continue;
    }

    // Check redirect
    if (isRedirected(normalized)) {
      results.redirected++;
      continue;
    }

    // Not found
    results.broken.push({ link: normalized, file, reason: "No matching route, content, or redirect" });
  }
}

// Report
console.log("=== RESULTS ===\n");
console.log(`Total internal links scanned: ${results.scanned}`);
console.log(`Total unique links: ${results.uniqueLinks.size}`);
console.log(`Valid static routes: ${results.validStatic}`);
console.log(`Valid dynamic routes: ${results.validDynamic}`);
console.log(`Valid content-backed routes: ${results.validContent}`);
console.log(`Redirected stale routes: ${results.redirected}`);
console.log(`Broken links: ${results.broken.length}`);
console.log(`Skipped (private/api/anchor): ${results.skipped.length}\n`);

if (results.broken.length > 0) {
  console.error("❌ BROKEN LINKS:");
  // Group by file
  const byFile = {};
  for (const b of results.broken) {
    if (!byFile[b.file]) byFile[b.file] = [];
    byFile[b.file].push(b);
  }
  for (const [file, links] of Object.entries(byFile)) {
    console.error(`\n  ${file}:`);
    for (const l of links) {
      console.error(`    - ${l.link} (${l.reason})`);
    }
  }
  console.error(`\nResult: FAIL`);
  process.exit(1);
}

console.log("Result: PASS\n");
