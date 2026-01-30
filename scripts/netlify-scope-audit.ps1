# scripts/netlify-scope-audit.ps1
# Audits Netlify env var scopes and prints "fix" commands.
# Usage:
#   pwsh scripts/netlify-scope-audit.ps1
#   pwsh scripts/netlify-scope-audit.ps1 -Apply

param(
  [switch]$Apply
)

function DesiredScopes([string]$Key) {
  # RULES OF THUMB (adjust if you have special cases)
  # - NEXT_PUBLIC_* => builds only
  # - Build tooling vars => builds
  # - Server secrets / DB / auth => runtime + functions (covers Next runtime + Netlify functions)
  # - If you KNOW a var is only used in Netlify Functions, you can reduce to functions only.

  if ($Key -like "NEXT_PUBLIC_*") { return @("builds") }

  $buildOnly = @(
    "NODE_VERSION",
    "NPM_FLAGS",
    "NEXT_TELEMETRY_DISABLED"
  )
  if ($buildOnly -contains $Key) { return @("builds") }

  $serverSecrets = @(
    "DATABASE_URL",
    "INNER_CIRCLE_DB_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "ACCESS_COOKIE_SECRET",
    "ACCESS_KEY_PEPPER",
    "ADMIN_API_KEY",
    "ADMIN_JWT_SECRET",
    "ADMIN_REVOKE_KEY",
    "ADMIN_SECRET_TOKEN",
    "JWT_SECRET"
  )
  if ($serverSecrets -contains $Key) { return @("runtime","functions") }

  # Broad pattern catch-alls:
  if ($Key -match "SECRET|TOKEN|KEY|DATABASE|DB_URL|JWT|NEXTAUTH") { return @("runtime","functions") }

  # Default: leave it alone (unknown usage)
  return @()
}

# Pull live env list (don’t rely on stale file)
$envs = netlify env:list --json | ConvertFrom-Json

# Normalize shape: the CLI output can vary; handle common formats
# We expect items with .key and scope information somewhere.
# We'll treat "no explicit scopes" as "all scopes" (what you’re trying to eliminate for most vars).
$items = @()

foreach ($e in $envs) {
  $key = $e.key
  if (-not $key) { continue }

  # Try to infer current scopes from known fields
  $currentScopes = @()

  if ($e.scopes) { $currentScopes = @($e.scopes) }
  elseif ($e.scope) { $currentScopes = @($e.scope) }
  elseif ($e.values -and $e.values[0] -and $e.values[0].scopes) { $currentScopes = @($e.values[0].scopes) }

  # Normalize to lowercase plural where possible
  $currentScopes = $currentScopes | ForEach-Object { "$_".ToLowerInvariant() }

  $items += [pscustomobject]@{
    key = $key
    currentScopes = $currentScopes
  }
}

# Determine “needs action”
$plan = @()

foreach ($i in $items) {
  $desired = DesiredScopes $i.key
  if ($desired.Count -eq 0) { continue } # unknown; skip

  $curr = $i.currentScopes

  # If the var looks like it applies to "all" (empty scopes or contains "all"), treat as needing explicit scopes
  $isAll = ($curr.Count -eq 0) -or ($curr -contains "all")

  # If current scopes already include desired scopes, no need.
  $missing = @()
  foreach ($d in $desired) {
    if ($curr -notcontains $d) { $missing += $d }
  }

  if ($isAll -or $missing.Count -gt 0) {
    $plan += [pscustomobject]@{
      key = $i.key
      current = if ($isAll) { "all" } else { ($curr -join ",") }
      desired = ($desired -join ",")
      missing = ($missing -join ",")
    }
  }
}

if ($plan.Count -eq 0) {
  "✅ No obvious scope moves needed based on current rules."
  exit 0
}

"--- SCOPE MOVE PLAN (based on naming rules) ---"
$plan | Sort-Object key | Format-Table -AutoSize

"`n--- READY COMMANDS (safe; pulls current values then re-sets with scopes) ---"

foreach ($p in ($plan | Sort-Object key)) {
  $desiredScopes = $p.desired.Split(",") | Where-Object { $_ -ne "" }

  foreach ($sc in $desiredScopes) {
    # We do NOT echo the value; we fetch it then set.
    # --force prevents prompts / “overwrite?” delays.
    "(`$v = netlify env:get {0}) > `$null; netlify env:set {0} `"`$v`" --scope {1} --force" -f $p.key, $sc
  }
}

if ($Apply) {
  "`n--- APPLYING CHANGES ---"
  foreach ($p in ($plan | Sort-Object key)) {
    $desiredScopes = $p.desired.Split(",") | Where-Object { $_ -ne "" }
    foreach ($sc in $desiredScopes) {
      $v = netlify env:get $p.key
      if (-not $v) {
        Write-Warning "Skipping $($p.key) (env:get returned empty)."
        continue
      }
      netlify env:set $p.key "$v" --scope $sc --force | Out-Null
      "✅ $($p.key) scoped to $sc"
    }
  }
  "✅ Done."
} else {
  "`nTip: run with -Apply to execute automatically:"
  "  pwsh scripts/netlify-scope-audit.ps1 -Apply"
}
