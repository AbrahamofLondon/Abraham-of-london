# scripts/fix-build-pipeline.ps1
# Hardened build-pipeline fixer (Windows-safe + "paste-safe" fallback)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ------------------------------------------------------------
# Repo root resolution (works in-file AND paste/interactive)
# ------------------------------------------------------------
function Resolve-RepoRoot {
  # In a script file, $PSScriptRoot is best.
  if ($PSScriptRoot -and (Test-Path -LiteralPath $PSScriptRoot)) {
    return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
  }

  # In some cases, MyInvocation is usable.
  try {
    if ($MyInvocation -and $MyInvocation.MyCommand -and $MyInvocation.MyCommand.Path) {
      $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
      if ($scriptDir) { return (Resolve-Path (Join-Path $scriptDir "..")).Path }
    }
  } catch { }

  # Fallback: current directory (interactive/paste mode)
  return (Get-Location).Path
}

$RepoRoot = Resolve-RepoRoot
Set-Location $RepoRoot

# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
function Say([string]$msg, [string]$color = "Gray") {
  Write-Host $msg -ForegroundColor $color
}

function ReadText([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) { return $null }
  return [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $path), [System.Text.Encoding]::UTF8)
}

function WriteUtf8NoBom([string]$path, [string]$content) {
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  $abs = $path
  if (-not [System.IO.Path]::IsPathRooted($abs)) {
    $abs = Join-Path $RepoRoot $path
  }
  $dir = Split-Path -Parent $abs
  if ($dir -and -not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  [System.IO.File]::WriteAllText($abs, $content, $utf8NoBom)
}

function Run([string]$cmd) {
  Say "→ $cmd" "DarkGray"
  & cmd.exe /c $cmd
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed (exit $LASTEXITCODE): $cmd"
  }
}

