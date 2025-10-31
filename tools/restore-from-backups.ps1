param(
  [switch]$Apply,
  [switch]$AppendLog,
  [switch]$RegenNextEnv,
  [switch]$FormatAndTypecheck,
  [string]$LogPath = "scripts\restore-report.csv"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Info($msg){ Write-Host $msg -ForegroundColor Cyan }
function Write-Ok($msg){ Write-Host $msg -ForegroundColor Green }
function Write-Warn($msg){ Write-Host $msg -ForegroundColor Yellow }

$RepoRoot   = (Get-Location).Path
$BackupRoot = Join-Path $RepoRoot "scripts\_backups"

if (-not (Test-Path $BackupRoot)) {
  Write-Error "Backup root not found: $BackupRoot"
  exit 1
}

function Get-TimestampAncestor([string]$path) {
  $dir = Split-Path $path -Parent
  while ($dir -and ($dir -ne $BackupRoot) -and ($dir -like "$BackupRoot*")) {
    $name = Split-Path $dir -Leaf
    if ($name -match '^\d{4}-\d{2}-\d{2}T') { return $dir }
    $dir = Split-Path $dir -Parent
  }
  return $null
}

function Decode-BackupLeaf([string]$leaf) {
  $ext  = [System.IO.Path]::GetExtension($leaf)
  $base = $leaf.Substring(0, $leaf.Length - $ext.Length)

  $placeholder = "UNDERSCORE_PLACEHOLDER"
  $base = $base -replace '__', $placeholder
  $base = $base -replace '_', [System.IO.Path]::DirectorySeparatorChar
  $base = $base -replace [Regex]::Escape($placeholder), '_'

  $resolved = $base + $ext

  $prefix = "scripts" + [IO.Path]::DirectorySeparatorChar
  if ($resolved.StartsWith($prefix)) { $resolved = $resolved.Substring($prefix.Length) }

  $bad = "_backups" + [IO.Path]::DirectorySeparatorChar
  if ($resolved.StartsWith($bad)) { $resolved = $resolved.Substring($bad.Length) }

  return $resolved
}

# Collect backups
$backupFiles = Get-ChildItem -Path $BackupRoot -Recurse -File -Include *.ts,*.tsx,*.d.ts
if (-not $backupFiles) {
  Write-Warn "No backup files found under $BackupRoot"
  exit 0
}

# targetRel -> newest backup info
$map = @{}
foreach ($bf in $backupFiles) {
  $tsDir = Get-TimestampAncestor $bf.FullName
  if (-not $tsDir) { continue }

  $tsName = Split-Path $tsDir -Leaf
  $ts = $null
  try { $ts = [DateTime]::Parse($tsName) } catch {}

  $leaf = Split-Path $bf.FullName -Leaf
  $targetRel = Decode-BackupLeaf $leaf
  if ([string]::IsNullOrWhiteSpace($targetRel)) { continue }

  if ($targetRel -like ("node_modules" + [IO.Path]::DirectorySeparatorChar + "*")) { continue }
  if ($targetRel -like ("scripts" + [IO.Path]::DirectorySeparatorChar + "_backups" + [IO.Path]::DirectorySeparatorChar + "*")) { continue }

  $current = $map[$targetRel]
  $shouldReplace = $false

  if (-not $current) {
    $shouldReplace = $true
  } elseif ($ts -and $current.Timestamp) {
    $shouldReplace = ($ts -gt $current.Timestamp)
  } elseif ($ts -and -not $current.Timestamp) {
    $shouldReplace = $true
  } elseif (-not $ts -and -not $current.Timestamp) {
    $shouldReplace = ($bf.FullName.Length -gt $current.Path.Length)
  }

  if ($shouldReplace) {
    $map[$targetRel] = [pscustomobject]@{
      Path      = $bf.FullName
      Timestamp = $ts
      StampName = $tsName
    }
  }
}

if ($map.Count -eq 0) {
  Write-Warn "No decodable backup targets were discovered."
  exit 0
}

Write-Info ("Discovered {0} target files with backups to consider." -f $map.Count)

# CSV buffering
$rows = New-Object System.Collections.Generic.List[object]
$logFull = Join-Path $RepoRoot $LogPath
$logDir  = Split-Path $logFull -Parent
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Force -Path $logDir | Out-Null }

