/* scripts/cleanup-backups.mjs - POST-BUILD SANITIZATION */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CONTENT_DIRS = [
  path.join(ROOT, "content/books"),
  path.join(ROOT, "content/briefs"),
  path.join(ROOT, "content/resources"),
];

function getBackupFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  
  const list = fs.readdirSync(dir);
  for (let file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(getBackupFiles(fullPath));
    } else if (file.endsWith(".bak")) {
      results.push(fullPath);
    }
  }
  return results;
}

async function cleanup() {
  console.log("🧹 [CLEANUP]: Searching for redundancy files (.bak)...");
  
  const backups = CONTENT_DIRS.flatMap(dir => getBackupFiles(dir));
  
  if (backups.length === 0) {
    console.log("✨ [CLEANUP]: No backup files found. Workspace is clean.");
    return;
  }

  let deletedCount = 0;
  for (const file of backups) {
    try {
      fs.unlinkSync(file);
      deletedCount++;
      // console.log(`🗑️ Deleted: ${path.relative(ROOT, file)}`);
    } catch (err) {
      console.error(`❌ [ERROR]: Failed to delete ${file}:`, err.message);
    }
  }

  console.log(`✅ [SUCCESS]: Removed ${deletedCount} backup files from the intelligence portfolio.`);
}

cleanup().catch(err => {
  console.error("❌ [CRITICAL]: Cleanup process failed:", err);
  process.exit(1);
});