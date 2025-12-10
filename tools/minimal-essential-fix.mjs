// tools/minimal-essential-fix.mjs
import fs from "fs";
import path from "path";

console.log("🔧 MINIMAL ESSENTIAL FIXES\n");

// Fix 1: events/index.tsx import syntax
function fixEventsImport() {
  const filePath = "pages/events/index.tsx";
  if (!fs.existsSync(filePath)) return false;

  try {
    let content = fs.readFileSync(filePath, "utf8");
    const original = content;

    // Fix the specific import syntax error
    content = content.replace(
      "getAllEvents(), type Event",
      "getAllEvents, type Event"
    );

    if (content !== original) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log("✅ Fixed events/index.tsx import syntax");
      return true;
    }
  } catch (error) {
    console.log("❌ Error fixing events import:", error.message);
  }
  return false;
}

// Fix 2: Ensure basic React imports in critical files
function ensureReactImports() {
  const criticalFiles = [
    "components/Layout.tsx",
    "pages/_app.tsx",
    "pages/index.tsx",
  ].filter(fs.existsSync);

  let fixed = 0;

  criticalFiles.forEach((filePath) => {
    try {
      let content = fs.readFileSync(filePath, "utf8");

      // Add React import if using React but not imported
      if (
        content.includes("React.") &&
        !content.includes("from 'react'") &&
        !content.includes("import React")
      ) {
        content = `import React from 'react';\n${content}`;
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`✅ Added React import to ${path.basename(filePath)}`);
        fixed++;
      }
    } catch (error) {
      console.log(`❌ Error fixing ${filePath}:`, error.message);
    }
  });

  return fixed;
}

// Fix 3: Remove TypeScript build artifacts causing errors
function cleanBuildArtifacts() {
  const buildArtifacts = [
    ".next/types",
    ".next/build-manifest.json",
    ".next/package.json",
  ];

  let cleaned = 0;
  buildArtifacts.forEach((artifact) => {
    if (fs.existsSync(artifact)) {
      try {
        fs.rmSync(artifact, { recursive: true, force: true });
        console.log(`✅ Removed ${artifact}`);
        cleaned++;
      } catch (error) {
        console.log(`⚠️ Could not remove ${artifact}:`, error.message);
      }
    }
  });

  return cleaned;
}

async function main() {
  console.log("1. Fixing events import...");
  const eventsFixed = fixEventsImport();

  console.log("2. Ensuring React imports...");
  const reactImportsFixed = ensureReactImports();

  console.log("3. Cleaning build artifacts...");
  const artifactsCleaned = cleanBuildArtifacts();

  console.log(`\n📊 SUMMARY:`);
  console.log(`- Events import fixed: ${eventsFixed ? "Yes" : "No"}`);
  console.log(`- React imports fixed: ${reactImportsFixed}`);
  console.log(`- Build artifacts cleaned: ${artifactsCleaned}`);

  // Test the fixes
  console.log("\n🧪 Testing TypeScript...");
  try {
    const { execSync } = await import("child_process");
    execSync("npm run typecheck", { stdio: "inherit" });
  } catch (error) {
    console.log("❌ TypeScript still has errors");
    console.log("Trying build anyway...");

    try {
      execSync("npm run build", { stdio: "inherit" });
    } catch (buildError) {
      console.log("❌ Build failed");
    }
  }
}

main().catch(console.error);
