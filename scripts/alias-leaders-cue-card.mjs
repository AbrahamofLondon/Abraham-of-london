scripts/alias-leaders-cue-card.mjs
#!/usr/bin/env node
import fs from "node:fs/promises";
import fss from "fs";
import path from "path";

const DL = path.join(process.cwd(), "public", "downloads");
const src = path.join(DL, "Leaders_Cue_Card.pdf");
const dst = path.join(DL, "leaders-cue-card.pdf");

(async () => {
  if (!fss.existsSync(src)) {
    console.error("source missing:", src);
    process.exit(1);
  }
  await fs.copyFile(src, dst);
  console.log("created:", path.relative(process.cwd(), dst));
})();
