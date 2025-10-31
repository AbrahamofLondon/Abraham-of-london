# Requires: Windows PowerShell 5.1+
# Usage:
#   powershell -ExecutionPolicy Bypass -File tools\restore-from-all-backups.ps1 -Verbose
#   (dry run) add -WhatIf to the Copy-Item calls by setting $Global:WhatIfPreference = $true

param(
  [switch]$DryRun
)

# --- config ---------------------------------------------------------
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$targetRoots = @(
  "components","pages","app","lib","styles","public","netlify","src","scripts"
)
$exts = @('*.ts','*.tsx','*.d.ts','*.js','*.mjs','*.cjs','*.jsx','*.json','*.css','*.mdx','*.md')
$excludeTargets = @(
  '\node_modules\','\.next\','\out\','\coverage\','\dist\','\build\','\public\downloads\'
)
# -------------------------------------------------------------------

if ($DryRun) { $Global:WhatIfPreference = $true }

function Is-Excluded([string]$path) {
  foreach($p in $excludeTargets){ if ($path -like "*$p*") { return $true } }
  return $false
}

function Make-Dir([string]$path) {
  if (!(Test-Path $path)) { New-Item -ItemType Directory -Path $path | Out-Null }
}

# Find all backup files (both forms)
$backupFiles = @()
$backupFiles += Get-ChildItem -Recurse -File -Include $exts -ErrorAction SilentlyContinue | Where-Object {
  $_.FullName -match '\\scripts_backups\\' -or $_.FullName -match '\\_backups\\'
}

if (-not $backupFiles.Count) {
  Write-Error "No backup files found under scripts_backups/ or scripts/_backups/."
  exit 1
}

# Map: targetRelativePath -> newest backup file
$map = @{}

foreach ($bf in $backupFiles) {
  $full = $bf.FullName

  # 1) Try to extract a relative path starting from a known root marker (mirror-style backups)
  $rel = $null
  foreach ($root in $targetRoots) {
    $idx = $full.ToLower().IndexOf("\$root\")
    if ($idx -ge 0) {
      $rel = $full.Substring($idx + 1)  # +1 removes leading '\'
      break
    }
  }

  # 2) If not found, try flattened underscore style: e.g., components_homepage_File.tsx
  if (-not $rel) {
    $name = [System.IO.Path]::GetFileName($full)
    if ($name -match '^[a-z]+(_[A-Za-z0-9\-\[\]\.]+)+\.(ts|tsx|jsx|js|mjs|cjs|json|mdx|md|css)$') {
      $base = [System.IO.Path]::GetFileNameWithoutExtension($name)
      $parts = $base.Split('_')
      if ($parts.Length -ge 2 -and $targetRoots -contains $parts[0]) {
        $fn = $parts[$parts.Length-1] + [System.IO.Path]::GetExtension($name)
        $dirs = $parts[0..($parts.Length-2)]
        $rel = [System.IO.Path]::Combine(($dirs -join [System.IO.Path]::DirectorySeparatorChar), $fn)
      }
    }
  }

  if (-not $rel) { continue }
  if (Is-Excluded $rel) { continue }

  # Prefer newest by LastWriteTime
  if (!$map.ContainsKey($rel) -or $bf.LastWriteTimeUtc -gt $map[$rel].LastWriteTimeUtc) {
    $map[$rel] = $bf
  }
}

if (-not $map.Keys.Count) {
  Write-Error "No restorable files resolved from backups."
  exit 1
}

Write-Host "Found $($map.Keys.Count) candidate files to restore from backups."

# Restore loop
$restored = 0
foreach ($rel in $map.Keys) {
  $src = $map[$rel].FullName
  $dst = Join-Path -Path (Get-Location) -ChildPath $rel
  if (Is-Excluded $dst) { continue }

  $dstDir = [System.IO.Path]::GetDirectoryName($dst)
  Make-Dir $dstDir

  # Read bytes, ensure UTF-8 no BOM, and normalize NBSP family + delete BOM/soft hyphen/bidi/ZW*.
  $bytes = [System.IO.File]::ReadAllBytes($src)
  # Strip byte BOM if present
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    $bytes = $bytes[3..($bytes.Length-1)]
  }
  $text = [System.Text.Encoding]::UTF8.GetString($bytes)

  # Convert NBSP-like to space; delete true invisibles
  $text = ($text.ToCharArray() | ForEach-Object {
    $cp = [int][char]$_
    switch ($cp) {
      0x00A0 { ' ' ; break } # NBSP
      0x2007 { ' ' ; break } # Figure space
      0x202F { ' ' ; break } # Narrow no-break space
      0xFEFF { ''  ; break } # BOM
      0x00AD { ''  ; break } # Soft hyphen
      0x2060 { ''  ; break } # Word joiner
      0x200B { ''  ; break } # ZWSP
      0x200C { ''  ; break } # ZWNJ
      0x200D { ''  ; break } # ZWJ
      0x202A { ''  ; break } # Bidi
      0x202B { ''  ; break }
      0x202C { ''  ; break }
      0x202D { ''  ; break }
      0x202E { ''  ; break }
      default { $_ }
    }
  }) -join ''

  # Trim a leading replacement char (U+FFFD) if present
  if ($text.Length -gt 0 -and [int][char]$text[0] -eq 0xFFFD) { $text = $text.Substring(1) }

  # Fix accidental token glue from earlier damage
  $text = [regex]::Replace($text, '(?m)\bdefault(?=function\b)', 'default ')

  if ($DryRun) {
    Write-Host "[DRY] would restore -> $rel  (from: $src)"
  } else {
    $sw = New-Object System.IO.StreamWriter($dst, $false, $Utf8NoBom)
    $sw.Write($text); $sw.Close()
    Write-Host "Restored: $rel"
    $restored++
  }
}

Write-Host "Restore complete. Files written: $restored"
