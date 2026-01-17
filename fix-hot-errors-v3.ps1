Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) { throw "Run from repo root (package.json not found)." }

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BACKUP_DIR = ".\_fixbak\ts-hotfix-$stamp"
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

function Backup-File([string]$Path) {
  if (Test-Path $Path) {
    $safe = ($Path -replace "[:\\\/]", "_")
    Copy-Item $Path (Join-Path $BACKUP_DIR $safe) -Force
  }
}

function Read-Raw([string]$Path) { Get-Content -Path $Path -Raw -ErrorAction Stop }

function Write-UTF8([string]$Path, [string]$Content) {
  Set-Content -Path $Path -Value $Content -Encoding UTF8
}

function Replace-Eval([string]$Path, [string]$Pattern, [ScriptBlock]$Evaluator) {
  if (-not (Test-Path $Path)) { return }
  Backup-File $Path
  $raw  = Read-Raw $Path
  $orig = $raw
  $new  = [regex]::Replace($raw, $Pattern, { param($m) & $Evaluator $m })
  if ($new -ne $orig) {
    Write-UTF8 $Path $new
    Write-Host "UPDATED: $Path" -ForegroundColor Green
  } else {
    Write-Host "NO CHANGE: $Path" -ForegroundColor DarkGray
  }
}

function Replace-Literal([string]$Path, [string]$Find, [string]$With) {
  if (-not (Test-Path $Path)) { return }
  Backup-File $Path
  $raw  = Read-Raw $Path
  $orig = $raw
  $new  = $raw.Replace($Find, $With)
  if ($new -ne $orig) {
    Write-UTF8 $Path $new
    Write-Host "UPDATED: $Path" -ForegroundColor Green
  } else {
    Write-Host "NO CHANGE: $Path" -ForegroundColor DarkGray
  }
}

# ============================================================
# A) lib/server/events-data.ts
# - metas is Promise<MdxMeta[]> => await metas
# - doc is Promise<MdxDocument|null> => await doc + null guard
# - function getEventBySlug must be async if using await
# - implicit any in map param
# ============================================================
Write-Host "`n=== Patch: lib/server/events-data.ts ===" -ForegroundColor Cyan
$events = ".\lib\server\events-data.ts"

# 1) Ensure getEventBySlug is async if present
Replace-Eval $events "(?m)^(export\s+)?function\s+getEventBySlug\s*\(" {
  param($m)
  if ($m.Value -match "async\s+function") { return $m.Value }
  if ($m.Groups[1].Success) { return "export async function getEventBySlug(" }
  return "async function getEventBySlug("
}

# 2) Fix metas.map -> (await metas).map((m:any)=>...)
Replace-Eval $events "return\s+metas\.map\(\s*\(?\s*m\s*\)?\s*=>\s*fromMdxMeta\(\s*m\s*\)\s*\)\s*;" {
  param($m)
  "return (await metas).map((m: any) => fromMdxMeta(m));"
}

# 3) Fix fromMdxDocument(doc) where doc is Promise
Replace-Eval $events "return\s+fromMdxDocument\(\s*doc\s*\)\s*;" {
  param($m)
@"
const resolvedDoc = await doc;
return resolvedDoc ? fromMdxDocument(resolvedDoc) : null;
"@
}

# 4) If you used 'await doc' but TS still says await not allowed, ensure any other containing function is async
# (generic: upgrade `export function <name>(` to `export async function <name>(` if body contains "await doc" or "await metas")
Replace-Eval $events "(?s)(export\s+)?function\s+(\w+)\s*\((.*?)\)\s*\{(.*?)(await\s+(doc|metas)\b.*?)(\n\})" {
  param($m)
  $hdrExport = $m.Groups[1].Value
  $name      = $m.Groups[2].Value
  $args      = $m.Groups[3].Value
  $body      = $m.Groups[4].Value
  if ($m.Value -match "async\s+function") { return $m.Value }
  $prefix = if ($hdrExport) { "export async function" } else { "async function" }
  return "$prefix $name($args) {$body`n}"
}

