#Requires -Version 5.1

<#
.SYNOPSIS
    Emergency fix for TypeScript syntax errors in pages/events/index.tsx

.DESCRIPTION
    This script specifically targets and fixes the broken line 10 in pages/events/index.tsx
    caused by regex replacement issues.
#>

param([switch]$DryRun)

$ErrorActionPreference = 'Stop'
$filePath = "pages\events\index.tsx"

function Write-ColorOutput {
    param([string]$Text, [string]$Color = 'White')
    Write-Host $Text -ForegroundColor $Color
}

if (-not (Test-Path $filePath)) {
    Write-ColorOutput "ERROR: File not found: $filePath" 'Red'
    exit 1
}

Write-ColorOutput "`n🔍 Analyzing $filePath..." 'Cyan'

# Read the file
$content = Get-Content $filePath -Raw
$lines = Get-Content $filePath

# Show the problematic line
Write-ColorOutput "`n📍 Current Line 10:" 'Yellow'
if ($lines.Count -ge 10) {
    Write-ColorOutput "   $($lines[9])" 'Red'
}

# Detect the issue pattern
$hasIssue = $false
$fixedContent = $content

# Pattern 0: Function call parentheses inside import statement (MAIN ISSUE)
if ($content -match 'import\s*\{[^}]*\w+\(\)[^}]*\}') {
    Write-ColorOutput "✓ Detected: Function call parentheses in import statement" 'Yellow'
    $hasIssue = $true
    
    # Fix: Remove () from all function names in import statements
    # This handles: import { getAllEvents(), type Event } -> import { getAllEvents, type Event }
    $fixedContent = $fixedContent -replace '(import\s*\{[^}]*?)(\w+)\(\)', '$1$2'
}

# Pattern 1: Import statement got mangled with getAllEvents()
if ($content -match 'from\s+getAllEvents\(\)') {
    Write-ColorOutput "✓ Detected: Import statement replaced with function call" 'Yellow'
    $hasIssue = $true
    
    # Fix: Restore proper import
    $fixedContent = $fixedContent -replace 'from\s+getAllEvents\(\)[^;]*;?', 'from "@/lib/events";'
}

# Pattern 2: Check for malformed import line specifically
if ($content -match 'import\s*\{[^}]*\}\s*from\s+[^"''\s]') {
    Write-ColorOutput "✓ Detected: Import 'from' clause missing quotes" 'Yellow'
    $hasIssue = $true
    
    # Extract and fix imports
    $fixedContent = $fixedContent -replace '(import\s*\{[^}]*\})\s*from\s+([^"'';\s]+)', '$1 from "@/lib/events"'
}

# Pattern 3: Completely rebuild the import section if necessary
if ($content -match 'getAllEvents\(\)[^;]{0,20}getAllEvents\(\)') {
    Write-ColorOutput "✓ Detected: Duplicate function call in import" 'Yellow'
    $hasIssue = $true
    
    # This is severely mangled, let's rebuild it properly
    $importSection = @'
import { getAllEvents } from "@/lib/events";
'@
    
    # Remove all mangled import lines for events
    $fixedContent = $fixedContent -replace 'import\s+\{[^}]*\}\s+from\s+[^;]*getAllEvents[^;]*;?', $importSection
}

# Pattern 4: Fix if the entire line is just broken syntax
if ($lines.Count -ge 10 -and $lines[9] -match '^[^a-zA-Z]*\(') {
    Write-ColorOutput "✓ Detected: Line 10 starts with invalid syntax" 'Yellow'
    $hasIssue = $true
    
    # Replace line 10 with proper import if it's completely broken
    $lines[9] = 'import { getAllEvents } from "@/lib/events";'
    $fixedContent = $lines -join "`n"
}

# Additional safety check: ensure getAllEvents is properly imported
if ($fixedContent -notmatch 'import\s+\{[^}]*getAllEvents[^}]*\}\s+from\s+"@/lib/events"') {
    Write-ColorOutput "⚠ Warning: getAllEvents import not found, adding it..." 'Yellow'
    
    # Find first import and add after it
    if ($fixedContent -match '(import\s+[^;]+;)') {
        $firstImport = $matches[1]
        $newImport = "`nimport { getAllEvents } from `"@/lib/events`";"
        $fixedContent = $fixedContent -replace [regex]::Escape($firstImport), "$firstImport$newImport"
    }
}

# Show what will be fixed
if ($hasIssue) {
    Write-ColorOutput "`n✨ Proposed Fix:" 'Green'
    $fixedLines = $fixedContent -split "`n"
    if ($fixedLines.Count -ge 10) {
        Write-ColorOutput "   Line 10: $($fixedLines[9])" 'Green'
    }
    
    # Show a few lines of context
    Write-ColorOutput "`n📄 Context (lines 8-12):" 'Cyan'
    for ($i = 7; $i -lt 12 -and $i -lt $fixedLines.Count; $i++) {
        $lineNum = $i + 1
        $line = $fixedLines[$i]
        if ($lineNum -eq 10) {
            Write-ColorOutput "   $lineNum : $line" 'Green'
        } else {
            Write-ColorOutput "   $lineNum : $line" 'Gray'
        }
    }
    
    if ($DryRun) {
        Write-ColorOutput "`n[DRY RUN] Changes NOT applied. Remove -DryRun to fix." 'Yellow'
    } else {
        # Write the fixed content
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($filePath, $fixedContent, $utf8NoBom)
        
        Write-ColorOutput "`n✅ File successfully repaired!" 'Green'
        Write-ColorOutput "`nNext steps:" 'Cyan'
        Write-ColorOutput "  1. npx tsc --noEmit" 'White'
        Write-ColorOutput "  2. npm run dev`n" 'White'
    }
} else {
    Write-ColorOutput "`n✓ No obvious syntax errors detected on line 10" 'Green'
    Write-ColorOutput "The error might be elsewhere or need manual inspection.`n" 'Yellow'
    
    # Show the actual content for manual review
    Write-ColorOutput "Full import section:" 'Cyan'
    $importLines = $lines | Select-Object -First 20 | Where-Object { $_ -match 'import' -or $_ -match '^$' }
    $importLines | ForEach-Object { Write-ColorOutput "  $_" 'Gray' }
}

if (-not $DryRun -and -not $hasIssue) {
    Write-ColorOutput "`n💡 Tip: Try running with -DryRun to see proposed changes" 'Yellow'
    Write-ColorOutput "   or manually inspect the file around line 10`n" 'Yellow'
}