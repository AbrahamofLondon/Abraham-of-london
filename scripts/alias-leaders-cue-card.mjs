scripts/alias-leaders-cue-card.mjs
#!/usr/bin/env node
import fs from "node:fs/promises";
import fss from "node:fs";
import path from "node:path";

const DL = path.join(process.cwd(), "public", "downloads");
const src = path.join(DL, "Leaders_Cue_Card.pdf");
const dst = path.join(DL, "leaders-cue-card.pdf");

(async () => {
  if (!fss.existsSync(src)) {
    console.error("source missing:", src);
    process.exit(1);
  }
