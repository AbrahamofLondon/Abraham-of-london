// scripts/fix-content-errors.js
const fs = require("fs");
const path = require("path");

console.log("🔧 Fixing content errors...");

// Move problematic file
const problematicFile = path.join(
  process.cwd(),
  "content",
  "_downloads-registry.md"
);
if (fs.existsSync(problematicFile)) {
  const archiveDir = path.join(process.cwd(), "content", "archive");
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  fs.renameSync(
    problematicFile,
    path.join(archiveDir, "_downloads-registry.md")
  );
  console.log("✅ Moved _downloads-registry.md to archive");
}

// Fix MDX imports in blog posts
const blogDir = path.join(process.cwd(), "content", "blog");
if (fs.existsSync(blogDir)) {
  const blogFiles = fs
    .readdirSync(blogDir)
    .filter((file) => file.endsWith(".mdx"));

  let fixedCount = 0;

  blogFiles.forEach((file) => {
    const filePath = path.join(blogDir, file);
    let content = fs.readFileSync(filePath, "utf8");

    // Replace problematic imports with comments
    const originalContent = content;
    content = content.replace(
      /<ResourcesCTA[^>]*\/>/g,
      "<!-- ResourcesCTA component -->"
    );
    content = content.replace(
      /<BrandFrame[^>]*\/>/g,
      "<!-- BrandFrame component -->"
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      fixedCount++;
    }
  });

  console.log(`✅ Fixed ${fixedCount} blog files with component imports`);
}

console.log("🎉 Content errors fixed successfully!");
process.exit(0);
