# scripts/netlify-set-prefix-contexts.ps1
[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param(
  [Parameter(Mandatory = $true)]
  [string]$Prefix,

  # Optional: apply this literal value to ALL matched vars (skips env:get)
  [string]$Value = "",

  # Optional: only update these exact var names
  [string[]]$Only = @(),

  # Optional: exclude these exact var names
  [string[]]$Exclude = @(),

  # Overwrite without prompts
  [switch]$Force
)

function Require-Cmd([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $name (Netlify CLI not on PATH)."
  }
}

Require-Cmd netlify

$contexts = @("production", "deploy-preview", "branch-deploy")

# 1) Pull env list JSON
$json = netlify env:list --json 2>$null
if (-not $json) { throw "netlify env:list --json returned nothing. Are you linked/logged in?" }

try { $data = $json | ConvertFrom-Json } catch { throw "Failed to parse JSON from netlify env:list --json" }

# 2) Extract variable names robustly (handles object map OR array forms)
$names = @()

# Case A: JSON is a plain object map { "KEY": "VALUE", ... }
if ($data -is [psobject] -and $data.PSObject.Properties.Count -gt 0 -and -not ($data -is [System.Collections.IEnumerable] -and $data.GetType().Name -match 'Array')) {
  $names = $data.PSObject.Properties.Name
}
# Case B: JSON is an array of objects (various Netlify CLI shapes)
elseif ($data -is [System.Collections.IEnumerable]) {
  # Some CLI versions wrap under .vars
  if ($data.vars) { $data = $data.vars }

  foreach ($v in $data) {
    if ($v.key)  { $names += [string]$v.key;  continue }
    if ($v.name) { $names += [string]$v.name; continue }
  }
}

$names = $names | Where-Object { $_ -like "$Prefix*" } | Sort-Object -Unique

if ($Only.Count -gt 0) {
  $onlySet = [System.Collections.Generic.HashSet[string]]::new([string[]]$Only)
  $names = $names | Where-Object { $onlySet.Contains($_) }
}

if ($Exclude.Count -gt 0) {
  $exSet = [System.Collections.Generic.HashSet[string]]::new([string[]]$Exclude)
  $names = $names | Where-Object { -not $exSet.Contains($_) }
}

if ($names.Count -eq 0) {
  Write-Host "No env vars match prefix '$Prefix' (after filters)." -ForegroundColor Yellow
  exit 0
}

Write-Host "Matched vars:" -ForegroundColor Cyan
$names | ForEach-Object { Write-Host " - $_" }

# 3) Apply across contexts
foreach ($name in $names) {

  $applyValue = $Value

  if ([string]::IsNullOrWhiteSpace($applyValue)) {
    # Read from production (source of truth)
    $applyValue = netlify env:get $name --context production 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($applyValue)) {
      Write-Host "⚠️  Skipping ${name}: couldn't read value from production." -ForegroundColor Yellow
      continue
    }
  }

  foreach ($ctx in $contexts) {
    $args = @("env:set", $name, $applyValue, "--context", $ctx)
    if ($Force) { $args += "--force" }

    $label = "netlify $($args -join ' ')"
    if ($PSCmdlet.ShouldProcess("${name} (${ctx})", $label)) {
      & netlify @args | Out-Host
      if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed setting ${name} in ${ctx}" -ForegroundColor Red
      } else {
        Write-Host "✅ ${name} set in ${ctx}" -ForegroundColor Green
      }
    }
  }
}

Write-Host "Done." -ForegroundColor Cyan