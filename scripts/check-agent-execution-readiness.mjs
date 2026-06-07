/**
 * Agent Execution Preflight Check
 * ─────────────────────────────────
 * Run before any major agent task to determine what is possible.
 *
 * Usage:
 *   node scripts/check-agent-execution-readiness.mjs
 *   node scripts/check-agent-execution-readiness.mjs --json
 *
 * Output: READY | READY_WITH_MANUAL_GATES | BLOCKED
 */

import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync, unlinkSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Load .env manually (dotenv not available as ESM in this context)
const envPath = join(fileURLToPath(new URL(".", import.meta.url)), "..", ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const JSON_MODE = process.argv.includes("--json");

const results = [];
const blockers = [];
const manualGates = [];
const warnings = [];

const isWindows = process.platform === "win32";
const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
const pathEntries = (process.env[pathKey] ?? "")
  .split(isWindows ? ";" : ":")
  .filter(Boolean);
const pathext = (process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD")
  .split(";")
  .map((ext) => ext.toLowerCase());

const commonWindowsToolPaths = [
  "C:\\Windows\\System32",
  "C:\\Windows\\System32\\WindowsPowerShell\\v1.0",
  "C:\\Program Files\\PowerShell\\7",
  "C:\\Program Files (x86)\\PowerShell\\7",
  "C:\\Program Files\\Git\\cmd",
  "C:\\Program Files\\GitHub CLI",
  "C:\\Program Files\\nodejs",
];

function candidateNames(name) {
  if (!isWindows) return [name];
  const lower = name.toLowerCase();
  if (pathext.some((ext) => lower.endsWith(ext))) return [name];
  return [name, ...pathext.map((ext) => `${name}${ext}`)];
}

function resolveCommand(name, extraDirs = []) {
  const dirs = [...pathEntries, ...extraDirs];
  for (const dir of dirs) {
    for (const candidate of candidateNames(name)) {
      const full = join(dir, candidate);
      if (existsSync(full)) return full;
    }
  }
  return null;
}

const tools = {
  node: resolveCommand("node", commonWindowsToolPaths),
  pnpm: resolveCommand("pnpm", commonWindowsToolPaths) ?? resolveCommand("pnpm.cmd", commonWindowsToolPaths),
  git: resolveCommand("git", commonWindowsToolPaths),
  gh: resolveCommand("gh", commonWindowsToolPaths) ?? resolveCommand("gh.exe", commonWindowsToolPaths),
  winget: resolveCommand("winget", commonWindowsToolPaths) ?? resolveCommand("winget.exe", commonWindowsToolPaths),
  powershell: resolveCommand("powershell.exe", commonWindowsToolPaths),
  pwsh: resolveCommand("pwsh", commonWindowsToolPaths) ?? resolveCommand("pwsh.exe", commonWindowsToolPaths),
};

function check(label, fn) {
  try {
    const result = fn();
    results.push({ label, status: "ok", detail: result ?? "✓" });
    return true;
  } catch (err) {
    if (String(err.message).includes("EPERM") && String(err.message).includes("spawnSync")) {
      warn(label, `${err.message} — sandbox blocked child process execution; verify by running the command directly in the shell`);
      return false;
    }
    results.push({ label, status: "fail", detail: err.message });
    blockers.push({ label, reason: err.message });
    return false;
  }
}

function manualGate(label, reason) {
  manualGates.push({ label, reason });
  results.push({ label, status: "manual", detail: reason });
}

function warn(label, detail) {
  warnings.push({ label, detail });
  results.push({ label, status: "warn", detail });
}

function runFile(commandPath, args = [], options = {}) {
  if (!commandPath) throw new Error(`command not found: ${options.label ?? args[0] ?? "unknown"}`);
  return execFileSync(commandPath, args, {
    cwd: ROOT,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
    ...options,
  }).trim();
}

function runPnpm(args) {
  return runFile(tools.pnpm, args, { label: "pnpm" });
}

// ─── Checks ───────────────────────────────────────────────────────────────────

if (isWindows) {
  const expectedPowerShellPath = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0";
  const present = pathEntries.some((entry) => entry.toLowerCase() === expectedPowerShellPath.toLowerCase());
  if (!present) {
    warn("PATH contains Windows PowerShell directory", `missing ${expectedPowerShellPath}; add it if gh/npm wrappers need powershell.exe`);
  } else {
    results.push({ label: "PATH contains Windows PowerShell directory", status: "ok", detail: "Windows PowerShell path present" });
  }

  if (!tools.powershell) {
    warn("powershell.exe available", "powershell.exe missing; official gh.exe or PATH repair recommended, but git push may still work");
  } else {
    results.push({ label: "powershell.exe available", status: "ok", detail: tools.powershell });
  }

  if (!tools.winget) {
    warn("winget available", "winget.exe missing; official GitHub CLI installation may require manual installer download");
  } else {
    results.push({ label: "winget available", status: "ok", detail: tools.winget });
  }
}

check("pwsh.exe available", () => {
  if (!tools.pwsh) throw new Error("pwsh.exe missing from PATH/common locations");
  return tools.pwsh;
});

// Node
check("node available", () => {
  const v = runFile(tools.node, ["--version"], { label: "node" });
  return `node ${v}`;
});

// pnpm
check("pnpm available", () => {
  const v = runPnpm(["--version"]);
  return `pnpm ${v} (${tools.pnpm})`;
});

check("git.exe available", () => {
  if (!tools.git) throw new Error("git.exe missing from PATH/common locations");
  return tools.git;
});

check("prisma executable via pnpm exec", () => {
  const out = runPnpm(["exec", "prisma", "--version"]);
  const first = out.split("\n")[0] ?? "prisma resolved";
  return first;
});

// git remote
check("git remote configured", () => {
  const remote = runFile(tools.git, ["remote", "get-url", "origin"], { label: "git" });
  // Redact credentials in URL
  const safe = remote.replace(/:\/\/[^@]+@/, "://***@");
  return safe;
});

// git branch
check("git current branch", () => {
  return runFile(tools.git, ["rev-parse", "--abbrev-ref", "HEAD"], { label: "git" });
});

// git working tree
check("git working tree", () => {
  const status = runFile(tools.git, ["status", "--porcelain"], { label: "git" });
  if (status.length === 0) return "clean";
  const lines = status.split("\n").length;
  return `${lines} modified/untracked file(s)`;
});

// git push dry-run
try {
  const out = runFile(tools.git, ["push", "--dry-run", "origin", "main"], { label: "git" });
  results.push({ label: "git push dry-run", status: "ok", detail: out || "push dry-run succeeded" });
} catch (err) {
  warn("git push dry-run", `push capability not proven: ${err.message}`);
}

// Write access
check("can write temp file", () => {
  const tmpDir = join(ROOT, "tmp");
  mkdirSync(tmpDir, { recursive: true });
  const tmp = join(tmpDir, ".agent-preflight-tmp");
  writeFileSync(tmp, "ok");
  try {
    unlinkSync(tmp);
  } catch (err) {
    warn("temp cleanup", `tmp/.agent-preflight-tmp cleanup failed: ${err.message}`);
  }
  return "write access confirmed";
});

// Prisma schema
check("prisma schema exists", () => {
  const schemaPath = join(ROOT, "prisma", "schema.prisma");
  if (!existsSync(schemaPath)) throw new Error("prisma/schema.prisma not found");
  return schemaPath.replace(ROOT, ".");
});

// DATABASE_URL
check("DATABASE_URL present", () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set in environment");
  // Redact credentials
  const safe = url.replace(/:\/\/[^:]+:[^@]+@/, "://***:***@").slice(0, 60) + "...";
  return `present (${safe})`;
});

// Prisma validate
check("prisma validate", () => {
  runPnpm(["exec", "prisma", "validate", "--schema", "prisma/schema.prisma"]);
  return "schema valid";
});

// Prisma migrate status
check("prisma migrate status", () => {
  let out = "";
  try {
    out = runPnpm(["exec", "prisma", "migrate", "status"]);
  } catch (err) {
    out = `${err.stdout ?? ""}\n${err.stderr ?? ""}`;
  }
  if (out.includes("All migrations have been applied")) return "all applied";
  if (out.includes("have not yet been applied")) {
    const match = out.match(/(\d+) migration/);
    throw new Error(`${match?.[1] ?? "some"} migrations pending — run migrate deploy`);
  }
  return "status checked";
});

// tsconfig
check("tsconfig.json exists", () => {
  if (!existsSync(join(ROOT, "tsconfig.json"))) throw new Error("tsconfig.json missing");
  return "tsconfig.json found";
});

// package.json scripts
check("test:gmi script present", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
  if (!pkg.scripts?.["test:gmi"]) throw new Error("test:gmi script missing from package.json");
  return "test:gmi script registered";
});

