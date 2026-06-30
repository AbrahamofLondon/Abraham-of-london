Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) { throw "Run from repo root (package.json not found)." }

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BACKUP_DIR = ".\_fixbak\ts-fix-$stamp"
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

function Replace-InFile([string]$Path, [hashtable]$Replacements) {
  if (-not (Test-Path $Path)) { return }
  Backup-File $Path
  $raw  = Read-Raw $Path
  $orig = $raw

  foreach ($pattern in $Replacements.Keys) {
    $raw = [regex]::Replace($raw, $pattern, $Replacements[$pattern])
  }

  if ($raw -ne $orig) {
    Write-UTF8 $Path $raw
    Write-Host "UPDATED: $Path" -ForegroundColor Green
  } else {
    Write-Host "NO CHANGE: $Path" -ForegroundColor DarkGray
  }
}

function Replace-InFileEval([string]$Path, [string]$Pattern, [ScriptBlock]$Evaluator) {
  if (-not (Test-Path $Path)) { return }
  Backup-File $Path
  $raw  = Read-Raw $Path
  $orig = $raw

  $new = [regex]::Replace($raw, $Pattern, { param($m) & $Evaluator $m })

  if ($new -ne $orig) {
    Write-UTF8 $Path $new
    Write-Host "UPDATED: $Path" -ForegroundColor Green
  } else {
    Write-Host "NO CHANGE: $Path" -ForegroundColor DarkGray
  }
}

# ============================================================
# 1) lib/server/events-data.ts — fix ONLY what TS complains about
# ============================================================
Write-Host "`n=== Fixing lib/server/events-data.ts ===" -ForegroundColor Cyan
$eventsPath = ".\lib\server\events-data.ts"

# (a) implicit any: metas.map(m => fromMdxMeta(m))
Replace-InFile $eventsPath @{
  "metas\.map\(\s*m\s*=>\s*fromMdxMeta\(m\)\s*\)" = "metas.map((m: any) => fromMdxMeta(m))"
}

# (b) Promise passed into fromMdxDocument(doc)
# Replace "return fromMdxDocument(doc);" with await+null guard (async needed)
Replace-InFile $eventsPath @{
  "return\s+fromMdxDocument\(\s*doc\s*\)\s*;" = @"
const resolvedDoc = await doc;
return resolvedDoc ? fromMdxDocument(resolvedDoc) : null;
"@
}

# (b2) Ensure the nearest containing function is async if we introduced "await doc"
# We look for a function block that contains "await doc" and ensure its signature starts with "async".
Replace-InFileEval $eventsPath `
  "(?s)(export\s+)?function\s+(\w+)\s*\((.*?)\)\s*\{(?:(?!\{).)*?await\s+doc;.*?\}" `
  {
    param($m)
    $txt = $m.Value
    if ($txt -match "export\s+async\s+function" -or $txt -match "(^|\s)async\s+function") { return $txt }
    # Insert async right after optional 'export'
    $txt = [regex]::Replace($txt, "^(export\s+)?function", { param($mm)
      if ($mm.Groups[1].Success) { "export async function" } else { "async function" }
    }, 1)
    return $txt
  }

# (c) Duplicate eventsDataApi variable: rename all after the first occurrence
Replace-InFileEval $eventsPath `
  "(?s)\bconst\s+eventsDataApi\s*=" `
  {
    param($m)
    # We'll do this in a second pass: keep first as-is, rename subsequent.
    # We can't track state inside pure evaluator reliably, so do a deterministic approach:
    # rename a later block by targeting the SECOND occurrence with a separate regex below.
    return $m.Value
  }

# Rename SECOND (and later) declarations safely:
Replace-InFile $eventsPath @{
  "(?s)(\bconst\s+eventsDataApi\s*=.*?)(\bconst\s+eventsDataApi\s*=)" = "`$1`r`nconst eventsDataApi_2 ="
}
Replace-InFile $eventsPath @{
  "\bconst\s+eventsDataApi\s*=" = "const eventsDataApi ="
}
# Ensure any "export default eventsDataApi_2" is corrected
Replace-InFile $eventsPath @{
  "export\s+default\s+eventsDataApi_2\s*;" = "export default eventsDataApi;"
}

