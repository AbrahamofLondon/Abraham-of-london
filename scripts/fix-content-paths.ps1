# scripts/fix-content-paths.ps1
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

Write-Host "Patching frontmatter and links in $Dir..." -ForegroundColor Cyan

$updatedCount = 0

# Set Regex options once for clarity
$RegexOptions = [System.Text.RegularExpressions.RegexOptions]::Multiline -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase

foreach ($File in $Files) {
    $FilePath = $File.FullName
    $Raw = Get-Content $FilePath -Raw -Encoding UTF8
    $Original = $Raw
    
    # -----------------------------------------------------------------
    # 1. FIX IMAGE PATHS (Ensure @1600.jpg is used)
    # Target: coverImage: "/assets/images/blog/image.jpg" -> coverImage: "/assets/images/blog/image@1600.jpg"
    # -----------------------------------------------------------------
    $ImagePattern = '^(coverImage:\s*[""])([^""@]+)\.(jpe?g|webp|png)([""]\s*)$'
    $ImageReplacement = '$1$2@1600.jpg$4'
    $Raw = [regex]::Replace($Raw, $ImagePattern, $ImageReplacement, $RegexOptions)


    # -----------------------------------------------------------------
    # 2. FIX DOWNLOAD PDF PATHS (Ensure Title_Case_With_Underscores.pdf)
    # -----------------------------------------------------------------
    $PdfPattern = '(\/downloads\/)([^"''\.]+)\.pdf'

    $Raw = [regex]::Replace($Raw, $PdfPattern, {
        param($m)
        $Before = $m.Groups[1].Value # /downloads/
        $Slug = $m.Groups[2].Value   # The slug part (e.g., weekly-operating-rhythm)

        # Convert slug to Title_Case_With_Underscores
        $CorrectedSlug = $Slug -split '-' | ForEach-Object { 
            # Handle acronyms/casing exceptions explicitly
            if ($_.ToLower() -eq 'bpf') { return 'Bpf' }
            if ($_.ToLower() -eq 'a4') { return 'A4' }
            
            # Simple capitalization and underscore conversion
            $Word = $_.Substring(0,1).ToUpper() + $_.Substring(1)
            return $Word
        } | Join-String -Separator '_'
        
        return "${Before}${CorrectedSlug}.pdf"
    }, [System.Text.RegularExpressions.RegexOptions]::Multiline -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)


    if ($Raw -ne $Original) {
        Backup-Once $FilePath
        Set-Content -Path $FilePath -Value $Raw -Encoding UTF8
        $updatedCount++
    }
}

Write-Ok "Finished patching $ContentType frontmatter. Updated $updatedCount files."