function Write-CsvRows($path, $objects, [switch]$Append) {
  $csv = $objects | Select-Object TargetPath,Action,BackupFile,BackupStamp,Bytes | ConvertTo-Csv -NoTypeInformation
  if ($Append -and (Test-Path $path)) {
    $csv = $csv | Select-Object -Skip 1
    $csv | Out-File -FilePath $path -Encoding utf8 -Append
  } else {
    $csv | Out-File -FilePath $path -Encoding utf8
  }
}

$restored = 0
$identical = 0

foreach ($kv in $map.GetEnumerator()) {
  $targetRel = $kv.Key
  $srcInfo   = $kv.Value
  $srcPath   = $srcInfo.Path
  $targetAbs = Join-Path $RepoRoot $targetRel

  $targetDir = Split-Path $targetAbs -Parent
  if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Force -Path $targetDir | Out-Null }

  $srcContent = [System.IO.File]::ReadAllText($srcPath)
  $destExists = Test-Path $targetAbs
  $isSame = $false
  if ($destExists) {
    $destContent = [System.IO.File]::ReadAllText($targetAbs)
    $isSame = ($destContent -ceq $srcContent)
  }

  if ($Apply) {
    if (-not $isSame) {
      $utf8bom = New-Object System.Text.UTF8Encoding($true)
      [System.IO.File]::WriteAllText($targetAbs, $srcContent, $utf8bom)
      $restored++
      Write-Ok ("RESTORED: {0}  <=  {1} [{2}]" -f $targetRel, (Split-Path $srcPath -Leaf), $srcInfo.StampName)
      $rows.Add([pscustomobject]@{
        TargetPath = $targetRel
        Action     = "RESTORED"
        BackupFile = $srcPath
        BackupStamp= $srcInfo.StampName
        Bytes      = $srcContent.Length
      })
    } else {
      $identical++
      Write-Warn ("SKIPPED identical: {0}" -f $targetRel)
      $rows.Add([pscustomobject]@{
        TargetPath = $targetRel
        Action     = "SKIPPED_IDENTICAL"
        BackupFile = $srcPath
        BackupStamp= $srcInfo.StampName
        Bytes      = $srcContent.Length
      })
    }
  } else {
    $action = "DRY_RUN_RESTORE"
    if ($isSame) { $action = "DRY_RUN_IDENTICAL" }
    Write-Host ("[DRY] would restore: {0}  <=  {1} [{2}]" -f $targetRel, (Split-Path $srcPath -Leaf), $srcInfo.StampName)
    $rows.Add([pscustomobject]@{
      TargetPath = $targetRel
      Action     = $action
      BackupFile = $srcPath
      BackupStamp= $srcInfo.StampName
      Bytes      = $srcContent.Length
    })
  }
}

if ($AppendLog) {
  Write-CsvRows -path $logFull -objects $rows -Append
} else {
  Write-CsvRows -path $logFull -objects $rows
}

$mode = "DRY-RUN"
if ($Apply) { $mode = "APPLY" }
Write-Host ("Mode: {0}. Restored: {1}. Skipped identical: {2}. CSV: {3}" -f $mode, $restored, $identical, $LogPath) -ForegroundColor Yellow

if ($Apply -and $RegenNextEnv) {
  $nextEnv = Join-Path $RepoRoot "next-env.d.ts"
  $content = @"
/// <reference types="next" />
/// <reference types="next/image-types/global" />
// NOTE: This file should not be edited
"@
  $utf8bom = New-Object System.Text.UTF8Encoding($true)
  [System.IO.File]::WriteAllText($nextEnv, $content, $utf8bom)
  Write-Ok "Regenerated next-env.d.ts"
}

if ($Apply -and $FormatAndTypecheck) {
  try {
    Write-Info "Running Prettier..."
    & npx prettier --log-level warn --write "**/*.{ts,tsx,d.ts}"
  } catch {
    Write-Warn ("Prettier run failed: {0}" -f $_.Exception.Message)
  }
  try {
    Write-Info "Clearing caches..."
    Remove-Item -Recurse -Force .\.next -ErrorAction SilentlyContinue
    Remove-Item -Force .\.tsbuildinfo -ErrorAction SilentlyContinue
  } catch {}
  try {
    Write-Info "Running TypeScript check..."
    & npx tsc -p . --noEmit
  } catch {
    Write-Warn "TypeScript check reported errors."
    throw
  }
}
