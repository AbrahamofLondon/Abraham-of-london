$files = Get-ChildItem "content/lexicon/*.mdx" | Where-Object { $_.Name -ne "_index.mdx" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if has proper frontmatter with required fields
    if ($content -notmatch 'accessLevel:' -or $content -notmatch 'docKind:') {
        Write-Host "Fixing: $($file.Name)" -ForegroundColor Yellow
        
        # Extract title
        $titleMatch = [regex]::Match($content, 'title:\s*"([^"]+)"')
        if ($titleMatch.Success) {
            $title = $titleMatch.Groups[1].Value
        } else {
            $title = ($file.BaseName -replace '-', ' ' -replace '_', ' ')
            $title = (Get-Culture).TextInfo.ToTitleCase($title)
        }
        
        # Extract category if exists
        $categoryMatch = [regex]::Match($content, 'category:\s*"([^"]+)"')
        $category = if ($categoryMatch.Success) { $categoryMatch.Groups[1].Value } else { "Lexicon" }
        
        # Remove old frontmatter
        $cleanContent = $content -replace '(?s)^---.*?---', ''
        $cleanContent = $cleanContent.Trim()
        
        # Create new frontmatter
        $newFrontmatter = @"
---
title: "$title"
category: "$category"
type: "Lexicon"
docKind: "Lexicon"
accessLevel: "public"
date: "$(Get-Date -Format 'yyyy-MM-dd')"
---

"@
        
        # Write new file
        $newContent = $newFrontmatter + $cleanContent
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "  ✓ Fixed $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✅ All lexicon files normalized!" -ForegroundColor Green
Write-Host "Run: pnpm contentlayer:clean && pnpm contentlayer:build" -ForegroundColor Cyan
