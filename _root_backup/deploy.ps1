<#
.SYNOPSIS
    Optimized hybrid deployment script for Netlify with Git integration and comprehensive validation.
.DESCRIPTION
    Combines robust error handling with complete automation including dependency management,
    build process, Git operations, and Netlify deployment with rollback capabilities.
.PARAMETER SkipDependencies
    Skip npm dependency installation
.PARAMETER SkipBuild
    Skip the build process
.PARAMETER SkipGit
    Skip Git operations (commit/push)
.PARAMETER Verbose
    Enable verbose output
.PARAMETER LogFile
    Specify custom log file path
.PARAMETER CommitMessage
    Custom Git commit message
.PARAMETER Branch
    Target Git branch (default: main)
.PARAMETER UseJsFallback
    Use Node.js deploy script instead of native PowerShell deployment
.PARAMETER JsDeployScript
    Path to Node.js deployment script (default: deploy.js)
.EXAMPLE
    .\deploy.ps1
    .\deploy.ps1 -SkipBuild -Verbose
    .\deploy.ps1 -CommitMessage "Feature: New component" -Branch "develop"
    .\deploy.ps1 -UseJsFallback -Verbose
#>

param(
    [switch]$SkipDependencies,
    [switch]$SkipBuild,
    [switch]$SkipGit,
    [switch]$Verbose,
    [switch]$DryRun,
    [switch]$UseJsFallback,
    [string]$LogFile = "codex-log.txt",
    [string]$CommitMessage = "",
    [string]$Branch = "main",
    [string]$JsDeployScript = "deploy.js"
)

# Script configuration
$ErrorActionPreference = "Stop"
$script:StartTime = Get-Date
$script:HasErrors = $false
$script:GitCommitHash = ""

# Enhanced logging function with levels
function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "WARN", "ERROR", "SUCCESS")]
        [string]$Level = "INFO",
        [string]$Color = "White"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Console output with color
    $consoleColors = @{
        "INFO" = "Cyan"
        "WARN" = "Yellow" 
        "ERROR" = "Red"
        "SUCCESS" = "Green"
    }
    
    Write-Host $logEntry -ForegroundColor $consoleColors[$Level]
    
    # File logging
    try {
        Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
    } catch {
        # Silently continue if logging fails
    }
}

# Comprehensive validation functions
function Test-Prerequisites {
    Write-Log "🔍 Performing pre-flight checks..." "INFO"
    
    # Check if in project directory
    if (-not (Test-Path "package.json")) {
        throw "package.json not found. Please run from project root directory."
    }
    
    # Check Node.js installation
    try {
        $nodeVersion = node --version 2>$null
        Write-Log "Node.js version: $nodeVersion" "INFO"
    } catch {
        throw "Node.js not found. Please install Node.js."
    }
    
    # Check npm installation
    try {
        $npmVersion = npm --version 2>$null
        Write-Log "npm version: $npmVersion" "INFO"
    } catch {
        throw "npm not found. Please install npm."
    }
    
    # Git availability check (if not skipping Git operations)
    if (-not $SkipGit) {
        try {
            $gitVersion = git --version 2>$null
            Write-Log "Git version: $gitVersion" "INFO"
            
            # Check if in git repository
            git rev-parse --git-dir 2>$null | Out-Null
            if ($LASTEXITCODE -ne 0) {
                throw "Not in a Git repository. Initialize git or use -SkipGit flag."
            }
            
            # Check git remote
            $remote = git remote get-url origin 2>$null
            if ($LASTEXITCODE -ne 0) {
                throw "No Git remote 'origin' configured."
            }
            Write-Log "Git remote: $remote" "INFO"
            
        } catch {
            throw "Git not available or not configured properly. Use -SkipGit to skip Git operations."
        }
    }
    
    Write-Log "✅ Pre-flight checks passed" "SUCCESS"
}

function Test-EnvironmentVariables {
    Write-Log "🔐 Validating environment variables..." "INFO"
    
    # Check for environment file
    if (Test-Path ".env") {
        Write-Log "Found .env file" "INFO"
        $envContent = Get-Content ".env" -Raw
        
        # Check for required variables in .env
        if ($envContent -match "NETLIFY_BUILD_HOOK|NETLIFY_DEPLOY_HOOK") {
            Write-Log "Netlify hook found in .env file" "SUCCESS"
        }
    }
    
    # Check environment variables (PowerShell 5.1 compatible)
    $netlifyHook = if ($env:NETLIFY_BUILD_HOOK) { $env:NETLIFY_BUILD_HOOK } else { $env:NETLIFY_DEPLOY_HOOK }
    if (-not $netlifyHook) {
        throw "Neither NETLIFY_BUILD_HOOK nor NETLIFY_DEPLOY_HOOK environment variable is set."
    }
    
    # Validate hook URL format
    if (-not ($netlifyHook -match "^https://api\.netlify\.com/build_hooks/")) {
        Write-Log "Warning: Hook URL format may be incorrect" "WARN"
    }
    
    Write-Log "✅ Environment variables validated" "SUCCESS"
    return $netlifyHook
}

