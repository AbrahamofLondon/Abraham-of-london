import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const extensions = [".tsx", ".jsx", ".ts", ".js"];
const targetDirs = ["./pages", "./components", "./app", "./layouts"];

function walkDir(dir: string): string[] {
  const files: string[] = [];
  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (extensions.includes(extname(fullPath))) {
      files.push(fullPath);
    }
  }
  return files;
}

function fixFile(filePath: string): boolean {
  let content = readFileSync(filePath, "utf-8");
  let modified = false;

  // Replace ambiguous duration classes with proper values
  if (content.includes('duration-[10s]')) {
    content = content.replace(/duration-\[10s\]/g, "duration-10000");
    modified = true;
  }
  if (content.includes('duration-[4000ms]')) {
    content = content.replace(/duration-\[4000ms\]/g, "duration-4000");
    modified = true;
  }

  if (modified) {
    writeFileSync(filePath, content, "utf-8");
    console.log(`Fixed: ${filePath}`);
  }
  return modified;
}

let fixedCount = 0;
for (const dir of targetDirs) {
  if (statSync(dir, { throwIfNoEntry: false })) {
    const files = walkDir(dir);
    for (const file of files) {
      if (fixFile(file)) fixedCount++;
    }
  }
}

console.log(`Fixed ${fixedCount} files`);
console.log("Duration classes now use standard Tailwind values: duration-4000 and duration-10000");