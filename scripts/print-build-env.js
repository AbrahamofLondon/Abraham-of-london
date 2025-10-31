const fs = require("fs");

console.log("Node:", process.version);
console.log("CWD :", process.cwd());

// Show tailwind config file chosen
const candidates = [
  "tailwind.config.js",
  "tailwind.config.cjs",
  "tailwind.config.ts",
];
const found = candidates.filter((f) => fs.existsSync(f));
console.log("Tailwind config candidates:", found);
if (found.length) {
  console.log("\n--- Tailwind Config ---");
  console.log(fs.readFileSync(found[0], "utf8"));
}

// Print the exact globals.css lines around 203
const cssPath = "styles/globals.css";
if (fs.existsSync(cssPath)) {
  const lines = fs.readFileSync(cssPath, "utf8").split(/\r?\n/);
  const start = Math.max(0, 202 - 15);
  const end = Math.min(lines.length, 202 + 15);
  console.log(`\n--- ${cssPath} (lines ${start + 1}-${end}) ---`);
  for (let i = start; i < end; i++) {
    console.log(String(i + 1).padStart(4), lines[i]);
  }
} else {
  console.log("\nMissing styles/globals.css?");
}
