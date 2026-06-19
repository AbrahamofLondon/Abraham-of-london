import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FILE_PATH = fileURLToPath(import.meta.url);
const LIB_DIR = dirname(FILE_PATH);
const REPO_ROOT = join(LIB_DIR, "..", "..");

export function runTypeScriptScript(relativeScriptPath, args = []) {
  try {
    loadTypeScriptModule(relativeScriptPath, args);
    return 0;
  } catch (error) {
    console.error(
      error instanceof Error ? error.stack ?? error.message : String(error),
    );
    return 1;
  }
}

export function loadTypeScriptModule(relativeScriptPath, args = []) {
  const require = createRequire(import.meta.url);
  const { createTypeScriptRequire } = require("./register-typescript-require.cjs");
  const tsRequire = createTypeScriptRequire(REPO_ROOT);
  const scriptPath = join(REPO_ROOT, relativeScriptPath);
  const originalArgv = process.argv;

  try {
    process.argv = [process.execPath, scriptPath, ...args];
    return tsRequire(scriptPath);
  } finally {
    process.argv = originalArgv;
  }
}
