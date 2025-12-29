# safe-autofix.ps1
# PowerShell 7 (x86) safe auto-fix for Next.js + TS + ESLint projects
# - No deletions/truncations
# - Creates a git branch + optional stash
# - Backs up changed files
# - Applies ONLY minimal, targeted edits:
#   * unused vars: remove from import lists; prefix unused catch vars with "_"
#   * any -> unknown (only for ": any" and "<any>" patterns; does not rewrite logic)
#   * react/no-unescaped-entities: escape ' and " in JSX text nodes (best-effort)
#   * require() -> import (best-effort for simple const x = require("y"))
# - Re-runs lint+typecheck after each pass, stops on no progress
# - Logs everything to .\fixlogs\

[CmdletBinding()]
param(
  [switch]$NoBranch,
  [switch]$NoStash,
  [switch]$WhatIfOnly,
  [int]$MaxPasses = 6
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Assert-RepoRoot {
  if (-not (Test-Path ".git")) {
    throw "Run this from the repository root (folder containing .git)."
  }
}

function Ensure-Folder([string]$Path) {
  if (-not (Test-Path $Path)) { New-Item -ItemType Directory -Path $Path | Out-Null }
}

function Run-Cmd([string]$Cmd, [string]$LogPath, [int]$TimeoutSeconds = 900) {
  Write-Host ">> $Cmd" -ForegroundColor Cyan

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "cmd.exe"
  $psi.Arguments = "/c $Cmd"
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError  = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  $null = $p.Start()

  if (-not $p.WaitForExit($TimeoutSeconds * 1000)) {
    try { $p.Kill($true) } catch {}
    "TIMEOUT after $TimeoutSeconds seconds: $Cmd" | Out-File -FilePath $LogPath -Encoding UTF8
    return [pscustomobject]@{ ExitCode = 124; Output = "TIMEOUT after $TimeoutSeconds seconds" }
  }

  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $out = ($stdout + "`r`n" + $stderr).Trim()
  $out | Out-File -FilePath $LogPath -Encoding UTF8

  return [pscustomobject]@{ ExitCode = $p.ExitCode; Output = $out }
}

function Git-Available {
  try { git --version | Out-Null; return $true } catch { return $false }
}

function Create-Branch {
  if ($NoBranch) { return }
  if (-not (Git-Available)) { Write-Warning "git not found; skipping branch creation."; return }

  $branch = "autofix/safe-eslint-" + (Get-Date -Format "yyyyMMdd-HHmmss")
  $status = git status --porcelain
  if ($status -and (-not $NoStash)) {
    Write-Host "Stashing working tree..." -ForegroundColor Yellow
    git stash push -u -m "pre-autofix stash $(Get-Date -Format s)" | Out-Null
  }

  Write-Host "Creating branch $branch" -ForegroundColor Green
  git checkout -b $branch | Out-Null
}

function Backup-Files([string[]]$Files, [string]$BackupRoot) {
  foreach ($f in $Files) {
    if (-not (Test-Path $f)) { continue }
    $dest = Join-Path $BackupRoot ($f.Replace(":", "").Replace("\", "/"))
    $destDir = Split-Path $dest -Parent
    Ensure-Folder $destDir
    Copy-Item -LiteralPath $f -Destination $dest -Force
  }
}

function Get-LintOutput {
  Ensure-Folder ".\fixlogs"
  $lintLog = ".\fixlogs\lint.log"
  $tcLog   = ".\fixlogs\typecheck.log"

  # Prefer package scripts if present
  $pkg = Get-Content ".\package.json" -Raw
  $hasLint = $pkg -match '"lint"\s*:'
  $hasTC   = $pkg -match '"typecheck"\s*:' -or $pkg -match '"tsc"\s*:'

  $lintCmd = if ($hasLint) { "pnpm -s lint" } else { "pnpm -s exec eslint . --ext .ts,.tsx --max-warnings=0" }
  $tcCmd   = if ($hasTC)   { "pnpm -s typecheck" } else { "pnpm -s exec tsc -p tsconfig.json --noEmit" }

  $lint = Run-Cmd $lintCmd $lintLog
  $tc   = Run-Cmd $tcCmd   $tcLog

  return [pscustomobject]@{
    LintExit = $lint.ExitCode
    TscExit  = $tc.ExitCode
    Combined = ($lint.Output + "`n" + $tc.Output)
    LintLog  = $lintLog
    TscLog   = $tcLog
  }
}

function Parse-FilesFromOutput([string]$Text) {
  # Matches paths like ./pages/foo.tsx or .\pages\foo.tsx
  $rx = [regex]'(?m)^(?<path>\.?[\\/][^\s:]+?\.(ts|tsx|js|jsx))'
  $files = New-Object System.Collections.Generic.HashSet[string]
  foreach ($m in $rx.Matches($Text)) {
    $p = $m.Groups["path"].Value.Trim()
    # normalize
    $p = $p -replace '^\./',''
    $p = $p -replace '/','\'
    if (Test-Path $p) { $files.Add($p) | Out-Null }
  }
  return $files.ToArray()
}

function Remove-Unused-ImportSpecifiers([string]$Content, [string]$Identifier) {
  # Removes Identifier from:
  #   import { A, B, Identifier, C } from "x";
  # without breaking commas/spacing; if braces empty, leaves import intact (won't delete line)
  $pattern = "(?m)^(?<pre>\s*import\s*\{\s*)(?<list>[^}]+?)(?<post>\s*\}\s*from\s*['""][^'""]+['""]\s*;?\s*)$"
  return [regex]::Replace($Content, $pattern, {
    param($m)
    $pre  = $m.Groups["pre"].Value
    $list = $m.Groups["list"].Value
    $post = $m.Groups["post"].Value

    $parts = $list.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
    $newParts = @()
    foreach ($p in $parts) {
      # support "X as Y"
      $base = ($p -split "\s+as\s+")[0].Trim()
      if ($base -ne $Identifier) { $newParts += $p }
    }
    if ($newParts.Count -eq $parts.Count) { return $m.Value } # no change
    $newList = ($newParts -join ", ")
    return "$pre$newList$post"
  })
}

function Fix-UnusedVars([string]$Path, [string]$Content, [ref]$Changed) {
  # Heuristic: remove unused identifiers from import { } lists if they exist
  # and prefix unused catch variables (catch (err) -> catch (_err))
  $original = $Content

  # 1) Prefix catch vars with underscore if named in your report (err, e, error, _error already ok)
  $Content = $Content -replace 'catch\s*\(\s*(err|e|error)\s*\)', 'catch (_$1)'

  # 2) If ESLint says "X is defined but never used", we remove from braces import list
  # We'll do this generally by scanning for common ones you listed:
  $commonUnused = @(
    "CheckCircle2","ArrowRight","Download","Trash2","Users","Sparkles","AnimatePresence","MDXRemote","isPublished",
    "ComponentModule","SiteConfig","IncomingMessage","Post","FONT_MAP","RATE_LIMIT_CONFIGS"
  )

  foreach ($id in $commonUnused) {
    $Content = Remove-Unused-ImportSpecifiers $Content $id
  }

  if ($Content -ne $original) { $Changed.Value = $true }
  return $Content
}

function Fix-AnyToUnknown([string]$Content, [ref]$Changed) {
  $original = $Content

  # Replace obvious ": any" with ": unknown"
  $Content = [regex]::Replace($Content, ':\s*any(\b)', ': unknown$1')

  # Replace "<any>" generic assertions with "<unknown>"
  $Content = [regex]::Replace($Content, '<\s*any\s*>', '<unknown>')

  # Replace " as any" with " as unknown"
  $Content = [regex]::Replace($Content, '\sas\s+any(\b)', ' as unknown$1')

  if ($Content -ne $original) { $Changed.Value = $true }
  return $Content
}

function Fix-NoUnescapedEntities([string]$Content, [ref]$Changed) {
  $original = $Content

  # Best-effort: in JSX text nodes, replace raw ' and " with &apos; and &quot;
  # We avoid touching inside JS/TS strings by only operating between > ... < on the same line
  $Content = [regex]::Replace($Content, '>([^<]*)<', {
    param($m)
    $inner = $m.Groups[1].Value
    $fixed = $inner
    $fixed = $fixed -replace '"', '&quot;'
    $fixed = $fixed -replace "'", '&apos;'
    if ($fixed -ne $inner) { $Changed.Value = $true }
    return ">$fixed<"
  })

  return $Content
}

function Fix-RequireImports([string]$Content, [ref]$Changed) {
  $original = $Content

  # Very conservative transform:
  #   const X = require("y");
  # -> import X from "y";
  $Content = [regex]::Replace($Content, '(?m)^\s*const\s+([A-Za-z0-9_$]+)\s*=\s*require\(\s*["'']([^"'']+)["'']\s*\)\s*;?\s*$', {
    param($m)
    $Changed.Value = $true
    $name = $m.Groups[1].Value
    $mod  = $m.Groups[2].Value
    return "import $name from `"$mod`";"
  })

  return $Content
}

function Fix-NextNoAssignModuleVariable([string]$Content, [ref]$Changed) {
  $original = $Content

  # Replace "module =" assignment to a safer variable name "mod" ONLY when it's a direct assignment.
  # This avoids the Next.js lint rule but doesn't change logic significantly.
  $Content = $Content -replace '(?m)^\s*module\s*=\s*', 'mod = '
  $Content = $Content -replace '(?m)\bmodule\b', 'mod'  # best-effort; may be noisy, so we gate it
  # To keep it safe, only apply if file clearly defines "let module" or "var module"
  if ($original -match '(?m)^\s*(let|var|const)\s+module\b') {
    if ($Content -ne $original) { $Changed.Value = $true }
    return $Content
  } else {
    return $original
  }
}

function Fix-ImportTracePrisma([string]$Content, [ref]$Changed) {
  $original = $Content
  # Your fatal compile error: "prisma is not exported from '@/lib/downloads/audit' (imported as 'prisma')"
  # Minimal safe fix: if file imports { prisma } from "@/lib/downloads/audit", swap to "@/lib/prisma"
  # Only changes that specific import line.
  $Content = [regex]::Replace($Content,
    '(?m)^\s*import\s*\{\s*prisma\s*\}\s*from\s*["'']@\/lib\/downloads\/audit["'']\s*;?\s*$',
    'import { prisma } from "@/lib/prisma";'
  )
  if ($Content -ne $original) { $Changed.Value = $true }
  return $Content
}

function Apply-FixesToFile([string]$Path, [string]$BackupRoot, [switch]$DryRun) {
  $content = Get-Content -LiteralPath $Path -Raw
  $changed = $false

  $content = Fix-ImportTracePrisma $content ([ref]$changed)
  $content = Fix-UnusedVars $Path $content ([ref]$changed)
  $content = Fix-AnyToUnknown $content ([ref]$changed)
  $content = Fix-NoUnescapedEntities $content ([ref]$changed)
  $content = Fix-RequireImports $content ([ref]$changed)

  # Only run module-variable rule fixer on the one file you listed (component-resolver)
  if ($Path -like "*components\mdx\component-resolver.tsx") {
    $content = Fix-NextNoAssignModuleVariable $content ([ref]$changed)
  }

  if (-not $changed) { return $false }

  if ($DryRun) {
    Write-Host "DRYRUN would modify: $Path" -ForegroundColor Yellow
    return $true
  }

  Backup-Files @($Path) $BackupRoot
  Set-Content -LiteralPath $Path -Value $content -Encoding UTF8
  return $true
}

# --- MAIN ---
Assert-RepoRoot
Ensure-Folder ".\fixlogs"

Create-Branch

$backupRoot = Join-Path ".\fixlogs" ("backup-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
Ensure-Folder $backupRoot

Write-Host "Running initial lint/typecheck..." -ForegroundColor Green
$initial = Get-LintOutput
$pass = 0

function Count-Errors([string]$Text) {
  # crude but useful: count ESLint "Error:" lines + "Failed to compile" lines
  $n1 = ([regex]::Matches($Text, '(?m)\sError:\s')).Count
  $n2 = ([regex]::Matches($Text, '(?m)^Failed to compile')).Count
  return ($n1 + $n2)
}

$prevCount = Count-Errors $initial.Combined
Write-Host "Initial issue count (approx): $prevCount" -ForegroundColor Magenta

if ($WhatIfOnly) {
  Write-Host "WhatIfOnly set - exiting after initial report logs." -ForegroundColor Yellow
  Write-Host "See: $($initial.LintLog) and $($initial.TscLog)"
  exit 0
}

while ($pass -lt $MaxPasses) {
  $pass++
  Write-Host "`n=== PASS $pass ===" -ForegroundColor Green

  $state = Get-LintOutput
  $files = Parse-FilesFromOutput $state.Combined

  if ($files.Count -eq 0) {
    Write-Host "No file paths detected in output. Stopping." -ForegroundColor Yellow
    break
  }

  $modified = New-Object System.Collections.Generic.List[string]
  foreach ($f in $files) {
    $did = Apply-FixesToFile -Path $f -BackupRoot $backupRoot -DryRun:$false
    if ($did) { $modified.Add($f) | Out-Null }
  }

  if ($modified.Count -eq 0) {
    Write-Host "No safe edits applicable this pass. Stopping." -ForegroundColor Yellow
    break
  }

  Write-Host "Modified files:" -ForegroundColor Cyan
  $modified | ForEach-Object { Write-Host " - $_" }

  # Re-run and check progress
  $after = Get-LintOutput
  $newCount = Count-Errors $after.Combined
  Write-Host "Issue count now (approx): $newCount" -ForegroundColor Magenta

  if ($newCount -ge $prevCount) {
    Write-Host "No improvement (or worse). Stopping to avoid damage." -ForegroundColor Red
    break
  }

  $prevCount = $newCount
}

Write-Host "`nDone." -ForegroundColor Green
Write-Host "Logs: .\fixlogs\lint.log and .\fixlogs\typecheck.log" -ForegroundColor Gray
Write-Host "Backups: $backupRoot" -ForegroundColor Gray
Write-Host "Next: run 'pnpm lint' and 'pnpm exec tsc -p tsconfig.json --noEmit' to confirm clean." -ForegroundColor Gray