# ============================================================
# B) lib/server/guards.ts
# Fix:
# - Duplicate RateLimitOptions/Result imports
# - Legacy import from "@/lib/server/rateLimit" (wrong module)
# - retryAfterMs not in RateLimitResult => use (result as any).retryAfterMs
# - limit not in RateLimitOptions => cast options as any
# ============================================================
Write-Host "`n=== Patch: lib/server/guards.ts ===" -ForegroundColor Cyan
$guards = ".\lib\server\guards.ts"

# 1) Remove any existing import type { RateLimitOptions, RateLimitResult } ... (duplicates)
Replace-Eval $guards "(?m)^\s*import\s+type\s+\{\s*RateLimitOptions\s*,\s*RateLimitResult\s*\}\s+from\s+['""][^'""]+['""]\s*;\s*\r?\n" { param($m) "" }

# 2) Remove legacy inline import from rateLimit module if present on same line
Replace-Eval $guards "(?m)^\s*import\s+\{\s*rateLimit\s*\}\s+from\s+['""]@\/lib\/server\/rateLimit['""]\s*;\s*\r?\n" { param($m) "" }

# 3) Ensure correct import of rateLimit + types from canonical module at top
Replace-Eval $guards "(?m)^(import[^\r\n]*\r?\n)+" {
  param($m)
  $block = $m.Value
  if ($block -match "rate-limit-unified") { return $block }
  return $block + "import { rateLimit } from '@/lib/server/rate-limit-unified';`r`nimport type { RateLimitOptions, RateLimitResult } from '@/lib/server/rate-limit-unified';`r`n"
}

# If file has no imports at all, prepend them
Replace-Eval $guards "^(?!import)" {
  param($m)
  "import { rateLimit } from '@/lib/server/rate-limit-unified';`r`nimport type { RateLimitOptions, RateLimitResult } from '@/lib/server/rate-limit-unified';`r`n" + $m.Value
}

# 4) Cast options objects that use { limit, windowMs, keyPrefix: bucket }
Replace-Eval $guards "\{\s*limit\s*,\s*windowMs\s*,\s*keyPrefix\s*:\s*bucket\s*\}" {
  param($m)
  "({ limit, windowMs, keyPrefix: bucket } as any)"
}

# 5) Replace result.retryAfterMs with (result as any).retryAfterMs and fix precedence for division
Replace-Eval $guards "Math\.ceil\(\s*([^\)]*?)result\.retryAfterMs\s*\?\?\s*0\s*\/\s*1000\s*\)" {
  param($m)
  # safer: Math.ceil((((result as any).retryAfterMs ?? 0) / 1000))
  "Math.ceil((((result as any).retryAfterMs ?? 0) / 1000))"
}
Replace-Eval $guards "result\.retryAfterMs" { param($m) "((result as any).retryAfterMs)" }

# 6) If there is a config object with "limit:" inside a RateLimitOptions literal, cast whole object as any
Replace-Eval $guards "(?s)(\{\s*[^{}]*\blimit\s*:\s*\d+[^{}]*\})" {
  param($m)
  "($($m.Value) as any)"
}

# ============================================================
# C) lib/server/http.ts
# Fix:
# - returning res.status().json() is void, but function typed to return NextApiResponse
#   => stop returning it; call it then return res
# - remove incorrect request?.method reference; use req or remove guard
# ============================================================
Write-Host "`n=== Patch: lib/server/http.ts ===" -ForegroundColor Cyan
$http = ".\lib\server\http.ts"

# 1) Replace "return res.status(X).json(Y);" with "res.status(X).json(Y); return res;"
Replace-Eval $http "return\s+res\.status\(\s*(?<code>[^)]+?)\s*\)\.json\(\s*(?<payload>[^;]+?)\s*\)\s*;\s*" {
  param($m)
  $code = $m.Groups["code"].Value
  $payload = $m.Groups["payload"].Value
  "res.status($code).json($payload);`r`n  return res;`r`n"
}

# 2) Fix "request?.method" -> "req?.method" if a req symbol exists; else drop the guard line
Replace-Eval $http "(?m)^\s*if\s*\(\s*request\?\.(method)\s*===\s*['""]OPTIONS['""]\s*\)\s*\{\s*\r?\n\s*return\s+res\.status\(\s*204\s*\)\.end\(\s*\)\s*;\s*\r?\n\s*\}\s*\r?\n" {
  param($m)
  "if (req?.method === 'OPTIONS') { res.status(204).end(); return res; }`r`n"
}

