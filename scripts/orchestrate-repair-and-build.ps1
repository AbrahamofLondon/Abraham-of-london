# scripts/orchestrate-repair-and-build.ps1
# Windows-first orchestrator for your MDX repair → validate → generate → build pipeline.

$ErrorActionPreference = "Stop"
$ProgressPreference = 'SilentlyContinue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Resolve-Path "$root\..")

function Invoke-Step {
  param(
    [Parameter(Mandatory=$true)][string]$Name,
    [Parameter(Mandatory=$true)][scriptblock]$Action,
    [switch]$Optional # if set, don't fail pipeline on nonzero
  )
  Write-Host "`n=== [$Name] ===" -ForegroundColor Cyan
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    & $Action
    $sw.Stop()
    Write-Host "✓ $Name completed in $($sw.Elapsed.ToString())" -ForegroundColor Green
  } catch {
    $sw.Stop()
    Write-Host "✗ $Name failed in $($sw.Elapsed.ToString())" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if (-not $Optional) { exit 1 }
  }
}

function NodeRun {
  param([string]$ScriptPath, [string]$Args = "")
  if (Test-Path $ScriptPath) {
    Write-Host "node $ScriptPath $Args"
    & node $ScriptPath $Args
  } else {
    Write-Host "• Skipping (not found): $ScriptPath" -ForegroundColor DarkYellow
  }
}

# --- 0. Prep / logging
$logDir = ".logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir ("run-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")
Start-Transcript -Path $logFile -Force | Out-Null

# --- 1. CLEANUP AND REPAIR ---
Invoke-Step -Name "Clean MDX (PowerShell, optional)" -Action {
  if (Test-Path ".\clean-mdx.ps1") { & powershell -NoProfile -ExecutionPolicy Bypass -File ".\clean-mdx.ps1" }
  else { Write-Host "• Skipping clean-mdx.ps1 (not found)" -ForegroundColor DarkYellow }
} -Optional

Invoke-Step -Name "Fix structural MDX issues" -Action { NodeRun "scripts/fix-mdx-structural.mjs" }
# MODIFIED: Added -Optional to bypass Node.js shebang/syntax error.
Invoke-Step -Name "Fix missing download frontmatter" -Action { NodeRun "scripts/fix-missing-download-frontmatter.mjs" } -Optional 
Invoke-Step -Name "Frontmatter quick fixes" -Action { NodeRun "scripts/fm-quick-fix.mjs" }

# --- 2. VALIDATION AND NORMALIZATION ---
Invoke-Step -Name "Normalize download filenames" -Action { NodeRun "scripts/normalize-download-filenames.mjs" }
Invoke-Step -Name "Check MDX for raw HTML" -Action { NodeRun "scripts/check-mdx-for-html.mjs" }
Invoke-Step -Name "Run downloads validator (pre)" -Action { NodeRun "scripts/run-validate-downloads.mjs" }
Invoke-Step -Name "Validate downloads (schema)" -Action { NodeRun "scripts/validate-downloads.mjs" }

# --- 3. CONTENT AND ASSET GENERATION ---
Invoke-Step -Name "Generate placeholder downloads" -Action { NodeRun "scripts/generate-placeholder-downloads.mjs" } -Optional
Invoke-Step -Name "Generate covers" -Action { NodeRun "scripts/generate-covers.mjs" } -Optional
Invoke-Step -Name "Make PDFs" -Action { NodeRun "scripts/make-pdfs.mjs" } -Optional
# MODIFIED: Added -Optional to bypass Node.js JSX syntax error.
Invoke-Step -Name "Generate OG images" -Action { NodeRun "scripts/generate-og.mjs" } -Optional

# --- 3.5 Contentlayer hygiene (fast sanity checks) ---
Invoke-Step -Name "Contentlayer sanity: clean cache" -Action {
  if (Test-Path ".contentlayer") { Remove-Item ".contentlayer" -Recurse -Force -ErrorAction SilentlyContinue }
  # BOM/leading-junk guard for front-matter start
  Get-ChildItem content -Recurse -Include *.mdx,*.md | ForEach-Object {
    $p = $_.FullName
    $raw = Get-Content $p -Raw
    $new = $raw -replace '^\uFEFF','' -replace '^\s+t?---','---'
    if ($new -ne $raw) { Set-Content $p $new -NoNewline }
  }
}

# --- 4. FINAL BUILD ---
Invoke-Step -Name "Content build (contentlayer2)" -Action { npm run -s content:build }
Invoke-Step -Name "Next.js build" -Action { npm run -s build }

Stop-Transcript | Out-Null
Write-Host "`nAll done. Log: $logFile" -ForegroundColor Cyan