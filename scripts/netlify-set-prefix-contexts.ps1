[CmdletBinding(SupportsShouldProcess=$true, ConfirmImpact="Medium")]
param(
  [Parameter(Mandatory=$true)]
  [string]$Prefix,

  # If provided: apply this same value to all matched vars across contexts
  [string]$Value,

  # If set: read each var from production context and replicate it into other contexts
  [switch]$UseProductionValues,

  # Include only these names
  [string[]]$Only,

  # Exclude these names
  [string[]]$Exclude,

  # Contexts to apply to
  [string[]]$Contexts = @("production","deploy-preview","branch-deploy"),

  [switch]$Force
)

# -----------------------------
# Utilities: robust JSON parse
# -----------------------------
function Remove-Ansi {
  param([string]$Text)
  if ($null -eq $Text) { return "" }
  # Strip ANSI escape sequences
  return ($Text -replace "`e\[[0-9;]*[A-Za-z]", "")
}

function Extract-JsonObject {
  param([string]$Text)

  $t = Remove-Ansi $Text
  # Remove leading BOM/non-printables
  $t = ($t.ToCharArray() | Where-Object { [int]$_ -ge 32 -or $_ -eq "`n" -or $_ -eq "`r" -or $_ -eq "`t" }) -join ""

  $start = $t.IndexOf("{")
  $end   = $t.LastIndexOf("}")

  if ($start -lt 0 -or $end -lt 0 -or $end -le $start) {
    return $null
  }

  return $t.Substring($start, ($end - $start + 1))
}

function Invoke-NetlifyRaw {
  param([string[]]$Args)

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "netlify"
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError  = $true
  $psi.UseShellExecute = $false
  $psi.Arguments = ($Args -join " ")

  # Prevent pager surprises
  $psi.Environment["PAGER"] = ""

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  [void]$p.Start()

  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()

  # Some Netlify CLI writes noise to stderr; keep it but don't treat as fatal here
  return @{
    ExitCode = $p.ExitCode
    StdOut   = $stdout
    StdErr   = $stderr
  }
}

function Invoke-NetlifyJson {
  param([string[]]$Args)

  $raw = Invoke-NetlifyRaw -Args $Args

  # Prefer stdout, but if stdout is empty and stderr has content, fall back
  $text = $raw.StdOut
  if ([string]::IsNullOrWhiteSpace($text) -and -not [string]::IsNullOrWhiteSpace($raw.StdErr)) {
    $text = $raw.StdErr
  }

  $jsonText = Extract-JsonObject $text
  if (-not $jsonText) {
    return $null
  }

  try {
    return ($jsonText | ConvertFrom-Json)
  } catch {
    return $null
  }
}

function Get-EnvVarNames {
  param($Obj)
  if ($null -eq $Obj) { return @() }
  if ($Obj.PSObject -and $Obj.PSObject.Properties) {
    return @($Obj.PSObject.Properties.Name)
  }
  return @()
}

# -----------------------------
# Load vars
# -----------------------------
$envJson = Invoke-NetlifyJson -Args @("env:list","--json")
$allNames = Get-EnvVarNames $envJson

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

# -----------------------------
# Apply
# -----------------------------
foreach ($name in $matched) {
  foreach ($ctx in $Contexts) {

    $targetValue = $null

    if ($PSBoundParameters.ContainsKey("Value")) {
      $targetValue = $Value
    }
    elseif ($UseProductionValues) {
      $get = Invoke-NetlifyRaw -Args @("env:get", $name, "--context", "production")
      $targetValue = ($get.StdOut ?? "").Trim()
      if ([string]::IsNullOrWhiteSpace($targetValue)) {
        # Some CLIs return value in stderr
        $targetValue = ($get.StdErr ?? "").Trim()
      }
      if ([string]::IsNullOrWhiteSpace($targetValue)) {
        Write-Host "⚠️  Skipping ${name} (couldn't read value from production)." -ForegroundColor Yellow
        continue
      }
    }
    else {
      if ($envJson -and $envJson.PSObject.Properties.Match($name).Count -gt 0) {
        $targetValue = [string]$envJson.$name
      }
      if ([string]::IsNullOrWhiteSpace($targetValue)) {
        Write-Host "⚠️  Skipping ${name} (no value available; pass -Value or -UseProductionValues)." -ForegroundColor Yellow
        continue
      }
    }

    $preview = "netlify env:set $name <value> --context $ctx" + ($(if ($Force) { " --force" } else { "" }))

    if ($PSCmdlet.ShouldProcess("$name ($ctx)", $preview)) {
      $args = @("env:set", $name, $targetValue, "--context", $ctx)
      if ($Force) { $args += "--force" }

      $set = Invoke-NetlifyRaw -Args $args
      if ($set.ExitCode -eq 0) {
        Write-Host "✅ ${name} set in ${ctx}" -ForegroundColor Green
      } else {
        Write-Host "❌ Failed setting ${name} in ${ctx}" -ForegroundColor Red
        if ($set.StdErr) { Write-Host $set.StdErr -ForegroundColor DarkRed }
      }
    }
  }
}

Write-Host "Done." -ForegroundColor Cyan