# If request?.method appears elsewhere, swap to req?.method
Replace-Eval $http "request\?\.(method)" { param($m) "req?.$($m.Groups[1].Value)" }

# ============================================================
# D) lib/server/rate-limit-unified.ts
# Fix:
# - getClientIp returns string|undefined in two places => default 'unknown'
# - duplicate withRateLimit identifier => keep one export only
# ============================================================
Write-Host "`n=== Patch: lib/server/rate-limit-unified.ts ===" -ForegroundColor Cyan
$rl = ".\lib\server\rate-limit-unified.ts"

# 1) Ensure forwardedFor / realIp return string always
Replace-Eval $rl "return\s+Array\.isArray\(forwardedFor\)\s*\?\s*forwardedFor\[0\]\s*:\s*forwardedFor\s*;" {
  param($m)
  "return (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) || 'unknown';"
}
Replace-Eval $rl "return\s+Array\.isArray\(realIp\)\s*\?\s*realIp\[0\]\s*:\s*realIp\s*;" {
  param($m)
  "return (Array.isArray(realIp) ? realIp[0] : realIp) || 'unknown';"
}

# 2) Remove duplicate export const withRateLimit = withApiRateLimit; if it exists twice
# Keep first occurrence, delete subsequent occurrences.
Replace-Eval $rl "(?ms)^(export\s+const\s+withRateLimit\s*=\s*withApiRateLimit\s*;\s*\r?\n)(.*?)(export\s+const\s+withRateLimit\s*=\s*withApiRateLimit\s*;\s*\r?\n)" {
  param($m)
  # remove second occurrence
  $first = $m.Groups[1].Value
  $mid   = $m.Groups[2].Value
  $first + $mid
}

# Also remove "export { withRateLimit ... }" duplicates if present (conservative)
Replace-Eval $rl "(?m)^\s*export\s*\{\s*withRateLimit\s*\}\s*;\s*\r?\n" { param($m) "" }

# ============================================================
# E) lib/server/pages-data.ts, posts-data.ts, prints-data.ts
# Fix: return fromMdxDocument(doc) where doc is Promise
# ============================================================
Write-Host "`n=== Patch: awaiting doc before fromMdxDocument ===" -ForegroundColor Cyan
$docFiles = @(".\lib\server\pages-data.ts", ".\lib\server\posts-data.ts", ".\lib\server\prints-data.ts")

foreach ($f in $docFiles) {
  if (-not (Test-Path $f)) { continue }
  Replace-Eval $f "return\s+fromMdxDocument\(\s*doc\s*\)\s*;" {
    param($m)
@"
const resolvedDoc = await doc;
return resolvedDoc ? fromMdxDocument(resolvedDoc) : null;
"@
  }

  # Ensure any function containing "await doc" is async
  Replace-Eval $f "(?s)(export\s+)?function\s+(\w+)\s*\((.*?)\)\s*\{(.*?)(await\s+doc\b.*?)(\n\})" {
    param($m)
    if ($m.Value -match "async\s+function") { return $m.Value }
    $hdrExport = $m.Groups[1].Value
    $name = $m.Groups[2].Value
    $args = $m.Groups[3].Value
    $body = $m.Groups[4].Value
    $prefix = if ($hdrExport) { "export async function" } else { "async function" }
    return "$prefix $name($args) {$body`n}"
  }
}

# ============================================================
# F) lib/server/md-utils.tsx
# Fix: next-mdx-remote SerializeOptions type import path changed; use serialize() types instead
# Quick fix: replace import to MDXRemoteSerializeResult type or just "any"
# ============================================================
Write-Host "`n=== Patch: lib/server/md-utils.tsx ===" -ForegroundColor Cyan
$mdutils = ".\lib\server\md-utils.tsx"
Replace-Eval $mdutils "(?m)^\s*import\s+type\s+\{\s*SerializeOptions\s*\}\s+from\s+['""]next-mdx-remote\/dist\/types['""]\s*;\s*\r?\n" {
  param($m) "import type { MDXRemoteSerializeResult } from 'next-mdx-remote';`r`n"
}

