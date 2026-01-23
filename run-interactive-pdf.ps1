# run-interactive-pdf.ps1 - PowerShell wrapper
Write-Host "🚀 Interactive PDF Generator" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Get all arguments
$argsString = $args -join " "

Write-Host "Arguments: $argsString" -ForegroundColor Yellow
Write-Host ""

# Run the TypeScript file
npx tsx scripts/pdf/generate-interactive-pdf.ts @args
