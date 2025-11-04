#Requires -Version 5.1

<#
.SYNOPSIS
    Comprehensive file sanitization script to remove invisible Unicode gremlins and syntax issues.

.DESCRIPTION
    This script performs multiple passes to clean source files of:
    - Invisible Unicode characters (NBSP, ZWSP, BOM, etc.)
    - Stray slash-only lines
    - Line ending normalization
    - Validation and backup creation
    - Detailed logging and rollback capability

.PARAMETER DryRun
    If specified, shows what would be changed without making actual changes.

.PARAMETER NoBackup
    If specified, skips creating backup files before modifications.

.PARAMETER SkipValidation
    If specified, skips post-fix validation checks.

.EXAMPLE
    .\fix-gremlins.ps1
    Run with default settings (creates backups, validates changes)

.EXAMPLE
    .\fix-gremlins.ps1 -DryRun
    Preview changes without modifying files

.EXAMPLE
    .\fix-gremlins.ps1 -NoBackup -SkipValidation
    Fast mode without safety checks (not recommended)
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$NoBackup,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipValidation,
    
    [Parameter(Mandatory=$false)]
    [string]$LogFile = "gremlin-fix-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$ErrorActionPreference = 'Stop'
$script:ModifiedFiles = @()
$script:ErrorFiles = @()
$script:BackupDir = ".gremlin-backups"
$script:BackupManifest = Join-Path $script:BackupDir "backup-manifest.json"
$script:BackupHashes = @{}

# File patterns to process
$FileExtensions = @(
    '*.ts', '*.tsx', '*.js', '*.jsx', '*.mjs', '*.cjs',
    '*.md', '*.mdx', '*.css', '*.json', '*.html',
    '*.yml', '*.yaml', '*.xml', '*.svg'
)

# Directories to skip
$SkipDirectories = @(
    'node_modules',
    '.next',
    '.next-dev',
    '.git',
    '.contentlayer',
    'public\downloads',
    'out',
    'dist',
    'build',
    '.cache',
    'coverage'
)

