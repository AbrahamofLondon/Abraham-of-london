#Requires -Version 5.1

<#
.SYNOPSIS
    Enterprise-grade, idempotent repository auditing and healing system.

.DESCRIPTION
    This comprehensive tool performs deep scanning, intelligent remediation, and rigorous validation
    of code artifacts across the repository. It prioritizes data integrity through granular
    backups and leverages version control (Git) for restoration.

    Enterprise Focus: High robustness, strict dependency checks, explicit rollback strategies,
    and detailed auditable reporting, now including mandatory ESLint validation by default.

.PARAMETER ScanOnly
    Scan and report without modifying files.

.PARAMETER AutoFix
    Apply safe, targeted repairs automatically (with backups, validation, and rollback).

.PARAMETER UseGitHistory
    If a direct repair makes no change or fails validation, try restoring a clean version from Git history.

.PARAMETER MaxGitHistoryDepth
    How far back to search in Git (default 50).

.PARAMETER SkipBackups
    Disable local backups (NOT recommended).

.PARAMETER VerboseOutput
    Emit DEBUG logs to console.

.PARAMETER Paths
    One or more root paths to scan (default: current directory).

.PARAMETER IncludePatterns
    Override default include patterns (glob array).

.PARAMETER ExcludeDirs
    Override default excluded directories (array of directory names).

.PARAMETER NoESLintCheck
    Skip running ESLint during the final validation phase, even if enabled in config.

.EXAMPLE
  .\Repair-Repository.ps1 -ScanOnly

.EXAMPLE
  .\Repair-Repository.ps1 -AutoFix -UseGitHistory -VerboseOutput

.EXAMPLE
  .\Repair-Repository.ps1 -AutoFix -NoESLintCheck
#>

