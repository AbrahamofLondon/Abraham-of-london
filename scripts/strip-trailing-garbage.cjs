// scripts/strip-trailing-garbage.cjs
// This script reads pages/index.tsx, finds the last valid closing brace '}',
// removes any junk/stray characters after it, and re-saves the file.

const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "pages", "index.tsx");

if (!fs.existsSync(p)) {
  console.log("[guard] pages/index.tsx not found, skipping.");
  process.exit(0);
}

const raw = fs.readFileSync(p, "utf8");

// Find the last valid closing brace '}' in the file,
// which should be the end of either the component or getStaticProps.
const match = raw.match(/^[\s\S]*^\s*}\s*$/m);

if (!match) {
  console.log(
    "[guard] Could not find valid closing brace in pages/index.tsx, skipping.",
  );
  process.exit(0);
}

// Get the clean content up to that last brace
const fixed = match[0].replace(/\s+$/, "") + "\n"; // Add a single newline

if (fixed !== raw) {
  fs.writeFileSync(p, fixed);
  console.log("[guard] Stripped trailing garbage in pages/index.tsx");
} else {
  console.log("[guard] pages/index.tsx is already clean.");
}