// GitHub auth
try {
  if (!tools.gh) throw new Error("gh executable not found");
  const ghDir = dirname(tools.gh).toLowerCase();
  const wrapperRisk = ghDir.includes("node_modules") || tools.gh.toLowerCase().endsWith("gh.cmd") || tools.gh.toLowerCase().endsWith("gh.ps1");
  if (wrapperRisk) {
    warn("github cli implementation", `npm/wrapper gh detected at ${tools.gh}; prefer official GitHub CLI gh.exe`);
  }
  runFile(tools.gh, ["auth", "status"], { label: "gh" });
  results.push({ label: "github auth (gh cli)", status: "ok", detail: "authenticated" });
} catch (err) {
  warn(
    "github auth (gh cli)",
    `gh auth status failed (${err.message}). This is warning-only when git push dry-run succeeds; use official GitHub CLI or refresh auth only if git push fails.`,
  );
}

// Vercel CLI
try {
  const vercel = resolveCommand("vercel", commonWindowsToolPaths);
  const who = runFile(vercel, ["whoami"], { label: "vercel" });
  results.push({ label: "vercel cli auth", status: "ok", detail: `logged in as ${who}` });
} catch {
  warn("vercel cli auth", "vercel whoami failed — REQUIRES_BROWSER_SESSION to re-auth");
}

