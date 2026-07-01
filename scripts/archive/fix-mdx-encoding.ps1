# Detects and removes invisible Unicode characters that break MDX parsers
param(
    [Parameter(Mandatory=$true)]
    [string]$Path,
    [switch]$Fix,
    [switch]$DryRun
)

$ProblematicChars = @{
    [char]0x200B = 'ZERO WIDTH SPACE'
    [char]0x200C = 'ZERO WIDTH NON-JOINER'
    [char]0x200D = 'ZERO WIDTH JOINER'
    [char]0xFEFF = 'ZERO WIDTH NO-BREAK SPACE (BOM)'
    [char]0x2028 = 'LINE SEPARATOR'
    [char]0x2029 = 'PARAGRAPH SEPARATOR'
    [char]0x00A0 = 'NON-BREAKING SPACE'
    [char]0x202F = 'NARROW NO-BREAK SPACE'
    [char]0x2060 = 'WORD JOINER'
    [char]0x2018 = 'LEFT SINGLE QUOTE'
    [char]0x2019 = 'RIGHT SINGLE QUOTE'
    [char]0x201C = 'LEFT DOUBLE QUOTE'
    [char]0x201D = 'RIGHT DOUBLE QUOTE'
    [char]0x2013 = 'EN DASH'
    [char]0x2014 = 'EM DASH'
}

$Replacements = @{
    [char]0x2018 = "'"
    [char]0x2019 = "'"
    [char]0x201C = '"'
    [char]0x201D = '"'
    [char]0x2013 = '-'
    [char]0x2014 = '-'
    [char]0x00A0 = ' '
    [char]0x202F = ' '
}

function Scan-File {
    param([string]$FilePath)
    try {
        # Using [System.IO.File] to ensure we see the raw bytes without PS auto-conversion
        $content = [System.IO.File]::ReadAllText($FilePath)
        $issues = @()
        foreach ($char in $ProblematicChars.Keys) {
            if ($content.Contains($char)) {
                $count = ($content.ToCharArray() | Where-Object { $_ -eq $char }).Count
                $issues += [PSCustomObject]@{
                    Char = $char
                    Name = $ProblematicChars[$char]
                    Count = $count
                }
            }
        }
        return $issues
    } catch { return @() }
}

function Fix-File {
    param([string]$FilePath, [bool]$DryRunMode)
    try {
        $content = [System.IO.File]::ReadAllText($FilePath)
        $original = $content
        $changes = @()
        
        foreach ($char in $Replacements.Keys) {
            if ($content.Contains($char)) {
                $content = $content.Replace($char, $Replacements[$char])
                $changes += "Replaced $($ProblematicChars[$char])"
            }
        }
        
        foreach ($char in $ProblematicChars.Keys) {
            if ($content.Contains($char) -and -not $Replacements.ContainsKey($char)) {
                $content = $content.Replace($char, "")
                $changes += "Removed $($ProblematicChars[$char])"
            }
        }

        if ($content -ne $original -and -not $DryRunMode) {
            $backupPath = "${FilePath}.bak"
            Copy-Item $FilePath $backupPath
            # Force UTF8 No BOM - Critical for Contentlayer
            $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBom)
        }
        return $changes
    } catch { return @("Error: $($_.Exception.Message)") }
}

# Execution
$files = if (Test-Path $Path -PathType Leaf) { @(Get-Item $Path) } else { Get-ChildItem -Path $Path -Recurse -Include *.mdx,*.md }
Write-Host "Scanning $($files.Count) files..." -ForegroundColor Cyan

foreach ($file in $files) {
    $issues = Scan-File $file.FullName
    if ($issues.Count -gt 0) {
        Write-Host "❌ $($file.Name)" -ForegroundColor Red
        if ($Fix) {
            $log = Fix-File $file.FullName $DryRun
            Write-Host "  ✓ Cleaned" -ForegroundColor Green
        }
    }
}
Write-Host "Process Complete." -ForegroundColor Cyan