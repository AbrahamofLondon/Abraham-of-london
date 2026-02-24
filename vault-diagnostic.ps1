# Abraham of London: Vault Integrity Diagnostic
$PSScriptRoot = Get-Location
$ContentPath = Join-Path $PSScriptRoot "content"

$files = Get-ChildItem -Path $ContentPath -Filter *.mdx -Recurse
Write-Host "🏛️ Starting Diagnostic on $($files.Count) assets..." -ForegroundColor Cyan
Write-Host "----------------------------------------------------"

$issuesFound = 0

foreach ($file in $files) {
    $fullPath = $file.FullName
    $text = [System.IO.File]::ReadAllText($fullPath)
    $relativePath = $file.FullName.Replace($PSScriptRoot, "")
    $hasIssue = $false

    # 1. Check for Invalid Code Points (Control characters)
    if ($text -match "[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]") {
        Write-Host "❌ INVALID CODE POINT: $relativePath" -ForegroundColor Red
        $hasIssue = $true
    }

    # 2. Check for Unclosed PullLine Tags (Common syntax error)
    $openTags = ([regex]::Matches($text, "<PullLine")).Count
    $closeTags = ([regex]::Matches($text, "/>")).Count 
    # Note: This is a simple check for self-closing tags
    if ($openTags -gt $closeTags) {
        Write-Host "⚠️ UNCLOSED TAG (<PullLine>): $relativePath (Open: $openTags, Closed: $closeTags)" -ForegroundColor Yellow
        $hasIssue = $true
    }

    # 3. Check for CRLF (The Windows Line Ending issue)
    if ($text -match "\r\n") {
        Write-Host "💧 CRLF DETECTED: $relativePath" -ForegroundColor Gray
        $hasIssue = $true
    }

    if ($hasIssue) { $issuesFound++ }
}

Write-Host "----------------------------------------------------"
Write-Host "Diagnostic Complete. Issues found in $issuesFound files." -ForegroundColor ($issuesFound -gt 0 ? "Yellow" : "Green")