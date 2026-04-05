$ErrorActionPreference = "Stop"

function U([int]$code) {
  return [string][char]$code
}

$replacements = @(
  @{ From = "ÔÇö"; To = [string]([char]0x2014) } # em dash —
  @{ From = "ÔÇó"; To = [string]([char]0x2022) } # bullet •
  @{ From = "ÔÇÖ"; To = [string]([char]0x2019) } # right single quote ’
  @{ From = "ÔÇ£"; To = [string]([char]0x201C) } # left double quote “
  @{ From = "ÔÇ\?"; To = [string]([char]0x201D) } # right double quote ”
  @{ From = "â€™"; To = [string]([char]0x2019) }
  @{ From = "â€œ"; To = [string]([char]0x201C) }
  @{ From = "â€\x9d"; To = [string]([char]0x201D) }
  @{ From = "â€“"; To = [string]([char]0x2013) } # en dash –
  @{ From = "â€”"; To = [string]([char]0x2014) } # em dash —
  @{ From = "Â "; To = " " }
)

$files = Get-ChildItem -Recurse -File .\lib,.\pages,.\app,.\scripts -Include *.ts,*.tsx,*.js,*.jsx,*.md,*.mdx,*.ps1

foreach ($file in $files) {
  $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
  $updated = $content

  foreach ($pair in $replacements) {
    $updated = $updated -replace $pair.From, $pair.To
  }

  if ($updated -ne $content) {
    Set-Content -LiteralPath $file.FullName -Value $updated -Encoding UTF8
    Write-Host "Normalized encoding: $($file.FullName)"
  }
}