function Install-Dependencies {
    if ($SkipDependencies) {
        Write-Log "⏭ Skipping dependency installation" "WARN"
        return
    }
    
    Write-Log "📦 Managing dependencies..." "INFO"
    
    if ($DryRun) {
        Write-Log "[DRY RUN] Would install dependencies" "INFO"
        return
    }
    
    try {
        # Prefer npm ci for faster, reliable installs when lockfile exists
        if (Test-Path "package-lock.json") {
            Write-Log "Using npm ci for faster install..." "INFO"
            if ($Verbose) {
                npm ci --verbose
            } else {
                npm ci --silent
            }
        } elseif (Test-Path "yarn.lock") {
            Write-Log "Yarn lockfile detected, using yarn..." "INFO"
            if ($Verbose) {
                yarn install --verbose
            } else {
                yarn install --silent
            }
        } else {
            Write-Log "Using npm install..." "INFO"
            if ($Verbose) {
                npm install --verbose
            } else {
                npm install --silent
            }
        }
        
        Write-Log "✅ Dependencies installed successfully" "SUCCESS"
    } catch {
        throw "Failed to install dependencies: $($_.Exception.Message)"
    }
}

function Invoke-BuildProcess {
    if ($SkipBuild) {
        Write-Log "⏭ Skipping build process" "WARN"
        return
    }
    
    Write-Log "🛠 Building project..." "INFO"
    
    if ($DryRun) {
        Write-Log "[DRY RUN] Would run build process" "INFO"
        return
    }
    
    # Check if build script exists
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if (-not $packageJson.scripts.build) {
        Write-Log "No build script found in package.json, skipping build" "WARN"
        return
    }
    
    try {
        if ($Verbose) {
            npm run build
        } else {
            npm run build 2>&1 | Out-Null
        }
        
        Write-Log "✅ Build completed successfully" "SUCCESS"
    } catch {
        throw "Build failed: $($_.Exception.Message)"
    }
}

