// build.ps1 - Windows PowerShell build script
# Save this as build.ps1 in your project root

Write-Host "Setting build environment..." -ForegroundColor Green

# Set environment variables
$env:CI = "false"
$env:NEXT_DISABLE_ESLINT = "1"
$env:NEXT_DISABLE_TYPECHECK = "1"
$env:NODE_ENV = "production"

Write-Host "Cleaning previous build..." -ForegroundColor Yellow
try {
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next"
    }
    if (Test-Path ".contentlayer") {
        Remove-Item -Recurse -Force ".contentlayer"
    }
    Write-Host "Cleanup complete" -ForegroundColor Green
} catch {
    Write-Host "Cleanup failed: $_" -ForegroundColor Red
}

Write-Host "Building Contentlayer..." -ForegroundColor Yellow
try {
    pnpm run content:build
    Write-Host "Contentlayer build successful" -ForegroundColor Green
} catch {
    Write-Host "Contentlayer build failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Building Next.js..." -ForegroundColor Yellow
try {
    next build
    Write-Host "Next.js build successful" -ForegroundColor Green
} catch {
    Write-Host "Next.js build failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Build complete!" -ForegroundColor Green