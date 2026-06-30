Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) { throw "Run from repo root (where package.json exists)." }

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$bakDir = ".\_fixbak\ts-hotfix-stage3-$stamp"
New-Item -ItemType Directory -Force -Path $bakDir | Out-Null

function Backup-File([string]$Path) {
  if (Test-Path $Path) {
    $safe = ($Path -replace "[:\\\/]", "_")
    Copy-Item $Path (Join-Path $bakDir $safe) -Force
  }
}

function Read-Raw([string]$Path) {
  Get-Content -Path $Path -Raw
}

function Write-UTF8([string]$Path, [string]$Content) {
  Set-Content -Path $Path -Value $Content -Encoding UTF8
}

function Replace-Regex([string]$Path, [string]$Pattern, [string]$Replacement, [switch]$DotAll) {
  if (-not (Test-Path $Path)) { return }
  $raw = Read-Raw $Path
  $opts = [System.Text.RegularExpressions.RegexOptions]::None
  if ($DotAll) { $opts = $opts -bor [System.Text.RegularExpressions.RegexOptions]::Singleline }
  $new = [regex]::Replace($raw, $Pattern, $Replacement, $opts)
  if ($new -ne $raw) {
    Write-UTF8 $Path $new
    Write-Host "UPDATED: $Path" -ForegroundColor Green
  } else {
    Write-Host "NO CHANGE: $Path" -ForegroundColor DarkGray
  }
}

function Ensure-Inserted-After-FirstImport([string]$Path, [string]$InsertLine) {
  if (-not (Test-Path $Path)) { return }
  $raw = Read-Raw $Path

  if ($raw -match [regex]::Escape($InsertLine)) {
    Write-Host "NO CHANGE: $Path (insert already present)" -ForegroundColor DarkGray
    return
  }

  $m = [regex]::Match($raw, "(?m)^\s*import[^\r\n]*\r?\n")
  if (-not $m.Success) {
    # No import line; prepend
    $new = $InsertLine + "`n" + $raw
    Write-UTF8 $Path $new
    Write-Host "UPDATED: $Path (prepended insert; no import found)" -ForegroundColor Green
    return
  }

  $idx = $m.Index + $m.Length
  $newRaw = $raw.Substring(0, $idx) + $InsertLine + "`n" + $raw.Substring($idx)
  Write-UTF8 $Path $newRaw
  Write-Host "UPDATED: $Path (inserted after first import)" -ForegroundColor Green
}

function Remove-Second-Matching-Line([string]$Path, [string]$Pattern) {
  if (-not (Test-Path $Path)) { return }
  $lines = Get-Content $Path
  $count = 0
  $out = foreach ($l in $lines) {
    if ($l -match $Pattern) {
      $count++
      if ($count -eq 2) { continue }
    }
    $l
  }
  if ($count -ge 2) {
    Set-Content -Path $Path -Value $out -Encoding UTF8
    Write-Host "UPDATED: $Path (removed duplicate line #2)" -ForegroundColor Green
  } else {
    Write-Host "NO CHANGE: $Path" -ForegroundColor DarkGray
  }
}

Write-Host "`nBackups: $bakDir`n" -ForegroundColor Cyan

# ============================================================
# 1) lib/server/rate-limit-unified.ts
#    - remove duplicate withRateLimit function
#    - ensure RateLimitResult has retryAfterMs?: number
# ============================================================
$rlu = ".\lib\server\rate-limit-unified.ts"
Backup-File $rlu

# Remove the later exported function withRateLimit(...) { ... } (keep const alias)
Replace-Regex $rlu "^\s*export\s+function\s+withRateLimit\s*\([^\)]*\)\s*\{[\s\S]*?\n\}\s*\n" "" -DotAll

# Ensure RateLimitResult contains retryAfterMs?: number (insert right after opening brace if missing)
if (Test-Path $rlu) {
  $raw = Read-Raw $rlu
  if ($raw -match "export\s+type\s+RateLimitResult\s*=\s*\{" -and $raw -notmatch "retryAfterMs\?\s*:") {
    $raw2 = [regex]::Replace(
      $raw,
      "(?s)(export\s+type\s+RateLimitResult\s*=\s*\{\s*)",
      '$1' + "`n  retryAfterMs?: number;`n"
    )
    if ($raw2 -ne $raw) {
      Write-UTF8 $rlu $raw2
      Write-Host "UPDATED: $rlu (added retryAfterMs?: number)" -ForegroundColor Green
    } else {
      Write-Host "NO CHANGE: $rlu" -ForegroundColor DarkGray
    }
  } else {
    Write-Host "NO CHANGE: $rlu" -ForegroundColor DarkGray
  }
}

# ============================================================
# 2) lib/server/rate-limit.ts: lru-cache v11 constructor fix
# ============================================================
$rl = ".\lib\server\rate-limit.ts"
Backup-File $rl

Replace-Regex $rl "(?m)^\s*import\s+LRU\s+from\s+['""]lru-cache['""]\s*;\s*$" "import { LRUCache } from 'lru-cache';"
Replace-Regex $rl "new\s+LRU<" "new LRUCache<"
Replace-Regex $rl "new\s+LRU\s*\(" "new LRUCache("

