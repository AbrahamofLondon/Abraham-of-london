/* scripts/bulk-categorize.mjs */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import chalk from "chalk";

const CONTENT_PATH = path.join(process.cwd(), "content");

// Define your Intelligence Pillars and their associated keywords
const THEMATIC_MAP = {
  "Sovereign Intelligence": ["sovereignty", "independence", "privacy", "crypto", "autonomy"],
  "Institutional Alpha": ["governance", "institutional", "board", "leadership", "organization"],
  "Frontier Resilience": ["survival", "resilience", "readiness", "frontier", "tactical"],
  "Brotherhood": ["covenant", "brother", "men", "unity", "fellowship"],
  "Lexicon": ["definition", "term", "glossary", "meaning"],
  "Apologetics": ["faith", "christianity", "defense", "witness", "theology"]
};

async function bulkCategorize() {
  console.log(chalk.blue.bold("🔍 Scanning 129 Uncategorized briefs for thematic alignment...\n"));

  const getFiles = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap((entry) => {
      const res = path.resolve(dir, entry.name);
      return entry.isDirectory() ? getFiles(res) : res;
    });
  };

  const mdxFiles = getFiles(CONTENT_PATH).filter(f => f.endsWith(".mdx") || f.endsWith(".md"));
  let patchedCount = 0;

  mdxFiles.forEach((file) => {
    const fileContent = fs.readFileSync(file, "utf8");
    const { data, content } = matter(fileContent);

    // Only process if category is missing, "Uncategorized", or empty
    if (!data.category || data.category === "Uncategorized") {
      let foundCategory = null;
      const combinedText = (content + JSON.stringify(data)).toLowerCase();

      for (const [category, keywords] of Object.entries(THEMATIC_MAP)) {
        if (keywords.some(keyword => combinedText.includes(keyword))) {
          foundCategory = category;
          break;
        }
      }

      if (foundCategory) {
        data.category = foundCategory;
        const newContent = matter.stringify(content, data);
        fs.writeFileSync(file, newContent);
        console.log(chalk.green(`📌 Categorized [${path.basename(file)}] as ${foundCategory}`));
        patchedCount++;
      }
    }
  });

  console.log(chalk.blue.bold(`\n--- 📊 CATEGORIZATION COMPLETE ---`));
  console.log(`Updated ${patchedCount} briefs. Run 'npm run sync' to push to Neon.`);
}

bulkCategorize();