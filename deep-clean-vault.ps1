# Abraham of London: Global Vault Integrity Sanitizer
$PSScriptRoot = Get-Location
$ContentPath = Join-Path $PSScriptRoot "content"

# Target all MDX files in the content directory
$files = Get-ChildItem -Path $ContentPath -Filter *.mdx -Recurse

Write-Host "🏛️ Initializing Global Deep Clean on $($files.Count) assets..." -ForegroundColor Cyan

foreach ($file in $files) {
    $fullPath = $file.FullName
    
    # Read raw bytes to handle any weird encoding issues
    $bytes = [System.IO.File]::ReadAllBytes($fullPath)
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)
    
    $originalText = $text

    # 1. Kill 'Invalid Code Points': Remove non-printable control characters (except tab/newline)
    # This targets the specific 'Invalid code point' errors.
    $text = $text -replace "[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", ""

    # 2. Fix JSX/MDX Spacing: Ensure no spaces exist between tag names and properties 
    # (e.g., <Component property /> instead of <Component  property />)
    $text = [regex]::Replace($text, "(<[A-Z][a-zA-Z0-9]+)\s{2,}", "$1 ")

    # 3. Strip Trailing Whitespace (The 'Ghost' Risk)
    $text = [regex]::Replace($text, "(?m)[ \t]+$", "")

    # 4. Force LF (Unix) Line Endings
    $text = $text.Replace("`r", "")

    # 5. Ensure file ends with exactly one newline
    $text = $text.Trim() + "`n"

    # Save only if changes were made to preserve timestamps where possible
    if ($text -ne $originalText) {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($fullPath, $text, $utf8NoBom)
        Write-Host "⚔️ Sanitized: $($file.Name)" -ForegroundColor Yellow
    }
}

Write-Host "✅ Global Integrity Restored. Re-run Build." -ForegroundColor Green