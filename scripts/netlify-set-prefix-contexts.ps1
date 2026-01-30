<# 
.SYNOPSIS
  Sync Netlify env vars across contexts by prefix.

.EXAMPLE
  pwsh scripts/netlify-set-prefix-contexts.ps1 -Prefix "NEXT_PUBLIC_GISCUS_" -Force

.EXAMPLE
  pwsh scripts/netlify-set-prefix-contexts.ps1 -Prefix "NEXT_PUBLIC_GISCUS_" -Only NEXT_PUBLIC_GISCUS_REPO,NEXT_PUBLIC_GISCUS_REPO_ID -Force

.EXAMPLE
  pwsh scripts/netlify-set-prefix-contexts.ps1 -Prefix "NEXT_PUBLIC_GISCUS_" -Value "..." -Force

.NOTES
  - If -Value is not provided, the script uses the value from --context production as source-of-truth.
  - Uses ShouldProcess so -WhatIf works naturally.
#>

[CmdletBinding(SupportsShouldProcess=$true, ConfirmImpact="Medium")]
param(
  [Parameter(Mandatory=$true)]
  [string]$Prefix,

  # If provided, apply this same value to all matched vars
  [string]$Value,

  # Apply to these vars only (names). If omitted, uses prefix match.
  [string[]]$Only,

  # Exclude these vars (names).
  [string[]]$Exclude,

  # Contexts to set in Netlify
  [string[]]$Contexts = @("production", "deploy-preview", "branch-deploy"),

  # If Value is not provided: read each var from production context and replicate it
  [switch]$UseProductionValues,

  [switch]$Force
)

function Invoke-NetlifyJson {
  param([string[]]$Args)
  $out = & netlify @Args 2>$null
  if (-not $out) { return $null }
  return ($out | ConvertFrom-Json)
}

function Get-VarNamesFromEnvListJson {
  param($Json)
  if ($null -eq $Json) { return @() }

  # netlify env:list --json often returns an object where properties are env var names
  if ($Json.PSObject -and $Json.PSObject.Properties) {
    return @($Json.PSObject.Properties.Name)
  }

  return @()
}

# -------------------- Load env vars --------------------
$envJson = Invoke-NetlifyJson -Args @("env:list", "--json")
$allNames = Get-VarNamesFromEnvListJson $envJson

$matched = @($allNames | Where-Object { $_ -like "$Prefix*" })

if ($Only -and $Only.Count -gt 0) {
  $onlySet = [System.Collections.Generic.HashSet[string]]::new([string[]]$Only)
  $matched = @($matched | Where-Object { $onlySet.Contains($_) })
}

if ($Exclude -and $Exclude.Count -gt 0) {
  $exSet = [System.Collections.Generic.HashSet[string]]::new([string[]]$Exclude)
  $matched = @($matched | Where-Object { -not $exSet.Contains($_) })
}

if (-not $matched -or $matched.Count -eq 0) {
  Write-Host "No env vars match prefix '$Prefix' (after filters)." -ForegroundColor Yellow
  exit 0
}

Write-Host "Matched vars:" -ForegroundColor Cyan
$matched | ForEach-Object { Write-Host " - $_" }

# -------------------- Apply --------------------
foreach ($name in $matched) {
  foreach ($ctx in $Contexts) {

    $targetValue = $null

    if ($PSBoundParameters.ContainsKey("Value")) {
      $targetValue = $Value
    }
    elseif ($UseProductionValues) {
      # always pull from production (single source of truth)
      $targetValue = & netlify env:get $name --context production 2>$null
      if ([string]::IsNullOrWhiteSpace($targetValue)) {
        Write-Host "⚠️  Skipping ${name} (couldn't read value from production)." -ForegroundColor Yellow
        continue
      }
      $targetValue = $targetValue.Trim()
    }
    else {
      # default: use value from env:list JSON (dev context snapshot)
      if ($envJson.PSObject.Properties.Match($name).Count -gt 0) {
        $targetValue = [string]$envJson.$name
      }

      if ([string]::IsNullOrWhiteSpace($targetValue)) {
        Write-Host "⚠️  Skipping ${name} (no value available; pass -Value or -UseProductionValues)." -ForegroundColor Yellow
        continue
      }
    }

    $cmd = "netlify env:set $name <value> --context $ctx" + ($(if ($Force) { " --force" } else { "" }))

    if ($PSCmdlet.ShouldProcess("$name ($ctx)", $cmd)) {
      $args = @("env:set", $name, $targetValue, "--context", $ctx)
      if ($Force) { $args += "--force" }

      & netlify @args | Out-Null
      Write-Host "✅ ${name} set in ${ctx}" -ForegroundColor Green
    }
  }
}

Write-Host "Done." -ForegroundColor Cyan
