import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const failures = [];

const deprecatedRedisImports = new Set([
  "@/lib/redis-enhanced.DEPRECATED",
  "@/lib/redis-enhanced.edge.DEPRECATED",
  "@/lib/redis-enhanced.node.DEPRECATED",
  "@/lib/redis-fallback.DEPRECATED",
  "@/lib/redis-wrapper.DEPRECATED",
  "@/lib/server/redis.DEPRECATED",
]);

const deprecatedRecaptchaImports = new Set([
  "@/lib/_recaptchaServer.DEPRECATED",
  "@/lib/verifyRecaptcha",
  "@/lib/isRecaptchaValid",
]);

const clientForbiddenImports = new Set([
  "@/lib/access/tier-policy",
  "@/lib/commercial/pricing-engine",
  "@/lib/commercial/entitlement-authority",
  "@/lib/commercial/entitlements",
  "@/lib/commercial/payment-verification",
  "@/lib/product/commercial-classification",
  "@/lib/prisma",
  "@/lib/prisma.server",
  "@/lib/prisma.pages",
  "@/lib/server/prisma",
  "@/lib/db",
  "@/lib/contentlayer-helper",
  "@/lib/contentlayer-helper.server",
  "@/lib/contentlayer-compat.server",
  "@/lib/contentlayer-generated",
  "@/lib/content/server",
]);

function relative(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") {
        continue;
      }
      files.push(...walk(full));
      continue;
    }

    if (exts.has(path.extname(entry.name))) {
      files.push(full);
    }
  }

  return files;
}

function isClientFile(text) {
  return /^\s*["']use client["']\s*;?/m.test(text);
}

function getImports(text) {
  const specifiers = new Set();
  const patterns = [
    /from\s+["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    /export\s+\*\s+from\s+["']([^"']+)["']/g,
    /export\s+\{[^}]*\}\s+from\s+["']([^"']+)["']/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      if (match[1]) specifiers.add(match[1]);
    }
  }

  return [...specifiers];
}

function addFailure(file, reason, specifier) {
  failures.push(`${relative(file)}: ${reason}${specifier ? ` (${specifier})` : ""}`);
}

const files = [
  ...walk(path.join(root, "app")),
  ...walk(path.join(root, "components")),
  ...walk(path.join(root, "contexts")),
  ...walk(path.join(root, "hooks")),
  ...walk(path.join(root, "lib")),
  ...walk(path.join(root, "pages")),
  ...walk(path.join(root, "netlify")),
];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const imports = getImports(text);
  const clientFile = isClientFile(text);

  for (const specifier of imports) {
    if (deprecatedRedisImports.has(specifier)) {
      addFailure(file, "deprecated Redis import forbidden", specifier);
    }

    if (deprecatedRecaptchaImports.has(specifier)) {
      addFailure(file, "deprecated reCAPTCHA import forbidden", specifier);
    }

    if (clientFile && clientForbiddenImports.has(specifier)) {
      addFailure(file, "client file imports server-only infrastructure module", specifier);
    }

    if (clientFile && specifier.startsWith("@/lib/db/")) {
      addFailure(file, "client file imports Prisma/DB helper", specifier);
    }
  }
}

if (failures.length > 0) {
  console.error("INFRASTRUCTURE_BOUNDARY_GUARD: FAIL");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("INFRASTRUCTURE_BOUNDARY_GUARD: PASS");
