// scripts/mdx-integrity-check.mjs
// Fails build if MDX component tags were escaped or stripped.
// Focus: Callout, Divider, Quote, Note, DocumentHeader/Footer, BriefAlert.

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CONTENT_DIRS = [
  path.join(ROOT, "content", "books"),
  path.join(ROOT, "content", "briefs"),
  path.join(ROOT, "content", "resources"),
];

const TAGS = [
  "Callout",
  "Divider",
  "Quote",
  "Note",
  "DocumentHeader",
  "DocumentFooter",
  "BriefAlert",
  "ResponsibilityGrid",
  "Responsibility",
  "ProcessSteps",
  "Step",
];

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

  // 3) Weird double-slash tags or broken closing artifacts
  const brokenClose = /&lt;\/[A-Za-z]/.test(s);

  return { escaped, illegalBracket, brokenClose };
}

const files = CONTENT_DIRS.flatMap((d) => walk(d));
let hadError = false;

const findings = [];

for (const fp of files) {
  const { escaped, illegalBracket, brokenClose } = scanFile(fp);

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
  console.error("\n[MDX_INTEGRITY] FAILED — MDX content was mutated/escaped before build.\n");
  for (const f of findings.slice(0, 50)) {
    console.error(`- ${f.kind}: ${f.fp}\n  ${f.detail}\n`);
  }
  if (findings.length > 50) console.error(`...and ${findings.length - 50} more.`);
  process.exit(1);
}

console.log(`[MDX_INTEGRITY] OK — scanned ${files.length} files, no escaped/illegal MDX component tags detected.`);