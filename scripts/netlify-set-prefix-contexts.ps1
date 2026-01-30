[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [Parameter(Mandatory = $true)]
  [string]$Prefix,

  # If a variable has per-context values, prefer the production value when available.
  [switch]$UseProductionValues,

  # Overwrite without prompting (uses netlify --force).
  [switch]$Force,

  # Skip setting vars that have empty/null values (recommended).
  [switch]$SkipEmpty = $true,

  # If you really want to keep using npx, set this; otherwise we use `netlify` directly.
  [switch]$UseNpx
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
  return $name -match '(SECRET|TOKEN|PASSWORD|KEY|JWT|COOKIE|PEPPER|DATABASE_URL|API_KEY|PRIVATE)'
}

function RedactValue([string]$name, [string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) { return "" }
  if (Is-SensitiveName $name) { return "********************" }
  # keep small public values readable
  if ($value.Length -le 8) { return $value }
  return $value.Substring(0,4) + "…" + $value.Substring($value.Length - 2, 2)
}

function Get-NetlifyCmd {
  if ($UseNpx) { return @("npx", "--yes", "netlify") }
  return @("netlify")
}

function Invoke-NetlifyJson([string[]]$args) {
  $cmd = Get-NetlifyCmd
  $exe = $cmd[0]
  $exeArgs = @()
  if ($cmd.Length -gt 1) { $exeArgs += $cmd[1..($cmd.Length-1)] }
  $exeArgs += $args

  # IMPORTANT: capture both stdout+stderr, but don’t explode on nonzero yet
  $output = & $exe @exeArgs 2>&1
  $text = To-Text $output
  return $text
}

function Build-VarMapFromNetlifyJson([object]$json) {
  # Supports two shapes:
  # (A) { KEY: "value", KEY2: "value2" }  -> object map
  # (B) [ { key: "KEY", values: { production: "x", dev: "y" } }, ... ] -> array records
  $map = @{}

  if ($json -is [System.Array]) {
    foreach ($row in $json) {
      $key = $row.key
      if (-not $key) { continue }

      $value = $null

      # Prefer production if asked and present
      if ($UseProductionValues -and $row.values -and $row.values.production) {
        $value = $row.values.production
      } elseif ($row.value) {
        $value = $row.value
      } elseif ($row.values) {
        # fall back to any available value
        foreach ($ctx in @("production","dev","deploy-preview","branch-deploy")) {
          if ($row.values.$ctx) { $value = $row.values.$ctx; break }
        }
      }

      $map[$key] = $value
    }
    return $map
  }

  # object map
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
Write-Host "Setting up environment variables with prefix: $Prefix" -ForegroundColor Cyan

# Version check
try {
  $ver = Invoke-NetlifyJson @("--version")
  Write-Host ("Netlify CLI: " + ($ver.Trim())) -ForegroundColor Gray
} catch {
  Write-Host "Netlify CLI not found or not runnable. Install or run: npm i -g netlify-cli" -ForegroundColor Red
  throw
}

Write-Host "`nFetching env vars (JSON)..." -ForegroundColor Gray
$raw = Invoke-NetlifyJson @("env:list","--json")

# Debug preview (safe)
$rawText = To-Text $raw
if ($rawText.Length -gt 0) {
  $previewLen = [Math]::Min(500, $rawText.Length)
  Write-Host "Raw preview (first $previewLen chars):" -ForegroundColor DarkGray
  Write-Host ($rawText.Substring(0, $previewLen)) -ForegroundColor DarkGray
  if ($rawText.Length -gt 500) { Write-Host "…" -ForegroundColor DarkGray }
} else {
  Write-Host "Netlify returned empty output." -ForegroundColor Yellow
}

# Parse JSON
$json = $null
try {
  $json = $rawText | ConvertFrom-Json -ErrorAction Stop
} catch {
  Write-Host "`nFailed to parse JSON. Raw output likely contains an error payload:" -ForegroundColor Red
  Write-Host $rawText -ForegroundColor DarkGray
  throw
}

$varMap = Build-VarMapFromNetlifyJson $json

# Filter by prefix
$matched = $varMap.Keys | Where-Object { $_ -like "$Prefix*" } | Sort-Object
if (-not $matched -or $matched.Count -eq 0) {
  Write-Host "`nNo variables found with prefix: $Prefix" -ForegroundColor Yellow
  exit 0
}

Write-Host "`nFound variables: $($matched -join ', ')" -ForegroundColor Green
foreach ($k in $matched) {
  $v = To-Text $varMap[$k]
  Write-Host ("  {0} = {1}" -f $k, (RedactValue $k $v)) -ForegroundColor Cyan
}

# Contexts (explicit is safer than "all")
$contexts = @("production","deploy-preview","branch-deploy","dev")

if (-not $Force) {
  $confirmation = Read-Host "`nSet these variables in contexts: $($contexts -join ', ')? (y/N)"
  if ($confirmation -ne 'y') {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    exit 0
  }
}

foreach ($k in $matched) {
  $value = To-Text $varMap[$k]

  if ($SkipEmpty -and [string]::IsNullOrWhiteSpace($value)) {
    Write-Host "Skipping $k (empty value)" -ForegroundColor Yellow
    continue
  }

  foreach ($ctx in $contexts) {
    $args = @("env:set", $k, $value, "--context", $ctx)
    if ($Force) { $args += "--force" }

    if ($PSCmdlet.ShouldProcess("$k [$ctx]", "netlify env:set")) {
      Write-Host ("Setting {0} in {1}…" -f $k, $ctx) -ForegroundColor Gray
      $out = Invoke-NetlifyJson $args
      if ($out) { Write-Host ($out.Trim()) -ForegroundColor DarkGray }
    }
  }
}

Write-Host "`nDone." -ForegroundColor Green