#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync(process.execPath, [join(root, "scripts/check-universal-product-gold-standard-98.mjs")], {
  cwd: root,
  stdio: "inherit",
});

process.exitCode = result.status ?? 1;
