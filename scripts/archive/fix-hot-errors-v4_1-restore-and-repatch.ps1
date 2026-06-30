Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) { throw "Run from repo root (package.json not found)." }

function Get-LatestBackupDir {
  $root = ".\_fixbak"
  if (-not (Test-Path $root)) { throw "No _fixbak folder found. Cannot restore." }

  $dirs = @(
    Get-ChildItem -Path $root -Directory -Filter "ts-hotfix-*"-ErrorAction SilentlyContinue
  ) | Sort-Object Name -Descending

  if ($dirs.Count -eq 0) { throw "No ts-hotfix backup directories found in _fixbak." }
  return $dirs[0].FullName
}

function Get-BackupFilePath([string]$BackupDir, [string]$RepoPath) {
  # Some scripts sanitized using full path, others relative path. Try both.
  $fullSafe = ($RepoPath -replace "[:\\\/]", "_")
  $rel = Resolve-Path $RepoPath | ForEach-Object { $_.Path }
  # relSafe uses path relative to repo root if possible
  $root = (Resolve-Path ".").Path
  $rel2 = $rel
  if ($rel.StartsWith($root)) { $rel2 = $rel.Substring($root.Length).TrimStart("\","/") }
  $relSafe = ($rel2 -replace "[:\\\/]", "_")

  $candidates = @(
    (Join-Path $BackupDir $fullSafe),
    (Join-Path $BackupDir $relSafe)
  )

  foreach ($c in $candidates) {
    if (Test-Path $c) { return $c }
  }

  throw "Backup not found for $RepoPath. Tried: `n- $($candidates[0])`n- $($candidates[1])"
}

function Restore-FromBackup([string]$BackupDir, [string]$RepoPath) {
  $bak = Get-BackupFilePath $BackupDir $RepoPath
  Copy-Item $bak $RepoPath -Force
  Write-Host "RESTORED: $RepoPath" -ForegroundColor Yellow
}

function Read-Raw([string]$Path) { Get-Content -Path $Path -Raw -ErrorAction Stop }

function Write-UTF8([string]$Path, [string]$Content) {
  Set-Content -Path $Path -Value $Content -Encoding UTF8
}

function Backup-File([string]$Path, [string]$BackupDir) {
  if (Test-Path $Path) {
    $safe = ($Path -replace "[:\\\/]", "_")
    Copy-Item $Path (Join-Path $BackupDir $safe) -Force
  }
}

function Replace-Eval([string]$Path, [string]$Pattern, [ScriptBlock]$Evaluator) {
  if (-not (Test-Path $Path)) { return }
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

# ============================================================
# 1) Restore the 3 broken files from latest backup
# ============================================================
$latestBak = Get-LatestBackupDir
Write-Host "`n=== Restoring from latest backup ===" -ForegroundColor Cyan
Write-Host "Using backup: $latestBak" -ForegroundColor DarkGray

$targets = @(
  ".\lib\server\pages-data.ts",
  ".\lib\server\posts-data.ts",
  ".\lib\server\prints-data.ts"
)

foreach ($t in $targets) {
  if (-not (Test-Path $t)) { throw "Missing file: $t" }
  Restore-FromBackup $latestBak $t
}

# Create a NEW backup set for this stage
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$newBak = ".\_fixbak\ts-hotfix-v4_1-$stamp"
New-Item -ItemType Directory -Force -Path $newBak | Out-Null
foreach ($t in $targets) { Backup-File $t $newBak }
Write-Host "Stage v4.1 backups at: $newBak" -ForegroundColor DarkGray

# ============================================================
# 2) Safe repatch: make getXBySlug async + Promise return
#    and await doc WITHOUT inserting stray braces.
# ============================================================
function Patch-DocFlow([string]$FilePath, [string]$FnName, [string]$TypeName) {
  Write-Host "`n--- Patching $FilePath ($FnName) ---" -ForegroundColor Cyan

  # A) Upgrade function signature to async + Promise<...> (exact match only)
  Replace-Eval $FilePath "(?m)^(export\s+)function\s+$FnName\s*\(\s*slug:\s*string\s*\)\s*:\s*$TypeName\s*\|\s*null\s*\{" {
    param($m)
    "export async function $FnName(slug: string): Promise<$TypeName | null> {"
  }

  # B) Rewrite the doc flow safely (single statement substitution, no braces added)
  Replace-Eval $FilePath "(?ms)const\s+doc\s*=\s*(?<rhs>[^;]+?)\s*;\s*return\s+fromMdxDocument\(\s*doc\s*\)\s*;" {
    param($m)
    $rhs = $m.Groups["rhs"].Value.Trim()
@"
const doc = await $rhs;
return doc ? fromMdxDocument(doc) : null;
"@
  }

  # C) If the signature didn’t match exactly, do a looser upgrade:
  Replace-Eval $FilePath "(?m)^(export\s+)function\s+$FnName\s*\(\s*slug:\s*string\s*\)\s*:\s*([A-Za-z0-9_]+)\s*\|\s*null\s*\{" {
    param($m)
    $ret = $m.Groups[2].Value
    "export async function $FnName(slug: string): Promise<$ret | null> {"
  }
}

Patch-DocFlow ".\lib\server\pages-data.ts"  "getPageBySlug"  "PageWithContent"
Patch-DocFlow ".\lib\server\posts-data.ts"  "getPostBySlug"  "PostWithContent"
Patch-DocFlow ".\lib\server\prints-data.ts" "getPrintBySlug" "PrintWithContent"

# ============================================================
# 3) Run TypeScript check
# ============================================================
Write-Host "`n=== Running TypeScript check ===" -ForegroundColor Magenta
& pnpm exec tsc -p .\tsconfig.json --noEmit
if ($LASTEXITCODE -eq 0) {
  Write-Host "`n✅ TypeScript: 0 errors" -ForegroundColor Green
} else {
  Write-Host "`n❌ TypeScript still failing. v4.1 backups at: $newBak" -ForegroundColor Yellow
  exit 1
}