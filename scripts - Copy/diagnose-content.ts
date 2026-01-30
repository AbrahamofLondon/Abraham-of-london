// scripts/diagnose-content.ts
import fs from "fs";
import path from "path";

function validateMdxFile(filePath: string): { isValid: boolean; error?: string } {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    const fm = content.match(/^---\n([\s\S]*?)\n---/);
    if (fm) {
      const frontmatter = fm[1];
      const braceCount =
        (frontmatter.match(/{/g) || []).length - (frontmatter.match(/}/g) || []).length;
      const bracketCount =
        (frontmatter.match(/\[/g) || []).length - (frontmatter.match(/\]/g) || []).length;
      const parenCount =
        (frontmatter.match(/\(/g) || []).length - (frontmatter.match(/\)/g) || []).length;

      if (braceCount !== 0) return { isValid: false, error: "Unmatched braces in frontmatter" };
      if (bracketCount !== 0) return { isValid: false, error: "Unmatched brackets in frontmatter" };
      if (parenCount !== 0) return { isValid: false, error: "Unmatched parentheses in frontmatter" };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: `Failed to read file: ${String(error)}` };
  }
}

function scanDir(dir: string, out: string[]) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) scanDir(fullPath, out);
    else if (item.isFile() && (item.name.endsWith(".mdx") || item.name.endsWith(".md"))) {
      const v = validateMdxFile(fullPath);
      if (!v.isValid) out.push(`${fullPath} — ${v.error}`);
    }
  }
}

function main() {
  const contentDir = path.join(process.cwd(), "content");

  if (!fs.existsSync(contentDir)) {
    console.error("❌ Content directory not found:", contentDir);
    process.exit(1);
  }

  console.log("🔎 Scanning content directory for potential MD/MDX issues...");
  const problematic: string[] = [];
  scanDir(contentDir, problematic);

  if (problematic.length) {
    console.log(`❌ Found ${problematic.length} problematic file(s):`);
    for (const p of problematic) console.log("  -", p);
    process.exitCode = 2;
  } else {
    console.log("✅ No obvious MD/MDX syntax issues found.");
  }
}

main();