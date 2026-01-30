[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [Parameter(Mandatory = $true)]
  [string]$Prefix,
  
  [switch]$UseProductionValues,
  [switch]$Force
)

Write-Host "Setting up environment variables with prefix: $Prefix" -ForegroundColor Cyan

# Debug: Check if netlify CLI is installed
Write-Host "Checking Netlify CLI..." -ForegroundColor Gray
try {
    $version = npx netlify --version 2>&1
    Write-Host "Netlify CLI version: $version" -ForegroundColor Gray
} catch {
    Write-Host "Netlify CLI not found or error: $_" -ForegroundColor Red
    exit 1
}

# Debug: Try different ways to get env vars
Write-Host "`nTrying to get environment variables..." -ForegroundColor Gray

# Method 1: Try without JSON first
Write-Host "Method 1: Plain output" -ForegroundColor DarkGray
$envPlain = npx netlify env:list 2>&1
Write-Host "Plain output:"
Write-Host $envPlain -ForegroundColor DarkGray

# Method 2: Try with JSON
Write-Host "`nMethod 2: JSON output" -ForegroundColor DarkGray
$envJsonRaw = npx netlify env:list --json 2>&1
Write-Host "JSON raw output:"
Write-Host $envJsonRaw -ForegroundColor DarkGray

# Try to parse JSON
try {
    $envJson = $envJsonRaw | ConvertFrom-Json -ErrorAction Stop
    Write-Host "`nSuccessfully parsed JSON!" -ForegroundColor Green
    Write-Host "Found $($envJson.PSObject.Properties.Count) variables" -ForegroundColor Green
    
    # Show all variables
    $envJson.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name) = $($_.Value)" -ForegroundColor Gray
    }
    
    # Find matching variables
    $matched = $envJson.PSObject.Properties.Name | Where-Object { $_ -like "${Prefix}*" }
    
    if (-not $matched) {
        Write-Host "`nNo variables found with prefix: $Prefix" -ForegroundColor Yellow
        Write-Host "Available prefixes:" -ForegroundColor Gray
        $envJson.PSObject.Properties.Name | ForEach-Object {
            if ($_ -match "^([A-Z_]+_)") {
                Write-Host "  $($matches[1])*" -ForegroundColor DarkGray
            }
        }
        exit 0
    }
    
    Write-Host "`nFound variables: $($matched -join ', ')" -ForegroundColor Green
    exit 0
    
} catch {
    Write-Host "`nFailed to parse JSON: $_" -ForegroundColor Red
    
    # Try to extract from plain output
    Write-Host "`nTrying to extract from plain output..." -ForegroundColor Yellow
    $lines = $envPlain -split "`n"
    $foundVars = @()
    
    foreach ($line in $lines) {
        if ($line -match "^([A-Z_]+)=(.*)$") {
            $name = $matches[1]
            $value = $matches[2]
            Write-Host "  $name = $value" -ForegroundColor Gray
            $foundVars += $name
        }
    }
    
    if ($foundVars.Count -eq 0) {
        Write-Host "No environment variables found in output" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "`nFound $($foundVars.Count) variables total" -ForegroundColor Green
    exit 0
}