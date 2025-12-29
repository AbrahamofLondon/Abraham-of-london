import fs from "fs";
import path from "path";

// The missing paths identified in your build log
const MISSING_ASSETS = [
  "public/assets/images/canon-resources.jpg",
  "public/assets/images/resources/institutional-health-scorecard.jpg",
  "public/assets/images/resources/leadership-standards-blueprint.jpg",
  "public/assets/images/resources/brotherhood-starter-kit.jpg",
  "public/assets/images/resources/getting-started.jpg",
];

// The source image to use as a placeholder (ensure this exists!)
// We use your global fallback from the config
const SOURCE_IMAGE = "public/assets/images/writing-desk.webp"; 

async function main() {
  const rootDir = process.cwd();
  const sourcePath = path.join(rootDir, SOURCE_IMAGE);

  // 1. Check if source exists
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source image not found at: ${sourcePath}`);
    console.error("Please explicitly create one valid image at that path to use as a placeholder.");
    process.exit(1);
  }

  console.log(`Using source: ${SOURCE_IMAGE}`);

  // 2. Loop through missing assets and copy the source there
  for (const relativePath of MISSING_ASSETS) {
    const destPath = path.join(rootDir, relativePath);
    const destDir = path.dirname(destPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      console.log(`📁 Created directory: ${destDir}`);
    }

    // Copy file if it doesn't exist
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Fixed: ${relativePath}`);
    } else {
      console.log(`Start skipping (already exists): ${relativePath}`);
    }
  }

  console.log("\n🎉 All assets patched. Run 'pnpm build' again to verify.");
}

main().catch(console.error);