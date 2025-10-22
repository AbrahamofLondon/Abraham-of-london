param(
  [switch]$WhatIfRun,        # dry-run toggle
  [switch]$SkipFrontMatter   # if set, don't touch YAML front matter
)

Write-Host "Running MDX cleanup with code-fence + hard-break protection..." -ForegroundColor Yellow

$mdxDir = (Get-Item -Path ".").FullName
$regexWhitespace = '[\p{Zs}\p{Zl}\p{Zp}\u0009-\u000D\u0085\u2000-\u200A\u2028-\u202F\u205F\u3000]'
$files   = Get-ChildItem -Path $mdxDir -Filter "*.mdx" -Recurse
$cleaned = 0

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

foreach ($f in $files) {
  $path    = $f.FullName
  $content = Get-Content -Raw -Path $path -Encoding UTF8
  $orig    = $content

  $usesCRLF = $content -match "`r`n"
  $eol      = if ($usesCRLF) { "`r`n" } else { "`n" }

  $lines = [System.Text.RegularExpressions.Regex]::Split($content, "`r?`n")
  $inCode = $false
  $inFront = $false
  $frontStartAtTop = ($lines.Count -gt 0 -and $lines[0] -match '^\s*---\s*$')

  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]

    if ($SkipFrontMatter -and $frontStartAtTop) {
      if ($i -eq 0 -and $line -match '^\s*---\s*$') { $inFront = $true; continue }
      if ($inFront -and $line -match '^\s*---\s*$') { $inFront = $false; continue }
      if ($inFront) { continue }
    }

    if ($line -match '^\s*(```|~~~)') {
      $inCode = -not $inCode
      continue
    }

    if ($inCode) { continue }

    $line = $line -replace $regexWhitespace, ' '
    $hasHardBreak = $line -match '  $'
    $line = $line -replace ' {2,}(?=\S)', ' '
    $line = $line.Trim()

    if ($hasHardBreak) { $line = "$line  " }

    $lines[$i] = $line
  }

  $new = ($lines -join $eol)

  if ($new -ne $orig) {
    if (-not $WhatIfRun) {
      if (-not (Test-Path "$path.bak")) { Copy-Item -LiteralPath $path -Destination "$path.bak" }
      [System.IO.File]::WriteAllText($path, $new, $utf8NoBom)
    }
    Write-Host "CLEANED: $($f.Name)" -ForegroundColor Green
    $cleaned++
  }
}

if ($WhatIfRun) { $mode = "DRY-RUN" } else { $mode = "WRITE" }
Write-Host "MDX cleanup complete [$mode]. Files changed: $cleaned / $($files.Count)." -ForegroundColor Cyan
