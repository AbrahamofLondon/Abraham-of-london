# 🔧 Enterprise Repository Healing System

## Overview

The Repository Healing System is an intelligent, enterprise-grade tool that automatically detects, diagnoses, and repairs code issues across your entire repository. It uses multiple strategies including direct repair, backup restoration, and git history analysis.

## Features

### 🔍 **Intelligent Detection**
- Unicode gremlins (NBSP, ZWSP, BOM, etc.)
- Import statement issues (function calls in imports, missing quotes)
- Duplicate imports
- JSON validation errors
- Unbalanced braces
- Syntax errors (TypeScript/JavaScript)
- Lone slash lines and code quality issues

### 🩹 **Smart Repair Strategies**
1. **Direct Repair** - Applies intelligent fixes to common issues
2. **Backup Restoration** - Uses clean backup files from `.gremlin-backups/`
3. **Git History** - Finds last clean version from git commits
4. **Validation** - Ensures repairs don't break functionality

### 📊 **Comprehensive Reporting**
- Beautiful HTML reports with issue breakdown
- Detailed logs with timestamps
- Statistics and metrics
- Before/after comparisons

### 🛡️ **Safety Features**
- Automatic backups before all changes
- Post-repair validation
- Rollback capability
- TypeScript/ESLint validation

## Quick Start

### 1. Scan Only (No Changes)
```bash
npm run heal:scan
```
**What it does:** Scans entire repository and generates a report without making any changes.

**Use when:** You want to see what issues exist before fixing them.

### 2. Interactive Mode (Recommended)
```bash
npm run heal:interactive
```
**What it does:** Scans for issues and prompts you before each repair.

**Use when:** You want control over what gets fixed.

### 3. Auto-Fix Mode
```bash
npm run heal
```
**What it does:** Automatically detects and fixes all issues without prompting.

**Use when:** You trust the system and want fast repairs.

### 4. Git-Enhanced Mode
```bash
npm run heal:git
```
**What it does:** Uses git history to find clean versions of files.

**Use when:** You have git history and want the most reliable repairs.

### 5. Full Power Mode
```bash
npm run heal:full
```
**What it does:** Auto-fix + Git history + Verbose logging.

**Use when:** You want maximum repair capability with detailed diagnostics.

## Detailed Usage

### Command Line Options

```powershell
.\scripts\Repair-Repository.ps1 [options]
```

| Option | Description |
|--------|-------------|
| `-ScanOnly` | Scan and report only, make no changes |
| `-AutoFix` | Automatically fix all issues without prompting |
| `-UseGitHistory` | Search git history for clean file versions |
| `-MaxGitHistoryDepth <n>` | How many commits to search (default: 50) |
| `-SkipBackups` | Don't create backups (NOT recommended) |
| `-Verbose` | Show detailed diagnostic information |

### Examples

**Scan with detailed output:**
```bash
pwsh ./scripts/Repair-Repository.ps1 -ScanOnly -Verbose
```

**Auto-fix with git history, search 100 commits:**
```bash
pwsh ./scripts/Repair-Repository.ps1 -AutoFix -UseGitHistory -MaxGitHistoryDepth 100
```

**Interactive mode with verbose logging:**
```bash
pwsh ./scripts/Repair-Repository.ps1 -Verbose
```

## How It Works

### 1. **Initialization Phase**
- Checks git availability
- Creates backup directory
- Updates .gitignore

### 2. **Scanning Phase**
- Recursively scans all source files
- Applies detection rules for each file type
- Categorizes issues by severity (Critical/High/Medium/Low)
- Generates issue reports

### 3. **Healing Phase**
For each issue, the system tries multiple strategies in order:

```
┌─────────────────────────────────────┐
│ 1. Direct Repair                    │
│    Apply intelligent fixes           │
│    ↓ If fails                        │
│ 2. Clean Backup Restoration         │
│    Use .gremlin-backups/*.bak       │
│    ↓ If fails                        │
│ 3. Git History Restoration          │
│    Find last clean commit            │
│    ↓ If fails                        │
│ 4. Manual Intervention Required      │
└─────────────────────────────────────┘
```

### 4. **Validation Phase**
- Runs TypeScript compiler check
- Runs ESLint validation
- Verifies all fixed files are readable
- Re-scans fixed files to confirm issues resolved

### 5. **Reporting Phase**
- Generates HTML report with visual breakdown
- Creates detailed log file
- Shows summary statistics

## Issue Types & Repairs

### Unicode Gremlins
**Detects:** NBSP, ZWSP, BOM, and other invisible characters  
**Repair:** Replaces with normal spaces or removes  
**Example:**
```typescript
// Before: const name = "John";  // NBSP before semicolon
// After:  const name = "John";
```

### Import Statement Issues
**Detects:** Function calls in imports, missing quotes  
**Repair:** Removes parentheses, adds quotes  
**Example:**
```typescript
// Before: import { getAllEvents() } from "@/lib/events";
// After:  import { getAllEvents } from "@/lib/events";
```

