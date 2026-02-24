import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CONTENT_PATH = path.join(ROOT, "content");

function surgicallyFix(content) {
  let out = content.replace(/\r/g, "");

  // 1. Mandatory Self-Closing for "Widget" Tags
  // This turns <ShareRow ... > into <ShareRow ... /> if no </ShareRow> exists
  const widgets = ["ShareRow", "Rule", "br", "ResourcesCTA", "HeroEyebrow", "Verse", "BadgeRow"];
  
  widgets.forEach(tag => {
    // Matches <Tag ... > where there is NO corresponding </Tag> in the file
    const openerOnly = new RegExp(`<${tag}([^>]*?)(?<!/)>` , 'g');
    const closer = new RegExp(`</${tag}>`, 'i');
    
    if (!closer.test(out)) {
      out = out.replace(openerOnly, `<${tag}$1 />`);
    }
  });

  // 2. Fix the Note tag specifically
  // Notes usually wrap content, so we ensure they have a closer
  if (out.includes("<Note") && !out.includes("</Note>")) {
    out += "\n</Note>";
  }

  // 3. Fix the PullLine tags (Strip and re-apply for specific flagship lines)
  out = out.replace(/<\/?PullLine[^>]*>/g, ""); // Nuke them all
  const phrases = [
    "I'm raising a man, not a moment",
    "I'm raising a man, not a brand",
    "into legacy; **you design it**",
    "they're **forged-together**",
    "Suffering is not your identity",
    "The cycle breaks when men keep small promises"
  ];

  phrases.forEach(phrase => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^.*${escaped}.*$`, 'gm');
    out = out.replace(regex, (match) => `<PullLine>${match.trim()}</PullLine>`);
  });

  return out;
}

function processFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processFiles(fullPath);
    } else if (entry.name.endsWith(".mdx")) {
      const raw = fs.readFileSync(fullPath, "utf8");
      const fixed = surgicallyFix(raw);
      if (raw !== fixed) {
        fs.writeFileSync(fullPath, fixed, "utf8");
        console.log(`✅ Forced Integrity: ${path.relative(ROOT, fullPath)}`);
      }
    }
  }
}

console.log("🚀 Running Version 7: Component Self-Closing & PullLine Reset...");
processFiles(CONTENT_PATH);
console.log("🏁 Strategy complete.");