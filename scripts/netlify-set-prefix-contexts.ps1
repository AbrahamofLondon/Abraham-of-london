# scripts/netlify-set-prefix-contexts.ps1
# SAFE-BY-DEFAULT production script:
# -Prefix required
# Only shows matching keys
# Never prints raw values unless -Reveal is explicitly set
# Robust JSON parsing (handles banners/help/noise)
# Safe invocation (does NOT merge stderr into stdout for JSON parsing)
# Optional: set matched vars across contexts

[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = "Medium")]
param(
  [Parameter(Mandatory = $true)]
  [ValidateNotNullOrEmpty()]
  [string]$Prefix,

  # Show actual values (DANGEROUS). Off by default.
  [switch]$Reveal,

  # Set matched variables across contexts
  [switch]$Set,

  # Which contexts to set (default: all the ones you actually care about)
  [ValidateSet("production","deploy-preview","branch-deploy","dev","all")]
  [string[]]$Contexts = @("production","deploy-preview","branch-deploy","dev"),

  # Overwrite without prompts (passes --force to netlify env:set)
  [switch]$Force,

  # Use npx netlify (helpful if global netlify isn't on PATH)
  [switch]$UseNpx,

  # Skip setting empty values (recommended)
  [switch]$SkipEmpty = $true,

  # Diagnostic mode: prints minimal diagnostics (never secrets unless -Reveal)
  [switch]$Diag
)

$ErrorActionPreference = "Stop"

# ---------------------------
# Helpers
# ---------------------------
function To-Text([object]$x) {
  if ($null -eq $x) { return "" }
  if ($x -is [string]) { return $x }
  if ($x -is [System.Array]) { return ($x | ForEach-Object { "$_" }) -join "`n" }
  return "$x"
}

function Is-SensitiveName([string]$name) {
  return $name -match '(SECRET|TOKEN|PASSWORD|PASS|KEY|JWT|COOKIE|PEPPER|DATABASE_URL|API_KEY|PRIVATE|CREDENTIAL)'
}

function MaskValue([string]$name, [string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) { return "" }
  if (Is-SensitiveName $name) { return "********************" }
  if ($value.Length -le 10) { return $value }
  return ($value.Substring(0,4) + "…" + $value.Substring($value.Length - 2, 2))
}

function Get-NetlifyCmd {
  if ($UseNpx) { return @("npx", "--yes", "netlify") }
  return @("netlify")
}

function Invoke-Netlify([string[]]$args, [switch]$CaptureStderr) {
  $cmd = Get-NetlifyCmd
  if ($cmd -is [string]) { $cmd = @($cmd) } # safety

  $exe = $cmd[0]
  $exeArgs = @()
  if ($cmd.Length -gt 1) { $exeArgs += $cmd[1..($cmd.Length-1)] }
  $exeArgs += $args

  if ($Diag) {
    $joined = ($exeArgs | ForEach-Object {
      if ($_ -match '(?i)(token|secret|password|key)') { "<redacted-arg>" } else { $_ }
    }) -join " "
    Write-Host "↪ $exe $joined" -ForegroundColor DarkGray
  }

  if ($CaptureStderr) {
    $out = & $exe @exeArgs 2>&1
    return To-Text $out
  } else {
    # stdout only (critical for JSON parsing cleanliness)
    $out = & $exe @exeArgs
    return To-Text $out
  }
}

function Extract-JsonSegment([string]$text) {
  if ([string]::IsNullOrWhiteSpace($text)) { return "" }

  # Find a line that begins with JSON after optional whitespace
  $m = [regex]::Match($text, '(?m)^[\s\ufeff]*([{\[])')
  if (-not $m.Success) { return "" }

  $idx = $m.Index
  $jsonText = $text.Substring($idx)

  # Trim trailing junk after the last closing brace/bracket
  $lastObj = $jsonText.LastIndexOf("}")
  $lastArr = $jsonText.LastIndexOf("]")
  $end = [Math]::Max($lastObj, $lastArr)
  if ($end -ge 0) { $jsonText = $jsonText.Substring(0, $end + 1) }

  return $jsonText
}

function Parse-EnvListJsonToMap([object]$json) {
  # Supports:
  # A) Object map { KEY: "value", ... }
  # B) Array records [ { key: "KEY", value: "x" }, { key:"K", values:{production:"x"} } ]
  $map = @{}

  if ($json -is [System.Array]) {
    foreach ($row in $json) {
      $k = $row.key
      if (-not $k) { continue }

      $v = $null
      if ($row.value) { $v = $row.value }
      elseif ($row.values) {
        foreach ($ctx in @("production","deploy-preview","branch-deploy","dev")) {
          if ($row.values.$ctx) { $v = $row.values.$ctx; break }
        }
      }

      $map[$k] = $v
    }
    return $map
  }

  if ($json.PSObject -and $json.PSObject.Properties) {
    foreach ($p in $json.PSObject.Properties) {
      $map[$p.Name] = $p.Value
    }
  }

  return $map
}

# ---------------------------
# Main
# ---------------------------
Write-Host "🔐 Netlify env sync (safe-by-default)" -ForegroundColor Cyan
Write-Host "Prefix: $Prefix" -ForegroundColor Cyan
Write-Host ("Reveal values: " + ($Reveal.IsPresent ? "YES (unsafe)" : "NO")) -ForegroundColor Gray

