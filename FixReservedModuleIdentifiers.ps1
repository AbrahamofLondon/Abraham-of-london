# =====================================================================
# FixReservedModuleIdentifiers.ps1 (inline)
# - Makes timestamped backups
# - Fixes "const module = ..." in the 5 failing files safely
# - Adds local ESLint guards where needed
# =====================================================================

$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

$targets = @(
  "lib/contentlayer.ts",
  "lib/fallbacks.tsx",
  "lib/inner-circle/access.ts",
  "lib/server/with-inner-circle-access.ts",
  "pages/resources/strategic-frameworks/index.tsx"
)

function Backup-File($path) {
  $full = Join-Path $root $path
  if (!(Test-Path $full)) { throw "Missing file: $path" }
  $bak = "$full.bak.$stamp"
  Copy-Item $full $bak -Force
  Write-Host "Backup created: $bak" -ForegroundColor DarkGray
}

function Ensure-Eslint-Guard($content, $guardLine) {
  if ($content -match [regex]::Escape($guardLine)) { return $content }
  # Insert at very top
  return ($guardLine + "`r`n" + $content)
}

function Apply-Replacements($path, $content) {
  switch ($path) {

    "lib/contentlayer.ts" {
      # Fix ONLY the variable named "module" in the collection loader loop
      $content = $content -replace '(\bconst\s+)module(\s*=\s*loadModule\()', '${1}mod$2'
      $content = $content -replace '(\bif\s*\()\s*module(\s*\))', '${1}mod$2'
      $content = $content -replace '\bsafeArray<DocBase>\(module\)', 'safeArray<DocBase>(mod)'
      $content = $content -replace '\bmodule\)\s*;\s*\r?\n(\s*console\.log)', "mod);`r`n`$1"

      # Optional: if you have other “const module = …” in THIS file only (rare), fix it carefully:
      # Replace "const module =" only when followed by whitespace and NOT 'Path'
      $content = [regex]::Replace($content, '(?m)(\bconst\s+)module(\s*=\s*)(?!Path\b)', '${1}mod$2')

      # ESLint guard (this file uses require + any + console by design)
      $guard = "/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires, no-console */"
      $content = Ensure-Eslint-Guard $content $guard
      return $content
    }

    "lib/fallbacks.tsx" {
      # Fix require block
      $content = $content -replace '(\bconst\s+)module(\s*=\s*require\()', '${1}mod$2'
      $content = $content -replace '\bmodule\.default\b', 'mod.default'
      $content = $content -replace '(\breturn\s+)module(\s*;)', '${1}mod$2'
      $content = $content -replace '(\breturn\s+)module(\s*\))', '${1}mod$2'

      # Fix dynamic import block
      $content = $content -replace '(\bconst\s+)module(\s*=\s*await\s+import\()', '${1}mod$2'
      $content = $content -replace '\bmodule\.default\b', 'mod.default'

      $guard = "/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires, no-console */"
      $content = Ensure-Eslint-Guard $content $guard
      return $content
    }

    "lib/inner-circle/access.ts" {
      $content = $content -replace '(\bconst\s+)module(\s*=\s*require\()', '${1}mod$2'
      $content = $content -replace '\brateLimitModule\s*=\s*module\b', 'rateLimitModule = mod'
      $content = $content -replace '\bRATE_LIMIT_CONFIGS\s*=\s*module\.RATE_LIMIT_CONFIGS\b', 'RATE_LIMIT_CONFIGS = mod.RATE_LIMIT_CONFIGS'

      $guard = "/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires, no-console */"
      $content = Ensure-Eslint-Guard $content $guard
      return $content
    }

    "lib/server/with-inner-circle-access.ts" {
      $content = $content -replace '(\bconst\s+)module(\s*=\s*require\()', '${1}mod$2'
      $content = $content -replace '\brateLimitModule\s*=\s*module\b', 'rateLimitModule = mod'

      $guard = "/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires, no-console */"
      $content = Ensure-Eslint-Guard $content $guard
      return $content
    }

    "pages/resources/strategic-frameworks/index.tsx" {
      # Fix ONLY the dynamic import variable and its uses
      $content = $content -replace '(\bconst\s+)module(\s*=\s*await\s+import\()', '${1}mod$2'
      $content = $content -replace '\bif\s*\(\s*module\.getAllFrameworks\s*\)', 'if (mod.getAllFrameworks)'
      $content = $content -replace '\bframeworks\s*=\s*module\.getAllFrameworks\(\)', 'frameworks = mod.getAllFrameworks()'

      # (No eslint guard here unless you also use require/any/console. Most pages don't need it.)
      return $content
    }

    default { return $content }
  }
}

# -------------------- EXECUTE --------------------
Write-Host "Applying safe fixes with backups ($stamp)..." -ForegroundColor Cyan

foreach ($t in $targets) {
  Backup-File $t

  $full = Join-Path $root $t
  $content = Get-Content $full -Raw -Encoding UTF8

  $newContent = Apply-Replacements $t $content

  if ($newContent -eq $content) {
    Write-Host "No changes needed: $t" -ForegroundColor Yellow
  } else {
    Set-Content $full -Value $newContent -Encoding UTF8
    Write-Host "Updated: $t" -ForegroundColor Green
  }
}

Write-Host "`nDone. Now run: pnpm build" -ForegroundColor Cyan