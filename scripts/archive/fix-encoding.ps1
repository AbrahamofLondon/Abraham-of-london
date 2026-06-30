# fix-encoding.ps1
$files = Get-ChildItem -Path "content/downloads" -Filter *.mdx -Recurse
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    [System.IO.File]::WriteAllText($file.FullName, $content, $Utf8NoBom)
}
Write-Host "✅ All files normalized to UTF-8 (No BOM)." -ForegroundColor Green