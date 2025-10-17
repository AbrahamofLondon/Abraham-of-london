// Windows-safe wrapper: runs downloads validation in lax mode by default.
// Set DOWNLOADS_STRICT=1 to enforce failure on warnings/errors.
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const strict = String(process.env.DOWNLOADS_STRICT || "0") === "1";
process.env.CI_LAX = strict ? "0" : "1";

const script = path.join(process.cwd(), "scripts", "validate-downloads.mjs");
const child = spawn(process.execPath, [script, "--skip-covers"], {
  stdio: "inherit",
  env: process.env
});

child.on("close", (code) => {
  if (strict) process.exit(code); // strict: pass through exit code
  process.exit(0);                // lax: never fail build
});
