# Emergency YAML duplicate remover
Write-Host "Running emergency YAML cleanup..." -ForegroundColor Red

Get-ChildItem -Recurse -Path "content" -Include "*.mdx", "*.md" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Find YAML frontmatter
    if ($content -match '^---\s*\n(.*?)\n---\s*\n') {
        $yamlContent = $matches[1]
        $lines = $yamlContent -split "`n"
        
        $uniqueKeys = @{}
        $newYaml = @()
        
        foreach ($line in $lines) {
            if ($line -match '^(\s*)([^:]+):\s*(.*)$') {
                $key = $matches[2].Trim()
                if (-not $uniqueKeys.ContainsKey($key)) {
                    $uniqueKeys[$key] = $true
                    $newYaml += $line
                } else {
                    Write-Host "Removing duplicate key '$key' in: $($_.Name)" -ForegroundColor Yellow
                }
            } else {
                $newYaml += $line
            }
        }
        
        # Rebuild the file
        $newContent = "---`n" + ($newYaml -join "`n") + "`n---`n" + $content.Substring($matches[0].Length)
        Set-Content -Path $_.FullName -Value $newContent
    }
}

Write-Host "Emergency cleanup complete!" -ForegroundColor Green