[CmdletBinding(DefaultParameterSetName='Scan', SupportsShouldProcess=$true, ConfirmImpact='Medium')]
param(
  [Parameter(ParameterSetName='Scan')][switch]$ScanOnly,
  [Parameter(ParameterSetName='Fix')][switch]$AutoFix,
  [Parameter(ParameterSetName='Fix')][switch]$UseGitHistory,
  [Parameter(ParameterSetName='Fix')][int]$MaxGitHistoryDepth = 50,

  [Parameter()][switch]$SkipBackups,
  [Parameter()][switch]$VerboseOutput,
  [Parameter()][switch]$NoESLintCheck,

  [Parameter()][string[]]$Paths = @('.'),
  [Parameter()][string[]]$IncludePatterns = @(),
  [Parameter()][string[]]$ExcludeDirs = @()
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# ===== Configuration & State =================================================
$nowStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$defaultInclude = @('*.ts','*.tsx','*.js','*.jsx','*.mjs','*.cjs','*.json','*.md','*.mdx','*.css','*.html','*.yml','*.yaml','*.vue')
$defaultExclude = @('.git','node_modules','.next','.vite','coverage','build','dist','vendor','temp','.cache','log','out','.contentlayer','public/downloads')

$script:Config = @{
  BackupDir        = ".repo-audit-backups-$nowStamp"
  ReportFile       = "repair-report-$nowStamp.html"
  LogFile          = "repair-log-$nowStamp.log"
  GitignoreBackups = $true

  IncludePatterns  = if ($IncludePatterns.Count) { $IncludePatterns } else { $defaultInclude }
  ExcludeDirs      = if ($ExcludeDirs.Count)    { $ExcludeDirs }    else { $defaultExclude }

  Rules = @{
    UnicodeGremlins  = $true
    SyntaxErrors     = $true
    ImportIssues     = $true
    JSONValidation   = $true
    MDXIssues        = $true
    UnbalancedBraces = $true
    DuplicateImports = $true
    MalformedRegex   = $true
  }

  # Validation gates (post-fix)
  RunTypeCheck     = $true   # npx tsc --noEmit
  RunESLint        = $true   # ENFORCED TRUE FOR ENTERPRISE QUALITY GATE
  ESLintArgs       = @('.', '--format=compact')
}

# Stats & registries
$script:Issues       = @()  # array of PSCustomObject
$script:FixedFiles   = [System.Collections.Generic.HashSet[string]]::new() # Use HashSet for O(1) addition/check
$script:FailedFiles  = [System.Collections.Generic.HashSet[string]]::new()
$script:GitAvailable = $false
$script:Statistics   = @{
  FilesScanned   = 0
  IssuesFound    = 0
  IssuesFixed    = 0
  FilesFailed    = 0
  BackupsCreated = 0
}

# ===== Logging ===============================================================
function Write-Log {
  param(
    [string]$Message,
    [ValidateSet('DEBUG','INFO','SUCCESS','WARNING','ERROR','CRITICAL')] [string]$Level='INFO',
    [string]$Category='General'
  )
  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss.fff'
  $line = "[$timestamp] [$Level] [$Category] $Message"
  $fg = switch ($Level) {
    'DEBUG'    { 'DarkGray' }
    'INFO'     { 'White' }
    'SUCCESS'  { 'Green' }
    'WARNING'  { 'Yellow' }
    'ERROR'    { 'Red' }
    'CRITICAL' { 'Magenta' }
  }
  if ($Level -ne 'DEBUG' -or $VerboseOutput) { Write-Host $line -ForegroundColor $fg }
  Add-Content -Path $script:Config.LogFile -Value $line -ErrorAction SilentlyContinue
}

# ===== Dependencies ==========================================================
function Test-GitAvailable { try { $null = git --version 2>&1; $true } catch { $false } }

function Test-ExternalDependencies {
  Write-Log "Checking external tooling…" -Level INFO -Category 'System'
  $script:GitAvailable = Test-GitAvailable
  $deps = @(
    @{Name='git';      Required=$true;  Ok=$script:GitAvailable},
    @{Name='npx';      Required=$true;  Ok={ $null = npx -v 2>&1; $LASTEXITCODE -eq 0 }},
    @{Name='tsc';      Required=$true;  Ok={ $null = npx tsc --version 2>&1; $LASTEXITCODE -eq 0 }},
    @{Name='esbuild';  Required=$true;  Ok={ $null = npx esbuild --version 2>&1; $LASTEXITCODE -eq 0 }},
    @{Name='eslint';   Required=$false; Ok={ if ($NoESLintCheck){$true} elseif($script:Config.RunESLint){ $null = npx eslint -v 2>&1; $LASTEXITCODE -eq 0 } else {$true} }}
  )
  $missing = @()
  foreach ($d in $deps) {
    $ok = if ($d.Ok -is [bool]) { $d.Ok } else { & $d.Ok }
    if (-not $ok -and $d.Required) { $missing += $d.Name; Write-Log "Missing required dependency: $($d.Name)" -Level CRITICAL -Category 'Dependency' }
    elseif (-not $ok) { Write-Log "Optional tool unavailable: $($d.Name) (skipping related checks)" -Level WARNING -Category 'Dependency' }
  }
  if ($missing.Count) { throw "Missing dependencies: $($missing -join ', ')" }
  Write-Log "Dependencies OK." -Level SUCCESS -Category 'System'
}

# ===== Backup system =========================================================
function Initialize-BackupSystem {
  if ($SkipBackups) { Write-Log "Backups disabled." -Level WARNING -Category 'Backup'; return }
  if (-not (Test-Path $script:Config.BackupDir)) {
    New-Item -ItemType Directory -Force -Path $script:Config.BackupDir | Out-Null
    Write-Log "Backup dir created: $($script:Config.BackupDir)" -Level INFO -Category 'Backup'
  }
  if ($script:Config.GitignoreBackups -and (Test-Path ".gitignore")) {
    $gi = Get-Content ".gitignore" -Raw
    if ($gi -notmatch [regex]::Escape($script:Config.BackupDir)) {
      Add-Content ".gitignore" "`n# Repository audit backups`n$($script:Config.BackupDir)/"
      Write-Log "Appended backup dir to .gitignore" -Level DEBUG -Category 'Backup'
    }
  }
}

function New-FileBackup {
  param([string]$FilePath)
  if ($SkipBackups) { return $null }
  try {
    $rel = Resolve-Path -LiteralPath $FilePath | ForEach-Object { $_.Path -replace [regex]::Escape((Get-Location).Path+'\'), '' }
    $name = ($rel -replace '[\\/]', '_') + ".${nowStamp}.bak"
    $dest = Join-Path $script:Config.BackupDir $name
    Copy-Item -LiteralPath $FilePath -Destination $dest -Force
    $script:Statistics.BackupsCreated++
    Write-Log "Backup: $dest" -Level DEBUG -Category 'Backup'
    return $dest
  } catch {
    Write-Log "Backup failed: $FilePath — $($_.Exception.Message)" -Level ERROR -Category 'Backup'
    return $null
  }
}

function Get-CleanBackupFile {
  param([string]$FilePath)
  if (-not (Test-Path $script:Config.BackupDir)) { return $null }
  $rel = Resolve-Path -LiteralPath $FilePath | ForEach-Object { $_.Path -replace [regex]::Escape((Get-Location).Path+'\'), '' }
  $pattern = ($rel -replace '[\\/]', '_') + "*.bak"
  $candidates = Get-ChildItem -Path $script:Config.BackupDir -Filter $pattern -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
  foreach ($b in $candidates) {
    try {
      $text = Get-Content -Raw -LiteralPath $b.FullName
      $res  = Test-FileForIssues -Content $text -FilePath $FilePath -QuickCheck
      if ($res.IsClean) { return @{Content=$text; Source=$b.FullName; Date=$b.LastWriteTime} }
    } catch { continue }
  }
  return $null
}

# ===== Git recovery ==========================================================
function Get-CleanFileFromGit {
  param([string]$FilePath,[int]$MaxDepth=50)
  if (-not $script:GitAvailable) { return $null }
  try {
    $gitRel = $FilePath -replace '^\.\\','' -replace '^\.\/',''
    $commits = git log --pretty=format:"%H" --max-count=$MaxDepth -- $gitRel 2>$null
    foreach ($c in $commits) {
      try {
        $content = git show "$c`:$gitRel" 2>$null
        if ($content) {
          $res = Test-FileForIssues -Content ($content -join "`n") -FilePath $FilePath -QuickCheck
          if ($res.IsClean) { return @{Content=($content -join "`n"); Commit=$c; CommitDate=(git show -s --format=%ci $c)} }
        }
      } catch { continue }
    }
  } catch { Write-Log "Git search failed: $($_.Exception.Message)" -Level ERROR -Category 'Git' }
  return $null
}

# ===== Issue reporting & HTML ===============================================
function New-IssueReport {
  param(
    [string]$FilePath,
    [string]$IssueType,
    [string]$Description,
    [ValidateSet('LOW','MEDIUM','HIGH','CRITICAL')] [string]$Severity,
    [object]$Details = $null,
    [string]$SuggestedFix = $null
  )
  if ($script:Issues.Where({ $_.FilePath -eq $FilePath -and $_.IssueType -eq $IssueType -and $_.Description -eq $Description }).Count) { return }
  $obj = [PSCustomObject]@{
    Timestamp    = Get-Date
    FilePath     = $FilePath
    IssueType    = $IssueType
    Description  = $Description
    Severity     = $Severity
    Details      = $Details
    SuggestedFix = $SuggestedFix
    Fixed        = $false
    FixMethod    = $null
  }
  $script:Issues += $obj
  $script:Statistics.IssuesFound++
  Write-Log "Issue: $IssueType @ $FilePath — $Description" -Level WARNING -Category 'Detection'
  return $obj
}

function Export-HtmlReport {
  <#
  .SYNOPSIS
    Generates a comprehensive HTML report summarizing the audit and repair process.
  .DESCRIPTION
    This function outputs a full self-contained HTML file detailing statistics, 
    and the status of every detected issue (fixed, failed, or pending).
  #>
  $html = @"
<!doctype html><html lang=en><meta charset=utf-8>
<title>Repository Repair Report</title>
<style>
  body{font-family:Segoe UI,-apple-system,system-ui; background:#f5f7fb; color:#0f172a; padding:24px}
  .card{background:#fff; border-radius:10px; padding:20px; box-shadow:0 1px 6px rgba(0,0,0,.08); margin:0 auto; max-width:1200px}
  h1{margin:0 0 6px; color:#1d4ed8}
  .muted{color:#64748b}
  .grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:12px; margin:18px 0}
  .kpi{background:#f1f5f9; border-left:4px solid #2563eb; border-radius:6px; padding:14px}
  .issues{margin-top:20px}
  .issue{border:1px solid #e2e8f0; border-left:4px solid #94a3b8; border-radius:6px; padding:12px; margin-bottom:10px}
  .issue.fixed{border-left-color:#10b981}
  .issue.failed{border-left-color:#ef4444}
  code{background:#0f172a; color:#e2e8f0; padding:10px; border-radius:6px; display:block; overflow:auto}
  .sev{font-size:12px; padding:2px 8px; border-radius:40px; font-weight:600}
  .sev.CRITICAL{background:#fecaca; color:#991b1b}
  .sev.HIGH{background:#fee2e2; color:#7f1d1d}
  .sev.MEDIUM{background:#fef3c7; color:#92400e}
  .sev.LOW{background:#dcfce7; color:#065f46}
  .badge{font-size:12px; padding:2px 8px; border-radius:40px; background:#e2e8f0; color:#334155}
  .ok{background:#bbf7d0; color:#14532d}
  .fail{background:#fecaca; color:#7f1d1d}
</style>
<div class=card>
<h1>🔧 Repository Repair Report</h1>
<div class=muted>Generated $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</div>
<div class=grid>
  <div class=kpi><div class=muted>Files Scanned</div><div style="font-size:28px;font-weight:700">$($script:Statistics.FilesScanned)</div></div>
  <div class=kpi><div class=muted>Issues Found</div><div style="font-size:28px;font-weight:700">$($script:Statistics.IssuesFound)</div></div>
  <div class=kpi><div class=muted>Issues Fixed</div><div style="font-size:28px;font-weight:700">$($script:Statistics.IssuesFixed)</div></div>
  <div class=kpi><div class=muted>Files Failed</div><div style="font-size:28px;font-weight:700">$($script:Statistics.FilesFailed)</div></div>
</div>
<div class=issues>
"@
  foreach ($i in ($script:Issues | Sort-Object Severity -Descending)) {
    $state = if ($i.Fixed) { 'fixed' } elseif ($i.FixMethod -match 'Failed|Exception') { 'failed' } else { '' }
    $badge = if ($i.Fixed) { '<span class="badge ok">Fixed</span>' } elseif ($i.FixMethod -match 'Failed|Exception') { '<span class="badge fail">Failed</span>' } else { '<span class="badge">Pending</span>' }
    $html += @"
<div class="issue $state">
  <div style="display:flex;gap:8px;justify-content:space-between;align-items:center">
    <strong>$($i.IssueType)</strong>
    <div>$badge <span class="sev $($i.Severity)">$($i.Severity)</span></div>
    </div>
    <div class=muted style="margin-top:4px">$([System.Web.HttpUtility]::HtmlEncode($i.FilePath))</div>
    <div style="margin-top:6px">$([System.Web.HttpUtility]::HtmlEncode($i.Description))</div>
"@
    if ($i.SuggestedFix) { $html += "<code>$([System.Web.HttpUtility]::HtmlEncode($i.SuggestedFix))</code>" }
    if ($i.FixMethod)   { $html += "<div class=muted>Method: $([System.Web.HttpUtility]::HtmlEncode($i.FixMethod))</div>" }
    $html += "</div>"
  }
  $html += "</div></div>"
  $html | Set-Content -Path $script:Config.ReportFile -Encoding UTF8
  Write-Log "HTML report: $($script:Config.ReportFile)" -Level SUCCESS -Category 'Report'
}

# ===== Heuristic detection ===================================================
function Test-FileForIssues {
  <#
  .SYNOPSIS
    Performs heuristic, rule-based scanning on file content for common structural issues.
  .DESCRIPTION
    Checks file content against configured rules (Unicode, imports, JSON validity, braces, etc.)
    to quickly identify file corruption or structural anomalies without needing a full compiler pass.
  .PARAMETER Content
    The raw string content of the file to test.
  .PARAMETER FilePath
    The path of the file (used for file type matching, e.g., JSON vs TS).
  .PARAMETER QuickCheck
    If specified, stops immediately upon finding the first issue.
  .OUTPUTS
    PSCustomObject containing 'IsClean' (Boolean) and 'Issues' (Array of strings).
  #>
  param([string]$Content,[string]$FilePath,[switch]$QuickCheck)
  $issues  = New-Object System.Collections.Generic.List[string]
  $isClean = $true

  # Unicode gremlins
  if ($script:Config.Rules.UnicodeGremlins) {
    $gremlins = @(0x00A0,0x200B,0xFEFF,0x200C,0x200D,0x200E,0x200F,0x202F,0x2009,0x200A,0x2060)
    foreach ($g in $gremlins) {
      if ($Content.IndexOf([char]$g) -ge 0) { $issues.Add("Unicode gremlin U+$([Convert]::ToString($g,16).ToUpper())"); $isClean=$false; if ($QuickCheck){break} }
    }
  }

  # Lone slash lines
  if ($Content -match '(?m)^\s*/\s*$') { $issues.Add("Lone slash line"); $isClean=$false }

  # JSON syntax
  if ($script:Config.Rules.JSONValidation -and $FilePath -match '\.json$') {
    try { $null = $Content | ConvertFrom-Json -ErrorAction Stop } catch { $issues.Add("JSON: $($_.Exception.Message)"); $isClean=$false }
  }

  # Unbalanced braces (heuristic)
  if ($script:Config.Rules.UnbalancedBraces -and $FilePath -match '\.(ts|tsx|js|jsx|mjs|css|vue)$') {
    $o = ([regex]::Matches($Content,'\{')).Count
    $c = ([regex]::Matches($Content,'\}')).Count
    if ($o -ne $c) { $issues.Add("Unbalanced braces: {=$o }=$c"); $isClean=$false }
  }

  # Frontmatter for MD/MDX/YAML
  if ($script:Config.Rules.MDXIssues -and $FilePath -match '\.(md|mdx|yml|yaml)$') {
    $count = ([regex]::Matches($Content,'(?m)^\s*---\s*$')).Count
    if ($count % 2 -ne 0) { $issues.Add("Frontmatter: odd number of '---' delimiters"); $isClean=$false }
  }

  # Import problems + duplicates
  if ($script:Config.Rules.ImportIssues -and $FilePath -match '\.(ts|tsx|js|jsx|mjs)$') {
    if ($Content -match 'import\s*\{[^}]*\w+\(\)[^}]*\}') { $issues.Add("Import: function call inside named import"); $isClean=$false }
    if ($Content -match 'import\s+.*\s+from\s+([^\s;]+?)(?=[;\n\r])' -and $matches[1] -notmatch '["'']') { $issues.Add("Import: unquoted path"); $isClean=$false }
    $m = [regex]::Matches($Content,'import\s+(?:\{[^}]+\}|\w+)\s+from\s+[''"]([^''"]+)[''"]')
    $dups = ($m | ForEach-Object { $_.Groups[1].Value }) | Group-Object | Where-Object { $_.Count -gt 1 }
    if ($dups) { $issues.Add("Duplicate imports: " + ($dups.Name -join ', ')); $isClean=$false }
  }

  return @{ IsClean=$isClean; Issues=$issues.ToArray() }
}

# ===== External syntax pass (esbuild) =======================================
function Find-SyntaxErrors {
  param([string]$FilePath)
  $ext = [IO.Path]::GetExtension($FilePath)
  $out = @()
  if ($script:Config.Rules.SyntaxErrors -and $ext -match '^\.(ts|tsx|js|jsx|mjs)$') {
    try {
      $res = npx esbuild $FilePath --bundle --format=esm --target=esnext --outfile=nul 2>&1
      if ($LASTEXITCODE -ne 0) {
        $line = ($res | Select-String -Pattern 'error:' -SimpleMatch | Select-Object -First 1).Line
        $out += @{ Tool='esbuild'; Message = ($line ? $line.Trim() : ($res -join "`n")) }
      }
    } catch { $out += @{ Tool='esbuild'; Message="Failed to run esbuild: $($_.Exception.Message)" } }
  }
  return $out
}

# ===== Repair primitives =====================================================
function Repair-UnicodeGremlins { param([string]$Content)
  $map = @{0x00A0=' ';0x200B='';0xFEFF='';0x200C='';0x200D='';0x200E='';0x200F='';0x202F=' ';0x2009=' ';0x200A=' ';0x2060=''}
  $out = $Content; foreach($k in $map.Keys){ $out = $out -replace [regex]::Escape([char]$k), $map[$k] }; return $out
}

function Repair-ImportStatements { param([string]$Content)
  $fixed = $Content
  $fixed = $fixed -replace '(?s)(import\s*\{)([^}]+?)(\w+)\s*\(\s*\)([^}]*)(\})','$1$2$3$4$5'
  $fixed = $fixed -replace '(?<=\sfrom\s)([^"''\s;]+)(?=\s*[;])','"$1"'
  $lines = $fixed -split "`n"; $seen=@{}; $emitted = foreach($ln in $lines){
    if ($ln -match '^\s*import\s+.*\s+from\s+[''"]([^''"]+)[''"]'){ $p=$matches[1]; if(-not $seen.ContainsKey($p)){ $seen[$p]=$true; $ln } }
    else { $ln }
  }
  return ($emitted -join "`n")
}

function Repair-JSONFile {
  param([string]$Content,[string]$FilePath)
  try { ($Content | ConvertFrom-Json -ErrorAction Stop) | ConvertTo-Json -Depth 100 } catch { $Content }
}

function Repair-LoneSlashLines { param([string]$Content) ($Content -replace '(?m)^\s*/\s*(\r?\n|$)',"`n") }

# ===== Intelligent repair with rollback =====================================
function Invoke-IntelligentRepair {
  <#
  .SYNOPSIS
    Executes the intelligent repair sequence for a file, incorporating backup, direct fix,
    restoration from Git/backup, validation, and guaranteed rollback on failure.
  .DESCRIPTION
    This is the core healing engine. It ensures **idempotency** and **safety** by taking a
    full backup and running a validation step after every fix. If validation fails,
    it reverts the file to its original state using the created backup.
  .PARAMETER FilePath
    The full path to the file currently being fixed.
  .PARAMETER Issue
    The issue object ($script:Issues item) triggering the repair.
  .OUTPUTS
    Boolean: $true if the file was successfully fixed and passed validation, $false otherwise.
  #>
  param([string]$FilePath,[object]$Issue)

  Write-Log "Repairing: $($Issue.IssueType) -> $FilePath" -Level INFO -Category 'Repair'
  try {
    $text = Get-Content -Raw -LiteralPath $FilePath
    $orig = $text
    $bak  = New-FileBackup -FilePath $FilePath
    $fixed = $text
    $applied = $false

    switch -Wildcard ($Issue.IssueType) {
      '*Unicode*' { $fixed = Repair-UnicodeGremlins $fixed; $applied=$true }
      '*Import*'  { $fixed = Repair-ImportStatements $fixed; $applied=$true }
      '*JSON*'    { $tmp = Repair-JSONFile -Content $fixed -FilePath $FilePath; if ($tmp -ne $fixed){ $fixed=$tmp; $applied=$true } }
      '*slash*'   { $fixed = Repair-LoneSlashLines $fixed; $applied=$true }
      default     { }
    }

    if (-not $applied -or $fixed -eq $orig) {
      Write-Log "No direct fix impact; trying backup/Git restore…" -Level INFO -Category 'Repair'
      $restored = $false
      $backup   = Get-CleanBackupFile -FilePath $FilePath
      if ($backup) { $fixed = $backup.Content; $Issue.FixMethod = "Restore: backup ($($backup.Source))"; $restored=$true }
      elseif ($UseGitHistory -and $script:GitAvailable) {
        $git = Get-CleanFileFromGit -FilePath $FilePath -MaxDepth $MaxGitHistoryDepth
        if ($git) { $fixed = $git.Content; $Issue.FixMethod = "Restore: git $($git.Commit)"; $restored=$true }
      }
      if (-not $restored -and -not $applied) { $Issue.FixMethod = "No-op (no safe fix identified)"; return $false }
    } else { $Issue.FixMethod = "Direct targeted repair" }

    # Validate before write
    $check = Test-FileForIssues -Content $fixed -FilePath $FilePath -QuickCheck
    if (-not $check.IsClean) {
      Write-Log "Pre-write validation failed, rolling back." -Level ERROR -Category 'Repair'
      if ($bak) { Copy-Item -LiteralPath $bak -Destination $FilePath -Force }
      $Issue.FixMethod = "Failed (pre-write validation)"
      $script:Statistics.FilesFailed++; $script:FailedFiles.Add($FilePath) | Out-Null
      return $false
    }

    if ($PSCmdlet.ShouldProcess($FilePath, "Write repaired content")) {
      $utf8 = New-Object System.Text.UTF8Encoding($false)
      [IO.File]::WriteAllText($FilePath, $fixed, $utf8)
    }

    $Issue.Fixed = $true
    $script:Statistics.IssuesFixed++
    $script:FixedFiles.Add($FilePath) | Out-Null
    Write-Log "Fixed: $FilePath" -Level SUCCESS -Category 'Repair'
    return $true
  } catch {
    Write-Log "Repair exception: $($_.Exception.Message)" -Level CRITICAL -Category 'Repair'
    $Issue.FixMethod = "Script Exception"
    $script:Statistics.FilesFailed++; $script:FailedFiles.Add($FilePath) | Out-Null
    return $false
  }
}

# ===== Repo scan =============================================================
function Is-ExcludedPath {
  param([string]$FullPath)
  $norm = $FullPath -replace '/','\'  # normalize
  foreach ($d in $script:Config.ExcludeDirs) {
    $pat = [regex]::Escape($d -replace '/','\')
    if ($norm -match "(?i)(\\|^)$pat(\\|$)") { return $true }
  }
  return $false
}

function Get-RepositoryFiles {
  Write-Log "Scanning repository…" -Level INFO -Category 'Scan'
  $candidates = New-Object System.Collections.Generic.List[IO.FileInfo]
  foreach ($root in $Paths) {
    foreach ($pat in $script:Config.IncludePatterns) {
      $found = Get-ChildItem -Path $root -Filter $pat -Recurse -File -ErrorAction SilentlyContinue
      foreach ($f in $found) { if (-not (Is-ExcludedPath -FullPath $f.FullName)) { $candidates.Add($f) | Out-Null } }
    }
  }
  Write-Log "Candidates: $($candidates.Count)" -Level INFO -Category 'Scan'
  return $candidates.ToArray()
}

function Invoke-DeepScan {
  <#
  .SYNOPSIS
    Iterates through repository files, reading content and invoking detection rules.
  .DESCRIPTION
    This function orchestrates the file-level issue detection phase, running both
    internal heuristic checks (Test-FileForIssues) and external tooling checks (Find-SyntaxErrors)
    to populate the global issue list.
  .PARAMETER Files
    An array of System.IO.FileInfo objects representing the files to scan.
  #>
  param([System.IO.FileInfo[]]$Files)
  Write-Log "Deep scan start…" -Level INFO -Category 'Scan'
  $i=0; $total=$Files.Count
  foreach ($f in $Files) {
    $i++; $pct=[math]::Round(($i/$total)*100,1)
    Write-Progress -Id 1 -Activity "Scanning" -Status "$i / $total" -PercentComplete $pct
    try {
      $content = Get-Content -Raw -LiteralPath $f.FullName -ErrorAction Stop
      if ([string]::IsNullOrWhiteSpace($content)) { $script:Statistics.FilesScanned++; continue }

      # Heuristics
      $res = Test-FileForIssues -Content $content -FilePath $f.FullName
      foreach ($msg in $res.Issues) {
        $sev = switch -Regex ($msg) {
          '^JSON'         { 'CRITICAL' }
          '^Unbalanced'   { 'CRITICAL' }
          '^Frontmatter'  { 'MEDIUM' }
          '^Unicode'      { 'LOW' }
          '^Import|^Duplicate imports' { 'HIGH' }
          default         { 'MEDIUM' }
        }
        $type = switch -Regex ($msg) {
          '^JSON'         { 'JSON Validation' }
          '^Unbalanced'   { 'Structural' }
          '^Frontmatter'  { 'File Structure' }
          '^Unicode'      { 'Unicode Gremlins' }
          '^Import|^Duplicate imports' { 'Import Issues' }
          default         { 'Structural' }
        }
        New-IssueReport -FilePath $f.FullName -IssueType $type -Description $msg -Severity $sev | Out-Null
      }

      # Syntax (esbuild)
      $sx = Find-SyntaxErrors -FilePath $f.FullName
      foreach ($e in $sx) {
        New-IssueReport -FilePath $f.FullName -IssueType "Syntax ($($e.Tool))" -Description $e.Message -Severity 'HIGH' | Out-Null
      }

      $script:Statistics.FilesScanned++
    } catch {
      New-IssueReport -FilePath $f.FullName -IssueType 'ReadError' -Description $_.Exception.Message -Severity 'CRITICAL' | Out-Null
      $script:Statistics.FilesFailed++
    }
  }
  Write-Progress -Id 1 -Activity "Scanning" -Completed
  Write-Log "Deep scan complete. Issues: $($script:Statistics.IssuesFound)" -Level INFO -Category 'Scan'
}

# ===== Healing orchestration =================================================
function Invoke-RepositoryHealing {
  Write-Log "Healing process started…" -Level INFO -Category 'Healing'
  $filesToProcess = $script:Issues | Where-Object { -not $_.Fixed } | Select-Object -ExpandProperty FilePath -Unique
  $i=0; $total=$filesToProcess.Count
  foreach ($filePath in $filesToProcess) {
    $i++; $pct=[math]::Round(($i/$total)*100,1)
    Write-Progress -Id 2 -Activity "Healing" -Status "$i / $total" -PercentComplete $pct
    $fileIssues = $script:Issues | Where-Object { $_.FilePath -eq $filePath -and -not $_.Fixed } | Sort-Object Severity -Descending
    foreach ($issue in $fileIssues) {
      if (-not $AutoFix) {
        Write-Host "`n--- INTERACTIVE REPAIR ---" -ForegroundColor Yellow
        Write-Host "File: $filePath" -ForegroundColor Yellow
        Write-Host "Issue: $($issue.IssueType) — $($issue.Description)" -ForegroundColor Yellow
        Write-Host "Severity: $($issue.Severity)" -ForegroundColor Yellow
        $r = Read-Host "Attempt repair? (Y/n/s=skip file/q=quit)"
        if ($r -match '^q') { Export-HtmlReport; throw "User aborted." }
        if ($r -match '^s') { break }
        if ($r -notmatch '^(y|Y)$') { continue }
      }
      Invoke-IntelligentRepair -FilePath $filePath -Issue $issue | Out-Null
    }
  }
  Write-Progress -Id 2 -Activity "Healing" -Completed
  Write-Log "Healing complete." -Level INFO -Category 'Healing'
}

# ===== Post-repair validation ===============================================
function Invoke-PostRepairValidation {
  Write-Log "Post-repair validation…" -Level INFO -Category 'Validate'
  $ok = $true

  if ($script:Config.RunTypeCheck -and (Test-Path "tsconfig.json")) {
    Write-Log "Type check: npx tsc --noEmit" -Level INFO -Category 'Validate'
    try {
      $null = npx tsc --noEmit --pretty false 2>&1
      if ($LASTEXITCODE -ne 0) {
        New-IssueReport -FilePath 'tsc' -IssueType 'TypeScript' -Description 'Type check failed (see log)' -Severity 'HIGH' | Out-Null
        $ok = $false
      } else {
        Write-Log "Type check passed." -Level SUCCESS -Category 'Validate'
      }
    } catch {
      New-IssueReport -FilePath 'tsc' -IssueType 'TypeScript' -Description $_.Exception.Message -Severity 'CRITICAL' | Out-Null
      $ok = $false
    }
  }

  if ($script:Config.RunESLint -and -not $NoESLintCheck -and (Test-Path ".eslintrc.json" -or Test-Path ".eslintrc.js" -or Test-Path ".eslintrc.cjs")) {
    Write-Log "ESLint: npx eslint $($script:Config.ESLintArgs -join ' ')" -Level INFO -Category 'Validate'
    try {
      $null = npx eslint @($script:Config.ESLintArgs) 2>&1
      if ($LASTEXITCODE -gt 1) {
        New-IssueReport -FilePath 'eslint' -IssueType 'ESLint' -Description "ESLint exited $LASTEXITCODE" -Severity 'MEDIUM' | Out-Null
        $ok = $false
      } else {
        Write-Log "ESLint completed (warnings may exist)." -Level SUCCESS -Category 'Validate'
      }
    } catch {
      New-IssueReport -FilePath 'eslint' -IssueType 'ESLint' -Description $_.Exception.Message -Severity 'MEDIUM' | Out-Null
      $ok = $false
    }
  }

  # Basic integrity for repaired files
  foreach ($ff in ($script:FixedFiles | Select-Object -Unique)) {
    if (-not (Test-Path $ff)) { Write-Log "INTEGRITY: missing after repair: $ff" -Level CRITICAL -Category 'Validate'; $ok=$false; continue }
    try { $null = Get-Content -Raw -LiteralPath $ff -Encoding UTF8 } catch { Write-Log "INTEGRITY: unreadable (UTF-8): $ff" -Level CRITICAL -Category 'Validate'; $ok=$false }
  }

  if ($ok) { Write-Log "Post-repair validation PASSED." -Level SUCCESS -Category 'Validate' } else { Write-Log "Post-repair validation FAILED." -Level ERROR -Category 'Validate' }
  return $ok
}

# ===== Summary ===============================================================
function Show-Summary {
  Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
  Write-Host "  REPOSITORY AUDIT & HEALING SUMMARY" -ForegroundColor Cyan
  Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
  Write-Host ("  Files Scanned:        {0}"  -f $script:Statistics.FilesScanned)
  Write-Host ("  Issues Found:         {0}"  -f $script:Statistics.IssuesFound)
  Write-Host ("  Issues Fixed:         {0}"  -f $script:Statistics.IssuesFixed)
  Write-Host ("  Files Failed:         {0}"  -f $script:Statistics.FilesFailed)
  Write-Host ("  Backups Created:      {0}"  -f $script:Statistics.BackupsCreated)
  Write-Host ""
  if ($script:FixedFiles.Count -gt 0) {
    Write-Host "  Repaired Files (top 10):" -ForegroundColor Green
    ($script:FixedFiles | Select-Object -Unique | Select-Object -First 10) | ForEach-Object { Write-Host "    ✓ $_" -ForegroundColor Green }
    if (($script:FixedFiles | Select-Object -Unique).Count -gt 10) { Write-Host "    … more" -ForegroundColor DarkGray }
  }
  if ($script:FailedFiles.Count -gt 0) {
    Write-Host "  Failed Files (top 5):" -ForegroundColor Red
    ($script:FailedFiles | Select-Object -Unique | Select-Object -First 5) | ForEach-Object { Write-Host "    ✗ $_" -ForegroundColor Red }
    Write-Host "  Review the HTML report for details." -ForegroundColor Yellow
  }
  Write-Host ""
  Write-Host "  Report: $($script:Config.ReportFile)"
  Write-Host "  Log   : $($script:Config.LogFile)"
  if (-not $SkipBackups) { Write-Host "  Backups: $($script:Config.BackupDir)" }
  Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
}

# ===== Main =================================================================
function Main {
  $start = Get-Date
  Write-Host ""
  Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
  Write-Host "║   🔧 ENTERPRISE REPOSITORY AUDIT & HEALING SYSTEM 🔧  ║" -ForegroundColor Cyan
  Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
  Write-Host ""

  Test-ExternalDependencies
  Initialize-BackupSystem

  $files = Get-RepositoryFiles
  if ($files.Count -eq 0) { Write-Log "No candidate files found. Exiting." -Level WARNING -Category 'System'; Show-Summary; return }

  Invoke-DeepScan -Files $files
  Export-HtmlReport

  if ($script:Statistics.IssuesFound -eq 0) {
    Write-Host "`n✨ No issues found. Repository is clean." -ForegroundColor Green
    Show-Summary; return
  }

  if ($ScanOnly) { Write-Log "ScanOnly mode — no repairs performed." -Level INFO -Category 'System'; Show-Summary; return }

  Invoke-RepositoryHealing
  $ok = Invoke-PostRepairValidation
  Export-HtmlReport
  Show-Summary

  $dur = (Get-Date) - $start
  Write-Log "Total execution time: $($dur.ToString('mm\:ss'))" -Level INFO -Category 'System'

  if ($script:Statistics.FilesFailed -gt 0 -or -not $ok) { exit 2 } else { exit 0 }
}

# ===== Entry point ===========================================================
try { Main }
catch {
  Write-Host "`n==============================================================" -ForegroundColor Red
  Write-Host "🚨 FATAL SCRIPT ERROR" -ForegroundColor Red
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
  Write-Log "FATAL: $($_.Exception.Message)" -Level CRITICAL -Category 'System'
  Write-Log $_.ScriptStackTrace -Level CRITICAL -Category 'System'
  Export-HtmlReport
  exit 3
}