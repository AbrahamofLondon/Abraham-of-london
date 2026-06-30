# Update all Redis imports to use the single source
$files = Get-ChildItem -Path . -Recurse -Include "*.ts", "*.tsx" -Exclude "node_modules", ".next", ".git"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if this file imports any redis module
    $hasRedisImport = $content -match "from ['\"]@/lib/(redis|redis-|.*redis.*)['\"]"
    
    if ($hasRedisImport) {
        # Create backup
        $backupPath = "$($file.FullName).redis-backup"
        Copy-Item $file.FullName $backupPath
        
        # Replace imports
        $newContent = $content
        
        # Replace all variations with the single source
        $newContent = $newContent -replace "from ['\"]@/lib/redis-wrapper['\"]", "from '@/lib/redis'"
        $newContent = $newContent -replace "from ['\"]@/lib/redis-fallback['\"]", "from '@/lib/redis'"
        $newContent = $newContent -replace "from ['\"]@/lib/redis-enhanced['\"]", "from '@/lib/redis'"
        $newContent = $newContent -replace "from ['\"]@/lib/redis-enhanced\.node['\"]", "from '@/lib/redis'"
        $newContent = $newContent -replace "from ['\"]@/lib/redis-enhanced\.edge['\"]", "from '@/lib/redis'"
        $newContent = $newContent -replace "from ['\"]@/lib/server/redis['\"]", "from '@/lib/redis'"
        
        # Only save if changes were made
        if ($newContent -ne $content) {
            Set-Content -Path $file.FullName -Value $newContent -Force
            Write-Host "✅ Updated: $($file.FullName)" -ForegroundColor Green
        }
    }
}

Write-Host "`n🎯 Redis import consolidation complete!" -ForegroundColor Cyan
