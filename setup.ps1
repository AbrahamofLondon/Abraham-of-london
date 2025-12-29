// setup.ps1 - Complete Windows setup script
Write-Host "Abraham of London - Windows Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check for Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# Check for pnpm
Write-Host "Checking pnpm..." -ForegroundColor Yellow
$pnpmVersion = pnpm --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "pnpm is not installed. Installing..." -ForegroundColor Yellow
    npm install -g pnpm
    $pnpmVersion = pnpm --version
}
Write-Host "pnpm version: $pnpmVersion" -ForegroundColor Green

# Clean up
Write-Host "Cleaning up..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
}
if (Test-Path ".contentlayer") {
    Remove-Item -Recurse -Force ".contentlayer"
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pnpm install

# Build Contentlayer
Write-Host "Building Contentlayer..." -ForegroundColor Yellow
pnpm run content:build

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start development:" -ForegroundColor Cyan
Write-Host "  pnpm run dev" -ForegroundColor White
Write-Host ""
Write-Host "To build for production:" -ForegroundColor Cyan
Write-Host "  pnpm run build:prod" -ForegroundColor White
Write-Host "  OR" -ForegroundColor White
Write-Host "  .\build.ps1" -ForegroundColor White