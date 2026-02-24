/* scripts/mdx-integrity-check.mjs — PRODUCTION GATEKEEPER */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CONTENT_DIRS = [
  path.join(ROOT, "content", "books"),
  path.join(ROOT, "content", "briefs"),
  path.join(ROOT, "content", "resources"),
];

const TAGS = [
  "Callout", "Divider", "Quote", "Note", "DocumentHeader",
  "DocumentFooter", "BriefAlert", "ResponsibilityGrid",
  "Responsibility", "ProcessSteps", "Step",
];

// REGEX for hidden illegal control characters (matching lib/mdx-utils.ts)
const ILLEGAL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && (p.endsWith(".mdx") || p.endsWith(".md"))) out.push(p);
  }
  return out;
}

function scanFile(fp) {
  const s = fs.readFileSync(fp, "utf8");

  // 1) Escaped tags: &lt;Callout ... &gt;
  const escaped = TAGS.filter((t) => s.includes(`&lt;${t}`) || s.includes(`&lt;/${t}`));

  // 2) Illegal bracket tag: <[Responsibility] ...>
  const illegalBracket = s.includes("<[");

  // 3) Hidden Control Characters (The "Silent Killer")
  const hasIllegalChars = ILLEGAL_CHARS_RE.test(s);

  // 4) Broken closing artifacts
  const brokenClose = /&lt;\/[A-Za-z]/.test(s);

  return { escaped, illegalBracket, brokenClose, hasIllegalChars };
}

const files = CONTENT_DIRS.flatMap((d) => walk(d));
let hadError = false;
const findings = [];

for (const fp of files) {
  const { escaped, illegalBracket, brokenClose, hasIllegalChars } = scanFile(fp);

  if (hasIllegalChars) {
    hadError = true;
    findings.push({ fp, kind: "CORRUPT_ENCODING", detail: "Found hidden control characters (\x00-\x1F). Run 'pnpm fix:encoding' to repair." });
  }

  if (illegalBracket) {
    hadError = true;
    findings.push({ fp, kind: "ILLEGAL_TAG", detail: "Found <[ ...> which MDX cannot parse." });
  }

  if (escaped.length) {
    hadError = true;
    findings.push({ fp, kind: "ESCAPED_TAG", detail: `Escaped MDX tags: ${escaped.join(", ")}` });
  }

  if (brokenClose) {
    hadError = true;
    findings.push({ fp, kind: "BROKEN_CLOSE", detail: "Found escaped closing tag artifacts (likely sanitation/encoding bug)." });
  }
}

if (hadError) {
  console.error("\n[MDX_INTEGRITY] FAILED — Integrity check found critical errors.\n");
  for (const f of findings.slice(0, 50)) {
    const relativePath = path.relative(ROOT, f.fp);
    console.error(`- ${f.kind}: ${relativePath}\n  ${f.detail}\n`);
  }
  if (findings.length > 50) console.error(`...and ${findings.length - 50} more.`);
  process.exit(1);
}

console.log(`[MDX_INTEGRITY] OK — Scanned ${files.length} files. No corruption or escaped tags detected.`);