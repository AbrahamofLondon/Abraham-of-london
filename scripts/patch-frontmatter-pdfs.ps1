# scripts/patch-frontmatter-pdfs.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$ContentType
)

$ErrorActionPreference = "Stop"

function Write-Ok($m){ Write-Host "✓ $m" -ForegroundColor Green }
function Write-Warn($m){ Write-Host "⚠ $m" -ForegroundColor Yellow }
function Backup-Once($p){ if(Test-Path $p){ $b="$p.bak"; if(-not(Test-Path $b)){ Copy-Item $p $b -Force } } }

$Dir = Join-Path (Get-Location) "content" $ContentType
$Files = Get-ChildItem -Path $Dir -Include "*.mdx", "*.md" -Recurse

if ($Files.Count -eq 0) {
    Write-Warn "No content files found in $Dir."
    exit
}

Write-Host "Patching PDF paths in $Dir..." -ForegroundColor Cyan

$updatedCount = 0

foreach ($File in $Files) {
    $FilePath = $File.FullName
    $Raw = Get-Content $FilePath -Raw -Encoding UTF8
    $Original = $Raw
    
    # Define the necessary replacements (Slug to Title_Case_With_Underscores.pdf)
    # This directly targets common kebab-case slugs and converts them to the redirect format.
    # Pattern: Finds any line containing pdfPath or downloadLink/Pdf with a lowercase slug.
    # Replacement: Captures the slug and replaces hyphens with underscores, and capitalizes.

    # 1. Convert kebab-case slugs to Title_Case_With_Underscores
    # Example: /downloads/weekly-operating-rhythm.pdf -> /downloads/Weekly_Operating_Rhythm.pdf
    $Raw = [regex]::Replace($Raw, '(\s*(pdfPath|downloadPdf|downloadLink):\s*["''])/downloads/([^"''\._]+)/i', {
        param($m)
        $Before = $m.Groups[1].Value
        $Slug = $m.Groups[3].Value
        
        # Simple capitalization and underscore conversion without relying on cultureinfo
        $CorrectedSlug = $Slug -split '-' | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1) } | Join-String -Separator '_'
        
        return "${Before}/downloads/${CorrectedSlug}.pdf"
    }, [System.Text.RegularExpressions.RegexOptions]::Multiline)

    if ($Raw -ne $Original) {
        Backup-Once $FilePath
        Set-Content -Path $FilePath -Value $Raw -Encoding UTF8
        $updatedCount++
    }
}

Write-Ok "Finished patching $ContentType frontmatter. Updated $updatedCount files."