function Invoke-GitOperations {
    if ($SkipGit) {
        Write-Log "⏭ Skipping Git operations" "WARN"
        return
    }
    
    Write-Log "📝 Performing Git operations..." "INFO"
    
    # Check for uncommitted changes
    $gitStatus = git status --porcelain
    if (-not $gitStatus) {
        Write-Log "No changes to commit" "INFO"
        return
    }
    
    if ($DryRun) {
        Write-Log "[DRY RUN] Would commit and push changes" "INFO"
        Write-Log "Changes to be committed:" "INFO"
        git status --short
        return
    }
    
    try {
        # Add all changes
        git add .
        
        # Generate commit message
        $finalCommitMessage = if ($CommitMessage) {
            $CommitMessage
        } else {
            "Auto deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        }
        
        # Commit changes
        git commit -m $finalCommitMessage
        $script:GitCommitHash = git rev-parse HEAD
        
        Write-Log "✅ Changes committed: $($script:GitCommitHash.Substring(0,8))" "SUCCESS"
        
        # Push to remote
        Write-Log "📤 Pushing to $Branch..." "INFO"
        git push origin $Branch
        
        Write-Log "✅ Code pushed to remote repository" "SUCCESS"
        
    } catch {
        $script:HasErrors = $true
        throw "Git operations failed: $($_.Exception.Message)"
    }
}

function Invoke-NetlifyDeploy {
    param([string]$HookUrl)
    
    Write-Log "🌐 Triggering Netlify deployment..." "INFO"
    
    if ($DryRun) {
        Write-Log "[DRY RUN] Would trigger Netlify deployment" "INFO"
        return
    }
    
    try {
        $response = Invoke-RestMethod -Uri $HookUrl -Method Post -TimeoutSec 30
        Write-Log "✅ Netlify deployment triggered successfully" "SUCCESS"
        
        if ($Verbose -and $response) {
            Write-Log "Netlify response: $($response | ConvertTo-Json -Compress)" "INFO"
        }
        
    } catch {
        throw "Netlify deployment trigger failed: $($_.Exception.Message)"
    }
}

function Invoke-JsFallback {
    param([string]$ScriptPath)
    
    Write-Log "🔄 Using JavaScript fallback deployment..." "INFO"
    
    # Validate JS script exists
    if (-not (Test-Path $ScriptPath)) {
        throw "JavaScript deployment script not found: $ScriptPath"
    }
    
    if ($DryRun) {
        Write-Log "[DRY RUN] Would execute: node $ScriptPath" "INFO"
        return
    }
    
    try {
        Write-Log "📜 Executing Node.js deployment script..." "INFO"
        
        if ($Verbose) {
            Write-Log "Running: node $ScriptPath" "INFO"
            node $ScriptPath
        } else {
            node $ScriptPath 2>&1 | ForEach-Object {
                Write-Log $_ "INFO"
            }
        }
        
        Write-Log "✅ JavaScript deployment completed" "SUCCESS"
        
    } catch {
        throw "JavaScript deployment failed: $($_.Exception.Message)"
    }
}

function Invoke-Rollback {
    if ($SkipGit -or -not $script:GitCommitHash) {
        Write-Log "Cannot rollback: Git operations were skipped or no commit was made" "WARN"
        return
    }
    
    Write-Log "🔄 Rolling back Git changes..." "WARN"
    
    try {
        # Reset to previous commit
        git reset --hard HEAD~1
        git push origin $Branch --force-with-lease
        Write-Log "✅ Rollback completed" "SUCCESS"
    } catch {
        Write-Log "❌ Rollback failed: $($_.Exception.Message)" "ERROR"
    }
}

function Show-DeploymentSummary {
    $duration = (Get-Date) - $script:StartTime
    $status = if ($script:HasErrors) { "FAILED" } else { "SUCCESS" }
    
    Write-Log "📊 Deployment Summary:" "INFO"
    Write-Log "   Status: $status" "INFO"
    Write-Log "   Duration: $($duration.ToString('mm\:ss'))" "INFO"
    Write-Log "   Branch: $Branch" "INFO"
    
    if ($script:GitCommitHash) {
        Write-Log "   Commit: $($script:GitCommitHash.Substring(0,8))" "INFO"
    }
    
    # Show latest log entries
    if (Test-Path $LogFile) {
        Write-Log "📘 Recent log entries:" "INFO"
        Get-Content $LogFile -Tail 3 | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
    }
}

# Main execution flow
try {
    Write-Log "🚀 Starting Optimized Codex Deployment" "INFO"
    
    if ($DryRun) {
        Write-Log "🧪 DRY RUN MODE - No actual changes will be made" "WARN"
    }
    
    # Pre-deployment validation
    Test-Prerequisites
    
    # Check for JavaScript fallback mode
    if ($UseJsFallback) {
        Write-Log "🔄 JavaScript fallback mode enabled" "INFO"
        
        # Still run dependency installation if not skipped
        Install-Dependencies
        
        # Use JavaScript deployment script
        Invoke-JsFallback -ScriptPath $JsDeployScript
        
        Write-Log "🎉 JavaScript fallback deployment completed!" "SUCCESS"
    } else {
        # Standard PowerShell deployment pipeline
        $netlifyHook = Test-EnvironmentVariables
        
        Install-Dependencies
        Invoke-BuildProcess
        Invoke-GitOperations
        Invoke-NetlifyDeploy -HookUrl $netlifyHook
        
        Write-Log "🎉 Deployment completed successfully!" "SUCCESS"
    }
    
} catch {
    $script:HasErrors = $true
    Write-Log "💥 Deployment failed: $($_.Exception.Message)" "ERROR"
    
    # Attempt rollback if Git operations were performed and not in JS fallback mode
    if (-not $DryRun -and -not $UseJsFallback -and $script:GitCommitHash) {
        $rollback = Read-Host "Attempt automatic rollback? (y/N)"
        if ($rollback -eq 'y' -or $rollback -eq 'Y') {
            Invoke-Rollback
        }
    }
    
    exit 1
} finally {
    Show-DeploymentSummary
}
# 🔁 Automatically update all old Netlify build hook URLs in the codebase
$hookPattern = "https://api\.netlify\.com/build_hooks/\w+"
$newHook = "https://api.netlify.com/build_hooks/684c730862a2c482c589aa5e"

Get-ChildItem -Recurse -Include .js,.bat | ForEach-Object {
    (Get-Content $.FullName) -replace $hookPattern, $newHook | Set-Content $.FullName
    Write-Host "✅ Updated: $($_.FullName)" -ForegroundColor Green
}