param(
  [switch]$Apply,
  [string]$LogPath = "scripts\restore-report.csv",
  [switch]$AppendLog
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot   = (Get-Location).Path
$BackupRoot = Join-Path $RepoRoot "scripts\_backups"

if (!(Test-Path $BackupRoot)) {
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

# single "_" => path separator; "__" => literal "_"
function Decode-BackupLeaf([string]$leaf) {
  $ext  = [IO.Path]::GetExtension($leaf)
  $base = $leaf.Substring(0, $leaf.Length - $ext.Length)

  $placeholder = "UNDERSCORE_PLACEHOLDER"
  $base = $base -replace '__', $placeholder
  $base = $base -replace '_', [IO.Path]::DirectorySeparatorChar
  $base = $base -replace [Regex]::Escape($placeholder), '_'

  $resolved = $base + $ext

  # If it starts with "scripts\", strip that prefix (original file lived at repo root)
  $prefix = 'scripts' + [IO.Path]::DirectorySeparatorChar
  if ($resolved.StartsWith($prefix)) { $resolved = $resolved.Substring($prefix.Length) }

  # Never restore back under scripts\_backups
  if ($resolved -like ('_backups' + [IO.Path]::DirectorySeparatorChar + '*')) {
    $resolved = $resolved.Substring(9)
  }

  return $resolved
}

# Gather candidates
$backupFiles = Get-ChildItem -Path $BackupRoot -Recurse -File -Include *.ts,*.tsx,*.d.ts
if (!$backupFiles) {
  Write-Warning "No backup files found under $BackupRoot"
  exit 0
}

# Choose newest per target
$map = @{}  # targetRel -> { Path, Timestamp, StampName }
foreach ($bf in $backupFiles) {
  $tsDir = Get-TimestampAncestor $bf.FullName
  if (-not $tsDir) { continue }

  $tsName = Split-Path $tsDir -Leaf
  $ts = $null
  try { $ts = [DateTime]::Parse($tsName) } catch {}

  $leaf      = Split-Path $bf.FullName -Leaf
  $targetRel = Decode-BackupLeaf $leaf
  if ([string]::IsNullOrWhiteSpace($targetRel)) { continue }

  # skip node_modules and backups
  if ($targetRel -like ('node_modules' + [IO.Path]::DirectorySeparatorChar + '*')) { continue }
  if ($targetRel -like ('scripts' + [IO.Path]::DirectorySeparatorChar + '_backups' + [IO.Path]::DirectorySeparatorChar + '*')) { continue }

  $current = $map[$targetRel]
  $replace = $false
  if (-not $current) { $replace = $true }
  elseif ($ts -and $current.Timestamp) { $replace = ($ts -gt $current.Timestamp) }
  elseif ($ts -and -not $current.Timestamp) { $replace = $true }
  elseif (-not $ts -and -not $current.Timestamp) { $replace = ($bf.FullName.Length -gt $current.Path.Length) }

  if ($replace) {
    $map[$targetRel] = [pscustomobject]@{
      Path      = $bf.FullName
      Timestamp = $ts
      StampName = $tsName
    }
  }
}

if ($map.Count -eq 0) {
  Write-Warning "No decodable backup targets were discovered."
  exit 0
}

# Prepare CSV
$csvDir = Split-Path $LogPath -Parent
if ($csvDir -and -not (Test-Path $csvDir)) { New-Item -ItemType Directory -Force -Path $csvDir | Out-Null }
$rows = New-Object System.Collections.Generic.List[object]

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$restored = 0
$skipped  = 0

Write-Host "Selected $($map.Count) targets from backups under $BackupRoot"

foreach ($kv in $map.GetEnumerator()) {
  $targetRel = $kv.Key
  $srcInfo   = $kv.Value
  $srcPath   = $srcInfo.Path
  $targetAbs = Join-Path $RepoRoot $targetRel

  $identical = $false
  if (Test-Path $targetAbs) {
    $current = [IO.File]::ReadAllText($targetAbs)
    $backup  = [IO.File]::ReadAllText($srcPath)
    $identical = ($current -ceq $backup)
  }

  if ($Apply -and -not $identical) {
    $dir = Split-Path $targetAbs -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $content = [IO.File]::ReadAllText($srcPath)
    [IO.File]::WriteAllText($targetAbs, $content, $utf8NoBom)
    $restored++
    Write-Host ("RESTORED  {0}  <=  {1} [{2}]" -f $targetRel, (Split-Path $srcPath -Leaf), $srcInfo.StampName)
    $rows.Add([pscustomobject]@{
      Timestamp = Get-Date -Format o
      Mode      = "APPLY"
      TargetRel = $targetRel
      Source    = $srcPath
      Stamp     = $srcInfo.StampName
      Action    = "RESTORE"
    })
  }
  else {
    $skipped++
    $mode = $Apply ? "APPLY" : "DRY_RUN"
    $action = $identical ? ($Apply ? "SKIP_IDENTICAL" : "DRY_RUN_IDENTICAL") : "DRY_RUN_RESTORE"
    Write-Host ("$action  {0}  <=  {1} [{2}]" -f $targetRel, (Split-Path $srcPath -Leaf), $srcInfo.StampName)
    $rows.Add([pscustomobject]@{
      Timestamp = Get-Date -Format o
      Mode      = $mode
      TargetRel = $targetRel
      Source    = $srcPath
      Stamp     = $srcInfo.StampName
      Action    = $action
    })
  }
}

# Write CSV
if ($AppendLog -and (Test-Path $LogPath)) {
  $rows | Export-Csv -Path $LogPath -Append -NoTypeInformation -Encoding UTF8
} else {
  $rows | Export-Csv -Path $LogPath -NoTypeInformation -Encoding UTF8
}

Write-Host ("Done. Restored: {0}. Skipped/checked: {1}. CSV: {2}" -f $restored, $skipped, $LogPath)