function RemoveDirSafe([string]$dirRel) {
  $dirAbs = Join-Path $RepoRoot $dirRel
  if (Test-Path -LiteralPath $dirAbs) {
    try {
      Remove-Item -LiteralPath $dirAbs -Recurse -Force -ErrorAction Stop
      Say "✓ Removed: $dirRel" "Green"
    } catch {
      # Windows can lock files; fallback to rd
      & cmd.exe /c "rd /s /q `"$dirAbs`"" | Out-Null
      Say "✓ Removed (rd): $dirRel" "Green"
    }
  }
}

function HasImport([string]$content, [string]$symbol) {
  return ($content -match "(?m)^\s*import\s+.*\b$([regex]::Escape($symbol))\b") -or
         ($content -match "(?m)^\s*import\s+\{\s*.*\b$([regex]::Escape($symbol))\b")
}

function InsertImportTop([string]$filePath, [string]$importLine) {
  $txt = ReadText $filePath
  if ($null -eq $txt) { return $false }
  if ($txt -match [regex]::Escape($importLine)) { return $false }

  $lines = $txt -split "`r?`n"
  if ($lines.Count -gt 0 -and $lines[0] -match '^\uFEFF') {
    $lines[0] = $lines[0].TrimStart([char]0xFEFF)
  }

  $out = New-Object System.Collections.Generic.List[string]

  # If first line is "use client"; place import right after it.
  if ($lines.Count -gt 0 -and $lines[0].Trim() -eq '"use client";') {
    $out.Add($lines[0])
    $out.Add($importLine)
    for ($i=1; $i -lt $lines.Count; $i++) { $out.Add($lines[$i]) }
    WriteUtf8NoBom $filePath ($out -join "`n")
    return $true
  }

  # Insert before first import, otherwise at top.
  $firstImportIdx = -1
  for ($i=0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*import\s') { $firstImportIdx = $i; break }
  }

  if ($firstImportIdx -ge 0) {
    for ($i=0; $i -lt $firstImportIdx; $i++) { $out.Add($lines[$i]) }
    $out.Add($importLine)
    for ($i=$firstImportIdx; $i -lt $lines.Count; $i++) { $out.Add($lines[$i]) }
  } else {
    $out.Add($importLine)
    foreach ($l in $lines) { $out.Add($l) }
  }

  WriteUtf8NoBom $filePath ($out -join "`n")
  return $true
}

# --- frontmatter helpers (YAML-lite)
function GetFrontmatter([string]$raw) {
  if ($raw -match "^\s*---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*([\s\S]*)$") {
    return @{ has = $true; fm = $matches[1]; body = $matches[2] }
  }
  return @{ has = $false; fm = ""; body = $raw }
}

function RemoveFrontmatterKeys([string]$fmText, [string[]]$keysToRemove) {
  $lines = $fmText -split "`r?`n"
  $out = New-Object System.Collections.Generic.List[string]
  $skipMode = $false
  $skipIndent = 0

  foreach ($line in $lines) {
    if ($skipMode) {
      $indent = ($line -match "^(\s+)") ? $matches[1].Length : 0
      if ($line -match "^\s*$") { $skipMode = $false; continue }
      if ($indent -gt $skipIndent) { continue } else { $skipMode = $false }
    }

    $matched = $false
    foreach ($k in $keysToRemove) {
      if ($line -match "^\s*$k\s*:") {
        $matched = $true
        $skipMode = $true
        $skipIndent = ($line -match "^(\s+)") ? $matches[1].Length : 0
        break
      }
    }

    if (-not $matched) { $out.Add($line) }
  }

  return ($out -join "`n").Trim()
}

function Detect-ContentlayerCli {
  # Prefer contentlayer2 if the CLI exists.
  # 1) try pnpm exec (best)
  # 2) fallback: node_modules/.bin presence
  $binCL2 = Join-Path $RepoRoot "node_modules\.bin\contentlayer2.cmd"
  $binCL1 = Join-Path $RepoRoot "node_modules\.bin\contentlayer.cmd"

  if (Test-Path -LiteralPath $binCL2) { return "contentlayer2" }
  if (Test-Path -LiteralPath $binCL1) { return "contentlayer" }

  # If not in .bin, we’ll still attempt pnpm exec contentlayer2 build and fall back if it fails.
  return "unknown"
}

# ------------------------------------------------------------
# PHASE A: SNAPSHOT
# ------------------------------------------------------------
Say "`n=== PHASE A: QUICK HEALTH SNAPSHOT ===" "Cyan"
Say ("Node: " + (& node -v)) "Gray"
Say ("PNPM: " + (& pnpm -v)) "Gray"
Say ("CWD : " + (Get-Location).Path) "Gray"
Say ("ROOT: " + $RepoRoot) "DarkCyan"

# ------------------------------------------------------------
# PHASE B: FIX KNOWN RUNTIME ReferenceErrors
# ------------------------------------------------------------
Say "`n=== PHASE B: FIX KNOWN RUNTIME REFERENCEERRORS ===" "Cyan"

# B1) StatsBar not defined on homepage
# Observed:
#   pages/index.tsx imports AnimatedStatsBar but uses <StatsBar />
# Best fix: replace <StatsBar /> with <AnimatedStatsBar /> if AnimatedStatsBar import exists
$indexPage = Join-Path $RepoRoot "pages\index.tsx"
if (Test-Path -LiteralPath $indexPage) {
  $txt = ReadText $indexPage
  if ($null -ne $txt) {
    $usesStatsBar    = ($txt -match "<\s*StatsBar\b")
    $importsStatsBar = (HasImport $txt "StatsBar")
    $importsAnimated = (HasImport $txt "AnimatedStatsBar")
    $usesAnimated    = ($txt -match "<\s*AnimatedStatsBar\b")

    if ($usesStatsBar -and -not $importsStatsBar) {
      if ($importsAnimated) {
        $fixed = $txt `
          -replace "<\s*StatsBar(\s*/\s*)?>", "<AnimatedStatsBar$1>" `
          -replace "</\s*StatsBar\s*>", "</AnimatedStatsBar>"
        if ($fixed -ne $txt) {
          WriteUtf8NoBom $indexPage $fixed
          Say "✓ pages/index.tsx: replaced <StatsBar> with <AnimatedStatsBar> (import already present)" "Green"
        } else {
          $did = InsertImportTop $indexPage 'import StatsBar from "@/components/homepage/StatsBar";'
          if ($did) { Say "✓ pages/index.tsx: inserted StatsBar import" "Green" }
        }
      } else {
        $did = InsertImportTop $indexPage 'import StatsBar from "@/components/homepage/StatsBar";'
        if ($did) { Say "✓ pages/index.tsx: inserted StatsBar import" "Green" }
      }
    } elseif ($usesStatsBar -and $importsStatsBar) {
      Say "✓ pages/index.tsx: StatsBar usage/import consistent" "Green"
    } elseif ($usesAnimated -and $importsAnimated) {
      Say "✓ pages/index.tsx: AnimatedStatsBar usage/import consistent" "Green"
    } else {
      Say "ℹ pages/index.tsx: no StatsBar issue detected" "DarkGray"
    }
  }
} else {
  Say "ℹ pages/index.tsx not found (skipping StatsBar fix)" "DarkGray"
}

# B2) assertContentlayerHasDocs import injection (your exact requested import)
$AssertImportLine = 'import { assertContentlayerHasDocs } from "@/lib/contentlayer-assert";'
$targetsRel = @(
  "pages\content\index.tsx",
  "pages\debug\content.tsx",
  "pages\downloads\index.tsx",
  "pages\prints\index.tsx",
  "pages\vault\index.tsx",
  "pages\[slug].tsx"
)
foreach ($rel in $targetsRel) {
  $p = Join-Path $RepoRoot $rel
  if (Test-Path -LiteralPath $p) {
    $t = ReadText $p
    if ($null -ne $t) {
      $uses = ($t -match "\bassertContentlayerHasDocs\b")
      $hasImp = (HasImport $t "assertContentlayerHasDocs")
      if ($uses -and -not $hasImp) {
        $did = InsertImportTop $p $AssertImportLine
        if ($did) { Say "✓ Inserted assertContentlayerHasDocs import: $rel" "Green" }
      }
    }
  }
}

# ------------------------------------------------------------
# PHASE C: CACHE HARDENING
# ------------------------------------------------------------
Say "`n=== PHASE C: CONTENTLAYER / NEXT CACHE HARDENING ===" "Cyan"
RemoveDirSafe ".contentlayer"
RemoveDirSafe ".next"
if (Test-Path -LiteralPath (Join-Path $RepoRoot ".turbo")) { RemoveDirSafe ".turbo" }

# ------------------------------------------------------------
# PHASE D: FRONTMATTER REMEDIATION (based on your report)
# ------------------------------------------------------------
Say "`n=== PHASE D: FRONTMATTER REMEDIATION ===" "Cyan"

$ContentRoot = Join-Path $RepoRoot "content"
if (-not (Test-Path -LiteralPath $ContentRoot)) {
  Say "✗ content directory missing at: $ContentRoot" "Red"
  throw "Missing content directory."
}

# D1) Quarantine ANY MD/MDX with slug: replace (template poison)
$templateHits = @()
Get-ChildItem -LiteralPath $ContentRoot -Recurse -File -Include *.md,*.mdx | ForEach-Object {
  $raw = Get-Content -LiteralPath $_.FullName -Raw
  $fm = GetFrontmatter $raw
  if ($fm.has -and ($fm.fm -match "(?m)^\s*slug\s*:\s*['""]?replace['""]?\s*$")) {
    $templateHits += $_.FullName
  }
}

if ($templateHits.Count -gt 0) {
  $tplDir = Join-Path $ContentRoot "_templates"
  New-Item -ItemType Directory -Path $tplDir -Force | Out-Null
  Say "⚠ Quarantining placeholder templates (slug: replace) → content/_templates" "Yellow"

  foreach ($f in $templateHits) {
    $name = Split-Path $f -Leaf
    $dest = Join-Path $tplDir $name
    if (Test-Path -LiteralPath $dest) {
      $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
      $dest = Join-Path $tplDir ("$stamp-$name")
    }
    Move-Item -LiteralPath $f -Destination $dest -Force
    Say "  ✓ Moved: $($f.Replace($RepoRoot,'')) → $($dest.Replace($RepoRoot,''))" "DarkGray"
  }
} else {
  Say "✓ No placeholder slug templates found" "Green"
}

# D2) Strip unsupported Resource fields from resources/vault.mdx (your warning list)
$vault = Join-Path $ContentRoot "resources\vault.mdx"
if (Test-Path -LiteralPath $vault) {
  $raw = Get-Content -LiteralPath $vault -Raw
  $fm = GetFrontmatter $raw
  if ($fm.has) {
    $keys = @("downloadType","paperFormats","isInteractive","isFillable","contentOnly")
    $newFm = RemoveFrontmatterKeys $fm.fm $keys
    if ($newFm -ne $fm.fm) {
      $rebuilt = "---`n$newFm`n---`n`n$($fm.body.TrimStart())"
      WriteUtf8NoBom $vault $rebuilt
      Say "✓ Cleaned unsupported Resource fields: content/resources/vault.mdx" "Green"
    } else {
      Say "✓ content/resources/vault.mdx: already clean" "Green"
    }
  } else {
    Say "⚠ content/resources/vault.mdx has no frontmatter" "Yellow"
  }
}

# D3) Strip unsupported Post fields from surrender-operational-framework.mdx (your warning list)
$postFile = Join-Path $ContentRoot "blog\surrender-operational-framework.mdx"
if (Test-Path -LiteralPath $postFile) {
  $raw = Get-Content -LiteralPath $postFile -Raw
  $fm = GetFrontmatter $raw
  if ($fm.has) {
    $keys = @("isPartTwo","previousPart")
    $newFm = RemoveFrontmatterKeys $fm.fm $keys
    if ($newFm -ne $fm.fm) {
      $rebuilt = "---`n$newFm`n---`n`n$($fm.body.TrimStart())"
      WriteUtf8NoBom $postFile $rebuilt
      Say "✓ Cleaned unsupported Post fields: content/blog/surrender-operational-framework.mdx" "Green"
    } else {
      Say "✓ content/blog/surrender-operational-framework.mdx: already clean" "Green"
    }
  }
}

# ------------------------------------------------------------
# PHASE E: CONTENTLAYER BUILD (SAFE)
#   (no require.resolve — just run CLIs)
# ------------------------------------------------------------
Say "`n=== PHASE E: CONTENTLAYER BUILD (SAFE) ===" "Cyan"

$cli = Detect-ContentlayerCli
if ($cli -eq "contentlayer2") {
  Run "pnpm exec contentlayer2 build"
} elseif ($cli -eq "contentlayer") {
  Run "pnpm exec contentlayer build"
} else {
  # unknown: try contentlayer2 first, fall back to v1
  try {
    Run "pnpm exec contentlayer2 build"
  } catch {
    Say "⚠ contentlayer2 build failed; trying contentlayer v1..." "Yellow"
    Run "pnpm exec contentlayer build"
  }
}

$genDir = Join-Path $RepoRoot ".contentlayer\generated"
if (-not (Test-Path -LiteralPath $genDir)) {
  Say "❌ .contentlayer/generated not found after build." "Red"
  throw "Contentlayer generated output missing."
}
$genEntries = Get-ChildItem -LiteralPath $genDir -ErrorAction SilentlyContinue
Say ("✓ Contentlayer generated output present (" + $genEntries.Count + " entries)") "Green"

# ------------------------------------------------------------
# PHASE F: FINAL BUILD
# ------------------------------------------------------------
Say "`n=== PHASE F: NEXT BUILD ===" "Cyan"
Run "pnpm run build"

Say "`n✅ BUILD PIPELINE HARDENING COMPLETE" "Green"
Say "If Next.js still fails to compile, paste the FIRST compile error block (the topmost one after 'Failed to compile.')." "Magenta"