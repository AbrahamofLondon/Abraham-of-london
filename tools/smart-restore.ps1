param(
  [switch]$Apply,
  [string]$LogPath = "scripts\restore-report.csv"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ----- Paths
$RepoRoot   = (Get-Location).Path
$BackupRoot = Join-Path $RepoRoot 'scripts/_backups'
if (!(Test-Path $BackupRoot)) { Write-Error "Backup root not found: $BackupRoot"; exit 1 }

# UTF-8 without BOM writer
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# ----- Helpers

function Get-AllBackupFiles {
  Get-ChildItem -Path $BackupRoot -Recurse -File -Include *.ts,*.tsx,*.d.ts
}

# Find nearest timestamp ancestor folder (e.g. 2025-10-23T22-03-30-089Z)
function Get-TimestampAncestor([string]$path) {
  $dir = Split-Path $path -Parent
  while ($dir -and ($dir -ne $BackupRoot) -and ($dir -like "$BackupRoot*")) {
    $name = Split-Path $dir -Leaf
    if ($name -match '^\d{4}-\d{2}-\d{2}T') { return $dir }
    $dir = Split-Path $dir -Parent
  }
  return $null
}

# Decode leaf name back to repo relative path:
#  - single "_"  -> path separator
#  - double "__" -> literal underscore
function Decode-BackupLeaf([string]$leaf) {
  $ext  = [IO.Path]::GetExtension($leaf)
  $base = $leaf.Substring(0, $leaf.Length - $ext.Length)
  $ph   = '§UND§'

  $base = $base -replace '__', $ph
  $base = $base -replace '_',  [IO.Path]::DirectorySeparatorChar
  $base = $base -replace [Regex]::Escape($ph), '_'

  $resolved = $base + $ext

  # Strip leading "scripts\" if present (original lived at repo root)
  $prefix = 'scripts' + [IO.Path]::DirectorySeparatorChar
  if ($resolved -like ($prefix + '*')) { $resolved = $resolved.Substring($prefix.Length) }

  # Never land back under _backups
  $prefix2 = '_backups' + [IO.Path]::DirectorySeparatorChar
  if ($resolved -like ($prefix2 + '*')) { $resolved = $resolved.Substring($prefix2.Length) }

  return $resolved
}

# NEW AND IMPROVED FUNCTION: Score readability (focuses on counting non-ASCII for mojibake)
function Get-ReadabilityScore([string]$content) {
  if ([string]::IsNullOrEmpty($content)) { return -100000 }

  $lines    = $content -split "`r?`n"
  $lineCnt  = [math]::Max($lines.Length, 1)
  $maxLen   = ($lines | ForEach-Object { $_.Length } | Measure-Object -Maximum).Maximum
  if (-not $maxLen) { $maxLen = $content.Length }

  # Count non-ASCII chars (mojibake proxy)
  $nonAscii = 0
  foreach ($ch in $content.ToCharArray()) { if ([int][char]$ch -gt 127) { $nonAscii++ } }

  # Slight bias for shorter average lines
  $avgLenDiv5 = [math]::Round(($content.Length / $lineCnt) / 5, 0)

  # Score: more lines good, long single lines bad, mojibake bad
  $score = (10 * $lineCnt) - $maxLen - (20 * $nonAscii) - $avgLenDiv5
  return $score
}

# Build catalog: targetRel -> list of candidate backups with score
Write-Host "Scanning backups..." -ForegroundColor Cyan
$catalog = @{} # key = targetRel, value = list of PSCustomObject(Path, Stamp, Score)

$all = Get-AllBackupFiles
foreach ($bf in $all) {
  $leaf    = Split-Path $bf.FullName -Leaf
  $target  = Decode-BackupLeaf $leaf
  if ([string]::IsNullOrWhiteSpace($target)) { continue }

  # skip node_modules or _backups
  if ($target -like ('node_modules' + [IO.Path]::DirectorySeparatorChar + '*')) { continue }
  if ($target -like ('scripts' + [IO.Path]::DirectorySeparatorChar + '_backups' + [IO.Path]::DirectorySeparatorChar + '*')) { continue }

  $tsDir = Get-TimestampAncestor $bf.FullName
  $stamp = if ($tsDir) { Split-Path $tsDir -Leaf } else { '' }

  $content = [IO.File]::ReadAllText($bf.FullName)
  $score   = Get-ReadabilityScore $content

  if (-not $catalog.ContainsKey($target)) { $catalog[$target] = @() }
  $catalog[$target] += [pscustomobject]@{
    Path   = $bf.FullName
    Stamp  = $stamp
    Score  = $score
    Length = $content.Length
  }
}

if ($catalog.Count -eq 0) {
  Write-Warning "No decodable backup targets discovered."; exit 0
}

# Choose the best candidate per target
$decisions = New-Object System.Collections.Generic.List[object]
foreach ($target in $catalog.Keys) {
  $cands = $catalog[$target] | Sort-Object -Property @{e='Score';Descending=$true}, @{e='Length';Descending=$true}
  $best  = $cands | Select-Object -First 1
  if (-not $best) { continue }

  $targetAbs = Join-Path $RepoRoot $target
  $curText   = ''
  if (Test-Path $targetAbs) { $curText = [IO.File]::ReadAllText($targetAbs) }

  $isSame = $false
  if ($curText.Length -gt 0) {
    # Simple equality check; if needed, normalize newlines first
    $isSame = ($curText -eq ([IO.File]::ReadAllText($best.Path)))
  }

  $decisions.Add([pscustomobject]@{
    TargetRel = $target
    TargetAbs = $targetAbs
    Source    = $best.Path
    Stamp     = $best.Stamp
    Score     = $best.Score
    Action    = (if ($isSame) { if ($Apply) {'SKIP_IDENTICAL'} else {'DRY_RUN_IDENTICAL'} } else { if ($Apply) {'RESTORE'} else {'DRY_RUN_RESTORE'} })
  })
}

# Ensure report folder exists and write CSV
$logAbs = if ([IO.Path]::IsPathRooted($LogPath)) { $LogPath } else { Join-Path $RepoRoot $LogPath }
$logDir = Split-Path $logAbs -Parent
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Force -Path $logDir | Out-Null }

$decisions | Select-Object TargetRel,Stamp,Score,Action,Source |
  Export-Csv -Path $logAbs -Encoding UTF8 -NoTypeInformation

# Apply if requested
$restored = 0
$skipped  = 0

foreach ($d in $decisions) {
  if ($Apply -and $d.Action -eq 'RESTORE') {
    $dir = Split-Path $d.TargetAbs -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $text = [IO.File]::ReadAllText($d.Source)
    [IO.File]::WriteAllText($d.TargetAbs, $text, $Utf8NoBom)
    $restored++
    Write-Host ("RESTORED {0}  <=  {1} [{2}] (score {3})" -f $d.TargetRel, (Split-Path $d.Source -Leaf), $d.Stamp, $d.Score)
  } else {
    $skipped++
    if (-not $Apply) {
      Write-Host ("DRY {0}  <=  {1} [{2}] (score {3})" -f $d.TargetRel, (Split-Path $d.Source -Leaf), $d.Stamp, $d.Score)
    }
  }
}

Write-Host ("Done. Mode: {0}. Restored: {1}. Skipped: {2}. CSV: {3}" -f ($(if ($Apply) {'APPLY'} else {'DRY-RUN'}), $restored, $skipped, $logAbs)) -ForegroundColor Green