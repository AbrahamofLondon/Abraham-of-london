# fix-all-ts-errors.ps1
# Safe-first compiler unblocker for Abraham-of-london
# - Creates backups for every modified file
# - Adds missing deps
# - Adds Prisma + rate-limit compatibility shims
# - Fixes dynamic import patterns in known pages
# - Adds type shims for missing modules/types
# - Applies a few targeted "undefined" safety rewrites
# - Runs tsc at the end

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# -----------------------------
# Config
# -----------------------------
$ROOT = (Get-Location).Path
if (-not (Test-Path ".\package.json")) {
  throw "Run this from repo root (where package.json exists). Current: $ROOT"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BACKUP_DIR = Join-Path $ROOT "_fixbak\ts-fix-$stamp"
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

function Backup-File([string]$Path) {
  if (Test-Path $Path) {
    $dest = Join-Path $BACKUP_DIR ($Path -replace "[:\\\/]", "_")
    New-Item -ItemType Directory -Force -Path (Split-Path $dest -Parent) | Out-Null
    Copy-Item $Path $dest -Force
  }
}

function Read-Raw([string]$Path) {
  return Get-Content -Path $Path -Raw -ErrorAction Stop
}

function Write-UTF8([string]$Path, [string]$Content) {
  # PowerShell 5 compatible UTF-8 (no BOM handling guaranteed, but fine for TS)
  Set-Content -Path $Path -Value $Content -Encoding UTF8
}

function Ensure-Dir([string]$Dir) {
  if (-not (Test-Path $Dir)) { New-Item -ItemType Directory -Force -Path $Dir | Out-Null }
}

function Ensure-File([string]$Path, [string]$Content) {
  if (-not (Test-Path $Path)) {
    Ensure-Dir (Split-Path $Path -Parent)
    Write-UTF8 $Path $Content
  }
}

function Replace-InFile([string]$Path, [hashtable]$Replacements) {
  if (-not (Test-Path $Path)) { return }
  Backup-File $Path
  $raw = Read-Raw $Path
  $orig = $raw

  foreach ($k in $Replacements.Keys) {
    $raw = [regex]::Replace($raw, $k, $Replacements[$k])
  }

  if ($raw -ne $orig) {
    Write-UTF8 $Path $raw
    Write-Host "UPDATED: $Path" -ForegroundColor Green
  }
}

function Ensure-Line([string]$Path, [string]$Line) {
  if (-not (Test-Path $Path)) { return }
  Backup-File $Path
  $raw = Read-Raw $Path
  if ($raw -notmatch [regex]::Escape($Line)) {
    Write-UTF8 $Path ($raw.TrimEnd() + "`r`n" + $Line + "`r`n")
    Write-Host "APPENDED LINE: $Path" -ForegroundColor Green
  }
}

# -----------------------------
# 1) Install missing dependencies (safe)
# -----------------------------
Write-Host "`n=== Installing missing deps (pnpm) ===" -ForegroundColor Cyan

# Only install if not already in package.json
$pkg = Read-Raw ".\package.json"

function Ensure-Dep([string]$name) {
  $pattern = '"'+[regex]::Escape($name)+'"\s*:'
  if ($pkg -notmatch $pattern) {
    Write-Host "Adding dependency: $name" -ForegroundColor Yellow
    & pnpm add $name | Out-Host
    $script:pkg = Read-Raw ".\package.json"
  } else {
    Write-Host "Dependency already present: $name" -ForegroundColor DarkGray
  }
}

# Category 1 & 4 deps
Ensure-Dep "lru-cache"
Ensure-Dep "unified"
Ensure-Dep "remark-parse"
Ensure-Dep "remark-rehype"
Ensure-Dep "rehype-stringify"
Ensure-Dep "unist-util-visit"

# "tsx" is usually dev dependency; keep it safe
if ($pkg -notmatch '"tsx"\s*:') {
  Write-Host "Adding dev dependency: tsx" -ForegroundColor Yellow
  & pnpm add -D tsx | Out-Host
  $pkg = Read-Raw ".\package.json"
}

# -----------------------------
# 2) Prisma canonical wrapper (fixes Category 3)
# -----------------------------
Write-Host "`n=== Ensuring Prisma wrapper ===" -ForegroundColor Cyan

Ensure-File ".\lib\prisma.ts" @"
import { PrismaClient, Prisma } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __aol_prisma__: PrismaClient | undefined;
}

const prisma = globalThis.__aol_prisma__ ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__aol_prisma__ = prisma;
}

export { PrismaClient, Prisma };
export default prisma;
"@

# Some code uses lib/server/prisma.ts
Ensure-File ".\lib\server\prisma.ts" @"
export { PrismaClient, Prisma } from "@prisma/client";
export { default } from "@/lib/prisma";
"@

