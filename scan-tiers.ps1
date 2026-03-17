# scan-tiers.ps1
$report = @()
$files = @(
  "lib/access/tier-policy.ts",
  "lib/auth/withAdminAuth.tsx",
  "lib/gating.ts",
  "lib/database/models/InnerCircleData.ts",
  "lib/database/models/User.ts",
  "lib/auth-utils.ts",
  "lib/pricing/event-pricing.ts",
  "contentlayer.config.ts",
  "lib/briefs/registry.ts",
  "lib/server/auth/tokenStore.postgres.ts",
  "lib/inner-circle/config.ts",
  "middleware.ts"
)

foreach ($file in $files) {
  if (Test-Path $file) {
    Write-Host "Scanning $file..." -ForegroundColor Yellow
    $content = Get-Content $file -Raw
    $issues = @()
    
    # Check for Record<AccessTier> without top-secret
    if ($content -match "Record\s*<\s*AccessTier\s*,\s*[^>]+>\s*=\s*{[^}]*}" -and 
        $content -notmatch "['`"]top-secret['`"]") {
      $issues += "Record<AccessTier> missing top-secret"
    }
    
    # Check tier arrays
    if ($content -match "(const|let|var)\s+\w+\s*:\s*AccessTier\[\]\s*=\s*\[[^\]]*\]" -and 
        $content -notmatch "['`"]top-secret['`"]") {
      $issues += "AccessTier array missing top-secret"
    }
    
    # Check switch statements
    if ($content -match "switch\s*\([^)]+\)\s*{[^}]*}" -and 
        $content -notmatch "case\s+['`"]top-secret['`"]") {
      $issues += "Switch statement missing top-secret case"
    }
    
    if ($issues.Count -gt 0) {
      $report += [PSCustomObject]@{
        File = $file
        Issues = $issues -join "; "
      }
      Write-Host "  Found issues: $($issues -join '; ')" -ForegroundColor Red
    } else {
      Write-Host "  ✓ No issues found" -ForegroundColor Green
    }
  } else {
    Write-Host "File not found: $file" -ForegroundColor Gray
  }
}

if ($report.Count -gt 0) {
  $report | Format-Table -AutoSize
  $report | Export-Csv -Path "tier-fixes-needed.csv" -NoTypeInformation
  Write-Host "`nReport saved to tier-fixes-needed.csv" -ForegroundColor Green
} else {
  Write-Host "`n✓ No issues found in scanned files!" -ForegroundColor Green
}