/* scripts/fix-encoding-issues.mjs — SURGICAL REPAIR */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const CONTENT_DIRS = [
  path.join(ROOT, "content/books"),
  path.join(ROOT, "content/briefs"),
  path.join(ROOT, "content/resources"),
];

// Targeted regex for control chars and common mangling artifacts
const ILLEGAL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const ESCAPED_TAGS_RE = /&lt;(\/?(?:Callout|Divider|Quote|Note|DocumentHeader|DocumentFooter|BriefAlert|ResponsibilityGrid|Responsibility|ProcessSteps|Step).*?)&gt;/g;

function getFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) results = results.concat(getFiles(file));
    else if (file.endsWith(".mdx") || file.endsWith(".md")) results.push(file);
  });
  return results;
}

async function repairFile(fp) {
  const content = fs.readFileSync(fp, "utf8");
  let fixed = content;

  // 1. Remove Null bytes and illegal control chars
  fixed = fixed.replace(ILLEGAL_CHARS_RE, "");

  // 2. Unescape MDX components (Reverses &lt;Tag&gt; -> <Tag>)
  fixed = fixed.replace(ESCAPED_TAGS_RE, (match, p1) => `<${p1}>`);

  // 3. Normalize Line Endings (Prevents Windows/Unix CRLF mangling)
  fixed = fixed.replace(/\r\n/g, "\n");

  if (content !== fixed) {
    // Safety: Create a backup before writing
    fs.writeFileSync(`${fp}.bak`, content);
    fs.writeFileSync(fp, fixed);
    return true;
  }
  return false;
}

async function run() {
  console.log("🛡️  Starting Surgical Content Repair...");
  const files = CONTENT_DIRS.flatMap(dir => getFiles(dir));
  let repairedCount = 0;

  for (const file of files) {
    const wasRepaired = await repairFile(file);
    if (wasRepaired) {
      repairedCount++;
      console.log(`[FIXED] ${path.relative(ROOT, file)}`);
    }
  }

  console.log(`\n✅ Repair complete. ${repairedCount} files sanitized.`);
  if (repairedCount > 0) {
    console.log("💡 Backups created with .bak extension. Verify and run 'rimraf content/**/*.bak' to clean.");
  }
}

run().catch(console.error);