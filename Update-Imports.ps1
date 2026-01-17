# Update-Imports.ps1 - FIXED VERSION
# Safe migration script for API import paths

param(
    [switch]$WhatIf,      # Preview changes only
    [switch]$Backup,      # Create backups before changes
    [switch]$TestOnly     # Only check, don't make changes
)

# Set execution policy for current session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Configuration
$LogFile = "api-migration-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$BackupDir = ".\backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$ExcludedDirs = @('node_modules', '.next', '.git', 'public', 'dist', 'build', 'coverage', '.vs', 'test-results')

# Path mapping - OLD to NEW (update based on your needs)
$PathMappings = @{
    # Rate limit imports
    '@/lib/rate-limit' = '@/lib/server/rate-limit-unified'
    '@/lib/middleware/rate-limit' = '@/lib/server/rate-limit-unified'
    '@/middleware/rate-limit' = '@/lib/server/rate-limit-unified'
    
    # Specific rate limit configs
    'RATE_LIMIT_CONFIGS\.public' = 'RATE_LIMIT_CONFIGS.public'
    'RATE_LIMIT_CONFIGS\.authenticated' = 'RATE_LIMIT_CONFIGS.authenticated'
    'RATE_LIMIT_CONFIGS\.critical' = 'RATE_LIMIT_CONFIGS.critical'
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "$timestamp [$Level] $Message"
    Add-Content -Path $LogFile -Value $logMessage
    
    switch ($Level) {
        "ERROR"   { Write-Host $logMessage -ForegroundColor Red }
        "WARN"    { Write-Host $logMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        default   { Write-Host $logMessage -ForegroundColor Cyan }
    }
}

function Test-FileSafety {
    param([string]$FilePath)
    
    # Skip excluded directories
    foreach ($excluded in $ExcludedDirs) {
        if ($FilePath -match "\\$excluded\\") {
            return $false
        }
    }
    
    # Only process code files
    $codeExtensions = @('.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs')
    $extension = [System.IO.Path]::GetExtension($FilePath)
    return $extension -in $codeExtensions
}

function Backup-File {
    param([string]$FilePath)
    
    if (-not $Backup) { return }
    
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    
    $relativePath = $FilePath.Replace((Get-Location).Path, "").TrimStart('\')
    $backupPath = Join-Path $BackupDir $relativePath
    
    # Create directory structure
    $backupDirPath = [System.IO.Path]::GetDirectoryName($backupPath)
    if (-not (Test-Path $backupDirPath)) {
        New-Item -ItemType Directory -Path $backupDirPath -Force | Out-Null
    }
    
    Copy-Item -Path $FilePath -Destination $backupPath -Force
    Write-Log "Backed up: $FilePath -> $backupPath" -Level "INFO"
}

function Find-Imports {
    param([string]$SearchPath = ".")
    
    Write-Log "Scanning for imports..." -Level "INFO"
    Write-Host "`n=== SCANNING IMPORTS ===" -ForegroundColor Magenta
    
    $importPattern = 'import.*from\s+["'']([^"'']+)["'']|require\s*\(\s*["'']([^"'']+)["'']\s*\)'
    $files = Get-ChildItem -Path $SearchPath -Recurse -File | Where-Object { Test-FileSafety $_.FullName }
    
    $importsFound = @()
    
    foreach ($file in $files) {
        try {
            # Skip empty files
            if ($file.Length -eq 0) { continue }
            
            $content = Get-Content $file.FullName -Raw -ErrorAction Stop
            if ([string]::IsNullOrEmpty($content)) { continue }
            
            $matches = [regex]::Matches($content, $importPattern)
            
            foreach ($match in $matches) {
                $importPath = if ($match.Groups[1].Success) { $match.Groups[1].Value } else { $match.Groups[2].Value }
                
                # Check if this import needs updating
                foreach ($oldPath in $PathMappings.Keys) {
                    $oldPattern = $oldPath.Replace('.', '\.')
                    if ($importPath -match $oldPattern -or $importPath.Contains($oldPath.Replace('\.', '.'))) {
                        $newPath = $PathMappings[$oldPath]
                        $updatedImport = $importPath -replace [regex]::Escape($oldPath), $newPath
                        
                        $importsFound += [PSCustomObject]@{
                            File = $file.FullName
                            Line = ($content.Substring(0, $match.Index) -split "`r?`n").Count
                            OldImport = $importPath
                            NewImport = $updatedImport
                            Pattern = $oldPath
                            NeedsUpdate = ($importPath -ne $updatedImport)
                        }
                    }
                }
            }
        }
        catch {
            Write-Log "Error reading $($file.FullName): $($_.Exception.Message)" -Level "WARN"
        }
    }
    
    return $importsFound
}

function Update-Imports {
    param([array]$ImportsToUpdate, [switch]$WhatIf)
    
    Write-Host "`n=== UPDATING IMPORTS ===" -ForegroundColor Magenta
    $filesToUpdate = $ImportsToUpdate | Group-Object File
    
    foreach ($fileGroup in $filesToUpdate) {
        $filePath = $fileGroup.Name
        Write-Host "`nFile: $filePath" -ForegroundColor Yellow
        
        try {
            $content = Get-Content $filePath -Raw
            $updatedContent = $content
            
            foreach ($import in $fileGroup.Group) {
                if ($import.NeedsUpdate) {
                    Write-Host "  - $($import.OldImport)" -ForegroundColor Gray -NoNewline
                    Write-Host " → " -ForegroundColor DarkGray -NoNewline
                    Write-Host "$($import.NewImport)" -ForegroundColor Green
                    
                    if (-not $WhatIf) {
                        if ($Backup -and $updatedContent -eq $content) {
                            Backup-File $filePath
                        }
                        
                        $oldEscaped = [regex]::Escape($import.OldImport)
                        $updatedContent = $updatedContent -replace "'$oldEscaped'", "'$($import.NewImport)'"
                        $updatedContent = $updatedContent -replace "`"$oldEscaped`"", "`"$($import.NewImport)`""
                    }
                }
            }
            
            if (-not $WhatIf -and $updatedContent -ne $content) {
                Set-Content -Path $filePath -Value $updatedContent -Force
                Write-Log "Updated imports in $filePath" -Level "SUCCESS"
            }
        }
        catch {
            Write-Log "Error updating $filePath : $($_.Exception.Message)" -Level "ERROR"
        }
    }
}

function Show-Summary {
    param([array]$AllImports, [array]$UpdatedImports)
    
    Write-Host "`n`n=== MIGRATION SUMMARY ===" -ForegroundColor Magenta
    Write-Host "Total files scanned: $($AllImports | Group-Object File | Measure-Object | Select-Object -ExpandProperty Count)" -ForegroundColor Cyan
    Write-Host "Total imports found: $($AllImports.Count)" -ForegroundColor Cyan
    
    $needsUpdate = $AllImports | Where-Object { $_.NeedsUpdate }
    Write-Host "Imports needing update: $($needsUpdate.Count)" -ForegroundColor Yellow
    
    if ($needsUpdate.Count -gt 0) {
        Write-Host "`nImports to update:" -ForegroundColor Yellow
        $needsUpdate | Group-Object Pattern | ForEach-Object {
            Write-Host "  $($_.Name): $($_.Count) occurrences" -ForegroundColor Gray
        }
        
        Write-Host "`nAffected files:" -ForegroundColor Yellow
        $needsUpdate | Group-Object File | ForEach-Object {
            Write-Host "  $($_.Name)" -ForegroundColor Gray
        }
    }
    
    if ($Backup -and (Test-Path $BackupDir)) {
        Write-Host "`nBackup created at: $BackupDir" -ForegroundColor Green
    }
    
    Write-Host "`nLog file: $LogFile" -ForegroundColor Cyan
}

# Main execution
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  API IMPORT PATH MIGRATION TOOL" -ForegroundColor Green
Write-Host "  SAFE AND REVERSIBLE" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if we're in the right directory - FIXED SYNTAX
$hasPackageJson = Test-Path "package.json"
$hasNextConfigJs = Test-Path "next.config.js"
$hasNextConfigMjs = Test-Path "next.config.mjs"
$hasNextConfigTs = Test-Path "next.config.ts"
$hasNextConfig = $hasNextConfigJs -or $hasNextConfigMjs -or $hasNextConfigTs

if (-not $hasPackageJson -or -not $hasNextConfig) {
    Write-Host "`⚠️  WARNING: This doesn't look like a Next.js project root!" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "Has package.json: $hasPackageJson" -ForegroundColor Gray
    Write-Host "Has next.config.*: $hasNextConfig" -ForegroundColor Gray
    $confirm = Read-Host "Continue anyway? (y/n)"
    if ($confirm -ne 'y') { exit 1 }
}

Write-Host "`nThis script will:" -ForegroundColor Cyan
Write-Host "1. Scan all code files for imports" -ForegroundColor Gray
Write-Host "2. Identify imports that need updating" -ForegroundColor Gray
Write-Host "3. Show preview of changes" -ForegroundColor Gray

if (-not $WhatIf -and -not $TestOnly) {
    Write-Host "4. Ask for confirmation before making changes" -ForegroundColor Gray
}

if ($Backup) {
    Write-Host "5. Create backups in $BackupDir" -ForegroundColor Green
}

if ($WhatIf -or $TestOnly) {
    Write-Host "`n⚠️  DRY RUN MODE: No changes will be made" -ForegroundColor Yellow
}

# Find all imports
$allImports = Find-Imports

if ($allImports.Count -eq 0) {
    Write-Host "`n✅ No imports found to process." -ForegroundColor Green
    exit 0
}

$needsUpdate = $allImports | Where-Object { $_.NeedsUpdate }

if ($needsUpdate.Count -eq 0) {
    Write-Host "`n✅ No imports need updating!" -ForegroundColor Green
    Show-Summary -AllImports $allImports -UpdatedImports @()
    exit 0
}

# Show preview
Write-Host "`n=== PREVIEW OF CHANGES ===" -ForegroundColor Magenta
foreach ($group in ($needsUpdate | Group-Object Pattern | Sort-Object Count -Descending)) {
    Write-Host "`n$($group.Name) ($($group.Count) occurrences):" -ForegroundColor Yellow
    foreach ($item in $group.Group | Select-Object -First 5) {
        $shortPath = $item.File.Replace((Get-Location).Path, "").TrimStart('\')
        Write-Host "  $shortPath`:$($item.Line)" -ForegroundColor Gray
        Write-Host "    $($item.OldImport) → $($item.NewImport)" -ForegroundColor White
    }
    if ($group.Count -gt 5) {
        Write-Host "  ... and $($group.Count - 5) more" -ForegroundColor DarkGray
    }
}

# Ask for confirmation
if (-not $WhatIf -and -not $TestOnly) {
    Write-Host "`n" -NoNewline
    $confirm = Read-Host "Apply these $($needsUpdate.Count) changes? (y/n)"
    
    if ($confirm -ne 'y') {
        Write-Host "Migration cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Perform updates
if (-not $TestOnly) {
    Update-Imports -ImportsToUpdate $needsUpdate -WhatIf:$WhatIf
}

# Show summary
Show-Summary -AllImports $allImports -UpdatedImports $needsUpdate

# Next steps
Write-Host "`n=== NEXT STEPS ===" -ForegroundColor Magenta
Write-Host "1. Run TypeScript compiler check:" -ForegroundColor Cyan
Write-Host "   npx tsc --noEmit" -ForegroundColor Gray
Write-Host "2. Test the application:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host "3. Check for any remaining import errors" -ForegroundColor Cyan