# Unicode gremlins to remove/replace
$UnicodeGremlins = @{
    # Character Name         = @(HexCode, Replacement)
    'NBSP'                   = @(0x00A0, ' ')     # Non-breaking space → normal space
    'ZWSP'                   = @(0x200B, '')      # Zero-width space → remove
    'BOM'                    = @(0xFEFF, '')      # Byte Order Mark → remove
    'ZWNJ'                   = @(0x200C, '')      # Zero-width non-joiner → remove
    'ZWJ'                    = @(0x200D, '')      # Zero-width joiner → remove
    'LRM'                    = @(0x200E, '')      # Left-to-right mark → remove
    'RLM'                    = @(0x200F, '')      # Right-to-left mark → remove
    'NARROW_NBSP'            = @(0x202F, ' ')     # Narrow no-break space → normal space
    'THIN_SPACE'             = @(0x2009, ' ')     # Thin space → normal space
    'HAIR_SPACE'             = @(0x200A, ' ')     # Hair space → normal space
    'WORD_JOINER'            = @(0x2060, '')      # Word joiner → remove
    'ZERO_WIDTH_NO_BREAK'    = @(0xFEFF, '')      # Zero-width no-break space → remove
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Get-FileHash256 {
    param([string]$FilePath)
    
    try {
        $hash = Get-FileHash -Path $FilePath -Algorithm SHA256 -ErrorAction Stop
        return $hash.Hash
    } catch {
        return $null
    }
}

function Initialize-BackupSystem {
    if ($NoBackup) {
        return
    }
    
    # Create backup directory if it doesn't exist
    if (-not (Test-Path $script:BackupDir)) {
        New-Item -Path $script:BackupDir -ItemType Directory -Force | Out-Null
        Write-Log "Created backup directory: $script:BackupDir" -Level DEBUG
    }
    
    # Add to .gitignore if not already there
    $gitignorePath = ".gitignore"
    if (Test-Path $gitignorePath) {
        $gitignoreContent = Get-Content $gitignorePath -Raw
        if ($gitignoreContent -notmatch [regex]::Escape($script:BackupDir)) {
            Add-Content -Path $gitignorePath -Value "`n# Gremlin fix backups`n$script:BackupDir/"
            Write-Log "Added $script:BackupDir to .gitignore" -Level DEBUG
        }
    }
    
    # Load existing manifest
    if (Test-Path $script:BackupManifest) {
        try {
            $manifest = Get-Content $script:BackupManifest -Raw | ConvertFrom-Json
            foreach ($entry in $manifest.PSObject.Properties) {
                $script:BackupHashes[$entry.Name] = $entry.Value
            }
            Write-Log "Loaded backup manifest with $($script:BackupHashes.Count) entries" -Level DEBUG
        } catch {
            Write-Log "Failed to load backup manifest, creating new one" -Level WARNING
            $script:BackupHashes = @{}
        }
    }
}

function Save-BackupManifest {
    if ($NoBackup -or $DryRun) {
        return
    }
    
    try {
        $script:BackupHashes | ConvertTo-Json | Set-Content -Path $script:BackupManifest -Force
        Write-Log "Saved backup manifest with $($script:BackupHashes.Count) entries" -Level DEBUG
    } catch {
        Write-Log "Failed to save backup manifest: $_" -Level WARNING
    }
}

function Test-BackupIsClean {
    param([string]$FilePath, [string]$BackupPath)
    
    if (-not (Test-Path $BackupPath)) {
        return $false
    }
    
    # Check if backup has no gremlins
    try {
        $backupContent = Get-Content -Raw -LiteralPath $BackupPath -ErrorAction Stop
        return -not (Test-FileHasGremlins -Content $backupContent)
    } catch {
        return $false
    }
}

function Get-BackupPath {
    param([string]$FilePath)
    
    $relativePath = Resolve-Path -Path $FilePath -Relative
    # Remove leading .\ or ./
    $relativePath = $relativePath -replace '^\.[\\/]', ''
    # Replace path separators with underscores and add .bak extension
    $backupFileName = $relativePath -replace '[\\/]', '_'
    return Join-Path $script:BackupDir "$backupFileName.bak"
}

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'DEBUG')]
        [string]$Level = 'INFO'
    )
    
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logMessage = "[$timestamp] [$Level] $Message"
    
    # Color coding for console output
    $color = switch ($Level) {
        'SUCCESS' { 'Green' }
        'WARNING' { 'Yellow' }
        'ERROR'   { 'Red' }
        'DEBUG'   { 'Gray' }
        default   { 'White' }
    }
    
    Write-Host $logMessage -ForegroundColor $color
    Add-Content -Path $LogFile -Value $logMessage -ErrorAction SilentlyContinue
}

function Test-ShouldSkipPath {
    param([string]$Path)
    
    foreach ($skipDir in $SkipDirectories) {
        if ($Path -match [regex]::Escape($skipDir)) {
            return $true
        }
    }
    return $false
}