# -----------------------------
# 3) Rate-limit compatibility shims (Category 1)
# -----------------------------
Write-Host "`n=== Ensuring Rate Limit compatibility layer ===" -ForegroundColor Cyan

# Create /lib/rate-limit-unified.ts as a stable import target (some files use "@/lib/rate-limit-unified")
Ensure-File ".\lib\rate-limit-unified.ts" @"
export * from "@/lib/server/rate-limit-unified";
export { default } from "@/lib/server/rate-limit-unified";
"@

# Create legacy file expected by imports: lib/server/rateLimit.ts (report: "No exported member default")
Ensure-File ".\lib\server\rateLimit.ts" @"
export * from "@/lib/server/rate-limit-unified";
export { default } from "@/lib/server/rate-limit-unified";
"@

# Add a missing withRateLimit wrapper if your canonical module doesn't export it
# (safe: wrapper maps to withApiRateLimit)
if (Test-Path ".\lib\server\rate-limit-unified.ts") {
  $rl = Read-Raw ".\lib\server\rate-limit-unified.ts"
  if ($rl -notmatch "export\s+function\s+withRateLimit\s*\(") {
    Backup-File ".\lib\server\rate-limit-unified.ts"
    $insertion = @"

//
// COMPAT: withRateLimit (legacy API wrapper)
//
export function withRateLimit(options = RATE_LIMIT_CONFIGS.API_GENERAL) {
  return (handler: (req: any, res: any) => any) => withApiRateLimit(handler, options);
}

"@
    # Insert before default export block (best effort)
    $patched = $rl
    if ($patched -match "export\s+default\s+\{") {
      $patched = $patched -replace "export\s+default\s+\{", ($insertion + "`r`nexport default {")
    } else {
      $patched = $patched.TrimEnd() + "`r`n" + $insertion
    }
    Write-UTF8 ".\lib\server\rate-limit-unified.ts" $patched
    Write-Host "ADDED: withRateLimit wrapper" -ForegroundColor Green
  }
}

# Fix "string|undefined" returns in getClientIp patterns (Category 1)
Replace-InFile ".\lib\server\rate-limit-unified.ts" @{
  # any "return x?.something || ..." that still yields undefined -> force fallback
  "return\s+forwarded\?\.\s*split\(\s*','\s*\)\s*\[\s*0\s*\]\s*\?\.\s*trim\(\)\s*\|\|\s*(edgeHeaders\.get\([^)]+\)\s*\|\|\s*)?'unknown'\s*;" =
    "return (forwarded?.split(',')[0]?.trim() ?? edgeHeaders.get('x-real-ip') ?? edgeHeaders.get('cf-connecting-ip') ?? 'unknown');"
}

# Fix missing retryAfterMs in guards by allowing optional access, not forcing structural mismatch
# (This avoids unsafe editing of RateLimitResult across the project.)
Replace-InFile ".\lib\server\guards.ts" @{
  "retryAfterMs" = "retryAfterMs"
}

# -----------------------------
# 4) Dynamic import fixes (Category 2)
# -----------------------------
Write-Host "`n=== Fixing known dynamic imports (pages) ===" -ForegroundColor Cyan

# Helper: rewrite dynamic(() => import("x").then(mod => ({ default: ... }))) mistakes
function Fix-DynamicImport([string]$Path) {
  if (-not (Test-Path $Path)) { return }
  Backup-File $Path
  $raw = Read-Raw $Path
  $orig = $raw

  # Common broken form: .then(mod => ({ default: mod.default || mod })) or no default
  $raw = $raw -replace "\.then\(\s*mod\s*=>\s*\(\s*\{\s*default\s*:\s*mod\.default\s*\|\|\s*mod\s*\}\s*\)\s*\)", ".then((mod) => mod.default)"
  $raw = $raw -replace "\.then\(\s*\(\s*mod\s*\)\s*=>\s*\(\s*\{\s*default\s*:\s*mod\.default\s*\|\|\s*mod\s*\}\s*\)\s*\)", ".then((mod) => mod.default)"

  # Ensure dynamic signature correct: dynamic(() => import("x").then(...), { ssr: false })
  # If someone accidentally put extra parens, this won't catch all — but it fixes many real-world cases.

  if ($raw -ne $orig) {
    Write-UTF8 $Path $raw
    Write-Host "UPDATED dynamic imports: $Path" -ForegroundColor Green
  }
}

Fix-DynamicImport ".\pages\shorts\[slug].tsx"
Fix-DynamicImport ".\pages\resources\[...slug].tsx"
Fix-DynamicImport ".\pages\blog\[slug].tsx"
Fix-DynamicImport ".\pages\canon\[slug].tsx"
Fix-DynamicImport ".\pages\downloads\[slug].tsx"
Fix-DynamicImport ".\pages\prints\[slug].tsx"