// ─── Manual gates always present ─────────────────────────────────────────────

manualGate("stripe.webhook.create", "Stripe Dashboard only — agent cannot create webhooks");
manualGate("vercel.env.add", "Vercel Dashboard only — agent cannot add env vars");
manualGate("github.auth.refresh", "Run 'gh auth login' manually only if git push fails; gh auth failure alone is not a deployment blocker");
manualGate("db.migrate.production.confirm", "Agent will ask for explicit confirmation before prisma migrate deploy");
manualGate("db.seed.production.confirm", "Agent will ask for explicit confirmation before production seed");

// ─── Determine overall readiness ─────────────────────────────────────────────

let overallStatus;
if (blockers.length === 0) {
  overallStatus = manualGates.length > 0 ? "READY_WITH_MANUAL_GATES" : "READY";
} else {
  overallStatus = "BLOCKED";
}

// ─── Output ───────────────────────────────────────────────────────────────────

if (JSON_MODE) {
  console.log(JSON.stringify({ status: overallStatus, results, blockers, manualGates, warnings }, null, 2));
} else {
  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Agent Execution Preflight Check");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");

  for (const r of results) {
    const icon = r.status === "ok" ? "✓" : r.status === "fail" ? "✗" : r.status === "warn" ? "⚠" : "○";
    console.log(`  ${icon}  ${r.label.padEnd(40)} ${r.detail}`);
  }

  console.log("");
  console.log("─── Status ─────────────────────────────────────────────────");
  console.log(`  ${overallStatus}`);

  if (blockers.length > 0) {
    console.log("");
    console.log("─── Blockers ───────────────────────────────────────────────");
    for (const b of blockers) {
      console.log(`  ✗  ${b.label}`);
      console.log(`     ${b.reason}`);
    }
  }

  if (warnings.length > 0) {
    console.log("");
    console.log("─── Warnings ───────────────────────────────────────────────");
    for (const w of warnings) {
      console.log(`  ⚠  ${w.label}`);
      console.log(`     ${w.detail}`);
    }
  }

  console.log("");
  console.log("─── Manual Gates (always require human action) ─────────────");
  for (const m of manualGates) {
    console.log(`  ○  ${m.label}`);
    console.log(`     ${m.reason}`);
  }

  console.log("");
}
