# scripts/netlify-set-prefix-contexts.ps1
# Enterprise-safe Netlify env context synchronizer (PowerShell 7+)
# - Matches env vars by Prefix
# - Optional Only/Exclude filters
# - Copies the current value (or a forced -Value) to multiple contexts
# - Supports -WhatIf via ShouldProcess (CmdletBinding)
# Usage:
#   pwsh scripts/netlify-set-prefix-contexts.ps1 -Prefix "NEXT_PUBLIC_GISCUS_" -WhatIf
#   pwsh scripts/netlify-set-prefix-contexts.ps1 -Prefix "NEXT_PUBLIC_GISCUS_" -Force
#   pwsh scripts/netlify-set-prefix-contexts.ps1 -Prefix "NEXT_PUBLIC_GISCUS_" -Only "A","B" -Force

[CmdletBinding(SupportsShouldProcess=$true, ConfirmImpact='Medium')]
param(
  [Parameter(Mandatory=$true)]
  [ValidateNotNullOrEmpty()]
  [string]$Prefix,

  # Can be array or comma-separated entries
  [string[]]$Only = @(),

  # Can be array or comma-separated entries
  [string[]]$Exclude = @(),

  # If set, overrides the value for ALL matched vars
  [string]$Value,

  # Target contexts
  [string[]]$Contexts = @('production','deploy-preview','branch-deploy'),

  # Pass --force to netlify env:set
  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-Cmd {
  param([string]$Name)
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) { throw "Missing required command: $Name. Install/enable it and retry." }
}

function Normalize-List {
  param([string[]]$Items)
  $acc = New-Object System.Collections.Generic.List[string]
  foreach ($i in @($Items)) {
    if ([string]::IsNullOrWhiteSpace($i)) { continue }
    foreach ($p in ($i -split ',')) {
      $t = $p.Trim()
      if ($t) { $acc.Add($t) }
    }
  }
  return @($acc.ToArray())
}

function Get-NetlifyEnvJsonObject {
  $raw = & netlify env:list --json 2>$null
  if (-not $raw) { throw "netlify env:list --json returned no output." }

  $text = ($raw | Out-String)

  try {
    return ($text | ConvertFrom-Json)
  } catch {
    # Some Netlify CLIs wrap JSON with banners; extract { ... } safely
    $start = $text.IndexOf('{')
    $end   = $text.LastIndexOf('}')
    if ($start -lt 0 -or $end -lt 0 -or $end -le $start) {
      throw "Could not parse JSON from netlify output."
    }
    $json = $text.Substring($start, $end - $start + 1)
    return ($json | ConvertFrom-Json)
  }
}

function New-NameSet {
  param([string[]]$Names)
  if (-not $Names -or @($Names).Count -eq 0) { return $null }
  return [System.Collections.Generic.HashSet[string]]::new([string[]]$Names, [System.StringComparer]::OrdinalIgnoreCase)
}

function Try-GetValueFromJson {
  param(
    [Parameter(Mandatory=$true)][object]$EnvObj,
    [Parameter(Mandatory=$true)][string]$Name
  )
  try {
    $prop = $EnvObj.PSObject.Properties[$Name]
    if ($null -ne $prop) {
      # May be masked; still treated as "value present" for copy-with-override scenarios
      return [string]$prop.Value
    }
  } catch {}
  return $null
}

function Get-VarValue {
  param(
    [Parameter(Mandatory=$true)][object]$EnvObj,
    [Parameter(Mandatory=$true)][string]$Name
  )

  # Best effort from JSON
  $v = Try-GetValueFromJson -EnvObj $EnvObj -Name $Name
  if (-not [string]::IsNullOrWhiteSpace($v)) { return $v }

  # Fallback to netlify env:get in production
  $got = & netlify env:get $Name --context production 2>$null
  if ($LASTEXITCODE -ne 0) { return $null }
  return ([string]($got | Select-Object -First 1)).Trim()
}

function Set-VarInContext {
  param(
    [Parameter(Mandatory=$true)][string]$Name,
    [Parameter(Mandatory=$true)][string]$Val,
    [Parameter(Mandatory=$true)][string]$Context,
    [switch]$Force
  )

  $args = @('env:set', $Name, $Val, '--context', $Context)
  if ($Force) { $args += '--force' }

  $target = "${Name} (${Context})"
  $action = "netlify $($args -join ' ')"

  if ($PSCmdlet.ShouldProcess($target, $action)) {
    & netlify @args | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "Failed to set ${Name} in ${Context}." }
    Write-Host "✅ ${Name} set in ${Context}"
  }
}

# ---------------- MAIN ----------------
Assert-Cmd netlify

$Only    = Normalize-List $Only
$Exclude = Normalize-List $Exclude

$onlySet = New-NameSet $Only
$exSet   = New-NameSet $Exclude

$envObj = Get-NetlifyEnvJsonObject

$allNames = @($envObj.PSObject.Properties.Name)

$matched = @(
  foreach ($n in $allNames) {
    if ($n -notlike "$Prefix*") { continue }
    if ($onlySet -and -not $onlySet.Contains($n)) { continue }
    if ($exSet   -and $exSet.Contains($n)) { continue }
    $n
  }
) | Sort-Object

if (@($matched).Count -eq 0) {
  Write-Host "No env vars match prefix '$Prefix' (after filters)."
  return
}

Write-Host "Matched vars:"
$matched | ForEach-Object { Write-Host " - $_" }

foreach ($name in $matched) {

  $valToUse = $null

  if ($PSBoundParameters.ContainsKey('Value')) {
    $valToUse = $Value
  } else {
    $valToUse = Get-VarValue -EnvObj $envObj -Name $name
    if ([string]::IsNullOrWhiteSpace($valToUse)) {
      Write-Host "⚠️  Skipping ${name}: could not read value (and no -Value supplied)."
      continue
    }
  }

  foreach ($ctx in @($Contexts)) {
    Set-VarInContext -Name $name -Val $valToUse -Context $ctx -Force:$Force
  }
}

Write-Host "Done."