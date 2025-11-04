$ErrorActionPreference = 'Stop'
$NBSP = [string][char]0x00A0
$ZWSP = [string][char]0x200B
$BOM  = [string][char]0xFEFF
$TextExt = @('.ts','.tsx','.js','.jsx','.mjs','.json','.md','.mdx','.css','.html','.xml','.yml','.yaml','.txt','.ps1','.psm1','.cjs','.cts','.mts')
$Exclude = @('\.next\','\bnode_modules\b','\bpublic\\downloads\b','\.contentlayer\\\.cache')

Get-ChildItem -Recurse -File | Where-Object {
  $TextExt -contains $_.Extension.ToLower() -and
  ($Exclude | ForEach-Object { $_ -notmatch $_.FullName }) -and
  $_.Length -gt 0
} | ForEach-Object {
  try {
    $path = $_.FullName
    $raw  = Get-Content -LiteralPath $path -Raw -ErrorAction SilentlyContinue
    if ($null -eq $raw) { return }
    $raw = [string]$raw
    $new = $raw.Replace($NBSP,' ').Replace($ZWSP,'').Replace($BOM,'')
    if ($new -ne $raw) {
      Set-Content -LiteralPath $path -Value $new -Encoding UTF8
      Write-Host "[gremlin-fix] cleaned $path"
    }
  } catch {
    Write-Warning "[gremlin-fix] error on $($_.FullName): $($_.Exception.Message)"
  }
}