function New-BackupFile {
    param([string]$FilePath)
    
    if ($NoBackup) {
        return $null
    }
    
    try {
        $backupPath = Get-BackupPath -FilePath $FilePath
        $currentHash = Get-FileHash256 -FilePath $FilePath
        
        if ($null -eq $currentHash) {
            Write-Log "Failed to compute hash for $FilePath" -Level WARNING
            return $null
        }
        
        # Check if we already have a clean backup for this exact file version
        if (Test-Path $backupPath) {
            $backupHash = Get-FileHash256 -FilePath $backupPath
            
            # If hashes match, we already have this exact version backed up
            if ($backupHash -eq $currentHash) {
                Write-Log "Using existing backup (same version): $FilePath" -Level DEBUG
                return $backupPath
            }
            
            # Check if existing backup is clean (no gremlins)
            if (Test-BackupIsClean -FilePath $FilePath -BackupPath $backupPath) {
                # Store this clean backup's hash in manifest
                $script:BackupHashes[$FilePath] = $backupHash
                Write-Log "Keeping existing clean backup: $FilePath" -Level DEBUG
                return $backupPath
            }
            
            # Existing backup has gremlins or is different, we'll replace it
            Write-Log "Replacing gremlin-infected backup: $FilePath" -Level DEBUG
        }
        
        # Check if we have a known clean backup hash for this file
        if ($script:BackupHashes.ContainsKey($FilePath)) {
            $cleanHash = $script:BackupHashes[$FilePath]
            if ($cleanHash -eq $currentHash) {
                Write-Log "Current file matches known clean backup: $FilePath" -Level DEBUG
                # Current file is already clean, just update the backup
                Copy-Item -Path $FilePath -Destination $backupPath -Force
                return $backupPath
            }
        }
        
        # Create new backup
        Copy-Item -Path $FilePath -Destination $backupPath -Force
        
        # If current file is clean, store its hash as the clean version
        $currentContent = Get-Content -Raw -LiteralPath $FilePath -ErrorAction Stop
        if (-not (Test-FileHasGremlins -Content $currentContent)) {
            $script:BackupHashes[$FilePath] = $currentHash
            Write-Log "Created clean backup: $FilePath" -Level DEBUG
        } else {
            Write-Log "Created backup (file has gremlins): $FilePath" -Level DEBUG
        }
        
        return $backupPath
        
    } catch {
        Write-Log "Failed to backup $FilePath : $_" -Level WARNING
        return $null
    }
}

function Test-FileHasGremlins {
    param([string]$Content)
    
    foreach ($gremlin in $UnicodeGremlins.Values) {
        $charCode = $gremlin[0]
        if ($Content.IndexOf([char]$charCode) -ge 0) {
            return $true
        }
    }
    
    # Check for lone slash lines
    if ($Content -match '(?m)^\s*/\s*$') {
        return $true
    }
    
    # Check for mixed line endings
    if (($Content -match "`r`n") -and ($Content -match "(?<!`r)`n")) {
        return $true
    }
    
    return $false
}

function Remove-UnicodeGremlins {
    param([string]$Content)
    
    $cleaned = $Content
    $changesFound = @()
    
    foreach ($entry in $UnicodeGremlins.GetEnumerator()) {
        $name = $entry.Key
        $charCode = $entry.Value[0]
        $replacement = $entry.Value[1]
        $char = [char]$charCode
        
        $count = ([regex]::Matches($cleaned, [regex]::Escape($char))).Count
        if ($count -gt 0) {
            $cleaned = $cleaned -replace [regex]::Escape($char), $replacement
            $changesFound += "$name ($count occurrences)"
        }
    }
    
    return @{
        Content = $cleaned
        Changes = $changesFound
    }
}

function Remove-LoneSlashLines {
    param([string]$Content)
    
    $before = $Content
    $after = $Content -replace '(?m)^\s*/\s*\r?\n', ''
    
    $removed = ([regex]::Matches($before, '(?m)^\s*/\s*\r?\n')).Count
    
    return @{
        Content = $after
        Removed = $removed
    }
}

function ConvertTo-UnixLineEndings {
    param([string]$Content)
    
    # Normalize to LF only
    $normalized = $Content -replace "`r`n", "`n" -replace "`r", "`n"
    
    return $normalized
}

function Test-FileIsValid {
    param([string]$FilePath)
    
    try {
        $content = Get-Content -Raw -LiteralPath $FilePath -ErrorAction Stop
        
        # Basic validation checks
        if ($null -eq $content) {
            return $false
        }
        
        # Check for JSON files
        if ($FilePath -match '\.json$') {
            try {
                $null = $content | ConvertFrom-Json
            } catch {
                Write-Log "JSON validation failed for $FilePath : $_" -Level WARNING
                return $false
            }
        }
        
        # Check file isn't corrupted (has reasonable length)
        if ($content.Length -eq 0 -and (Get-Item $FilePath).Length -gt 0) {
            return $false
        }
        
        return $true
        
    } catch {
        Write-Log "File validation failed for $FilePath : $_" -Level ERROR
        return $false
    }
}

