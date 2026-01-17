// scripts/fix-dynamic-imports.js
const fs = require("fs");
const path = require("path");

const pagesDir = path.join(__dirname, "..", "pages");

// Files with dynamic import errors
const problemFiles = [
  "blog/[slug].tsx",
  "canon/[slug].tsx", 
  "downloads/[slug].tsx",
  "resources/[...slug].tsx",
  "shorts/[slug].tsx",
  "prints/[slug].tsx"
];

function fixDynamicImport(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  
  // Fix pattern: dynamic(() => import("..."), { ssr: false })
  // Change to more compatible pattern
  content = content.replace(
    /dynamic\(\(\) => import\(["'][^"']+["']\)/g,
    'dynamic(() => import("$1").then(mod => ({ default: mod.default || mod })))'
  );
  
  // Fix ReadTime component import specifically
  if (content.includes('import("@/components/enhanced/ReadTime")')) {
    content = content.replace(
      /dynamic\(\(\) => import\(["']@\/components\/enhanced\/ReadTime["']\)/g,
      'dynamic(() => import("@/components/enhanced/ReadTime").then(mod => ({ default: mod.default || mod.ReadTime || mod })))'
    );
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${filePath}`);
}

// Fix each problem file
problemFiles.forEach(relativePath => {
  const fullPath = path.join(pagesDir, relativePath);
  if (fs.existsSync(fullPath)) {
    fixDynamicImport(fullPath);
  }
});
