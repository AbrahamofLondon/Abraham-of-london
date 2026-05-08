[CmdletBinding()]
param(
  [switch]$Apply
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Conservative executor for the root-artifact hygiene ledger.
# - Reads docs/repository-hygiene-ledger.md
# - Moves only MOVE_TO_DOCS_ARCHIVE and MOVE_TO_SCRIPTS_ARCHIVE files
# - Never deletes anything
# - Defaults to dry-run unless -Apply is explicitly passed

$repoRoot = Split-Path -Parent $PSScriptRoot
$ledgerPath = Join-Path $repoRoot "docs\repository-hygiene-ledger.md"
$docsArchive = Join-Path $repoRoot "docs\archive\reports"
$scriptsArchive = Join-Path $repoRoot "scripts\archive"
$reviewArchive = Join-Path $repoRoot "archive\review-required"

if (-not (Test-Path -LiteralPath $ledgerPath)) {
  throw "Ledger not found: $ledgerPath"
}

$isDryRun = -not $Apply.IsPresent

Write-Host "Repository hygiene executor"
Write-Host "Ledger: $ledgerPath"
Write-Host ("Mode: " + ($(if ($isDryRun) { "DRY-RUN" } else { "APPLY" })))

# Create archive folders up front so the archive shape is explicit in source control.
foreach ($folder in @($docsArchive, $scriptsArchive, $reviewArchive)) {
  if (-not (Test-Path -LiteralPath $folder)) {
    if ($isDryRun) {
      Write-Host "[DRY-RUN] mkdir $folder"
    } else {
      New-Item -ItemType Directory -Path $folder -Force | Out-Null
      Write-Host "[APPLY]   mkdir $folder"
    }
  }
}

$lines = Get-Content -LiteralPath $ledgerPath
$moves = New-Object System.Collections.Generic.List[object]

foreach ($line in $lines) {
  if ($line -notmatch '^\| `(?<name>.+?)` \| .* \| `(?<classification>[^`]+)` \|') {
    continue
  }

  $name = $Matches.name
  $classification = $Matches.classification

  $destination = switch ($classification) {
    "MOVE_TO_DOCS_ARCHIVE" { $docsArchive; break }
    "MOVE_TO_SCRIPTS_ARCHIVE" { $scriptsArchive; break }
    default { $null }
  }

  if ($null -eq $destination) {
    continue
  }

  $sourcePath = Join-Path $repoRoot $name
  $targetPath = Join-Path $destination $name

  $moves.Add([pscustomobject]@{
    Name = $name
    Classification = $classification
    SourcePath = $sourcePath
    TargetPath = $targetPath
  }) | Out-Null
}

if ($moves.Count -eq 0) {
  Write-Host "No archive-classified moves found in the ledger."
  exit 0
}

foreach ($move in $moves) {
  if (-not (Test-Path -LiteralPath $move.SourcePath)) {
    Write-Host "[SKIP]    missing source $($move.Name)"
    continue
  }

  if (Test-Path -LiteralPath $move.TargetPath) {
    Write-Host "[SKIP]    target already exists $($move.TargetPath)"
    continue
  }

  if ($isDryRun) {
    Write-Host "[DRY-RUN] move $($move.SourcePath) -> $($move.TargetPath)"
    continue
  }

  Move-Item -LiteralPath $move.SourcePath -Destination $move.TargetPath
  Write-Host "[APPLY]   move $($move.SourcePath) -> $($move.TargetPath)"
}

Write-Host "Completed."
