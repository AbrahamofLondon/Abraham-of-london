// scripts/security/security-scan.ts
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  file?: string;
  line?: number;
}

class SecurityScanner {
  private issues: SecurityIssue[] = [];
  private projectRoot: string;
  private packageJson: any;

  constructor() {
    this.projectRoot = join(__dirname, '../..');
    this.packageJson = JSON.parse(
      readFileSync(join(this.projectRoot, 'package.json'), 'utf-8')
    );
  }

  scan(): SecurityIssue[] {
    console.log('🔍 Starting security scan...');
    console.log('='.repeat(60));

    try {
      this.checkDependencies();
      this.checkEnvironmentFiles();
      this.checkContentSecurity();
      this.checkSensitiveData();
      this.runNpmAudit();
      this.checkBuildOutput();
    } catch (error: any) {
      this.addIssue('critical', `Scan error: ${error.message}`);
    }

    return this.issues;
  }

  private checkDependencies(): void {
    console.log('📦 Checking dependencies...');
    
    const deps = this.packageJson.dependencies || {};
    const devDeps = this.packageJson.devDependencies || {};
    const allDeps = { ...deps, ...devDeps };

    // Check for known vulnerable packages
    const riskyPackages = [
      'lodash', 'moment', 'axios', 'express', 'next'
    ];

    riskyPackages.forEach(pkg => {
      if (allDeps[pkg]) {
        this.addIssue('info', `Using ${pkg} - ensure version is up-to-date`, 'package.json');
      }
    });

    // Check for outdated packages
    try {
      execSync('npm outdated --json', { stdio: 'pipe', cwd: this.projectRoot });
    } catch (error: any) {
      // npm outdated exits with 1 if packages are outdated
      const output = JSON.parse(error.stdout.toString());
      Object.keys(output).forEach(pkg => {
        this.addIssue('medium', 
          `Package ${pkg} is outdated (${output[pkg].current} → ${output[pkg].latest})`,
          'package.json'
        );
      });
    }
  }

  private checkEnvironmentFiles(): void {
    console.log('🌍 Checking environment files...');
    
    const envFiles = ['.env', '.env.local', '.env.production'];
    
    envFiles.forEach(file => {
      const envPath = join(this.projectRoot, file);
      if (existsSync(envPath)) {
        const content = readFileSync(envPath, 'utf-8');
        
        // Check for hardcoded secrets
        const secrets = content.match(/SECRET|KEY|PASSWORD|TOKEN/g);
        if (secrets) {
          this.addIssue('high', 
            `Potential secrets found in ${file} (${secrets.length} matches)`,
            file
          );
        }

        // Check if .env files are in .gitignore
        try {
          const gitignore = readFileSync(join(this.projectRoot, '.gitignore'), 'utf-8');
          if (!gitignore.includes(file)) {
            this.addIssue('critical', `${file} not found in .gitignore`, '.gitignore');
          }
        } catch {
          this.addIssue('critical', '.gitignore file missing', '.gitignore');
        }
      }
    });
  }

  private checkContentSecurity(): void {
    console.log('📄 Checking content security...');
    
    const contentDirs = ['content', 'public', 'downloads'];
    
    contentDirs.forEach(dir => {
      const dirPath = join(this.projectRoot, dir);
      if (existsSync(dirPath)) {
        // Check for executable files in content directories
        try {
          const findCommand = process.platform === 'win32' 
            ? `dir /s /b "${dirPath}\\*.exe" "${dirPath}\\*.bat" "${dirPath}\\*.sh" 2>nul`
            : `find "${dirPath}" -name "*.exe" -o -name "*.bat" -o -name "*.sh"`;
          
          const output = execSync(findCommand, { encoding: 'utf-8' }).trim();
          if (output) {
            this.addIssue('high', `Executable files found in ${dir}/ directory`, dir);
          }
        } catch {
          // Command failed or no files found
        }
      }
    });
  }

  private checkSensitiveData(): void {
    console.log('🔒 Checking for sensitive data...');
    
    const patterns = [
      { regex: /password\s*[:=]\s*['"][^'"]+['"]/gi, type: 'Hardcoded password' },
      { regex: /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi, type: 'API key' },
      { regex: /secret\s*[:=]\s*['"][^'"]+['"]/gi, type: 'Secret key' },
    ];

    // Scan TypeScript/JavaScript files
    const scanDir = (dir: string): void => {
      try {
        const findCommand = process.platform === 'win32'
          ? `dir /s /b "${dir}\\*.ts" "${dir}\\*.tsx" "${dir}\\*.js" "${dir}\\*.jsx" 2>nul`
          : `find "${dir}" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx"`;
        
        const files = execSync(findCommand, { encoding: 'utf-8' })
          .split('\n')
          .filter(f => f.trim());
        
        files.forEach(file => {
          try {
            const content = readFileSync(file, 'utf-8');
            patterns.forEach(pattern => {
              const matches = content.match(pattern.regex);
              if (matches) {
                const relativePath = file.replace(this.projectRoot, '').replace(/^[\\/]/, '');
                this.addIssue('critical', 
                  `${pattern.type} found in ${relativePath} (${matches.length} occurrences)`,
                  relativePath
                );
              }
            });
          } catch {
            // Skip unreadable files
          }
        });
      } catch {
        // Directory might not exist
      }
    };

    scanDir(join(this.projectRoot, 'src'));
    scanDir(join(this.projectRoot, 'lib'));
    scanDir(join(this.projectRoot, 'scripts'));
  }

