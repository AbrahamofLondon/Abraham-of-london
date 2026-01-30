import fs from "fs";
import path from "path";

type FixResult = {
  file: string;
  changed: boolean;
  replacements: number;
};

const ROOT = process.cwd();

/**
 * Repairs entities that were mistakenly injected inside JSX/HTML tags.
 * Example bad: <h2&gt;Title</h2>
 * Example bad: <p className="x"&gt;10</p>
 *
 * We ONLY replace inside tag bodies:
 *   (<[^>]*?)&gt;([^>]*>)
 *   (<[^>]*?)&lt;([^>]*>)
 *
 * And we repeat until stable because a line may contain multiple tags.
 */
function repairEntitiesInsideTags(src: string): { out: string; count: number } {
  let out = src;
  let total = 0;

  const gtRe = /(<[^>]*?)&gt;([^>]*>)/g;
  const ltRe = /(<[^>]*?)&lt;([^>]*>)/g;

  // Run to fix multiple occurrences in one pass
  let prev: string;
  do {
    prev = out;
    out = out.replace(gtRe, (_m, a, b) => {
      total += 1;
      return `${a}>${b}`;
    });
    out = out.replace(ltRe, (_m, a, b) => {
      total += 1;
      return `${a}<${b}`;
    });
  } while (out !== prev);

  return { out, count: total };
}

/**
 * Limits repair to the known broken files (from your build output).
 * This avoids accidentally touching MDX where &gt; was intended in text.
 */
const BROKEN_FILES = [
  "content/blog/in-my-fathers-house.mdx",
  "content/blog/fathering-principles.mdx",
  "content/blog/principles-for-my-son.mdx",
  "content/blog/surrender-operational-framework.mdx",
  "content/canon/canon-campaign.mdx",
  "content/downloads/leadership-playbook.mdx",
  "content/downloads/standards-brief.mdx",
  "content/downloads/ultimate-purpose-of-man-editorial.mdx",
];

function main() {
  console.log("========================================");
  console.log("🛠️  REPAIR: &gt; / &lt; INSIDE JSX/HTML TAGS ONLY");
  console.log("========================================");

  const results: FixResult[] = [];

  for (const rel of BROKEN_FILES) {
    const abs = path.join(ROOT, rel);

    if (!fs.existsSync(abs)) {
      console.log(`⚠ Missing: ${rel}`);
      results.push({ file: rel, changed: false, replacements: 0 });
      continue;
    }

    const raw = fs.readFileSync(abs, "utf8");
    const { out, count } = repairEntitiesInsideTags(raw);

    const changed = out !== raw;
    if (changed) fs.writeFileSync(abs, out, "utf8");

    console.log(`${changed ? "✅" : "⏭️ "} ${rel}  (${count} replacements)`);
    results.push({ file: rel, changed, replacements: count });
  }

  const totalChanged = results.filter(r => r.changed).length;
  const totalRepl = results.reduce((a, r) => a + r.replacements, 0);

  console.log("----------------------------------------");
  console.log(`Files processed: ${results.length}`);
  console.log(`Files changed:   ${totalChanged}`);
  console.log(`Replacements:    ${totalRepl}`);
  console.log("========================================");
}

main();