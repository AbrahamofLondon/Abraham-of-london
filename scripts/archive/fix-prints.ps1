# Fix print file types
Get-ChildItem "content\prints\*.mdx" | ForEach-Object {
     = Get-Content  -Raw
     =  -replace 'type:\s*"Resource"', 'type: "Print"' -replace "type:\s*'Resource'", "type: 'Print'" -replace 'type:\s*Resource', 'type: Print'
    if ( -ne ) {
        Set-Content  -Value  -NoNewline
        Write-Host "Fixed: "
    }
}
