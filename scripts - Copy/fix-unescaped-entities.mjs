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

function backup(p, content) {
  const b = `${p}.bak`;
  if (!fs.existsSync(b)) fs.writeFileSync(b, content, "utf8");
}

function patch(content) {
  // Conservative replacements:
  // 1) Apostrophes in common contractions -> curly apostrophe
  content = content.replace(/\b([A-Za-z]+)'([A-Za-z]+)\b/g, "$1'$2");

  // 2) Double quotes that appear as standalone quotes in JSX text often look like: ... "word" ...
  // Replace only when surrounded by whitespace or punctuation to reduce code-string risk.
  content = content.replace(/(^|[>\s(\[{])"([^"]+)"([<\s)\]}.,!?;:])/g, '$1"$2"$3');

  // 3) Single quotes used as quotations in text: 'word'
  content = content.replace(/(^|[>\s(\[{])'([^']+)'([<\s)\]}.,!?;:])/g, "$1'$2'$3");

  return content;
}

let changed = 0;

for (const p of targets) {
  if (!fs.existsSync(p)) continue;
  const original = fs.readFileSync(p, "utf8");
  const next = patch(original);

  if (next !== original) {
    backup(p, original);
    fs.writeFileSync(p, next, "utf8");
    console.log(`patched: ${p}`);
    changed++;
  } else {
    console.log(`no change: ${p}`);
  }
}

console.log(`\nDone. Files changed: ${changed}`);