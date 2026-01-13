// scripts/fix-unescaped-entities-safe.ts
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

function backup(filePath: string, content: string): void {
  const backupPath = `${filePath}.bak`;
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, content, "utf8");
  }
}

function patch(content: string): string {
  // Conservative replacements:
  // 1) Apostrophes in common contractions -> curly apostrophe
  content = content.replace(/\b([A-Za-z]+)'([A-Za-z]+)\b/g, "$1'$2");

  // 2) Double quotes that appear as standalone quotes in JSX text
  // Replace only when surrounded by whitespace or punctuation to reduce code-string risk.
  content = content.replace(/(^|[>\s(\[{])"([^"]+)"([<\s)\]}.,!?;:])/g, '$1"$2"$3');

  // 3) Single quotes used as quotations in text: 'word'
  content = content.replace(/(^|[>\s(\[{])'([^']+)'([<\s)\]}.,!?;:])/g, "$1'$2'$3");

  return content;
}

function main(): void {
  let changed = 0;

  for (const filePath of targets) {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }
    
    const original = fs.readFileSync(filePath, "utf8");
    const next = patch(original);

    if (next !== original) {
      backup(filePath, original);
      fs.writeFileSync(filePath, next, "utf8");
      console.log(`patched: ${filePath}`);
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

export { patch, backup };