/**
 * scripts/mdx-illegal-jsx-gate.mjs
 *
 * Purpose:
 * 1. Detect illegal JSX like: <[Responsibility](/vault/lexicon/responsibility) ...>
 * 2. Automatically repair it into:
 *    <LexiconLink href="/vault/lexicon/responsibility">Responsibility</LexiconLink>
 * 3. Fail build ONLY if unrecoverable illegal JSX remains.
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && (p.endsWith(".mdx") || p.endsWith(".md"))) {
      out.push(p);
    }
  }
  return out;
}

/**
 * Repair pattern:
 * <[Responsibility](/vault/lexicon/responsibility)>
 * or
 * <[Responsibility](/vault/lexicon/responsibility) icon="🕊️">
 */
function repairIllegalBracketTags(source) {
  const illegalPattern = /<\[(.*?)\]\((.*?)\)(.*?)>/g;

  return source.replace(illegalPattern, (_, label, href) => {
    return `<LexiconLink href="${href}">${label}</LexiconLink>`;
  });
}

let hadFatalError = false;
const files = walk(CONTENT_DIR);

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");

  // Step 1: Repair illegal bracket JSX
  const repaired = repairIllegalBracketTags(original);

  if (repaired !== original) {
    fs.writeFileSync(file, repaired, "utf8");
    console.log(`[MDX_GATE] Repaired illegal bracket JSX in: ${file}`);
  }

  // Step 2: Detect remaining illegal `<[` patterns
  if (/<\[/.test(repaired)) {
    console.error(`[MDX_GATE] Unrecoverable illegal JSX in: ${file}`);
    hadFatalError = true;
  }
}

if (hadFatalError) {
  console.error("\n❌ MDX gate failed. Fix remaining illegal JSX manually.");
  process.exit(1);
}

console.log(`[MDX_GATE] Completed. Scanned ${files.length} files. No blocking issues.`);