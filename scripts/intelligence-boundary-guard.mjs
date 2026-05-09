import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const failures = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    if (exts.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function relative(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function classifyFile(file) {
  const rel = relative(file);
  if (rel.startsWith("pages/api/") || rel.startsWith("app/api/")) return "api";
  if (rel.startsWith("pages/admin/") || rel.startsWith("app/api/admin/") || rel.startsWith("app/admin/") || rel.startsWith("components/admin/")) return "operator";
  if (rel.startsWith("components/Intelligence/operator/") || rel.startsWith("components/Intelligence/internal/")) return "internal";
  if (rel.startsWith("components/Intelligence/user/")) return "user";
  if (rel.startsWith("components/Intelligence/public/")) return "public";
  if (rel.startsWith("pages/") || rel.startsWith("app/")) return "public";
  if (rel.startsWith("components/")) return "public_component";
  return "other";
}

function addFailure(file, reason, detail) {
  failures.push(`${relative(file)}: ${reason}${detail ? ` (${detail})` : ""}`);
}

const files = [
  ...walk(path.join(root, "app")),
  ...walk(path.join(root, "pages")),
  ...walk(path.join(root, "components")),
];

for (const file of files) {
  const rel = relative(file);
  const bucket = classifyFile(file);
  const text = fs.readFileSync(file, "utf8");
  const imports = [...text.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);

  for (const specifier of imports) {
    const genericIntelligence = specifier.startsWith("@/components/Intelligence/")
      && !specifier.includes("/public/")
      && !specifier.includes("/user/")
      && !specifier.includes("/operator/")
      && !specifier.includes("/internal/");
    if (genericIntelligence) {
      addFailure(file, "generic intelligence import forbidden", specifier);
    }

    if (bucket === "public" || bucket === "public_component") {
      if (specifier.includes("/components/Intelligence/internal/")) {
        addFailure(file, "public surface imports internal intelligence", specifier);
      }
      if (specifier.includes("/components/Intelligence/operator/")) {
        addFailure(file, "public surface imports operator intelligence", specifier);
      }
      if (specifier.startsWith("@/lib/engine/")) {
        addFailure(file, "public surface imports lib/engine directly", specifier);
      }
      if (specifier.startsWith("@/lib/decision/kernel")) {
        addFailure(file, "public surface imports decision kernel directly", specifier);
      }
      if (/arbiter/i.test(specifier) && specifier !== "@/components/trust/ArbiterBadge") {
        addFailure(file, "public surface imports arbiter internals directly", specifier);
      }
    }

    if (bucket === "user") {
      if (specifier.includes("/components/Intelligence/internal/")) {
        addFailure(file, "user intelligence imports internal intelligence", specifier);
      }
      if (specifier.startsWith("@/lib/engine/")) {
        addFailure(file, "user intelligence imports lib/engine directly", specifier);
      }
      if (specifier.startsWith("@/lib/decision/kernel")) {
        addFailure(file, "user intelligence imports decision kernel directly", specifier);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("INTELLIGENCE_BOUNDARY_GUARD: FAIL");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("INTELLIGENCE_BOUNDARY_GUARD: PASS");
