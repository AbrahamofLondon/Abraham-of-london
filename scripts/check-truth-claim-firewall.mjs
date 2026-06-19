#!/usr/bin/env node

import { runTypeScriptScript } from "./lib/run-typescript-script.mjs";

const exitCode = runTypeScriptScript(
  "scripts/lib/run-truth-claim-firewall.ts",
  process.argv.slice(2),
);

process.exit(exitCode);
