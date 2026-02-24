import fs from "fs";
import glob from "fast-glob";

const files = await glob(["content/**/*.mdx"]);

files.forEach(file => {
  const buffer = fs.readFileSync(file);
  
  // 1. Convert buffer to string, stripping the Byte Order Mark (BOM) if it exists
  let content = buffer.toString("utf8");
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  // 2. Remove any NULL bytes (\0) which cause "Invalid code point" errors
  content = content.replace(/\0/g, '');

  // 3. Normalize Line Endings (CRLF -> LF)
  content = content.replace(/\r\n/g, '\n');

  // 4. Trim trailing whitespace that causes pointer drift
  content = content.replace(/[ \t]+$/gm, '');

  // 5. Write back as clean UTF-8
  fs.writeFileSync(file, content, { encoding: "utf8" });
});

console.log(`✅ [NUCLEAR]: Sanitized ${files.length} assets at the hex level.`);