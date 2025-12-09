// scripts/check-exports.js (CommonJS for testing)
const fs = require("fs");
const path = require("path");

console.log("🔍 Checking exports by file content analysis...\n");

const filesToCheck = [
  { path: "lib/gtag.ts", exports: ["pageview", "gaEvent"] },
  { path: "lib/server/content-data.ts", exports: ["getContentSlugs"] },
  {
    path: "lib/server/print-utils.ts",
    exports: ["getPrintSlugs", "getPrintBySlug"],
  },
];

filesToCheck.forEach(({ path: filePath, exports: expectedExports }) => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${filePath} - FILE NOT FOUND`);
    return;
  }

  const content = fs.readFileSync(fullPath, "utf8");

  console.log(`${filePath}:`);
  expectedExports.forEach((exportName) => {
    const hasExport =
      content.includes(`export function ${exportName}`) ||
      content.includes(`export const ${exportName}`) ||
      content.includes(`export { ${exportName} }`);

    console.log(`  ${hasExport ? "✅" : "❌"} ${exportName}`);
  });
  console.log("");
});

console.log(
  "💡 If any exports are missing, create the files with the proper exports."
);
