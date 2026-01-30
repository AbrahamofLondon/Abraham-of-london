# scripts/netlify-scope-hard-audit.ps1
$envs = netlify env:list --json | ConvertFrom-Json

# Try to normalize the scopes field across shapes
function Get-Scopes($item) {
  if ($item.scopes) { return @($item.scopes) }
  if ($item.scope)  { return @($item.scope) }
  if ($item.values -and $item.values[0] -and $item.values[0].scopes) { return @($item.values[0].scopes) }
  return @() # empty => treat as all-scopes/unknown
}

$report = foreach ($e in $envs) {
  $k = $e.key
  if (-not $k) { continue }

  $scopes = (Get-Scopes $e) | ForEach-Object { "$_".ToLowerInvariant() }

  [pscustomobject]@{
    key = $k
    scopes = if ($scopes.Count) { $scopes -join "," } else { "ALL/UNSPECIFIED" }
  }
}

"--- Vars still ALL/UNSPECIFIED ---"
$report | Where-Object { $_.scopes -eq "ALL/UNSPECIFIED" } | Sort-Object key | Format-Table -AutoSize

"`n--- Vars with MULTIPLE scopes (check if intended) ---"
$report | Where-Object { $_.scopes -match "," } | Sort-Object key | Format-Table -AutoSize