  private runNpmAudit(): void {
    console.log('📊 Running npm audit...');
    
    try {
      const auditResult = execSync('npm audit --json', { 
        stdio: 'pipe', 
        cwd: this.projectRoot,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      
      const auditData = JSON.parse(auditResult.toString());
      
      if (auditData.vulnerabilities) {
        Object.entries(auditData.vulnerabilities).forEach(([pkg, data]: [string, any]) => {
          this.addIssue(
            data.severity as 'critical' | 'high' | 'medium' | 'low',
            `${pkg}: ${data.name} (${data.severity} severity)`,
            'package.json'
          );
        });
      }
    } catch (error: any) {
      // npm audit exits with 1 if vulnerabilities found
      try {
        const auditData = JSON.parse(error.stdout.toString());
        if (auditData.vulnerabilities) {
          Object.entries(auditData.vulnerabilities).forEach(([pkg, data]: [string, any]) => {
            this.addIssue(
              data.severity as 'critical' | 'high' | 'medium' | 'low',
              `${pkg}: ${data.name} - ${data.via?.[0]?.title || 'Vulnerability found'}`,
              'package.json'
            );
          });
        }
      } catch {
        this.addIssue('medium', 'npm audit failed to parse results');
      }
    }
  }

  private checkBuildOutput(): void {
    console.log('🏗️ Checking build output...');
    
    const buildDirs = ['.next', 'dist', 'build', 'out'];
    
    buildDirs.forEach(dir => {
      const dirPath = join(this.projectRoot, dir);
      if (existsSync(dirPath)) {
        try {
          const findCommand = process.platform === 'win32'
            ? `dir /s /b "${dirPath}\\*.map" 2>nul | find /c /v ""`
            : `find "${dirPath}" -name "*.map" | wc -l`;
          
          const mapCount = parseInt(execSync(findCommand, { encoding: 'utf-8' }).trim()) || 0;
          if (mapCount > 0) {
            this.addIssue('low', 
              `${mapCount} source map files found in ${dir}/ (expose source code in production)`,
              dir
            );
          }
        } catch {
          // Command failed
        }
      }
    });
  }

  private addIssue(
    severity: SecurityIssue['severity'], 
    message: string, 
    file?: string, 
    line?: number
  ): void {
    this.issues.push({ severity, message, file, line });
  }

  printReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📋 SECURITY SCAN REPORT');
    console.log('='.repeat(60));
    
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    const sortedIssues = [...this.issues].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
    
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    this.issues.forEach(issue => { counts[issue.severity]++; });
    
    console.log(`🔴 Critical: ${counts.critical}`);
    console.log(`🟠 High: ${counts.high}`);
    console.log(`🟡 Medium: ${counts.medium}`);
    console.log(`🔵 Low: ${counts.low}`);
    console.log(`⚪ Info: ${counts.info}`);
    console.log('='.repeat(60));
    
    if (sortedIssues.length === 0) {
      console.log('✅ No security issues found!');
      return;
    }
    
    sortedIssues.forEach((issue, index) => {
      const icon = issue.severity === 'critical' ? '🔴' :
                   issue.severity === 'high' ? '🟠' :
                   issue.severity === 'medium' ? '🟡' :
                   issue.severity === 'low' ? '🔵' : '⚪';
      
      const location = issue.file ? 
        (issue.line ? ` (${issue.file}:${issue.line})` : ` (${issue.file})`) : '';
      
      console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.message}${location}`);
    });
    
    console.log('='.repeat(60));
    
    if (counts.critical > 0 || counts.high > 0) {
      console.log('🚨 CRITICAL/HIGH ISSUES FOUND - Immediate action required!');
      process.exit(1);
    } else if (counts.medium > 0) {
      console.log('⚠️ Medium severity issues found - review recommended');
      process.exit(0);
    } else {
      console.log('✅ Security scan passed!');
      process.exit(0);
    }
  }
}

// Run if called directly
async function main() {
  const scanner = new SecurityScanner();
  const issues = scanner.scan();
  scanner.printReport();
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main().catch(error => {
    console.error('❌ Security scan failed:', error.message);
    process.exit(1);
  });
}

export { SecurityScanner, main as runSecurityScan };