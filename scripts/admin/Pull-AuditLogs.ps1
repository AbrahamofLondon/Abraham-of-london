# ==============================================================================
# ABRAHAM OF LONDON: STRATEGIC AUDIT RETRIEVAL (Windows/PowerShell)
# ==============================================================================

$ApiUrl = "https://abrahamoflondon.org/api/admin/export-audit"
$AuthKey = "your_admin_api_key_here" # Ensure this matches your ENV
$Since = (Get-Date).AddDays(-7).ToString("yyyy-MM-ddTHH:mm:ssZ")
$OutputFile = "audit_export_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"

$Headers = @{
    "Authorization" = "Bearer $AuthKey"
    "Content-Type"  = "application/json"
}

Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host "Starting Institutional Audit Retrieval..."
Write-Host "Period Since: $Since"

try {
    # 1. Execute Web Request
    $Response = Invoke-RestMethod -Uri "$($ApiUrl)?since=$Since" -Method Get -Headers $Headers

    if ($Response.ok -eq $true) {
        Write-Host "✅ Success. Data retrieved: $($Response.meta.count) entries."
        
        # 2. Transform and Export to CSV natively
        $Response.data | Export-Csv -Path $OutputFile -NoTypeInformation -Encoding utf8
        
        Write-Host "----------------------------------------------------" -ForegroundColor Green
        Write-Host "REPORT COMPLETE: $OutputFile"
    } else {
        Write-Host "❌ API Error: $($Response.error.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Critical Failure: $($_.Exception.Message)" -ForegroundColor Red
}