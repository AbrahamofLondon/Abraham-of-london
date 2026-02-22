import fs from "fs";
import fg from "fast-glob";

const BOM = "\uFEFF";

async function main() {
  const files = await fg(["content/**/*.mdx"], { dot: false });
  let fixed = 0;

  for (const file of files) {
    const buf = fs.readFileSync(file);              // raw bytes
    // UTF-8 BOM bytes: EF BB BF
    if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
      fs.writeFileSync(file, buf.slice(3));         // write bytes back (no encoding surprises)
      fixed++;
      console.log(`✅ BOM removed: ${file}`);
    }
  }

  console.log(`\n✅ Completed. Files checked: ${files.length}. BOM removed from: ${fixed}.`);
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