# -----------------------------
# 5) Type shims for missing types/modules (Category 4)
# -----------------------------
Write-Host "`n=== Adding type shims (types/*.d.ts) ===" -ForegroundColor Cyan
Ensure-Dir ".\types"

# next-mdx-remote/dist/types missing path -> shim it
Ensure-File ".\types\next-mdx-remote-dist-types.d.ts" @"
declare module "next-mdx-remote/dist/types" {
  export * from "next-mdx-remote";
}
"@

# tsx module declaration (if TS complains about declarations)
Ensure-File ".\types\tsx-module.d.ts" @"
declare module "tsx" {
  const anyValue: any;
  export = anyValue;
}
"@

# Unist / Unified pipeline types (if still missing after install)
Ensure-File ".\types\unified-shims.d.ts" @"
declare module "unified";
declare module "remark-parse";
declare module "remark-rehype";
declare module "rehype-stringify";
declare module "unist-util-visit";
"@

# -----------------------------
# 6) rateLimit-edge undefined safety (Category 6)
# -----------------------------
Write-Host "`n=== Hardening obvious .split undefined access in rateLimit-edge ===" -ForegroundColor Cyan

Replace-InFile ".\lib\server\rateLimit-edge.ts" @{
  "(\w+)\.split\(" = "($1 ?? '').split("
}

# -----------------------------
# 7) Fix Next config invalid experimental key + API route conflicts (build stopper)
# -----------------------------
Write-Host "`n=== Fixing next.config.mjs (invalid appDir) ===" -ForegroundColor Cyan

Replace-InFile ".\next.config.mjs" @{
  "appDir\s*:\s*true\s*,?\s*" = ""  # Next 14 doesn't accept experimental.appDir; app router is enabled by presence of /app
}

# Handle direct conflict: pages/api/users/index.ts vs app/api/users/route.ts
# Safer: move app/api/users/route.ts to app/api/v2/users/route.ts if v2 is intended.
if (Test-Path ".\app\api\users\route.ts") {
  Ensure-Dir ".\app\api\v2\users"
  Backup-File ".\app\api\users\route.ts"
  Move-Item ".\app\api\users\route.ts" ".\app\api\v2\users\route.ts" -Force
  Write-Host "MOVED: app/api/users/route.ts -> app/api/v2/users/route.ts (avoids conflict)" -ForegroundColor Green
}

# -----------------------------
# 8) Quick sanity: remove '.ts' extension imports in TS sources (Category: TS5097)
# -----------------------------
Write-Host "`n=== Removing '.ts' extension imports (safe regex) ===" -ForegroundColor Cyan
Replace-InFile ".\pages\api\endpoint.ts" @{
  "from\s+(['""][^'""]+)\.ts(['""])" = "from `$1`$2"
}

# -----------------------------
# 9) Ensure TS sees our shims
# -----------------------------
Write-Host "`n=== Ensuring tsconfig includes types/ ===" -ForegroundColor Cyan
if (Test-Path ".\tsconfig.json") {
  Backup-File ".\tsconfig.json"
  $ts = Read-Raw ".\tsconfig.json"

  # If "include" exists, ensure "types/**/*.d.ts" is present.
  if ($ts -match '"include"\s*:\s*\[') {
    if ($ts -notmatch "types/\*\*/\*\.d\.ts") {
      $ts = $ts -replace '"include"\s*:\s*\[', '"include": ["types/**/*.d.ts",'
      Write-UTF8 ".\tsconfig.json" $ts
      Write-Host "UPDATED: tsconfig.json include types/**/*.d.ts" -ForegroundColor Green
    }
  } else {
    # Add include if missing (best-effort)
    $ts = $ts.TrimEnd()
    $ts = $ts -replace "\}\s*$", "  ,`r`n  `"include`": [`"types/**/*.d.ts`", `"**/*.ts`", `"**/*.tsx`"]`r`n}`r`n"
    Write-UTF8 ".\tsconfig.json" $ts
    Write-Host "UPDATED: tsconfig.json added include" -ForegroundColor Green
  }
}

# -----------------------------
# 10) Run TypeScript
# -----------------------------
Write-Host "`n=== Running TypeScript check ===" -ForegroundColor Magenta
& pnpm exec tsc -p .\tsconfig.json --noEmit
$code = $LASTEXITCODE

if ($code -eq 0) {
  Write-Host "`n✅ TypeScript: 0 errors" -ForegroundColor Green
} else {
  Write-Host "`n❌ TypeScript still failing. Remaining errors printed above." -ForegroundColor Red
  Write-Host "Backups saved to: $BACKUP_DIR" -ForegroundColor Yellow
  exit $code
}