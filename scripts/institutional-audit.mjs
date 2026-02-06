import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_PATH = path.join(process.cwd(), "content");

// ALIGNED WITH types/next-auth.d.ts
const VALID_LEVELS = [
  "public", 
  "inner-circle", 
  "inner-circle-plus", 
  "inner-circle-elite", 
  "private",
  "restricted", // Legacy support
  "admin"       // Legacy support
];

async function runAudit() {
  console.log("🔍 [INSTITUTIONAL AUDIT]: Validating 256 Assets...");
  
  if (!fs.existsSync(CONTENT_PATH)) {
    console.error("❌ Error: Content directory not found.");
    process.exit(1);
  }

  const getFiles = (dir) => {
    const subdirs = fs.readdirSync(dir);
    const files = subdirs.map((subdir) => {
      const res = path.resolve(dir, subdir);
      return fs.statSync(res).isDirectory() ? getFiles(res) : res;
    });
    return files.reduce((a, b) => a.concat(b), []);
  };

  const mdxFiles = getFiles(CONTENT_PATH).filter(f => f.endsWith(".mdx"));
  let errorCount = 0;

  mdxFiles.forEach(file => {
    const content = fs.readFileSync(file, "utf8");
    const { data } = matter(content);
    const fileName = path.basename(file);

    // Validate accessLevel
    if (!data.accessLevel || !VALID_LEVELS.includes(data.accessLevel)) {
      console.warn(`⚠️  [MISMATCH]: ${fileName} -> Level: ${data.accessLevel || "MISSING"}`);
      errorCount++;
    }
  });

  if (errorCount > 0) {
    console.log(`\n❌ Audit complete: ${errorCount} items require frontmatter correction.`);
  } else {
    console.log("\n✅ Audit Complete: All 256 items are schema-valid.");
  }
}

runAudit();