# ============================================================
# 3) lib/server/guards.ts:
#    - remove duplicate type imports
#    - ensure one canonical type import
#    - fix retryAfter precedence and fallback to resetTime
# ============================================================
$guards = ".\lib\server\guards.ts"
Backup-File $guards

# Remove any RateLimitOptions/RateLimitResult type import lines (we'll add one clean line)
Replace-Regex $guards "(?m)^\s*import\s+type\s+\{\s*RateLimitOptions\s*,\s*RateLimitResult\s*\}\s+from\s+['""][^'""]*rate-limit-unified['""]\s*;\s*$" ""
Replace-Regex $guards "(?m)^\s*import\s+type\s+\{\s*RateLimitOptions\s*,\s*RateLimitResult\s*\}\s+from\s+['""][^'""]*rate-limit-unified\.ts['""]\s*;\s*$" ""

# Fix accidental "two imports on one line" pattern if present
Replace-Regex $guards "(?m)^import\s+\{\s*rateLimit\s*\}\s+from\s+['""][^'""]+rateLimit['""]\s*;\s*import\s+type\s+\{[^\}]+\}\s+from\s+['""][^'""]+rate-limit-unified['""]\s*;\s*$" "import { rateLimit } from '@/lib/server/rateLimit';"

# Ensure canonical import exists
Ensure-Inserted-After-FirstImport $guards "import type { RateLimitOptions, RateLimitResult } from '@/lib/server/rate-limit-unified';"

# Fix bad precedence / use derived retryAfter if retryAfterMs missing
Replace-Regex $guards "(?m)Math\.ceil\(\s*\(result as unknown as RateLimitResult\)\.retryAfterMs\s*\?\?\s*0\s*/\s*1000\s*\)" "Math.ceil((((result as unknown as RateLimitResult).retryAfterMs ?? [Math]::Max(0, ((result as any).resetTime - [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()))) / 1000))"
Replace-Regex $guards "(?m)\(result as unknown as RateLimitResult\)\.retryAfterMs\s*\?\?\s*0\s*/\s*1000" "(((result as unknown as RateLimitResult).retryAfterMs ?? [Math]::Max(0, ((result as any).resetTime - [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()))) / 1000)"

# ============================================================
# 4) lib/server/http.ts: return types + stray req
# ============================================================
$http = ".\lib\server\http.ts"
Backup-File $http

Replace-Regex $http "(?m)\)\s*:\s*NextApiResponse<ApiOk<[^>]+>>" "): void"
Replace-Regex $http "(?m)\)\s*:\s*NextApiResponse<ApiErr>" "): void"
Replace-Regex $http "(?m)^\s*return\s+res\s*;\s*$" ""

# Replace req?.method OPTIONS check with request?.method if req is referenced
Replace-Regex $http "(?m)\bif\s*\(\s*req\?\.(method)\s*===\s*['""]OPTIONS['""]\s*\)" "if (request?.method === 'OPTIONS')"

# ============================================================
# 5) lib/server/md-utils.tsx: duplicate imports + SerializeOptions type
# ============================================================
$md = ".\lib\server\md-utils.tsx"
Backup-File $md

# Remove duplicate MDXRemoteSerializeResult import (second occurrence)
Remove-Second-Matching-Line $md "^\s*import\s+type\s+\{\s*MDXRemoteSerializeResult\s*\}\s+from\s+['""]next-mdx-remote['""]\s*;?\s*$"

# Remove unsupported SerializeOptions import from dist/types
Replace-Regex $md "(?m)^\s*import\s+type\s+\{\s*SerializeOptions\s*\}\s+from\s+['""]next-mdx-remote\/dist\/types['""]\s*;\s*$" ""

# Ensure SerializeOptions is imported from next-mdx-remote/serialize
Ensure-Inserted-After-FirstImport $md "import type { SerializeOptions } from 'next-mdx-remote/serialize';"

# ============================================================
# 6) pages-data/posts-data/prints-data: await getXBySlug + make getAll* async
# ============================================================
$filesAsync = @(
  ".\lib\server\pages-data.ts",
  ".\lib\server\posts-data.ts",
  ".\lib\server\prints-data.ts"
)

foreach ($f in $filesAsync) {
  Backup-File $f

  Replace-Regex $f "(?m)(\b(?:pagesWithContent|postsWithContent|printsWithContent)\.push\()\s*(get(?:Page|Post|Print)BySlug\([^\)]*\))\s*\)" '$1await $2)'

  Replace-Regex $f "(?m)^export\s+function\s+(getAllPages|getAllPosts|getAllPrints)\s*\(\s*\)\s*:\s*([A-Za-z0-9_]+\[\])\s*\{" 'export async function $1(): Promise<$2> {'

  Replace-Regex $f "(?m)\breturn\s+(get(?:Page|Post|Print)BySlug\([^\)]*\))\s*;" "return await `$1;"
}

# ============================================================
# 7) Run TypeScript check
# ============================================================
Write-Host "`n=== Running TypeScript check ===" -ForegroundColor Magenta
& pnpm exec tsc -p .\tsconfig.json --noEmit
if ($LASTEXITCODE -eq 0) {
  Write-Host "`n✅ TypeScript: 0 errors" -ForegroundColor Green
} else {
  Write-Host "`n❌ TypeScript still failing. Backups at: $bakDir" -ForegroundColor Yellow
  exit 1
}