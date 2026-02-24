import fs from "fs";
import glob from "fast-glob";

const CONTENT_DIR = "content";

// ERROR CODES DEFINITION
const ERR = {
  E001: "Dangling Tag Space (e.g. <Component >)",
  E002: "Overshot Opening Tag (Content on same line as <Tag>)",
  E003: "Unescaped Raw Brace { } in Body",
  E004: "Incomplete Closing Tag (e.g. Missing </Component>)",
  E005: "Emoji Pointer Drift (Emoji touching JSX boundary)"
};

async function audit() {
  const files = await glob([`${CONTENT_DIR}/**/*.mdx`]);
  const reports = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");
    let inCodeBlock = false;
    const fileErrors = new Set();

    lines.forEach((line, index) => {
      if (line.trim().startsWith("```")) { inCodeBlock = !inCodeBlock; return; }
      if (inCodeBlock) return;

      // E001: Dangling Spaces
      if (/<[A-Z][a-zA-Z]+\s+>/.test(line)) fileErrors.add("E001");

      // E002: Overshot Tags
      if (/<([A-Z][a-zA-Z]+)([^>]*?)>(?!$|[\s\r\n]*<\/)/.test(line)) {
        if (!line.includes("/>") && !line.includes("</")) fileErrors.add("E002");
      }

      // E003: Raw Braces
      if (line.includes("{") && !line.includes("={") && !line.includes("const") && !line.trim().startsWith("<")) {
        if (!line.includes("`")) fileErrors.add("E003");
      }
      
      // E005: Emoji Proximity
      if (/[\uD800-\uDBFF][\uDC00-\uDFFF][<>]/.test(line)) fileErrors.add("E005");
    });

    if (fileErrors.size > 0) {
      reports.push({ file, errors: Array.from(fileErrors) });
    }
  }

  // --- FINAL SUMMARY REPORT ---
  console.log("\n🏛️  [VAULT AUDIT SUMMARY]");
  console.log("==============================================================");
  console.table(reports.map(r => ({
    File: r.file.split('/').pop(),
    Error_Codes: r.errors.join(", ")
  })));

  console.log("\n📋 [MANUAL ACTION LIST]");
  console.log("--------------------------------------------------------------");
  if (reports.length === 0) {
    console.log("✅ No traitors found. The vault is structurally sound.");
  } else {
    reports.forEach(r => {
      console.log(`📍 FETCH OUT: ${r.file}`);
      r.errors.forEach(code => console.log(`   └─ ${code}: ${ERR[code]}`));
    });
  }
  console.log("==============================================================\n");
}

audit();