# ==============================================================================
# ABRAHAM OF LONDON: PRISMA IMPORT RECONCILIATION
# ==============================================================================

$TargetFiles = Get-ChildItem -Recurse -Include *.ts, *.tsx, *.js, *.jsx | 
               Where-Object { $_.FullName -notlike "*node_modules*" }

foreach ($File in $TargetFiles) {
    $Content = Get-Content $File.FullName -Raw
    if ($Content -match 'import \{ prisma \} from') {
        Write-Host "Reconciling Prisma in: $($File.Name)" -ForegroundColor Cyan
        $NewContent = $Content -replace 'import \{ prisma \} from', 'import prisma from'
        Set-Content -Path $File.FullName -Value $NewContent
    }
}

Write-Host "----------------------------------------------------"
Write-Host "RECONCILIATION COMPLETE. TRIGGERING CLIENT GENERATION..." -ForegroundColor Green

# Synchronize the Prisma Client with the updated schema
npx prisma generate