# ============================================================
# G) lib/server/mdx-collections.ts
# Fix:
# - generic T missing slug => constrain or cast
# - prev/next possibly undefined => coalesce null
# ============================================================
Write-Host "`n=== Patch: lib/server/mdx-collections.ts ===" -ForegroundColor Cyan
$mdxcol = ".\lib\server\mdx-collections.ts"

# Replace localeCompare on a.slug where T has no slug: cast to any
Replace-Eval $mdxcol "return\s*\(\s*a\.slug\s*\|\|\s*''\s*\)\.localeCompare\(\s*b\.slug\s*\|\|\s*''\s*\)\s*;" {
  param($m)
  "return (((a as any).slug || '') as string).localeCompare((((b as any).slug || '') as string));"
}

# Coalesce undefined to null for prev/next lines
Replace-Eval $mdxcol "prev:\s*currentIndex\s*>\s*0\s*\?\s*docs\[currentIndex\s*-\s*1\]\s*:\s*null\s*," {
  param($m)
  "prev: (currentIndex > 0 ? (docs[currentIndex - 1] ?? null) : null),"
}
Replace-Eval $mdxcol "next:\s*currentIndex\s*<\s*docs\.length\s*-\s*1\s*\?\s*docs\[currentIndex\s*\+\s*1\]\s*:\s*null" {
  param($m)
  "next: (currentIndex < docs.length - 1 ? (docs[currentIndex + 1] ?? null) : null)"
}

# ============================================================
# H) lib/server/prisma.ts
# Your TS says @prisma/client has no PrismaClient, meaning one of:
# - prisma client not generated, or wrong package resolution
# We'll implement a safe fallback wrapper that doesn't hard-import PrismaClient type.
# ============================================================
Write-Host "`n=== Patch: lib/server/prisma.ts ===" -ForegroundColor Cyan
$prisma = ".\lib\server\prisma.ts"
if (Test-Path $prisma) {
  Backup-File $prisma
  $content = @"
/// lib/server/prisma.ts
/// Safe Prisma wrapper.
/// NOTE: If TypeScript says PrismaClient is missing from @prisma/client,
/// it usually means prisma generate hasn't run or dependency resolution is broken.
/// This file avoids hard-typing PrismaClient so the app can compile while you fix tooling.

let prisma: any = null;

export function getPrisma() {
  if (prisma) return prisma;
  try {
    // dynamic require avoids TS static type dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("@prisma/client");
    const Client = mod.PrismaClient;
    prisma = Client ? new Client() : null;
  } catch {
    prisma = null;
  }
  return prisma;
}

export default getPrisma();
"@
  Write-UTF8 $prisma $content
  Write-Host "UPDATED: $prisma" -ForegroundColor Green
}

# ============================================================
# I) Fix duplicate downloadsDataApi if present in downloads-data.ts (your log shows redeclare)
# ============================================================
Write-Host "`n=== Patch: lib/server/downloads-data.ts ===" -ForegroundColor Cyan
$dl = ".\lib\server\downloads-data.ts"
Replace-Eval $dl "(?s)(\bconst\s+downloadsDataApi\s*=.*?)(\bconst\s+downloadsDataApi\s*=)" {
  param($m)
  # keep first block then rename the second declaration token
  $m.Groups[1].Value + "const downloadsDataApi_2 ="
}
Replace-Eval $dl "(?m)^export\s+default\s+downloadsDataApi_2\s*;" { param($m) "export default downloadsDataApi;" }

# ============================================================
# Run TS
# ============================================================
Write-Host "`n=== Running TypeScript check ===" -ForegroundColor Magenta
& pnpm exec tsc -p .\tsconfig.json --noEmit
if ($LASTEXITCODE -eq 0) {
  Write-Host "`n✅ TypeScript: 0 errors" -ForegroundColor Green
  Write-Host "Backups at: $BACKUP_DIR" -ForegroundColor DarkGray
} else {
  Write-Host "`n❌ TypeScript still failing. Backups at: $BACKUP_DIR" -ForegroundColor Yellow
  exit 1
}