### Duplicate Imports
**Detects:** Same module imported multiple times  
**Repair:** Keeps first import, removes duplicates  
**Example:**
```typescript
// Before:
import { foo } from "module";
import { bar } from "module";  // Duplicate!

// After:
import { foo } from "module";
```

### JSON Validation
**Detects:** Invalid JSON syntax  
**Repair:** Parses and reformats correctly  
**Example:**
```json
// Before: {"name": "test",}  // Trailing comma
// After:  {"name": "test"}
```

### Unbalanced Braces
**Detects:** Mismatched { } in code  
**Repair:** Attempts to restore from backup/git  
**Example:**
```typescript
// Detected: 5 open braces, 4 close braces
// Action: Restore from last clean version
```

## Reports & Logs

### HTML Report
Location: `repair-report-[timestamp].html`

**Contains:**
- Visual statistics dashboard
- Color-coded issue list by severity
- File-by-file breakdown
- Fix methods applied
- Success/failure indicators

**Colors:**
- 🔴 Critical (must fix immediately)
- 🟠 High (should fix soon)
- 🟡 Medium (should fix)
- 🟢 Low (nice to fix)

### Log File
Location: `repair-log-[timestamp].log`

**Contains:**
- Timestamped entries
- Detailed error messages
- Decision paths taken
- Validation results

### Backup Directory
Location: `.repo-healing-[timestamp]/`

**Contains:**
- Timestamped backups of all modified files
- Flat structure with `_` separators
- Original file state before any changes

## Integration with Existing Tools

### Works With:
- ✅ TypeScript compiler validation
- ✅ ESLint
- ✅ Git
- ✅ Existing backup system (`.gremlin-backups/`)
- ✅ NPM scripts

### Part of Build Pipeline:
```json
{
  "scripts": {
    "prebuild": "npm run heal:scan",
    "build": "npm run heal && contentlayer2 build && next build"
  }
}
```

## Troubleshooting

### "No files found to scan"
**Cause:** Wrong directory or all files excluded  
**Fix:** Ensure you're in project root with package.json

### "Git integration DISABLED"
**Cause:** Git not installed or not in PATH  
**Fix:** Install git or run without `-UseGitHistory`

### "Validation failed after repair"
**Cause:** Repair broke something  
**Fix:** File automatically restored from backup

### "Some files could not be repaired"
**Cause:** Issues too complex for auto-repair  
**Fix:** Check HTML report for details, manual intervention needed

## Best Practices

### ✅ DO:
- Run `heal:scan` first to see what will change
- Use interactive mode for critical files
- Review HTML reports after healing
- Keep backups enabled
- Run validation after healing

### ❌ DON'T:
- Skip backups on production code
- Run auto-fix without scanning first
- Ignore failed files in report
- Delete backup directories immediately
- Disable validation checks

## Advanced Usage

### Custom Configuration

Edit the script's configuration section:

```powershell
$script:Config = @{
    BackupDir = ".my-custom-backups"
    MaxGitHistoryDepth = 100
    IncludePatterns = @('*.ts', '*.tsx', '*.custom')
    ExcludeDirs = @('node_modules', 'my-custom-dir')
}
```

### Programmatic Usage

```powershell
# Import functions
. .\scripts\Repair-Repository.ps1

# Use specific functions
$files = Get-RepositoryFiles
Invoke-DeepScan -Files $files
Export-HtmlReport
```

### CI/CD Integration

```yaml
# .github/workflows/heal.yml
name: Repository Healing
on: [push]
jobs:
  heal:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run heal:scan
      - uses: actions/upload-artifact@v3
        with:
          name: healing-report
          path: repair-report-*.html
```

## Performance

**Typical scan times:**
- Small repo (< 100 files): 5-10 seconds
- Medium repo (100-500 files): 20-40 seconds
- Large repo (500+ files): 1-3 minutes

**Factors affecting speed:**
- Number of files
- File sizes
- Git history depth (if enabled)
- Number of issues found

## Security & Privacy

- ✅ All operations are local
- ✅ No data sent to external services
- ✅ Backups stored locally
- ✅ Git operations are read-only
- ✅ No modification of .git directory

## Support & Feedback

For issues, feature requests, or questions:
1. Check the HTML report for details
2. Review log file for error messages
3. Enable verbose mode for diagnostics
4. Check backup files if repairs failed

## Version History

**v1.0.0** - Initial enterprise release
- Multi-strategy repair system
- Git integration
- HTML reporting
- TypeScript/ESLint validation
- Backup management

---

## Quick Reference

```bash
# Most common commands
npm run heal:scan        # Just scan, no changes
npm run heal:interactive # Ask before fixing
npm run heal            # Auto-fix everything
npm run heal:git        # Auto-fix with git help
npm run heal:full       # Maximum power mode

# Direct PowerShell (advanced)
pwsh ./scripts/Repair-Repository.ps1 -ScanOnly
pwsh ./scripts/Repair-Repository.ps1 -AutoFix -Verbose
pwsh ./scripts/Repair-Repository.ps1 -UseGitHistory -MaxGitHistoryDepth 100
```

---

**Remember:** Always run `heal:scan` first to see what will change! 🔍