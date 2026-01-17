# hybrid-migration.ps1
Write-Host "🚀 Setting up hybrid router structure..." -ForegroundColor Cyan

# Create directory structure
New-Item -ItemType Directory -Force -Path "app/api/v2"
New-Item -ItemType Directory -Force -Path "backup/conflicting-routes"

# Define which APIs go where
$pagesApiFiles = @(
  "users",
  "admin",
  "analytics", 
  "inner-circle",
  "rate-limit",
  "contact",
  "subscribe",
  "newsletter",
  "health"
)

$appApiFiles = @(
  "v2/users",
  "v2/admin",
  "v2/health"
)

Write-Host "`n📦 Checking existing files..." -ForegroundColor Yellow

# Check for conflicts
if (Test-Path "app/api") {
    $conflicts = Get-ChildItem "app/api" -Recurse -File | Where-Object { 
        $_.FullName -match "route\.ts$" -or $_.FullName -match "route\.tsx$"
    }
    
    if ($conflicts.Count -gt 0) {
        Write-Host "⚠️  Found $($conflicts.Count) App Router API files" -ForegroundColor Red
        foreach ($file in $conflicts) {
            $relative = $file.FullName.Replace((Get-Location).Path + "\", "")
            Write-Host "   - $relative" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n✅ Hybrid setup ready!" -ForegroundColor Green
Write-Host "`n📋 API Endpoints:" -ForegroundColor Cyan
Write-Host "   Pages Router: /api/v1/*" -ForegroundColor White
Write-Host "   App Router:   /api/v2/*" -ForegroundColor White
Write-Host "   Legacy:       /api/*  → /api/v1/*" -ForegroundColor Gray
Write-Host "`n🚀 To build:" -ForegroundColor Green
Write-Host "   pnpm next clean && pnpm build" -ForegroundColor White
