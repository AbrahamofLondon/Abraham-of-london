# sanitize-mdx.ps1 — SOVEREIGN MDX REPAIR SCRIPT
$targetPath = "content/downloads"

Write-Host "🔍 Scanning 169+ files for MDX syntax conflicts..." -ForegroundColor Cyan

# Find and replace the problematic Tailwind arbitrary color syntax
# From: bg-[color:var(--color-primary)/0.1]
# To: style={{ backgroundColor: 'var(--color-primary-alpha-10)' }} or a simple hex
Get-ChildItem -Path $targetPath -Filter *.mdx -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    if ($content -match 'bg-\[color:') {
        Write-Host "🛡️ Repairing: $($_.Name)" -ForegroundColor Yellow
        # Replace the complex arbitrary bracket syntax with a standard JSX style object
        $content = $content -replace 'className="bg-\[color:var\(--color-primary\)/0\.1\]"', 'style={{ backgroundColor: "rgba(var(--color-primary-rgb), 0.1)" }}'
        $content = $content -replace 'className="bg-\[color:var\(--color-primary\)/0\.2\]"', 'style={{ backgroundColor: "rgba(var(--color-primary-rgb), 0.2)" }}'
        
        Set-Content -Path $_.FullName -Value $content -Encoding utf8
    }
}

Write-Host "✅ Sanitization Complete. You can now run pnpm run build." -ForegroundColor Green