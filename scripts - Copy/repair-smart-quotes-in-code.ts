// scripts/repair-smart-quotes-in-code.ts
import fs from "node:fs";
import path from "node:path";

const targets = [
  "pages/auth/signin.tsx",
  "pages/books/the-architecture-of-human-purpose-landing.tsx",
  "pages/brands/index.tsx",
  "pages/contact.tsx",
  "pages/events/index.tsx",
  "pages/subscribe.tsx",
  "components/admin/ShortsAnalytics.tsx",
  "components/mdx/Quote.tsx",
  "components/homepage/AboutSection.tsx",
];

// Only touch likely JSX text nodes: between > ... <
// (This avoids import strings, object keys, etc.)
function fixInJsxText(input: string): string {
  return input.replace(/>([^<]+)</g, (match: string, text: string) => {
    const fixed = text
      // straight double quotes in text → smart quotes
      .replace(/"([^"]*)"/g, '“$1”')  // Fixed: Use proper quote characters
      // apostrophes in common contractions/possessives → curly apostrophe
      .replace(/(\w)'(\w)/g, "$1'$2");
    return `>${fixed}<`;
  });
}

function main(): void {
  let changed = 0;

  for (const filePath of targets) {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }

    const original = fs.readFileSync(filePath, "utf8");
    const next = fixInJsxText(original);

    if (next !== original) {
      // Create backup before writing
      const backupPath = `${filePath}.backup`;
      fs.writeFileSync(backupPath, original, "utf8");
      
      fs.writeFileSync(filePath, next, "utf8");
      console.log(`patched: ${filePath} (backup created at ${backupPath})`);
      changed++;
    } else {
      console.log(`no change: ${filePath}`);
    }
  }

  console.log(`\nDone. Files changed: ${changed}`);
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { fixInJsxText };