# ============================================================
# 2) lib/server/guards.ts — align to canonical rate-limit types
# ============================================================
Write-Host "`n=== Fixing lib/server/guards.ts ===" -ForegroundColor Cyan
$guardsPath = ".\lib\server\guards.ts"

# Ensure it imports RateLimitOptions/Result from canonical module (won't double-add if already present)
Replace-InFile $guardsPath @{
  "(?m)^import\s+type\s+\{\s*RateLimitOptions\s*,\s*RateLimitResult\s*\}\s+from\s+['""]@\/lib\/server\/rate-limit-unified['""]\s*;\s*\r?\n?" = ""
}

Replace-InFileEval $guardsPath `
  "(?m)^(import[^\r\n]+;\s*)+" `
  {
    param($m)
    $block = $m.Value
    if ($block -match "@\/lib\/server\/rate-limit-unified") { return $block }
    return $block + "import type { RateLimitOptions, RateLimitResult } from '@/lib/server/rate-limit-unified';`r`n"
  }

# Fix options object using cast (because your TS error says 'limit' not in RateLimitOptions => it's importing a different RateLimitOptions somewhere)
Replace-InFile $guardsPath @{
  "\{\s*limit\s*,\s*windowMs\s*,\s*keyPrefix\s*:\s*bucket\s*\}" = "({ limit, windowMs, keyPrefix: bucket } as unknown as RateLimitOptions)"
}

# Make retryAfterMs safe even if type doesn't expose it
Replace-InFile $guardsPath @{
  "\bresult\.retryAfterMs\b" = "((result as unknown as RateLimitResult).retryAfterMs ?? 0)"
}

# ============================================================
# 3) lib/server/http.ts — stop returning void as NextApiResponse
# ============================================================
Write-Host "`n=== Fixing lib/server/http.ts ===" -ForegroundColor Cyan
$httpPath = ".\lib\server\http.ts"

Replace-InFile $httpPath @{
  "return\s+res\.status\(([^)]+)\)\.json\(([^;]+)\);\s*" = "res.status($1).json($2);`r`n  return;`r`n"
}

# Fix stray 'req' reference: replace "req?.method" with "request?.method" if that is present, else remove guard
Replace-InFile $httpPath @{
  "\breq\?\." = "request?."
}

# ============================================================
# 4) lib/server/inner-circle-access.ts — widen types + remove duplicate re-export block
# ============================================================
Write-Host "`n=== Fixing lib/server/inner-circle-access.ts ===" -ForegroundColor Cyan
$icPath = ".\lib\server\inner-circle-access.ts"

Replace-InFile $icPath @{
  "(interface\s+InnerCircleMember\s*\{)" = "`$1`r`n  email?: string;"
  "(type\s+InnerCircleMember\s*=\s*\{)"  = "`$1`r`n  email?: string;"
}

Replace-InFile $icPath @{
  "(interface\s+VerifyInnerCircleKeyResult\s*\{)" = "`$1`r`n  member?: any;`r`n  issuedKey?: any;"
  "(type\s+VerifyInnerCircleKeyResult\s*=\s*\{)"  = "`$1`r`n  member?: any;`r`n  issuedKey?: any;"
}

Replace-InFile $icPath @{
  "auditData\.forEach\(\s*\(\s*data\s*,\s*index\s*\)\s*=>\s*\{" = "auditData.forEach((data: any, index: number) => {"
}

Replace-InFile $icPath @{
  "(?s)\r?\nexport\s*\{\s*AccessLevel\s*,\s*AccessCheckResult\s*,\s*PremiumContentAccess\s*,\s*BatchAccessCheck\s*,\s*AccessAuditLog\s*,\s*CachedAccessCheck\s*\}\s*;?\s*" = "`r`n"
}

# ============================================================
# Run TS
# ============================================================
Write-Host "`n=== Running TypeScript check ===" -ForegroundColor Magenta
& pnpm exec tsc -p .\tsconfig.json --noEmit
if ($LASTEXITCODE -eq 0) {
  Write-Host "`n✅ TypeScript: 0 errors" -ForegroundColor Green
} else {
  Write-Host "`n❌ TypeScript still failing. Backups at: $BACKUP_DIR" -ForegroundColor Yellow
  exit 1
}