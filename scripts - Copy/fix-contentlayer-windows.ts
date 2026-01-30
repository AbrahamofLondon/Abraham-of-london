#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function fixWindowsContentLayer() {
  console.log('🔧 Applying Windows compatibility fixes...\n');
  
  try {
    // 1. Check for Contentlayer configuration
    const contentlayerConfig = path.join(process.cwd(), 'contentlayer.config.ts');
    if (fs.existsSync(contentlayerConfig)) {
      console.log('✅ Found Contentlayer configuration');
      
      let content = fs.readFileSync(contentlayerConfig, 'utf-8');
      
      // Add Windows-compatible path handling
      if (!content.includes('path.win32')) {
        content = content.replace(
          /import.*from.*['"]path['"]/,
          `import path from 'path'`
        );
        
        // Add Windows-specific path normalization
        const fixCode = `
// Windows path normalization
const normalizePath = (filePath: string) => {
  if (process.platform === 'win32') {
    return filePath.replace(/\\\\/g, '/');
  }
  return filePath;
};
`;
        
        if (!content.includes('normalizePath')) {
          content = content.replace(
            /(export default makeSource)/,
            `${fixCode}\n$1`
          );
        }
        
        fs.writeFileSync(contentlayerConfig, content, 'utf-8');
        console.log('✅ Added Windows path normalization');
      }
    }
    
    // 2. Fix package.json overrides for Windows
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    if (!packageJson.overrides) {
      packageJson.overrides = {};
    }
    
    // Add Windows-compatible overrides
    const windowsOverrides = {
      "@mdx-js/mdx": "2.3.0",
      "@mdx-js/esbuild": "2.3.0",
      "unified": "10.1.2",
      "remark": "14.0.3",
      "remark-gfm": "3.0.1",
      "remark-html": "15.0.2",
      "rehype-slug": "5.1.0",
      "vfile": "5.3.7",
      "vfile-message": "3.1.4",
      "unist-util-visit": "4.1.2",
      "mdast-util-to-markdown": "1.5.0",
      "mdast-util-from-markdown": "1.3.1",
      "mdast-util-gfm": "2.0.2",
      "mdast-util-mdx-jsx": "2.1.0",
      "micromark-util-symbol": "1.0.1",
      "micromark": "3.2.0",
      "mdast-util-gfm-task-list-item": "1.0.2",
      "@types/mdast": "4.0.0"
    };
    
    packageJson.overrides = { ...packageJson.overrides, ...windowsOverrides };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
    console.log('✅ Updated package.json overrides');
    
    // 3. Create Windows-specific environment helper
    const windowsEnvHelper = `
// Windows environment helper
export const isWindows = process.platform === 'win32';
export const normalizePath = (filePath: string) => {
  if (isWindows) {
    return filePath.replace(/\\\\/g, '/');
  }
  return filePath;
};

export const getNpxCommand = () => {
  return isWindows ? 'npx.cmd' : 'npx';
};

export const fixPathForWindows = (path: string) => {
  if (isWindows) {
    return path.replace(/\//g, '\\\\');
  }
  return path;
};
`;
    
    const helperPath = path.join(process.cwd(), 'scripts/windows-helper.ts');
    fs.writeFileSync(helperPath, windowsEnvHelper, 'utf-8');
    console.log('✅ Created Windows helper script');
    
    // 4. Create a Windows-compatible PDF generation wrapper
    const pdfWrapper = `
#!/usr/bin/env tsx
import { isWindows, getNpxCommand, normalizePath } from './windows-helper.ts';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function runWindowsSafe(command: string, options: any = {}) {
  if (isWindows) {
    // Fix path separators for Windows
    command = command.replace(/\\//g, '\\\\');
    
    // Use cmd.exe for complex commands
    if (command.includes('&&') || command.includes('||')) {
      command = \`cmd /c "\${command}"\`;
    }
  }
  
  return await execAsync(command, {
    ...options,
    shell: isWindows ? 'cmd.exe' : '/bin/bash',
    windowsHide: true
  });
}
`;
    
    const wrapperPath = path.join(process.cwd(), 'scripts/windows-wrapper.ts');
    fs.writeFileSync(wrapperPath, pdfWrapper, 'utf-8');
    console.log('✅ Created Windows PDF wrapper');
    
    // 5. Update the main generate-pdfs script to use Windows wrapper
    const generatePdfsPath = path.join(process.cwd(), 'scripts/generate-pdfs.tsx');
    if (fs.existsSync(generatePdfsPath)) {
      let generatePdfsContent = fs.readFileSync(generatePdfsPath, 'utf-8');
      
      if (!generatePdfsContent.includes('windows-wrapper')) {
        // Add import at the top
        generatePdfsContent = generatePdfsContent.replace(
          /import.*from.*['"]child_process['"]/,
          `import { exec } from 'child_process';\nimport { runWindowsSafe } from './windows-wrapper.ts'`
        );
        
        // Replace execAsync calls with runWindowsSafe
        generatePdfsContent = generatePdfsContent.replace(
          /const \{ stdout, stderr \} = await execAsync\(command,/g,
          'const { stdout, stderr } = await runWindowsSafe(command,'
        );
        
        fs.writeFileSync(generatePdfsPath, generatePdfsContent, 'utf-8');
        console.log('✅ Updated generate-pdfs.tsx for Windows');
      }
    }
    
    console.log('\n✅ Windows compatibility fixes applied successfully!');
    console.log('\n📋 Recommended next steps:');
    console.log('1. Run: npm install (to apply package.json overrides)');
    console.log('2. Run: npm run dev:windows (for Windows development)');
    console.log('3. Run: npm run build:windows (for Windows builds)');
    
  } catch (error: any) {
    console.error('❌ Error applying Windows fixes:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === import.meta.url) {
  fixWindowsContentLayer();
}