# Check CLI
try {
  $ver = Invoke-Netlify @("--version") -CaptureStderr
  if ($ver) { Write-Host ("Netlify CLI: " + $ver.Trim()) -ForegroundColor Gray }
} catch {
  Write-Host "Netlify CLI not found/runnable. Install (global) or rerun with -UseNpx." -ForegroundColor Red
  throw
}

# Fetch env list as JSON (stdout only)
$raw = ""
try {
  $raw = Invoke-Netlify @("env:list","--json") # stdout only
  
  # Check if the output looks like help/error output
  if ($raw -match '(?m)^\s*USAGE\b|^\s*COMMANDS\b|^\s*\[COMMAND\]') {
    throw "netlify env:list did not return JSON (help output received)."
  }
} catch {
  # Try again with stderr captured to get error details
  $raw = Invoke-Netlify @("env:list","--json") -CaptureStderr
  
  # Check if this is help/error output
  if ($raw -match '(?m)^\s*USAGE\b|^\s*COMMANDS\b|^\s*\[COMMAND\]') {
    Write-Host "Failed to run netlify env:list --json. The command printed help instead of JSON." -ForegroundColor Red
    if ($Diag) { 
      Write-Host "Output from netlify:" -ForegroundColor DarkGray
      Write-Host $raw -ForegroundColor DarkGray
    }
    throw "netlify env:list returned help/error output. Check if you're logged in and have the correct project selected."
  }
}

if ($Diag) {
  $previewLen = [Math]::Min(300, $raw.Length)
  Write-Host "Raw preview (first $previewLen chars):" -ForegroundColor DarkGray
  Write-Host ($raw.Substring(0, $previewLen)) -ForegroundColor DarkGray
  if ($raw.Length -gt $previewLen) { Write-Host "…" -ForegroundColor DarkGray }
}

# Extract JSON segment safely (handles banners/noise)
$jsonText = Extract-JsonSegment $raw
if ([string]::IsNullOrWhiteSpace($jsonText)) {
  Write-Host "`nNetlify did not return JSON. This usually means the CLI printed help/error output." -ForegroundColor Red
  Write-Host "Tip: run 'netlify env:list --json' directly to see what is printed." -ForegroundColor Yellow
  if ($Diag -and $raw) { 
    Write-Host "Full output (first 1000 chars):" -ForegroundColor DarkGray
    Write-Host ($raw.Substring(0, [Math]::Min(1000, $raw.Length))) -ForegroundColor DarkGray
    if ($raw.Length -gt 1000) { Write-Host "…" -ForegroundColor DarkGray }
  }
  throw "No JSON detected in netlify output."
}

# Parse JSON
$json = $null
try {
  $json = $jsonText | ConvertFrom-Json -ErrorAction Stop
} catch {
  Write-Host "`nJSON parse failed. (Output contained non-JSON characters.)" -ForegroundColor Red
  if ($Diag) {
    Write-Host "JSON segment preview:" -ForegroundColor DarkGray
    $pLen = [Math]::Min(800, $jsonText.Length)
    Write-Host $jsonText.Substring(0, $pLen) -ForegroundColor DarkGray
    if ($jsonText.Length -gt $pLen) { Write-Host "…" -ForegroundColor DarkGray }
  }
  throw
}

$map = Parse-EnvListJsonToMap $json

# Match keys by prefix
$matched = $map.Keys | Where-Object { $_ -like "$Prefix*" } | Sort-Object
if (-not $matched -or $matched.Count -eq 0) {
  Write-Host "`nNo variables found with prefix: $Prefix" -ForegroundColor Yellow
  exit 0
}

Write-Host "`nMatched keys ($($matched.Count)):" -ForegroundColor Green
foreach ($k in $matched) {
  $v = To-Text $map[$k]
  if ($Reveal) {
    Write-Host ("  {0} = {1}" -f $k, $v) -ForegroundColor Cyan
  } else {
    $hint = MaskValue $k $v
    if ([string]::IsNullOrWhiteSpace($hint)) {
      Write-Host ("  {0}" -f $k) -ForegroundColor Cyan
    } else {
      Write-Host ("  {0} = {1}" -f $k, $hint) -ForegroundColor Cyan
    }
  }
}

# If not setting, stop here
if (-not $Set) {
  Write-Host "`n(No changes made) Use -Set to apply these keys across contexts." -ForegroundColor Gray
  exit 0
}

# Resolve contexts
$targetContexts = if ($Contexts -contains "all") {
  @("production","deploy-preview","branch-deploy","dev")
} else {
  $Contexts
}

Write-Host "`nSetting matched keys in contexts: $($targetContexts -join ', ')" -ForegroundColor Green

foreach ($k in $matched) {
  $value = To-Text $map[$k]

  if ($SkipEmpty -and [string]::IsNullOrWhiteSpace($value)) {
    Write-Host "Skipping $k (empty value)" -ForegroundColor Yellow
    continue
  }

  foreach ($ctx in $targetContexts) {
    $args = @("env:set", $k, $value, "--context", $ctx)
    if ($Force) { $args += "--force" }

    if ($PSCmdlet.ShouldProcess("$k [$ctx]", "netlify env:set")) {
      Write-Host ("  Setting {0} in {1}…" -f $k, $ctx) -ForegroundColor Gray
      try {
        $out = Invoke-Netlify $args -CaptureStderr
        if ($Diag -and $out) { Write-Host $out.Trim() -ForegroundColor DarkGray }
      } catch {
        Write-Host ("  Failed setting {0} in {1}: {2}" -f $k, $ctx, $_.Exception.Message) -ForegroundColor Red
      }
    }
  }
}

Write-Host "`nDone." -ForegroundColor Green