import fs from "node:fs";

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
function fixInJsxText(input) {
  return input.replace(/>([^<]+)</g, (m, text) => {
    const fixed = text
      // straight double quotes in text → smart quotes
      .replace(/"([^"]*)"/g, ""$1"")
      // apostrophes in common contractions/possessives → curly apostrophe
      .replace(/(\w)'(\w)/g, "$1'$2");
    return `>${fixed}<`;
  });
}

let changed = 0;

for (const p of targets) {
  if (!fs.existsSync(p)) continue;

  const original = fs.readFileSync(p, "utf8");
  const next = fixInJsxText(original);

  if (next !== original) {
    fs.writeFileSync(p, next, "utf8");
    console.log(`patched: ${p}`);
    changed++;
  } else {
    console.log(`no change: ${p}`);
  }
}

console.log(`\nDone. Files changed: ${changed}`);
