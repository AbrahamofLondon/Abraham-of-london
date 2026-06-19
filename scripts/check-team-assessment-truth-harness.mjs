#!/usr/bin/env node

import {
  loadTypeScriptModule,
  runTypeScriptScript,
} from "./lib/run-typescript-script.mjs";

const moduleExports = loadTypeScriptModule(
  "scripts/lib/run-team-assessment-truth-harness.ts",
  process.argv.slice(2),
);

if (!moduleExports || typeof moduleExports.main !== "function") {
  const exitCode = runTypeScriptScript(
    "scripts/lib/run-team-assessment-truth-harness.ts",
    process.argv.slice(2),
  );
  process.exit(exitCode);
}

try {
  await moduleExports.main();
  process.exit(0);
} catch (error) {
  console.error(
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
  process.exit(1);
}
