# Abraham of London: Vault Structural Stabilization (V4 - Trailing Space Obliteration)
$PSScriptRoot = Get-Location

$files = @(
    "content/lexicon/strategy.mdx",
    "content/vault/briefs/brief-001-modern-household.mdx",
    "content/vault/briefs/brief-002-economic-fortress.mdx",
    "content/vault/briefs/brief-003-education-of-heirs.mdx",
    "content/vault/briefs/brief-004-parallel-estate.mdx",
    "content/vault/briefs/brief-005-brotherhood-protocol.mdx",
    "content/vault/briefs/brief-006-sisterhood-and-hearth.mdx",
    "content/vault/briefs/brief-007-covenantal-oath.mdx",
    "content/vault/briefs/brief-008-ledger-of-legacy.mdx",
    "content/vault/briefs/brief-009-sovereignty-of-time.mdx",
    "content/vault/briefs/brief-010-geometry-of-inner-circle.mdx",
    "content/vault/briefs/brief-011-geography-of-estate.mdx",
    "content/vault/briefs/brief-012-aesthetics-of-order.mdx",
    "content/vault/indices/rise-decay-index.mdx"
)

foreach ($relativePath in $files) {
    $fullPath = Join-Path $PSScriptRoot $relativePath

    if (Test-Path $fullPath) {
        Write-Host "⚔️ Final Polish: $relativePath" -ForegroundColor Cyan
        
        # Read the file as a single string
        $text = [System.IO.File]::ReadAllText($fullPath)
        
        # Step 1: Force remove ALL Carriage Returns (\r) first to prevent Regex mismatches
        $text = $text.Replace("`r", "")
        
        # Step 2: Use Multi-line Regex to kill spaces/tabs before every Line Feed
        # [ \t]+ matches one or more spaces/tabs. $ with (?m) matches end of line.
        $text = [regex]::Replace($text, "(?m)[ \t]+$", "")
        
        # Step 3: Ensure no leading/trailing empty newlines at the absolute start/end of file
        $text = $text.Trim() + "`n"
        
        # Step 4: Write back with UTF8 No BOM (Pure Integrity)
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($fullPath, $text, $utf8NoBom)
    } else {
        Write-Host "⚠️ Not Found: $relativePath" -ForegroundColor Yellow
    }
}

Write-Host "✅ Whitespace Obliterated. Your Signal should be GREEN." -ForegroundColor Green