function Restore-FromBackup {
    param([string]$FilePath, [string]$BackupPath)
    
    if ($null -eq $BackupPath -or -not (Test-Path $BackupPath)) {
        Write-Log "Cannot restore $FilePath - no backup found" -Level ERROR
        return $false
    }
    
    try {
        Copy-Item -Path $BackupPath -Destination $FilePath -Force
        Write-Log "Restored $FilePath from backup" -Level SUCCESS
        return $true
    } catch {
        Write-Log "Failed to restore $FilePath : $_" -Level ERROR
        return $false
    }
}

function Invoke-GremlinFix {
    param([System.IO.FileInfo]$File)
    
    $filePath = $File.FullName
    Write-Log "Processing: $filePath" -Level DEBUG
    
    try {
        # Read file content
        $originalContent = Get-Content -Raw -LiteralPath $filePath -ErrorAction Stop
        
        if ($null -eq $originalContent -or $originalContent.Length -eq 0) {
            Write-Log "Skipping empty file: $filePath" -Level DEBUG
            return
        }
        
        # Check if file needs fixing
        if (-not (Test-FileHasGremlins -Content $originalContent)) {
            Write-Log "No gremlins found: $filePath" -Level DEBUG
            return
        }
        
        # Create backup
        $backupPath = $null
        if (-not $DryRun) {
            $backupPath = New-BackupFile -FilePath $filePath
        }
        
        # Apply fixes
        $content = $originalContent
        $allChanges = @()
        
        # 1. Remove Unicode gremlins
        $unicodeResult = Remove-UnicodeGremlins -Content $content
        $content = $unicodeResult.Content
        if ($unicodeResult.Changes.Count -gt 0) {
            $allChanges += $unicodeResult.Changes
        }
        
        # 2. Remove lone slash lines
        $slashResult = Remove-LoneSlashLines -Content $content
        $content = $slashResult.Content
        if ($slashResult.Removed -gt 0) {
            $allChanges += "Lone slash lines ($($slashResult.Removed) removed)"
        }
        
        # 3. Normalize line endings
        $content = ConvertTo-UnixLineEndings -Content $content
        
        # Check if content actually changed
        if ($content -eq $originalContent) {
            Write-Log "No actual changes needed: $filePath" -Level DEBUG
            return
        }
        
        # Write changes
        if ($DryRun) {
            Write-Log "[DRY RUN] Would fix: $filePath" -Level INFO
            Write-Log "  Changes: $($allChanges -join ', ')" -Level INFO
        } else {
            # Write file with UTF-8 no BOM
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($filePath, $content, $utf8NoBom)
            
            # Validate the written file
            if (-not $SkipValidation) {
                if (-not (Test-FileIsValid -FilePath $filePath)) {
                    Write-Log "Validation failed after fix, restoring backup: $filePath" -Level ERROR
                    Restore-FromBackup -FilePath $filePath -BackupPath $backupPath
                    $script:ErrorFiles += $filePath
                    return
                }
            }
            
            $script:ModifiedFiles += $filePath
            Write-Log "Fixed: $filePath" -Level SUCCESS
            Write-Log "  Changes: $($allChanges -join ', ')" -Level INFO
        }
        
    } catch {
        Write-Log "Error processing $filePath : $_" -Level ERROR
        $script:ErrorFiles += $filePath
        
        # Attempt to restore from backup
        if ($backupPath -and (Test-Path $backupPath)) {
            Restore-FromBackup -FilePath $filePath -BackupPath $backupPath
        }
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

function Main {
    Write-Log "======================================" -Level INFO
    Write-Log "  GREMLIN FIX - File Sanitization" -Level INFO
    Write-Log "======================================" -Level INFO
    Write-Log "" -Level INFO
    
    if ($DryRun) {
        Write-Log "DRY RUN MODE - No files will be modified" -Level WARNING
    }
    
    if ($NoBackup -and -not $DryRun) {
        Write-Log "RUNNING WITHOUT BACKUPS - This is risky!" -Level WARNING
        Start-Sleep -Seconds 2
    }
    
    # Initialize backup system
    Initialize-BackupSystem
    
    # Get all files to process
    Write-Log "Scanning for files..." -Level INFO
    
    $allFiles = Get-ChildItem -Recurse -File -Include $FileExtensions |
        Where-Object { -not (Test-ShouldSkipPath $_.FullName) }
    
    Write-Log "Found $($allFiles.Count) files to process" -Level INFO
    
    # Check existing backups
    if (-not $NoBackup -and (Test-Path $script:BackupDir)) {
        $existingBackups = (Get-ChildItem -Path $script:BackupDir -Filter "*.bak" -File).Count
        Write-Log "Existing backups: $existingBackups" -Level INFO
    }
    
    Write-Log "" -Level INFO
    
    # Process each file
    $progressId = 1
    $fileCount = 0
    
    foreach ($file in $allFiles) {
        $fileCount++
        $percentComplete = [math]::Round(($fileCount / $allFiles.Count) * 100, 1)
        
        Write-Progress -Id $progressId `
            -Activity "Fixing gremlins" `
            -Status "Processing: $($file.Name)" `
            -PercentComplete $percentComplete
        
        Invoke-GremlinFix -File $file
    }
    
    Write-Progress -Id $progressId -Activity "Fixing gremlins" -Completed
    
    # Save manifest after all processing
    Save-BackupManifest
    
    # Summary
    Write-Log "" -Level INFO
    Write-Log "======================================" -Level INFO
    Write-Log "  SUMMARY" -Level INFO
    Write-Log "======================================" -Level INFO
    
    if ($DryRun) {
        Write-Log "DRY RUN - No files were modified" -Level WARNING
    } else {
        Write-Log "Files processed: $($allFiles.Count)" -Level INFO
        Write-Log "Files modified: $($script:ModifiedFiles.Count)" -Level SUCCESS
        Write-Log "Files with errors: $($script:ErrorFiles.Count)" -Level $(if ($script:ErrorFiles.Count -gt 0) { 'ERROR' } else { 'INFO' })
        
        if (-not $NoBackup) {
            if ($script:ModifiedFiles.Count -gt 0) {
                Write-Log "Backups maintained in: $script:BackupDir" -Level INFO
                $totalBackups = (Get-ChildItem -Path $script:BackupDir -Filter "*.bak" -File).Count
                Write-Log "Total backups: $totalBackups (reusing clean backups when possible)" -Level INFO
            }
            Write-Log "Clean backup registry: $($script:BackupHashes.Count) files tracked" -Level INFO
        }
    }
    
    Write-Log "Log file: $LogFile" -Level INFO
    
    if ($script:ErrorFiles.Count -gt 0) {
        Write-Log "" -Level INFO
        Write-Log "Files with errors:" -Level ERROR
        $script:ErrorFiles | ForEach-Object { Write-Log "  - $_" -Level ERROR }
        exit 1
    }
    
    Write-Log "" -Level INFO
    Write-Log "✨ All gremlins vanquished! ✨" -Level SUCCESS
}

# ============================================================================
# SCRIPT ENTRY POINT
# ============================================================================

try {
    # Change to project root if not already there
    $projectRoot = Split-Path -Parent $PSScriptRoot
    if (Test-Path (Join-Path $projectRoot "package.json")) {
        Set-Location $projectRoot
        Write-Log "Working directory: $projectRoot" -Level DEBUG
    }
    
    Main
    
} catch {
    Write-Log "FATAL ERROR: $_" -Level ERROR
    Write-Log $_.ScriptStackTrace -Level ERROR
    
    # Try to save manifest even on error
    Save-BackupManifest
    
    exit 1
} finally {
    # Cleanup only if dry run
    if ($DryRun -and (Test-Path $script:BackupDir)) {
        # Don't delete the backup directory in dry run, just don't create new backups
    }
}