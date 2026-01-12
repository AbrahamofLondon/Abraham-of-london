# windows-build.ps1
Write-Host "🚀 Windows Build Script for Abraham of London" -ForegroundColor Green

# Step 1: Clean
Write-Host "`n🧹 Step 1: Cleaning..." -ForegroundColor Cyan
$paths = @(".next", ".contentlayer", "node_modules/.cache", ".turbo")
foreach ($path in $paths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
        Write-Host "  Removed: $path" -ForegroundColor Gray
    }
}
Write-Host "✅ Cleanup complete" -ForegroundColor Green

# Step 2: Fix YAML
Write-Host "`n🔧 Step 2: Fixing YAML frontmatter..." -ForegroundColor Cyan
pnpm run fix:yaml:all

# Step 3: Build Contentlayer
Write-Host "`n🏗️  Step 3: Building Contentlayer..." -ForegroundColor Cyan
try {
    pnpm run contentlayer:build
    Write-Host "✅ Contentlayer build successful" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Contentlayer build failed, using fallback..." -ForegroundColor Yellow
    pnpm run contentlayer:safe
}

# Step 4: Main build
Write-Host "`n🚀 Step 4: Main build..." -ForegroundColor Cyan
pnpm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 Build successful!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Build failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Try: pnpm run build:no-contentlayer" -ForegroundColor Yellow
}
