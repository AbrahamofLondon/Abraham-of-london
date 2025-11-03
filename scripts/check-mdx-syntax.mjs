// scripts/check-mdx-syntax.mjs
import { globby } from 'globby';
import fsp from 'fs/promises';
import path from 'path';
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";

const root = process.cwd();

const run = async () => {
  console.log("[MDX Check] Scanning and compiling all .mdx files...");
  
  const files = await globby(["content/**/*.mdx"], { 
    cwd: root,
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  for (const f of files) {
    const src = await fs.readFile(f, "utf8");
    try {
      await compile(src, { jsx: true, remarkPlugins: [remarkGfm] });
    } catch (e) {
      console.error("\n" + "=".repeat(60));
      console.error("❌ FATAL MDX SYNTAX ERROR IN:", path.relative(root, f));
      console.error("=".repeat(60));
      console.error(String(e?.message || e));
      process.exit(1); 
    }
  }
  
  console.log(`✅ [MDX Check] All ${files.length} MDX files compiled cleanly.`);
};

run().catch((e) => { 
  console.error("[MDX Check] A critical error occurred:", e); 
  process.exit(1); 
});